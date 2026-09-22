import { IntakeGeometry } from "../src/intake-geometry";
import assert from "node:assert/strict";
import paintedJson from "../levels/painted-hillside.json";
import { ContentCompiler, parseLevelDocument } from "../src/content";
import {
  CELL_SIZE,
  COLS,
  PIPE_SIZE,
  type CompiledLevelDefinition,
  type LevelDocument,
  type Rect,
} from "../src/content-types";
import { DEFAULT_LEVEL_ID, LEVELS, loadCampaignLevels } from "../src/levels";

const original = parseLevelDocument(paintedJson);
assert.deepEqual(
  ContentCompiler.compile(original),
  original.legacy,
  "legacy content must compile to its exact shipped definition",
);

const editable = ContentCompiler.withoutLegacy(original);
const compiled = ContentCompiler.compile(editable) as CompiledLevelDefinition;
assert.equal(compiled.id, "painted-hillside");
assert.equal(compiled.terrainGrid.length, 80 * 100);
assert.equal(compiled.reservoirs.length, 1);
assert.equal(compiled.requiredPercent, 60);
assert.equal(compiled.hint.length, 0, "new authoring omits legacy hint paths");

const ordered = ContentCompiler.createLevel(
  "ordered-ops",
  "Ordered operations",
);
ordered.reservoirs = [];
ordered.terrain = [
  {
    id: "erase",
    kind: "brush",
    material: "empty",
    points: [
      { x: 2, y: 5 },
      { x: 8, y: 5 },
    ],
    radius: 1,
  },
  {
    id: "restore",
    kind: "polygon",
    material: "dirt",
    points: [
      { x: 4, y: 4 },
      { x: 6, y: 4 },
      { x: 6, y: 6 },
      { x: 4, y: 6 },
    ],
  },
  {
    id: "stone",
    kind: "brush",
    material: "rock",
    points: [{ x: 9, y: 9 }],
    radius: 0.4,
  },
];
const terrain = ContentCompiler.terrain(ordered);
const cell = (x: number, y: number) =>
  terrain[Math.floor(y / CELL_SIZE) * COLS + Math.floor(x / CELL_SIZE)];
assert.equal(cell(3, 5), 0, "brush erases dirt");
assert.equal(cell(5, 5), 1, "later polygon restores dirt");
assert.equal(cell(9, 9), 2, "painted rock has stable value 2");

const geometry = ContentCompiler.createLevel("geometry", "Geometry");
geometry.reservoirs = [
  {
    id: "left",
    x: 1.2,
    y: 1.2,
    w: 2.4,
    h: 2.4,
    fillPercent: 50,
    outlet: "left",
  },
  {
    id: "right",
    x: 7.2,
    y: 1.2,
    w: 2.4,
    h: 2.4,
    fillPercent: 100,
    outlet: "right",
  },
];
geometry.pipes = [
  { id: "a", x: 2.4, y: 7.2, kind: "straight", rotation: 0 },
  { id: "b", x: 3.6, y: 7.2, kind: "straight", rotation: 0 },
  { id: "c", x: 6, y: 7.2, kind: "tee", rotation: 90 },
];
const geometryLevel = ContentCompiler.compile(
  geometry,
) as CompiledLevelDefinition;
assert.equal(
  geometryLevel.reservoirs[0].halfH < geometryLevel.reservoirs[1].halfH,
  true,
  "fill percent controls spawn height",
);
assert.equal(
  covered(geometryLevel.tankWalls, 1.2, 2.4),
  false,
  "left outlet is centered and open",
);
assert.equal(
  covered(geometryLevel.tankWalls, 9.6, 2.4),
  false,
  "right outlet is centered and open",
);
assert(
  covered(geometryLevel.pipeRects, 3.6, 7.8),
  "adjacent snapped pipes meet without a collision gap",
);
assert(Math.abs(geometry.pipes[1].x - geometry.pipes[0].x - PIPE_SIZE) < 1e-9);

