import assert from "node:assert/strict";
import { ContentCompiler } from "../src/content";
import type { LevelDocument } from "../src/content-types";
import {
  EditorHistory,
  PIPE_GRID,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  addObject,
  beginAuthoring,
  duplicateSelection,
  hitTest,
  moveSelection,
  nextObjectId,
  removeSelection,
} from "../src/editor/model";
import type { LevelDefinition } from "../src/types";

function level(id = "model-test"): LevelDocument {
  return ContentCompiler.createLevel(id, "Model Test");
}

function testHistoryHasNoAliases(): void {
  const document = level();
  document.terrain.push({
    id: "model-test-shape-1",
    kind: "polygon",
    material: "empty",
    points: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 3 },
    ],
  });
  const history = new EditorHistory();
  history.remember(document);

  document.name = "Changed current document";
  document.terrain[0].points[0].x = 8;
  const undone = history.undo(document);
  assert.ok(undone);
  assert.equal(undone.name, "Model Test");
  assert.equal(undone.terrain[0].points[0].x, 1);
  assert.equal(history.canRedo, true);

  undone.name = "Edited after undo";
  undone.terrain[0].points[0].x = 2;
  const redone = history.redo(undone);
  assert.ok(redone);
  assert.equal(redone.name, "Changed current document");
  assert.equal(redone.terrain[0].points[0].x, 8);

  redone.terrain[0].points[0].x = 11;
  const secondUndo = history.undo(redone);
  assert.ok(secondUndo);
  assert.equal(secondUndo.name, "Edited after undo");
  assert.equal(secondUndo.terrain[0].points[0].x, 2);
}

function testWholeShapeMovesPreserveGeometry(): void {
  const document = level();
  document.terrain.push({
    id: "model-test-polygon-1",
    kind: "polygon",
    material: "rock",
    points: [
      { x: 10, y: 1 },
      { x: 11.8, y: 1 },
      { x: 11.8, y: 3 },
      { x: 10, y: 3 },
    ],
  });
  const before = structuredClone(document.terrain[0].points);
  moveSelection(document, { kind: "terrain", index: 0 }, 2, -5);
  const after = document.terrain[0].points;

  const appliedDx = after[0].x - before[0].x;
  const appliedDy = after[0].y - before[0].y;
  after.forEach((point, index) => {
    assert.equal(point.x - before[index].x, appliedDx);
    assert.equal(point.y - before[index].y, appliedDy);
  });
  assert.equal(Math.max(...after.map((point) => point.x)), WORLD_WIDTH);
  assert.equal(Math.min(...after.map((point) => point.y)), 0);

  const reservoir = structuredClone(document.reservoirs[0]);
  moveSelection(document, { kind: "reservoir", index: 0 }, 100, 100);
  assert.equal(document.reservoirs[0].w, reservoir.w);
  assert.equal(document.reservoirs[0].h, reservoir.h);
  assert.ok(document.reservoirs[0].x + reservoir.w <= WORLD_WIDTH);
  assert.ok(document.reservoirs[0].y + reservoir.h <= WORLD_HEIGHT);

  addObject(document, "rock");
  const rock = structuredClone(document.rocks[0]);
  moveSelection(document, { kind: "rock", index: 0 }, -100, -100);
  assert.deepEqual(
    { w: document.rocks[0].w, h: document.rocks[0].h },
    { w: rock.w, h: rock.h },
  );
}

function testVertexEditingIsIsolated(): void {
  const document = level();
  document.terrain.push({
    id: "model-test-polygon-1",
    kind: "polygon",
    material: "empty",
    points: [
      { x: 2, y: 2 },
      { x: 5, y: 2 },
      { x: 3, y: 5 },
    ],
  });
  const untouched = structuredClone(document.terrain[0].points.slice(1));
  assert.deepEqual(hitTest(document, { x: 2.05, y: 2.05 }), {
    kind: "terrain",
    index: 0,
    vertex: 0,
  });
  moveSelection(document, { kind: "terrain", index: 0, vertex: 0 }, -10, 20);
  assert.deepEqual(document.terrain[0].points[0], { x: 0, y: WORLD_HEIGHT });
  assert.deepEqual(document.terrain[0].points.slice(1), untouched);
}

function testPipeSnappingRotationAndBounds(): void {
  const document = level();
  const selection = addObject(document, "pipe-straight");
  assert.equal(selection.kind, "pipe");
  if (selection.kind !== "pipe") throw new Error("Expected pipe selection.");
  const pipe = document.pipes[selection.index];
  pipe.rotation = 90;

  const duplicate = duplicateSelection(document, selection);
  assert.ok(duplicate && duplicate.kind === "pipe");
  if (!duplicate || duplicate.kind !== "pipe")
    throw new Error("Expected duplicated pipe.");
  const copy = document.pipes[duplicate.index];
  assert.notEqual(copy.id, pipe.id);
  assert.equal(copy.rotation, 90);
  assert.equal(copy.x / PIPE_GRID, Math.round(copy.x / PIPE_GRID));
  assert.equal(copy.y / PIPE_GRID, Math.round(copy.y / PIPE_GRID));

  moveSelection(document, duplicate, 100, 100);
  assert.ok(copy.x >= 0 && copy.x + PIPE_GRID <= WORLD_WIDTH);
  assert.ok(copy.y >= 0 && copy.y + PIPE_GRID <= WORLD_HEIGHT);
  assert.equal(copy.x / PIPE_GRID, Math.round(copy.x / PIPE_GRID));
  assert.equal(copy.y / PIPE_GRID, Math.round(copy.y / PIPE_GRID));

  document.pipes = [
    {
      id: "model-test-pipe-rotation",
      x: 4.8,
      y: 6,
      kind: "straight",
      rotation: 0,
    },
  ];
  const horizontal = ContentCompiler.compile(document).pipeRects ?? [];
  document.pipes[0].rotation = 90;
  const vertical = ContentCompiler.compile(document).pipeRects ?? [];
  const extent = (rects: typeof horizontal) => ({
    w:
      Math.max(...rects.map((rect) => rect.x + rect.w)) -
      Math.min(...rects.map((rect) => rect.x)),
    h:
      Math.max(...rects.map((rect) => rect.y + rect.h)) -
      Math.min(...rects.map((rect) => rect.y)),
  });
  const horizontalExtent = extent(horizontal);
  const verticalExtent = extent(vertical);
  assert.ok(Math.abs(horizontalExtent.w - PIPE_GRID) < 1e-9);
  assert.ok(Math.abs(horizontalExtent.h - 0.3) < 1e-9);
  assert.ok(Math.abs(verticalExtent.w - 0.3) < 1e-9);
  assert.ok(Math.abs(verticalExtent.h - PIPE_GRID) < 1e-9);
}

