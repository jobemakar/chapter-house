import test from "node:test"; import assert from "node:assert/strict";
import { loadStormglideProgress, toLegacyStormglideSave } from "../src/progress";
test("migrates legacy discoveries to stable scoped rewards", () => { const progress=loadStormglideProgress({found:[0,4,4,99],total:10,trail:9,best:-2,unknown:true}); assert.deepEqual(progress.found,[0,4]); assert.equal(progress.trail,4); assert.ok(progress.ownedRewardIds.includes("stormglide:pup-4")); assert.ok(progress.ownedRewardIds.includes("stormglide:trail-2")); assert.equal("ownedRewardIds" in toLegacyStormglideSave(progress),false); });
test("rejects malformed progress", () => { assert.deepEqual(loadStormglideProgress("bad").found,[]); });