const draft = ContentCompiler.createLevel("draft", "Draft");
draft.reservoirs = [];
assert.match(
  ContentCompiler.validate(draft).join(" "),
  /at least one reservoir/i,
);
draft.reservoirs = [
  {
    id: "reservoir-1",
    x: 0,
    y: 1,
    w: 2,
    h: 2,
    fillPercent: 100,
    outlet: "bottom",
  },
];
assert.match(ContentCompiler.validate(draft).join(" "), /boundary/i);
draft.reservoirs = [
  {
    id: "reservoir-1",
    x: 1,
    y: 1,
    w: 2,
    h: 2,
    fillPercent: 100,
    outlet: "bottom",
  },
];
draft.pipes = [{ id: "off-grid", x: 1, y: 4, kind: "cross", rotation: 0 }];
assert.match(ContentCompiler.validate(draft).join(" "), /snap/i);

const shallow = ContentCompiler.createLevel("shallow", "Shallow");
shallow.reservoirs[0].fillPercent = 1;
assert.match(ContentCompiler.validate(shallow).join(" "), /water particle/i);

await testRuntimeFileLoading();

function covered(rects: Rect[], x: number, y: number): boolean {
  return rects.some(
    (rect) =>
      x >= rect.x - 1e-9 &&
      x <= rect.x + rect.w + 1e-9 &&
      y >= rect.y - 1e-9 &&
      y <= rect.y + rect.h + 1e-9,
  );
}

async function testRuntimeFileLoading(): Promise<void> {
  const savedDocument = globalThis.document;
  const savedFetch = globalThis.fetch;
  const first = ContentCompiler.createLevel("file-first", "First file");
  const second = ContentCompiler.createLevel("file-second", "Second file");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { baseURI: "https://example.test/chapter-house/" },
  });
  globalThis.fetch = async (input) => {
    const pathname = new URL(String(input)).pathname;
    const value = pathname.endsWith("campaign.json")
      ? { version: 1, levels: ["file-second", "file-first"] }
      : pathname.endsWith("file-second.json")
        ? second
        : first;
    return new Response(JSON.stringify(value), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  try {
    await loadCampaignLevels();
    assert.deepEqual(
      LEVELS.map((level) => level.id),
      ["file-second", "file-first"],
    );
    assert.equal(DEFAULT_LEVEL_ID, "file-second");
  } finally {
    if (savedDocument === undefined)
      delete (globalThis as { document?: Document }).document;
    else
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: savedDocument,
      });
    globalThis.fetch = savedFetch;
  }
}

// The old oversized fixture left water suspended above the illustrated barrel.
for (const facing of ["left", "up", "right", "down"] as const) {
  const turns = { left: 0, up: 1, right: 2, down: 3 }[facing];
  const point = (x: number, y: number) => {
    for (let i = 0; i < turns; i++) [x, y] = [-y, x];
    return { x: 6 + x, y: 8 + y };
  };
  const bodies = IntakeGeometry.body({ x: 6, y: 8, facing });
  const above = point(0, -0.5), barrel = point(0, 0), mouth = point(-0.9, 0);
  assert(!covered(bodies, above.x, above.y), "water can reach the visible pipe top in " + facing);
  assert(covered(bodies, barrel.x, barrel.y), "visible barrel stays solid in " + facing);
  assert(!covered(bodies, mouth.x, mouth.y), "working mouth stays open in " + facing);
}
const capped = IntakeGeometry.body({ x: 6, y: 8, facing: "up" }, true);
assert(!covered(capped, 6, 7.05), "transparent padding above capped pipe is open");
assert(covered(capped, 6, 7.3), "capped dome is solid");
for (const intake of original.legacy!.intakes) {
  for (const rect of IntakeGeometry.body(intake, intake.dummy)) {
    assert(original.legacy!.fixtures.some((fixture) =>
      ["x", "y", "w", "h"].every((key) => Math.abs(fixture[key as keyof Rect] - rect[key as keyof Rect]) < 1e-8)),
      "original campaign fixtures match the authored intake geometry");
  }
}
