import assert from "node:assert/strict";
import { GUMMY_NOOK_REWARD_IDS, loadGummyNookProgress } from "../src/progress.ts";
import { GummyBoard } from "../src/engine.ts";

const fresh = loadGummyNookProgress(null);
assert.equal(fresh.version, 2); assert.equal(fresh.board.length, 36);
const malformed = loadGummyNookProgress({ version: 2, board: [99], cleared: -2, owned: ["wrong"] });
assert.equal(malformed.board.length, 36); assert.equal(malformed.cleared, 0); assert.deepEqual(malformed.owned, ["gn-candy-jar"]);
const migrated = loadGummyNookProgress({ version: 1, discovered: [0, 1, 2, 3, 4, 6], settings: { music: false, gloss: false } });
assert.equal(migrated.settings.music, false); assert.equal(migrated.settings.gloss, false); assert.equal(migrated.owned.length, 4);
assert.equal(GUMMY_NOOK_REWARD_IDS.candyJar, "gummy-nook:gn-candy-jar");
assert.ok(GummyBoard.legalMoves(fresh.board).length > 0);
console.log("gummy nook progress tests passed");
