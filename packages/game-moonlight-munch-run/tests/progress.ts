import assert from "node:assert/strict";
import test from "node:test";
import { loadMoonlightMunchRunProgress, MOONLIGHT_LEGACY_REWARD_MAP, rewardIdsForFeeds } from "../src/progress";

test("canonical v2 save migrates into bounded host progress", () => {
  const progress = loadMoonlightMunchRunProgress({ fed: 60, keeps: ["fake", "lantern-token"], phase: "boss", bossHp: 19, weaponLevels: { spread: 2 }, activeWeapon: "spread" });
  assert.equal(progress.version, 1); assert.equal(progress.phase, "boss"); assert.equal(progress.bossHp, 19); assert.equal(progress.weaponLevels.spread, 2);
  assert.deepEqual(progress.ownedRewardIds, Object.values(MOONLIGHT_LEGACY_REWARD_MAP));
});
test("malformed payload remains safe and reward requests are namespaced", () => {
  const progress = loadMoonlightMunchRunProgress({ fed: Infinity, stage: -1, ownedRewardIds: ["moon-menu", "unknown"] });
  assert.equal(progress.fed, 0); assert.equal(progress.stage, 1);
  assert.deepEqual(progress.ownedRewardIds, [MOONLIGHT_LEGACY_REWARD_MAP["moon-menu"]]);
  assert.ok(rewardIdsForFeeds(60).every(id => id.startsWith("moonlight-munch-run:")));
});
