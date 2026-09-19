import { test } from "node:test";
import assert from "node:assert/strict";
import { loadVedaProgress, VEDA_REWARD_IDS } from "../src/progress";

test("progress is normalized and completion-derived rewards remain idempotent", () => {
  const progress = loadVedaProgress({ level: 99, unlocked: 99, completed: [0, 1, 1, 2, 3, 4, 8], bestMoves: [7, -1, 18], bestPeaches: [1, 2], ownedRewardIds: [VEDA_REWARD_IDS[0], "unknown"] });
  assert.equal(progress.level, 4);
  assert.deepEqual(progress.completed, [0, 1, 2, 3, 4]);
  assert.deepEqual(progress.ownedRewardIds, [...VEDA_REWARD_IDS]);
  assert.deepEqual(loadVedaProgress(progress), progress);
});
