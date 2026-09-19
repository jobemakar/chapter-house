import assert from "node:assert/strict";
import test from "node:test";
import {
  PetRoamingController,
  PetRoamingPolicy,
  type PetMotionNavigation,
} from "../src/room/pet-motion";

const navigation: PetMotionNavigation = {
  walkable: () => true,
  path: (_start, end) => [{ ...end }],
};

test("shared pet roaming uses the same calm speed and bounded target policy", () => {
  const policy = new PetRoamingPolicy();
  const controller = new PetRoamingController(
    navigation,
    policy,
    () => 0.5,
  );
  const avatar = { point: { x: 0, z: 0 } };
  const actor = { point: { x: 0, z: 0 }, path: [], wait: 0 };

  const result = controller.update(actor, avatar, 0, 1);

  assert.equal(result.moved, true);
  assert.ok(Math.hypot(actor.point.x, actor.point.z) <= policy.speed);
  assert.ok(
    Math.hypot(actor.point.x, actor.point.z) <= policy.maxWanderDistance,
  );
});

test("shared controller catches up and calls pets through navigation", () => {
  const controller = new PetRoamingController(navigation);
  const avatar = { point: { x: 5, z: 5 } };
  const actor = { point: { x: 0, z: 0 }, path: [], wait: 0 };

  controller.update(actor, avatar, 0, 0);
  assert.ok(actor.path.length > 0);
  assert.ok(actor.wait > 0);

  controller.call(actor, avatar, 0);
  assert.ok(actor.path.length > 0);
  assert.ok(actor.wait > 0);
});
