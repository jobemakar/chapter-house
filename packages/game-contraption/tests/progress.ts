import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { part } from "../src/levels";
import {
  CONTRAPTION_REWARD_IDS,
  LEGACY_LEVEL_IDS,
  loadContraptionProgress,
} from "../src/progress";

describe("Contraption progress migration", () => {
  test("migrates v2 numeric identities, sparse clears, player layouts, totals and preferences idempotently", () => {
    const savedLayout = [part("belt", 420, 350, 0, "saved-belt")];
    const rawV2 = {
      version: 2,
      delivered: 18,
      best: 11,
      board: 3,
      cleared: [0, 2, 5, 2, -1, 99, "bad"],
      layouts: [
        [part("ramp", 200, 300, 0.2, "layout-zero")],
        null,
        [part("fan", 500, 180, -Math.PI / 2, "layout-two")],
        savedLayout,
        [],
        [part("funnel", 800, 400, 0, "layout-five")],
      ],
      owned: ["cc-spring-ornament", "unknown-reward", "cc-spring-ornament"],
      mute: true,
      slow: true,
      trails: false,
    };

    const migrated = loadContraptionProgress(rawV2);
    assert.equal(migrated.version, 3);
    assert.equal(migrated.selectedId, LEGACY_LEVEL_IDS[3]);
    assert.deepEqual(migrated.cleared, [0, 2, 5]);
    assert.deepEqual(migrated.clearedIds, [
      LEGACY_LEVEL_IDS[0],
      LEGACY_LEVEL_IDS[2],
      LEGACY_LEVEL_IDS[5],
    ]);
    assert.deepEqual(
      migrated.layoutsById[LEGACY_LEVEL_IDS[0]],
      rawV2.layouts[0],
    );
    assert.deepEqual(
      migrated.layoutsById[LEGACY_LEVEL_IDS[2]],
      rawV2.layouts[2],
    );
    assert.deepEqual(migrated.layoutsById[LEGACY_LEVEL_IDS[3]], savedLayout);
    assert.deepEqual(
      migrated.layoutsById[LEGACY_LEVEL_IDS[5]],
      rawV2.layouts[5],
    );
    assert.equal(migrated.delivered, 18);
    assert.equal(migrated.best, 11);
    assert.deepEqual(migrated.ownedRewardIds, [
      CONTRAPTION_REWARD_IDS[0],
      "unknown-reward",
    ]);
    assert.equal(migrated.mute, true);
    assert.equal(migrated.slow, true);
    assert.equal(migrated.trails, false);
    assert.deepEqual(
      loadContraptionProgress(migrated),
      migrated,
      "loading the migrated version 3 payload a second time changes no history",
    );
  });

  test("preserves stable-ID history and revisions from an existing v3 save", () => {
    const rawV3 = {
      version: 3,
      selectedId: "new-room-id",
      clearedIds: [
        "special-delivery",
        "new-room-id",
        "new-room-id",
        "unsafe/id",
      ],
      layoutsById: {
        "special-delivery": [part("belt", 300, 400, 0, "old-belt")],
        "new-room-id": [part("fan", 250, 220, -Math.PI / 2, "new-fan")],
        "../escape": [part("ramp", 5, 5, 0, "bad")],
      },
      layoutRevisions: {
        "special-delivery": "r7",
        "new-room-id": "revision-a",
        "unsafe/id": "ignored",
      },
      delivered: 50,
      best: 12,
      board: 4,
      cleared: [0, 4],
      layouts: [[part("belt", 1, 2, 0, "old-layout")]],
      ownedRewardIds: [CONTRAPTION_REWARD_IDS[0]],
      mute: false,
      slow: false,
      trails: true,
    };
    const loaded = loadContraptionProgress(rawV3);
    assert.equal(loaded.selectedId, "new-room-id");
    assert.deepEqual(loaded.clearedIds, ["special-delivery", "new-room-id"]);
    assert.deepEqual(
      loaded.layoutsById["special-delivery"],
      rawV3.layoutsById["special-delivery"],
    );
    assert.deepEqual(
      loaded.layoutsById["new-room-id"],
      rawV3.layoutsById["new-room-id"],
    );
    assert.equal(loaded.layoutsById["../escape"], undefined);
    assert.deepEqual(loaded.layoutRevisions, {
      "special-delivery": "r7",
      "new-room-id": "revision-a",
    });
    assert.deepEqual(
      loaded.ownedRewardIds,
      [...CONTRAPTION_REWARD_IDS],
      "earned rewards remain owned after repeated progression totals",
    );
    assert.deepEqual(loadContraptionProgress(loaded), loaded);
  });

  test("imports the legacy v1 save and normalizes old reward IDs", () => {
    const legacy = loadContraptionProgress({
      version: 1,
      delivered: 20,
      mute: true,
      owned: ["cc-spring-ornament"],
    });
    assert.equal(legacy.delivered, 20);
    assert.equal(legacy.mute, true);
    assert.deepEqual(legacy.ownedRewardIds, [...CONTRAPTION_REWARD_IDS]);
  });
});
