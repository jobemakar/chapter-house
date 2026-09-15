import { test } from "node:test";
import assert from "node:assert/strict";
import { coinFlightPoint } from "../src/town/art";
import { TOWN } from "../src/town/layout";

test("a tossed coin arcs from the avatar and lands in the fountain", () => {
  const avatar = { x: 31.5, z: 38.5 };
  assert.deepEqual(coinFlightPoint(avatar, 0), { ...avatar, y: 1.15 });
  const apex = coinFlightPoint(avatar, 0.5);
  assert.ok(apex.y > 3);
  assert.equal(apex.x, (avatar.x + TOWN.fountain.x) / 2);
  assert.equal(apex.z, (avatar.z + TOWN.fountain.z) / 2);
  const landing = coinFlightPoint(avatar, 1);
  assert.equal(landing.x, TOWN.fountain.x);
  assert.equal(landing.z, TOWN.fountain.z);
  assert.ok(Math.abs(landing.y - 0.58) < 0.000001);
});
