import test from "node:test";
import assert from "node:assert/strict";
import { thumbOffset, thumbVector } from "../src/touch-input";

test("thumb pad has a calm centre dead zone and a normalized outer edge", () => {
  assert.deepEqual(thumbVector(5, 4, 52), { x: 0, y: 0 });
  const diagonal = thumbVector(52, 52, 52);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 0.0001);
  assert.ok(diagonal.x > 0 && diagonal.y > 0);
});

test("visible thumb never travels farther than its ring permits", () => {
  assert.deepEqual(thumbOffset({ x: -1, y: 0.5 }, 31), { x: -31, y: 15.5 });
});
