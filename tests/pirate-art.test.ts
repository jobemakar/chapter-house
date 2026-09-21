import assert from "node:assert/strict";
import test from "node:test";
import { PirateArt, pirateShipPose } from "../src/town/pirate-art";

test("pirate ships have subtle movement that freezes for reduced motion", () => {
  const start = pirateShipPose(0, 0, false);
  const moved = pirateShipPose(1, 0, false);
  assert.notDeepEqual(moved, start);
  assert.ok(Math.abs(moved.y - 0.1) <= 0.075);
  assert.ok(Math.abs(moved.roll) <= 0.018);
  assert.ok(Math.abs(moved.pitch) <= 0.012);
  assert.deepEqual(pirateShipPose(1, 0, true), { y: 0.1, roll: 0, pitch: 0 });

  const art = new PirateArt();
  // Imported assets are populated asynchronously; this unit only verifies the authored scene can be safely torn down before loading.
  art.update(1, true);
  art.dispose();
});
