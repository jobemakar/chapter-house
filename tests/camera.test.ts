import { test } from "node:test";
import assert from "node:assert/strict";
import { WishboneCamera } from "../src/games/wishbone/camera";

test("camera transforms invert at multiple zooms and anchored zoom keeps world point", () => {
  const c = new WishboneCamera();
  for (const zoom of [1, 1.25, 1.8]) {
    c.zoomAt(zoom);
    for (const p of [
      { x: 162, y: 478 },
      { x: 900, y: 400 },
    ]) {
      const q = c.toWorld(c.toScreen(p));
      assert.ok(Math.hypot(q.x - p.x, q.y - p.y) < 1e-9);
    }
  }
  c.home();
  const anchor = { x: 540, y: 400 },
    before = c.toWorld(anchor);
  c.zoomAt(1.5, anchor);
  assert.deepEqual(c.toWorld(anchor), before);
});
test("camera clamps exploration, freezes aim, follows flight and returns to launcher", () => {
  const c = new WishboneCamera();
  c.home(true);
  c.pan(-10000, 10000);
  assert.equal(c.x, 800);
  assert.equal(c.y, 240);
  c.launched();
  const before = { x: c.x, y: c.y };
  c.update(0.05, "flight", { x: 100, y: 500 }, true, false);
  assert.deepEqual({ x: c.x, y: c.y }, before);
  for (let i = 0; i < 100; i++)
    c.update(0.05, "flight", { x: 1100, y: 400 }, false, false);
  assert.equal(c.x, 800);
  for (let i = 0; i < 100; i++)
    c.update(0.05, "ready", { x: 162, y: 478 }, false, false);
  assert.equal(c.x, 400);
  c.zoomAt(500);
  assert.equal(c.zoom, 1.8);
  c.zoomAt(0.1);
  assert.equal(c.zoom, 1);
  assert.equal(c.x, 600);
});
test("reduced motion uses a steady overview during flight", () => {
  const c = new WishboneCamera();
  c.home(true);
  c.launched();
  c.update(0.05, "flight", { x: 1000, y: 100 }, false, true);
  assert.equal(c.zoom, 1);
  assert.equal(c.x, 600);
});