function testDuplicatesUseStableUniqueIds(): void {
  const document = level("stable-ids");
  document.terrain.push({
    id: "stable-ids-polygon-1",
    kind: "polygon",
    material: "dirt",
    points: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1.5, y: 2 },
    ],
  });
  document.reservoirs[0].id = "stable-ids-tank-1";
  document.pipes.push({
    id: "stable-ids-pipe-1",
    x: 1.2,
    y: 4.8,
    kind: "elbow",
    rotation: 270,
  });

  const firstTerrain = duplicateSelection(document, {
    kind: "terrain",
    index: 0,
  });
  const firstTank = duplicateSelection(document, {
    kind: "reservoir",
    index: 0,
  });
  const firstPipe = duplicateSelection(document, { kind: "pipe", index: 0 });
  assert.ok(firstTerrain && firstTank && firstPipe);
  const ids = [
    ...document.terrain.map((item) => item.id),
    ...document.reservoirs.map((item) => item.id),
    ...document.pipes.map((item) => item.id),
  ];
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(nextObjectId(document, "pipe"), "stable-ids-pipe-3");

  const terrainCopy = document.terrain.at(-1)!;
  terrainCopy.points[0].x = 9;
  assert.equal(document.terrain[0].points[0].x, 1);
  assert.equal(document.pipes.at(-1)!.rotation, 270);
}

function testRequiredObjectsCannotBeDeleted(): void {
  const document = level();
  const intake = structuredClone(document.intake);
  const target = structuredClone(document.target);
  assert.equal(removeSelection(document, { kind: "intake" }), false);
  assert.equal(removeSelection(document, { kind: "target" }), false);
  assert.deepEqual(document.intake, intake);
  assert.deepEqual(document.target, target);
}

function legacyDefinition(): LevelDefinition {
  return {
    id: "legacy-level",
    name: "Legacy Level",
    required: 10,
    floor: 14.7,
    reservoir: {
      left: 4,
      right: 8,
      height: 2,
      centerX: 6,
      centerY: 1,
      halfW: 1.8,
      halfH: 0.8,
    },
    soil: [],
    protected: [],
    pockets: [],
    rocks: [],
    fixtures: [],
    canteens: [{ x: 2, y: 3 }],
    intakes: [{ id: "hose", x: 6, y: 13, facing: "left", dummy: false }],
    hint: [],
    target: { x: 7, y: 11, w: 4, h: 3 },
    fire: { x: 9, y: 13 },
    hose: { x: 10, y: 12 },
  };
}

function testLegacyConversionIsExplicitAndAllowsZeroCanteens(): void {
  const document = level("modern-draft");
  document.canteens = [];
  document.legacy = legacyDefinition();

  const preserved = ContentCompiler.compile(document);
  assert.equal(preserved.id, "modern-draft");
  assert.equal(preserved.required, 10);
  assert.equal(preserved.canteens.length, 1);
  assert.ok(document.legacy, "compilation must not convert the document");

  const authored = beginAuthoring(document);
  assert.equal(authored.legacy, undefined);
  assert.ok(document.legacy, "conversion must not mutate the source document");
  const compiled = ContentCompiler.compile(authored);
  assert.equal(compiled.id, "modern-draft");
  assert.deepEqual(compiled.canteens, []);
  assert.equal(
    ContentCompiler.validate(authored).some((issue) => /canteen/i.test(issue)),
    false,
  );
}

const cases: Array<[string, () => void]> = [
  ["history has no aliases", testHistoryHasNoAliases],
  ["whole-shape moves preserve geometry", testWholeShapeMovesPreserveGeometry],
  ["polygon vertex editing is isolated", testVertexEditingIsIsolated],
  ["pipes snap, rotate, and stay bounded", testPipeSnappingRotationAndBounds],
  ["duplicates use stable unique ids", testDuplicatesUseStableUniqueIds],
  ["required objects cannot be deleted", testRequiredObjectsCannotBeDeleted],
  [
    "legacy conversion is explicit",
    testLegacyConversionIsExplicitAndAllowsZeroCanteens,
  ],
];
const failures: Error[] = [];
for (const [name, run] of cases) {
  try {
    run();
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    failure.message = `${name}: ${failure.message}`;
    failures.push(failure);
  }
}
if (failures.length)
  throw new AggregateError(
    failures,
    `${failures.length} editor model test(s) failed.`,
  );
console.log(
  "PASS: editor history, geometry, snapping, required objects, duplication, and legacy conversion",
);
