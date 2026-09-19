import assert from "node:assert/strict";
import { loadWishboneProgress, WISHBONE_REWARD_REQUEST_IDS } from "../src/progress";
const progress = loadWishboneProgress({ throws: 14, owned: ["power-magnet"] });
assert.ok(progress.owned.includes("bed")); assert.ok(progress.owned.includes("power-magnet"));
assert.equal(WISHBONE_REWARD_REQUEST_IDS.bed, "wishbone-fling:keepsake:bed");
