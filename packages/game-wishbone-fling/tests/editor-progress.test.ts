import assert from "node:assert/strict";
import { test } from "node:test";
import { loadWishboneProgress } from "../src/progress";
import { LEGACY_LEVEL_IDS, LEGACY_LEVEL_REVISIONS } from "../src/legacy-levels";
import { registerYards } from "../src/levels";
import { PowerYard } from "../src/powers";
import { legacyYards } from "./legacy-catalog";

test("v2 migration keeps old numeric selection and original revision despite reordered or edited files", () => {
  const legacy = legacyYards[4],
    edited = structuredClone(legacy);
  edited.revision = "edited-layout";
  registerYards([
    edited,
    ...[...legacyYards].reverse().filter((y) => y.id !== edited.id),
  ]);
  const old = {
    version: 2,
    yard: 4,
    throws: 14,
    owned: ["bed", "power-magnet"],
    rescued: [`${legacy.id}:3`, "removed-yard:900"],
    checkpoints: {
      [legacy.id]: {
        pieces: [{ id: 3, x: 999, y: 333, angle: 1 }],
        rescued: [3],
        gadgets: {
          claimed: ["wind"],
          clearPaid: true,
          reward: "wind",
          gateOpen: true,
          polarity: 1,
        },
      },
      "removed-yard": {
        pieces: [{ id: 900, x: 400, y: 500, angle: 0 }],
        rescued: [900],
      },
    },
  };
  const migrated = loadWishboneProgress(old);
  assert.equal(migrated.version, 3);
  assert.equal(migrated.selectedLevelId, LEGACY_LEVEL_IDS[4]);
  assert.equal(
    migrated.checkpoints[legacy.id].revision,
    LEGACY_LEVEL_REVISIONS[legacy.id],
  );
  assert.deepEqual(migrated.rescued, old.rescued);
  assert.ok(migrated.owned.includes("bed"));
  assert.ok(migrated.owned.includes("power-magnet"));
  assert.ok(migrated.checkpoints["removed-yard"]);
  assert.deepEqual(loadWishboneProgress(migrated), migrated);
  const yard = new PowerYard(edited, migrated.checkpoints[legacy.id]);
  assert.equal(yard.rescued.size, 0);
  assert.equal(yard.gateOpen, false);
  assert.deepEqual(yard.checkpoint().gadgets?.claimed, ["wind"]);
  yard.dispose();
  registerYards(legacyYards);
});

test("stable selection and inactive historical state survive catalog removal without repeated migration grants", () => {
  const state = loadWishboneProgress({
    version: 3,
    selectedLevelId: "retired-yard",
    throws: 0,
    rescued: ["retired-yard:400"],
    checkpoints: {
      "retired-yard": {
        revision: "old",
        pieces: [],
        rescued: [400],
        devices: { "Gate.A_2": { open: true, polarity: -1 } },
      },
    },
  });
  assert.equal(state.selectedLevelId, "retired-yard");
  assert.equal(
    state.checkpoints["retired-yard"].devices?.["Gate.A_2"].open,
    true,
  );
  assert.ok(state.owned.includes("squeaker"));
  assert.deepEqual(loadWishboneProgress(state), state);
});
