import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { TownAssets } from "../src/town/assets";

type LoaderResult = Awaited<ReturnType<GLTFLoaderLike["loadAsync"]>>;
type GLTFLoaderLike = Pick<
  import("three/examples/jsm/loaders/GLTFLoader.js").GLTFLoader,
  "loadAsync"
>;

const assetCount = 21;

function sourceScene() {
  const scene = new THREE.Group();
  const geometry = new THREE.BoxGeometry(4, 8, 8);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  // Its raw bounds are X -2..2, Y -3..5, Z -4..4.
  mesh.position.set(0, 1, 0);
  scene.add(mesh);
  return { scene, geometry, material };
}

function result(scene: THREE.Group): LoaderResult {
  return { scene } as LoaderResult;
}

function meshIn(group: THREE.Object3D): THREE.Mesh {
  let found: THREE.Mesh | undefined;
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) found = object;
  });
  assert.ok(found, "asset clone should contain a mesh");
  return found;
}

test("TownAssets loads its local catalog once and clones share resources", async () => {
  let calls = 0;
  const loader: GLTFLoaderLike = {
    loadAsync: async () => {
      calls += 1;
      return result(sourceScene().scene);
    },
  };
  const assets = new TownAssets(loader);

  await Promise.all([assets.load(), assets.load()]);
  await assets.load();
  assert.equal(calls, assetCount);

  const first = meshIn(assets.create("mini-tree"));
  const second = meshIn(assets.create("mini-tree"));
  assert.equal(first.geometry, second.geometry);
  assert.equal(first.material, second.material);
  assets.dispose();
});

test("TownAssets centers shifted source bounds and scales its grounding correction", async () => {
  const assets = new TownAssets({
    loadAsync: async () => result(sourceScene().scene),
  });
  await assets.load();

  const instance = assets.create("mini-tree", { height: 16 });
  const bounds = new THREE.Box3().setFromObject(instance);
  assert.deepEqual(bounds.min.toArray().map(round), [-4, 0, -8]);
  assert.deepEqual(bounds.max.toArray().map(round), [4, 16, 8]);
  assert.deepEqual(assets.size("mini-tree").toArray(), [4, 8, 8]);
  assets.dispose();
});

test("TownAssets disposes results that arrive after it is disposed", async () => {
  const deferred: Array<{
    resolve: (value: LoaderResult) => void;
  }> = [];
  const disposed: number[] = [];
  const assets = new TownAssets({
    loadAsync: () =>
      new Promise<LoaderResult>((resolve) => deferred.push({ resolve })),
  });
  const loading = assets.load();
  assets.dispose();

  for (let index = 0; index < assetCount; index += 1) {
    const source = sourceScene();
    source.geometry.addEventListener("dispose", () => disposed.push(index));
    deferred[index].resolve(result(source.scene));
  }
  await assert.rejects(loading, /disposed while loading/);
  assert.equal(disposed.length, assetCount);
});

test("TownAssets cleans up partial successes when one asset fails", async () => {
  let calls = 0;
  const disposed: number[] = [];
  const assets = new TownAssets({
    loadAsync: async () => {
      calls += 1;
      if (calls === 1) throw new Error("missing test model");
      const source = sourceScene();
      source.geometry.addEventListener("dispose", () => disposed.push(calls));
      return result(source.scene);
    },
  });

  await assert.rejects(assets.load(), /missing test model/);
  assert.equal(calls, assetCount);
  assert.equal(disposed.length, assetCount - 1);
});

function round(value: number): number {
  return Number(value.toFixed(6));
}
