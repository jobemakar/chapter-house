import assert from "node:assert/strict";
import { loadDigAndDouseProgress, TOTAL_CANTEENS } from "../src/progress";

assert.deepEqual(loadDigAndDouseProgress(null), {
  version: 1,
  firesExtinguished: 0,
  bestCanteens: 0,
  totalCanteens: 0,
  ownedRewardIds: [],
});
assert.deepEqual(
  loadDigAndDouseProgress({
    firesExtinguished: 2.9,
    bestCanteens: 99,
    totalCanteens: 1,
    ownedRewardIds: ["wildfire:camp-lantern", "wildfire:camp-lantern", 2],
  }),
  {
    version: 1,
    firesExtinguished: 2,
    bestCanteens: TOTAL_CANTEENS,
    totalCanteens: 1,
    ownedRewardIds: ["wildfire:camp-lantern"],
  },
);
console.log(
  "PASS: Dig & Douse progress migration normalizes partial and legacy saves",
);
