import { test } from "node:test";
import assert from "node:assert/strict";
import { PointerGesture } from "../src/core/pointer-gesture";

test("a short single-pointer gesture remains a tap", () => {
  const gesture = new PointerGesture();
  assert.equal(gesture.down(1, { x: 20, y: 30 }).kind, "none");
  assert.equal(gesture.move(1, { x: 24, y: 31 }).kind, "none");
  assert.deepEqual(gesture.up(1, { x: 24, y: 31 }), {
    kind: "tap",
    point: { x: 24, y: 31 },
  });
});

test("dragging emits incremental pan updates and cannot tap", () => {
  const gesture = new PointerGesture();
  gesture.down(1, { x: 0, y: 0 });
  assert.deepEqual(gesture.move(1, { x: 12, y: 2 }), {
    kind: "pan",
    from: { x: 0, y: 0 },
    to: { x: 12, y: 2 },
  });
  assert.equal(gesture.up(1, { x: 12, y: 2 }).kind, "none");
});

test("pinch reports midpoint and scale while suppressing both taps", () => {
  const gesture = new PointerGesture();
  gesture.down(1, { x: 10, y: 20 });
  assert.deepEqual(gesture.down(2, { x: 30, y: 20 }), {
    kind: "pinch-start",
    midpoint: { x: 20, y: 20 },
  });
  assert.deepEqual(gesture.move(2, { x: 50, y: 20 }), {
    kind: "pinch",
    midpoint: { x: 30, y: 20 },
    scale: 2,
  });
  assert.equal(gesture.up(2, { x: 50, y: 20 }).kind, "none");
  assert.equal(gesture.up(1, { x: 10, y: 20 }).kind, "none");
});
