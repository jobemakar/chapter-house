import { test } from "node:test";
import assert from "node:assert/strict";
import { WishboneCamera } from "../packages/game-wishbone-fling/src/camera";
import { WishboneScenery } from "../packages/game-wishbone-fling/src/scenery";

test("fence stays behind the collision floor through wide overview and detail zoom", () => {
  const camera = new WishboneCamera();
  camera.setWorld({ width: 2400, height: 720 });
  for (const zoom of [0.5, 0.75, 1, 1.5, 1.8]) {
    camera.zoomAt(zoom);
    for (const dy of [-10000, 10000]) {
      camera.pan(0, dy);
      const s = WishboneScenery.layout(camera, 2400, false);
      assert.equal(s.groundY, camera.toScreen({ x: 0, y: 602 }).y);
      assert.equal(s.fenceBaseY, camera.toScreen({ x: 0, y: 582 }).y);
      assert.ok(s.fenceBaseY < s.groundY);
      assert.ok(s.farTop < 0, "painted sky must cover viewport top");
      assert.ok(s.farTop + s.farHeight > s.groundY);
      const fenceScreenX = (x: number) =>
        600 + s.fenceX + (x - 600) * camera.zoom;
      assert.ok(fenceScreenX(s.fenceLeft) < 0);
      assert.ok(fenceScreenX(s.fenceRight) > 1200);
      assert.ok(s.farLeft < 0 && s.farLeft + s.farWidth > 1200);
    }
  }
});

test("fence tracks yard closely and faster than mountains when panning", () => {
  for (const zoom of [0.5, 1, 1.8]) {
    const a = WishboneScenery.layout({ x: 600, y: 360, zoom }, 2400, false);
    const b = WishboneScenery.layout({ x: 900, y: 360, zoom }, 2400, false);
    const fenceTravel = Math.abs(b.fenceX - a.fenceX);
    const farTravel = Math.abs(b.farX - a.farX);
    assert.ok(Math.abs(fenceTravel / (300 * zoom) - 0.96) < 1e-9);
    assert.ok(fenceTravel > farTravel);
    assert.equal(a.groundY, b.groundY);
  }
});
