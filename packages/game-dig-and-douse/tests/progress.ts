import assert from "node:assert/strict";
import {
  CampaignProgress,
  loadDigAndDouseProgress,
  TOTAL_CANTEENS,
} from "../src/progress";
const fresh = loadDigAndDouseProgress(null);
assert.deepEqual(fresh, {
  version: 2,
  firesExtinguished: 0,
  bestCanteens: 0,
  totalCanteens: 0,
  ownedRewardIds: [],
  completedLevelIds: [],
  unlockedLevelIds: [],
});
const migrated = loadDigAndDouseProgress({
  firesExtinguished: 2.9,
  bestCanteens: 99,
  totalCanteens: 1,
  ownedRewardIds: ["wildfire:camp-lantern", "wildfire:camp-lantern", 2],
});
assert.equal(migrated.firesExtinguished, 2);
assert.equal(migrated.bestCanteens, TOTAL_CANTEENS);
assert.deepEqual(migrated.completedLevelIds, ["painted-hillside"]);
assert.deepEqual(migrated.ownedRewardIds, ["wildfire:camp-lantern"]);
assert.deepEqual(
  loadDigAndDouseProgress(migrated),
  migrated,
  "migration must be idempotent",
);
const campaign = new CampaignProgress(fresh, ["first", "second", "third"]);
assert.equal(campaign.initial(), "first");
assert(!campaign.canPlay("second"));
campaign.complete("first");
assert(campaign.canPlay("second"));
assert(!campaign.canPlay("third"));
campaign.complete("first");
assert.deepEqual(fresh.completedLevelIds, ["first"]);
fresh.currentLevelId = "second";
assert.equal(campaign.initial(), "second");
const reordered = new CampaignProgress(fresh, [
  "third",
  "first",
  "new",
  "second",
]);
reordered.reconcile();
assert(reordered.canPlay("second"), "reorder must not relock earned access");
assert(
  reordered.canPlay("new"),
  "completion unlocks next entry in the new order",
);
assert(!reordered.canPlay("missing"));
const removed = new CampaignProgress(fresh, ["first"]);
assert.equal(removed.initial(), "first");
assert.deepEqual(new CampaignProgress(fresh, []).initial(), undefined);
const many = loadDigAndDouseProgress({ ...fresh, bestCanteens: 12 });
assert.equal(many.bestCanteens, 12, "new saves permit variable canteen counts");
const legacyCampaign = new CampaignProgress(migrated, [
  "painted-hillside",
  "new",
]);
legacyCampaign.reconcile();
assert(legacyCampaign.canPlay("new"));
console.log(
  "PASS: versioned progress migration, variable canteens, ordered unlocks, reorder/removal and idempotence",
);
