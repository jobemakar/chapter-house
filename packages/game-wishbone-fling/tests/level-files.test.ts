import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  copyLevelFile,
  levelIssues,
  levelRevision,
  parseLevelFile,
  parseLevelIndex,
  playableYard,
  type LevelFile,
} from "../src/level-files";
import { LEGACY_LEVELS } from "../src/legacy-levels";

const levelsUrl = new URL("../public/levels/", import.meta.url);

function fixture(overrides: Partial<LevelFile["yard"]> = {}): LevelFile {
  return {
    version: 1,
    playtested: false,
    nextPieceId: 2,
    yard: {
      id: "test-yard",
      name: "Test Yard",
      subtitle: "A fixture",
      legacyIndex: null,
      world: { width: 1200, height: 720 },
      launcher: { x: 162, y: 478 },
      pieces: [
        { id: 0, kind: "plank", x: 600, y: 500, w: 300, h: 18, color: 0, angle: 0 },
        { id: 1, kind: "target", x: 700, y: 400, w: 0, h: 0, r: 20, color: 1, angle: 0 },
      ],
      terrain: [{ id: "ground", x: 600, y: 638, w: 1600, h: 76, angle: 0 }],
      devices: [],
      ...overrides,
    },
  };
}

describe("Wishbone level files", () => {
  test("round-trips all 28 converted yards and preserves the visible picker order", () => {
    const index = parseLevelIndex(JSON.parse(readFileSync(new URL("index.json", levelsUrl), "utf8")) as unknown);
    const expectedOrder = [...LEGACY_LEVELS.slice(2), ...LEGACY_LEVELS.slice(0, 2)].map(({ id }) => id);
    const legacyIds = new Set<string>(LEGACY_LEVELS.map(({ id }) => id));
    assert.deepEqual(index.levels.filter((id) => legacyIds.has(id)), expectedOrder);

    for (const [legacyIndex, metadata] of LEGACY_LEVELS.entries()) {
      const raw = JSON.parse(readFileSync(new URL(`${metadata.id}.json`, levelsUrl), "utf8")) as unknown;
      const file = parseLevelFile(raw);
      assert.deepEqual(parseLevelFile(JSON.parse(JSON.stringify(file))), file);
      assert.deepEqual(levelIssues(file), []);
      assert.equal(file.yard.legacyIndex, legacyIndex);
      assert.equal(playableYard(file).revision, metadata.revision);
    }
  });

  test("saves safe incomplete drafts and reports playability diagnostics", () => {
    const draft = parseLevelFile(fixture({ name: "", launcher: null, pieces: [] }));
    assert.deepEqual(levelIssues(draft), [
      "A level name is required.",
      "Place one launcher.",
      "Place at least one toy.",
    ]);
    assert.throws(() => playableYard(draft), /Place one launcher/);
  });

  test("validates finite geometry, stable IDs, launcher support and explicit links", () => {
    assert.throws(() => parseLevelFile(fixture({ id: "../escape" })), /yard id/);
    assert.throws(() => parseLevelFile({ ...fixture(), nextPieceId: 1 }), /greater than every piece id/);
    assert.throws(() => parseLevelFile(fixture({ pieces: [
      { id: 0, kind: "target", x: Number.NaN, y: 1, w: 0, h: 0, r: 20, color: 0, angle: 0 },
    ] })), /finite number/);

    const linked = fixture({
      launcher: { x: 40, y: 100 },
      devices: [{ id: "lever-1", kind: "lever", x: 400, y: 400, targetId: "missing-gate" }],
    });
    assert.deepEqual(levelIssues(linked), [
      "Launcher and its automatic support must fit inside the 1200 by 720 world.",
      "Lever lever-1 targets missing device missing-gate.",
    ]);
  });

  test("uses rotated rectangle extents rather than a broad bounding circle", () => {
    const file = fixture({ pieces: [
      { id: 0, kind: "plank", x: 150, y: 20, w: 300, h: 18, color: 0, angle: 0 },
      { id: 1, kind: "target", x: 700, y: 400, w: 0, h: 0, r: 20, color: 1, angle: 0 },
    ] });
    assert.deepEqual(levelIssues(file), []);
  });

  test("revision follows physics by stable identity while ignoring array and copy edits", () => {
    const source = fixture();
    const reordered = fixture({
      name: "Retitled",
      subtitle: "Edited copy",
      pieces: [...source.yard.pieces].reverse(),
      terrain: [...source.yard.terrain].reverse(),
    });
    assert.equal(levelRevision(source), levelRevision(reordered));
    const moved = fixture({ pieces: source.yard.pieces.map((piece) => piece.id === 1 ? { ...piece, x: piece.x + 1 } : piece) });
    assert.notEqual(levelRevision(source), levelRevision(moved));

    const copy = copyLevelFile(source, "copied-yard");
    assert.equal(copy.yard.id, "copied-yard");
    assert.equal(copy.yard.legacyIndex, null);
    assert.equal(copy.playtested, false);
    assert.deepEqual(levelIssues(copy), []);
  });

  test("manifest accepts only safe unique level IDs", () => {
    assert.deepEqual(parseLevelIndex({ version: 1, levels: ["one", "two-2"] }), { version: 1, levels: ["one", "two-2"] });
    assert.throws(() => parseLevelIndex({ version: 1, levels: ["one", "one"] }), /duplicate/);
    assert.throws(() => parseLevelIndex({ version: 1, levels: ["index"] }), /cannot be "index"/);
  });
});
