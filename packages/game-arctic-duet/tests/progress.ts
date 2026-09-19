import assert from "node:assert/strict";
import { ARCTIC_DUET_REWARDS, loadArcticDuetProgress, parseArcticDuetProgress } from "../src/progress";

assert.deepEqual(loadArcticDuetProgress(null), {
  version: 1, total: 0, bestLevel: 1, muted: false, gentle: false, assist: false, motion: false, keepsakes: [],
});
const complete = loadArcticDuetProgress({ version: 1, total: 100, bestLevel: -9, muted: true, gentle: true, assist: true, reducedMotion: true, keepsakes: ["duet-snow-cushion", "not-a-reward"] });
assert.deepEqual(complete.keepsakes, ARCTIC_DUET_REWARDS.map((reward) => reward.legacyId));
assert.equal(complete.bestLevel, 1);
assert.equal(complete.motion, true, "pre-host reducedMotion migrates to legacy motion field");
assert.deepEqual(loadArcticDuetProgress(complete), complete, "migration is idempotent");
assert.deepEqual(parseArcticDuetProgress("bad JSON"), loadArcticDuetProgress(null));
assert.deepEqual(loadArcticDuetProgress({ version: 99, total: 100 }), loadArcticDuetProgress(null));
assert.deepEqual(ARCTIC_DUET_REWARDS.map((reward) => reward.rewardId), [
  "arctic-duet:duet-snow-cushion", "arctic-duet:puffin-window-star", "arctic-duet:aurora-wool-rug", "arctic-duet:together-pennant",
]);
console.log("PASS: Arctic Duet progress migration and namespaced reward mapping");
