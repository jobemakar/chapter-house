import assert from "node:assert/strict";
import test from "node:test";
import { pocketFunhouseManifest } from "../src/manifest";
import { POCKET_FUNHOUSE_REWARD_IDS } from "../src/progress";

test("manifest declares the integrated card and every stable Pocket Funhouse reward", () => {
  assert.equal(pocketFunhouseManifest.id, "pocket-funhouse");
  assert.ok(pocketFunhouseManifest.cardArtUrl.length > 0);
  assert.equal(pocketFunhouseManifest.rewards.length, 12);
  assert.deepEqual(pocketFunhouseManifest.rewards.map((reward) => reward.rewardId), POCKET_FUNHOUSE_REWARD_IDS);
  assert.ok(pocketFunhouseManifest.rewards.every((reward) => reward.legacyId && reward.display && reward.catalogId === null));
});
