import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { TownWater } from "../src/town/water";
import { TownStream } from "../src/town/stream";

test("drawn water ribbon samples the collision/fishing boundary and motion can freeze", () => {
  const water = new TownWater();
  const mesh = water.root.children[1] as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.ShaderMaterial
  >;
  const positions = mesh.geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i += 2) {
    const bank = TownStream.bounds(positions.getX(i));
    assert.ok(Math.abs(positions.getZ(i) - bank.minZ) < 0.00001);
    assert.ok(Math.abs(positions.getZ(i + 1) - bank.maxZ) < 0.00001);
  }
  water.update(1, false);
  assert.equal(mesh.material.uniforms.time.value, 0.1);
  water.update(1, true);
  assert.equal(mesh.material.uniforms.time.value, 0.1);
  water.root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
});
