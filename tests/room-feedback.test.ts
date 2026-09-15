import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  ProfileRepository,
  PROFILE_KEY,
  type StoragePort,
} from "../src/core/profile";
import { RoomNavigation } from "../src/room/navigation";
import { RouteMotion } from "../src/room/motion";
import { RoomArt, AnimalRig } from "../src/room/art";
import { getFurniture } from "../src/core/catalog";

class MemoryStore implements StoragePort {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("old saves accept per-instance lamp state and preserve it through storage and reload", () => {
  const storage = new MemoryStore();
  const profile = new ProfileRepository(storage);
  assert.equal(profile.toggleLamp("starter-shelf"), null);
  assert.equal(profile.toggleLamp("starter-lamp"), true);
  profile.state.currency = 100;
  assert.equal(profile.buyFurniture("reading-lamp", "second-lamp"), true);
  const lamp = profile.state.items.find((i) => i.id === "starter-lamp")!;
  lamp.placement = null;
  assert.equal(profile.toggleLamp(lamp.id), null);
  profile.save();
  const next = new ProfileRepository(storage);
  assert.equal(next.state.items.find((i) => i.id === lamp.id)!.lampOn, true);
  assert.equal(
    next.state.items.filter(
      (i) => i.definitionId === "reading-lamp" && i.lampOn,
    ).length,
    1,
  );
  const restored = next.state.items.find((i) => i.id === lamp.id)!;
  restored.placement = { x: 3, z: 3, rotation: 2 };
  assert.equal(next.toggleLamp(lamp.id), false);
  const raw = JSON.parse(storage.getItem(PROFILE_KEY)!);
  raw.items.find((i: { id: string }) => i.id === lamp.id).lampOn = "true";
  storage.setItem(PROFILE_KEY, JSON.stringify(raw));
  assert.equal(
    new ProfileRepository(storage).state.items.find((i) => i.id === lamp.id)!
      .lampOn,
    false,
  );
});

test("arrival in every direction keeps its heading despite duplicate terminal waypoints", () => {
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    const point = { x: 5, z: 5 };
    const end = { x: 5 + dx, z: 5 + dz };
    const route = new RoomNavigation([]).path(point, end);
    let facing = Math.atan2(dx, dz);
    for (let frame = 0; frame < 100; frame++) {
      const result = RouteMotion.step(point, route, facing, 2.35, 1 / 60);
      facing = result.facing;
    }
    assert.ok(Math.abs(facing - Math.atan2(dx, dz)) < 1e-8);
    assert.ok(Math.hypot(point.x - end.x, point.z - end.z) < 1e-8);
    assert.equal(route.length, 0);
    assert.equal(
      RouteMotion.step(point, [{ ...point }], facing, 2.35, 1 / 60).facing,
      facing,
    );
  }
});

test("off-grid arrival replaces the tiny final correction with a clear approach", () => {
  const start = { x: 5, z: 5 },
    end = { x: 7.12, z: 5.06 };
  const path = new RoomNavigation([]).path(start, end);
  assert.deepEqual(path.at(-1), end);
  const previous = path.at(-2)!;
  assert.ok(Math.hypot(end.x - previous.x, end.z - previous.z) > 0.25);
});

test("jump articulates the animal, settles fully, and reduced motion lowers the arc", () => {
  const rig = new AnimalRig(0xcc8957);
  const body = rig.root.children[0];
  rig.jump();
  rig.update(0.08, false, false);
  assert.ok(body.scale.y < 1);
  rig.update(0.37, false, false);
  assert.ok(body.position.y > 0.4);
  assert.ok(
    body.children.some(
      (child) => child.type === "Group" && Math.abs(child.rotation.x) > 0.2,
    ),
  );
  const normalHeight = body.position.y;
  rig.jump();
  rig.update(0.45, false, true);
  assert.ok(body.position.y < normalHeight * 0.4);
  rig.update(1, false, true);
  assert.equal(body.position.y, 0);
  assert.equal(body.scale.y, 1);
  RoomArt.release(rig.root);
});

test("wave raises a contrasting paw clear of the torso and returns to idle", () => {
  const rig = new AnimalRig(0xcc8957);
  rig.wave();
  rig.update(0.3, false, false);
  const body = rig.root.children[0];
  const arm = body.children.find(
    (child) => child.type === "Group" && child.position.x > 0.2,
  )!;
  assert.ok(arm.rotation.z > 1.9);
  rig.root.updateMatrixWorld(true);
  const paw = arm.children[1].getWorldPosition(new THREE.Vector3());
  assert.ok(paw.x > 0.35 && paw.y > 0.8);
  rig.update(2, false, true);
  assert.equal(arm.rotation.z, 0);
  RoomArt.release(rig.root);
});

test("lamp on adds emissive light; off has no light sources", () => {
  const definition = getFurniture("reading-lamp")!;
  const on = RoomArt.furniture(definition, true),
    off = RoomArt.furniture(definition, false);
  assert.ok(on.children.some((child) => child instanceof THREE.PointLight));
  assert.ok(!off.children.some((child) => child instanceof THREE.PointLight));
  RoomArt.release(on);
  RoomArt.release(off);
});
