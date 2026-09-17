import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { TownAssets } from "../src/town/assets";
import { TownWaterfall } from "../src/town/waterfall";
import { TownNavigation } from "../src/town/navigation";
import { TOWN } from "../src/town/layout";
import { TownStream } from "../src/town/stream";

async function fixture() {
  const assets = new TownAssets({
    loadAsync: async (url: string) => {
      const half = url.includes("Half") || url.includes("cliff_half");
      const column = url.includes("rock_tall");
      const scene = new THREE.Group();
      scene.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(
            column ? 0.45 : 1,
            column ? 0.8 : half ? 0.5 : 1,
            column ? 0.45 : 1,
          ),
          new THREE.MeshStandardMaterial(),
        ),
      );
      return { scene } as Awaited<
        ReturnType<
          import("three/examples/jsm/loaders/GLTFLoader.js").GLTFLoader["loadAsync"]
        >
      >;
    },
  });
  await assets.load();
  return { assets, waterfall: new TownWaterfall(assets) };
}

test("waterfall preserves native kit proportions and detaches shared imports", async () => {
  const { assets, waterfall } = await fixture();
  waterfall.imports.traverse((object) => {
    assert.equal(object.scale.x, object.scale.y);
    assert.equal(object.scale.y, object.scale.z);
  });
  assert.ok(waterfall.imports.children.length > 50);
  waterfall.detachImports();
  assert.equal(waterfall.imports.parent, null);
  assets.dispose();
});

test("brook meets the drop and waterfall motion freezes in reduced motion", async () => {
  const { assets, waterfall } = await fixture();
  const water = waterfall.root.children.filter(
    (o): o is THREE.Mesh =>
      o instanceof THREE.Mesh && o.material instanceof THREE.ShaderMaterial,
  );
  assert.equal(water.length, 2);
  const brook = water[0].geometry.getAttribute("position");
  const fall = water[1].geometry.getAttribute("position");
  const last = brook.count - 2;
  for (const axis of ["Y", "Z"] as const)
    assert.equal(brook[`get${axis}`](last), fall[`get${axis}`](0));
  assert.ok(Math.abs(brook.getX(last) - fall.getX(1)) < 0.001);
  assert.ok(Math.abs(brook.getX(last + 1) - fall.getX(0)) < 0.001);
  for (const mesh of water)
    for (const n of mesh.geometry.getAttribute("position").array)
      assert.ok(Number.isFinite(n));
  const material = water[0].material as THREE.ShaderMaterial;
  waterfall.update(0.1, false);
  assert.equal(material.uniforms.time.value, 0.1);
  waterfall.update(1, true);
  assert.equal(material.uniforms.time.value, 0.1);
  const nav = new TownNavigation();
  const bank = TownStream.bank(TOWN.waterfall.x, -1);
  for (const dx of [-5, 0, 5])
    for (const dz of [-12, -8, -4, -0.3])
      assert.equal(
        nav.walkable({ x: TOWN.waterfall.x + dx, z: bank + dz }),
        false,
      );
  waterfall.detachImports();
  assets.dispose();
});
