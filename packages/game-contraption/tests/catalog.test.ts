import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CatalogProgress } from "../src/catalog-progress";
import { loadLevelCatalog } from "../src/level-loader";
import { parseLevelFile } from "../src/level-files";
import { clone, normalizeLayout } from "../src/levels";
import { freshContraptionProgress } from "../src/progress";

const file = () =>
  parseLevelFile(
    JSON.parse(
      readFileSync(
        new URL("./fixtures/editor-roundtrip.json", import.meta.url),
        "utf8",
      ),
    ),
  );
test("catalog edits reset only incompatible layout and retain earned and inactive history", () => {
  const level = file().level,
    progress = freshContraptionProgress();
  progress.selectedId = level.id;
  progress.clearedIds = [level.id, "retired-machine"];
  progress.delivered = 25;
  CatalogProgress.prepare(progress, [level]);
  const movable = progress.layoutsById[level.id].find((p) => !p.locked)!;
  movable.x = 700;
  const second = clone(level);
  second.id = "second-machine";
  assert.equal(CatalogProgress.prepare(progress, [second, level]), 1);
  assert.equal(
    progress.layoutsById[level.id].find((p) => p.id === movable.id)?.x,
    700,
  );
  CatalogProgress.prepare(progress, [second]);
  assert.ok(progress.layoutsById[level.id]);
  const edited = clone(level);
  edited.initial.find((p) => p.id === movable.id)!.x = 400;
  CatalogProgress.prepare(progress, [edited]);
  assert.equal(
    progress.layoutsById[level.id].find((p) => p.id === movable.id)?.x,
    400,
  );
  assert.deepEqual(progress.clearedIds, [level.id, "retired-machine"]);
  assert.equal(progress.delivered, 25);
});
test("spare identity and authored binding survive normalization; unowned pieces cannot enter a layout", () => {
  const level = file().level;
  const reserve = level.spares[0];
  assert.ok(reserve);
  const input = [
    ...level.initial,
    { ...reserve, x: 300, y: 300, power: 50 },
    { ...reserve, id: "unowned-piece" },
  ];
  const restored = normalizeLayout(level, input);
  assert.equal(restored.find((p) => p.id === reserve.id)?.power, 1);
  assert.ok(!restored.some((p) => p.id === "unowned-piece"));
  const button = level.initial.find((p) => p.type === "button")!;
  assert.equal(
    restored.find((p) => p.id === button.id)?.targetId,
    button.targetId,
  );
});
test("loader honors order, reports invalid entries and handles empty catalogs without fallback", async () => {
  const a = file(),
    b = clone(a);
  b.level.id = "second-machine";
  const original = globalThis.fetch;
  const data: Record<string, unknown> = {
    "index.json": {
      version: 1,
      levels: [b.level.id, "broken-machine", a.level.id],
    },
    [a.level.id + ".json"]: a,
    [b.level.id + ".json"]: b,
    "broken-machine.json": { version: 1 },
  };
  globalThis.fetch = async (input) =>
    new Response(
      JSON.stringify(data[new URL(String(input)).pathname.split("/").pop()!]),
      { status: 200 },
    );
  try {
    const loaded = await loadLevelCatalog(
      new URL("http://localhost/nested/levels/"),
    );
    assert.deepEqual(
      loaded.levels.map((l) => l.id),
      [b.level.id, a.level.id],
    );
    assert.equal(loaded.diagnostics.length, 1);
    data["index.json"] = { version: 1, levels: [] };
    assert.deepEqual(
      await loadLevelCatalog(new URL("http://localhost/levels/")),
      { levels: [], diagnostics: [] },
    );
  } finally {
    globalThis.fetch = original;
  }
});
