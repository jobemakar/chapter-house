import assert from "node:assert/strict";
import { BUREAU_REWARD_REQUEST_IDS, loadBureauAfterDarkProgress } from "../src/progress";

assert.deepEqual(loadBureauAfterDarkProgress(null), { version: 1, found: { "0": [], "1": [] }, rewards: [], selectedLevel: 0, ownedRewardIds: [] });
const migrated = loadBureauAfterDarkProgress({ version: 1, found: { "0": ["moon", "feather", "key", "moon", "bad"], "1": ["star"] }, rewards: ["night-garden", "bad"], selectedLevel: 1 });
assert.deepEqual(migrated.found["0"], ["moon", "feather", "key"]);
assert.equal(migrated.selectedLevel, 1);
assert.deepEqual(migrated.ownedRewardIds, [BUREAU_REWARD_REQUEST_IDS["night-garden"]]);
assert.deepEqual(loadBureauAfterDarkProgress({ found: { "0": ["moon"] }, rewards: ["night-garden"] }).rewards, []);
console.log("PASS: Bureau progress safely migrates legacy v2 fields and namespaced rewards");
