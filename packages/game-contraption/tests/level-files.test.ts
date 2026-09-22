import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import {
  copyLevel,
  fingerprint,
  levelIssues,
  parseLevelFile,
  parseLevelIndex,
  type LevelFile,
} from "../src/level-files";
import { part } from "../src/levels";

const LEVEL_DIRECTORY = fileURLToPath(
  new URL("../public/levels/", import.meta.url),
);

function levelFile(level: LevelFile["level"]): LevelFile {
  return { version: 1, level };
}

describe("Contraption level files", () => {
  test("parses the included index and all six separate stable-ID documents", async () => {
    const index = parseLevelIndex(
      JSON.parse(
        await fs.readFile(path.join(LEVEL_DIRECTORY, "index.json"), "utf8"),
      ) as unknown,
    );
    assert.equal(index.version, 1);
    assert.deepEqual(index.levels, [
      "special-delivery",
      "missing-link",
      "over-the-wall",
      "little-breeze",
      "meet-in-the-middle",
      "switchboard-symphony",
    ]);
    for (const id of index.levels) {
      const raw = JSON.parse(
        await fs.readFile(path.join(LEVEL_DIRECTORY, `${id}.json`), "utf8"),
      ) as unknown;
      const parsed = parseLevelFile(raw);
      assert.equal(parsed.level.id, id);
      assert.deepEqual(
        parseLevelFile(JSON.parse(JSON.stringify(parsed))),
        parsed,
      );
      assert.deepEqual(levelIssues(parsed), []);
    }
  });

  test("preserves saveable gameplay-invalid drafts for the editor to diagnose", () => {
    const button = {
      ...part("button", 250, 250, 0, "unbound-button"),
      mode: "latch" as const,
    };
    const draft = levelFile({
      id: "draft-machine",
      name: "",
      tag: "",
      sources: [],
      period: 0.6,
      bowl: { x: 850, y: 550 },
      initial: [button],
      spares: [],
    });
    const saved = parseLevelFile(draft);
    assert.deepEqual(saved, draft);
    assert.deepEqual(levelIssues(saved), [
      "Give the level a name",
      "Add at least one inlet",
      "Corn button unbound-button: choose one conveyor or fan",
    ]);
  });

  test("copies level and piece identities and remaps links across placed and spare pieces", () => {
    const belt = part("belt", 700, 400, 0, "belt-authored");
    const button = {
      ...part("button", 200, 200, 0, "button-authored"),
      targetId: belt.id,
      mode: "toggle" as const,
    };
    const fan = part("fan", 500, 180, -Math.PI / 2, "fan-spare");
    const lever = {
      ...part("lever", 400, 250, 0, "lever-spare"),
      targetId: fan.id,
      mode: "latch" as const,
    };
    const source = parseLevelFile(
      levelFile({
        id: "source-machine",
        name: "Source",
        tag: "",
        sources: [{ x: 180, y: 100, vx: 0 }],
        period: 0.6,
        bowl: { x: 850, y: 550 },
        initial: [belt, button],
        spares: [fan, lever],
      }),
    );
    const copy = parseLevelFile(copyLevel(source));
    assert.notEqual(copy.level.id, source.level.id);
    assert.equal(copy.level.initial[1].targetId, copy.level.initial[0].id);
    assert.equal(copy.level.spares[1].targetId, copy.level.spares[0].id);
    assert.equal(
      new Set(
        [...copy.level.initial, ...copy.level.spares].map((piece) => piece.id),
      ).size,
      4,
    );
    assert.ok(
      [...copy.level.initial, ...copy.level.spares].every(
        (piece) => ![belt.id, button.id, fan.id, lever.id].includes(piece.id),
      ),
    );
    assert.deepEqual(levelIssues(copy), []);
  });

  test("keeps layout fingerprints stable when authored piece arrays are reordered", () => {
    const a = part("belt", 700, 400, 0, "belt-a");
    const b = part("ramp", 300, 250, 0.2, "ramp-b");
    const source = levelFile({
      id: "ordered-machine",
      name: "Order",
      tag: "",
      sources: [{ x: 180, y: 100, vx: 0 }],
      period: 0.6,
      bowl: { x: 850, y: 550 },
      initial: [a, b],
      spares: [],
    });
    assert.equal(
      fingerprint(source.level),
      fingerprint({
        ...source.level,
        initial: [...source.level.initial].reverse(),
      }),
    );
  });

  test("rejects unsafe IDs, duplicate index entries, invalid versions, and out-of-bounds stored geometry", () => {
    assert.throws(
      () => parseLevelIndex({ version: 1, levels: ["safe-id", "safe-id"] }),
      /Duplicate/,
    );
    assert.throws(() => parseLevelFile({ version: 9, level: {} }), /version/);
    const unsafeId = levelFile({
      id: "../outside",
      name: "Unsafe",
      tag: "",
      sources: [{ x: 180, y: 100, vx: 0 }],
      period: 0.6,
      bowl: { x: 850, y: 550 },
      initial: [],
      spares: [],
    });
    assert.throws(() => parseLevelFile(unsafeId), /stable ID/);
    const outside = levelFile({
      ...unsafeId.level,
      id: "inside-id",
      sources: [{ x: 1200, y: 100, vx: 0 }],
    });
    assert.throws(() => parseLevelFile(outside), /between 0 and 1100/);
  });
});
