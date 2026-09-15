import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { PetAssets, type PetLoader } from "../src/room/pet-assets";

type LoaderResult = Awaited<ReturnType<PetLoader["loadAsync"]>>;
const petCount = 3;
const clipNames = ["idle", "walk", "eat", "dance", "gesture-positive"];

function sourceScene() {
  const scene = new THREE.Group();
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial();
  const body = new THREE.Mesh(geometry, material);
  body.name = "body";
  body.position.set(2, 1, -3);
  scene.add(body);
  return { scene, geometry, material };
}

function clips(names = clipNames): THREE.AnimationClip[] {
  return names.map(
    (name) =>
      new THREE.AnimationClip(name, name === "gesture-positive" ? 0.1 : 1, [
        new THREE.NumberKeyframeTrack("body.position[x]", [0, 1], [2, 2.05]),
      ]),
  );
}

function result(scene: THREE.Group, animationClips = clips()): LoaderResult {
  return { scene, animations: animationClips } as LoaderResult;
}

function meshIn(object: THREE.Object3D): THREE.Mesh {
  let found: THREE.Mesh | undefined;
  object.traverse((node) => {
    if (node instanceof THREE.Mesh && node.name !== "Pet touch target")
      found = node;
  });
  assert.ok(found, "pet rig should contain a mesh");
  return found;
}

test("PetAssets loads its local catalog once and rigs keep mixers independent", async () => {
  let calls = 0;
  const assets = new PetAssets({
    loadAsync: async () => {
      calls += 1;
      return result(sourceScene().scene);
    },
  });
  await Promise.all([assets.load(), assets.load()]);
  await assets.load();
  assert.equal(calls, petCount);

  const first = assets.create("cat");
  const second = assets.create("cat");
  assert.notEqual(first.root, second.root);
  assert.notEqual(first.mixer, second.mixer);
  assert.equal(meshIn(first.root).geometry, meshIn(second.root).geometry);
  assert.equal(meshIn(first.root).material, meshIn(second.root).material);
  assert.equal(meshIn(first.root).castShadow, true);
  assert.equal(meshIn(first.root).receiveShadow, true);
  const ray = new THREE.Raycaster(
    new THREE.Vector3(0, 0.42, 2),
    new THREE.Vector3(0, 0, -1),
  );
  assert.ok(
    ray
      .intersectObject(first.root, true)
      .some((hit) => hit.object.name.includes("touch target")),
    "the invisible touch target should make a small pet easy to raycast",
  );
  assets.dispose();
});

test("PetAssets reports the local URL and missing required clips", async () => {
  const assets = new PetAssets({
    loadAsync: async () => result(sourceScene().scene, clips(["walk"])),
  });
  await assert.rejects(
    assets.load(),
    /cat.*\/assets\/pets\/animal-cat\.glb.*idle/,
  );
  assets.dispose();
});

test("PetRig maps activity and returns from a positive gesture", async () => {
  const assets = new PetAssets({
    loadAsync: async () => result(sourceScene().scene),
  });
  await assets.load();
  const rig = assets.create("bunny");
  rig.update(0, true, true);
  assert.deepEqual(rig.status(), {
    activity: null,
    animation: "walk",
    moving: true,
    reduced: true,
  });
  rig.setActivity("eat");
  assert.equal(rig.status().animation, "eat");
  rig.pet();
  assert.equal(rig.status().animation, "gesture-positive");
  rig.update(2, true, true);
  assert.equal(rig.status().animation, "eat");
  rig.setActivity(null);
  assert.equal(rig.status().animation, "walk");
  rig.dispose();
  assets.dispose();
});

test("PetAssets disposes late arrivals and partial successes", async () => {
  const deferred: Array<{ resolve: (value: LoaderResult) => void }> = [];
  const lateDisposed: number[] = [];
  const assets = new PetAssets({
    loadAsync: () =>
      new Promise<LoaderResult>((resolve) => deferred.push({ resolve })),
  });
  const loading = assets.load();
  assets.dispose();
  for (let index = 0; index < petCount; index += 1) {
    const source = sourceScene();
    source.geometry.addEventListener("dispose", () => lateDisposed.push(index));
    deferred[index].resolve(result(source.scene));
  }
  await assert.rejects(loading, /disposed while loading/);
  assert.equal(lateDisposed.length, petCount);

  let calls = 0;
  const partialDisposed: number[] = [];
  const partial = new PetAssets({
    loadAsync: async () => {
      calls += 1;
      if (calls === 1) throw new Error("missing test model");
      const source = sourceScene();
      source.geometry.addEventListener("dispose", () =>
        partialDisposed.push(calls),
      );
      return result(source.scene);
    },
  });
  await assert.rejects(partial.load(), /missing test model/);
  assert.equal(partialDisposed.length, petCount - 1);
  partial.dispose();
});
