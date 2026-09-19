import { test } from "node:test";
import assert from "node:assert/strict";
import { TownRenderPerformance } from "../src/town/render-performance";

test("town zoom eases to a bounded wheel target", () => {
  const performance = new TownRenderPerformance(0.8);
  performance.nudgeZoom(0.4);
  const first = performance.update(1 / 60);
  assert.equal(first.zoomChanged, true);
  assert.ok(first.zoom > 0.8 && first.zoom < 1.2);
  for (let i = 0; i < 120; i++) performance.update(1 / 60);
  assert.ok(Math.abs(performance.zoom - 1.2) < 0.000001);

  performance.nudgeZoom(10);
  for (let i = 0; i < 120; i++) performance.update(1 / 60);
  assert.equal(performance.zoom, 1.7);
});

test("pinch zoom applies immediately and resets the eased target", () => {
  const performance = new TownRenderPerformance(0.8);
  performance.nudgeZoom(0.5);
  performance.setZoomImmediate(1.1);
  assert.equal(performance.zoom, 1.1);
  assert.equal(performance.update(1 / 60).zoomChanged, false);
});

test("shadow refreshes are capped independently of render frames", () => {
  const performance = new TownRenderPerformance(0.8);
  assert.equal(performance.update(0).refreshShadows, true);
  assert.equal(performance.update(1 / 60).refreshShadows, false);
  assert.equal(performance.update(1 / 60).refreshShadows, true);
});
