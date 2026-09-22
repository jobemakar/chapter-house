import assert from "node:assert/strict";
import { parseLevelFile } from "../src/level-files";
import {
  EditorDocument,
  addPaletteObject,
  blankLevel,
  duplicateSelection,
  linkSelection,
  moveSelection,
  resizeSelection,
  rotateSelection,
} from "../src/editor/model";

const run = (name: string, test: () => void): void => {
  try { test(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n`); throw error; }
};

run("a drag batch undoes as one edit", () => {
  const document = new EditorDocument(blankLevel("batched-drag"));
  document.beginBatch();
  document.edit((file) => moveSelection(file, { kind: "launcher" }, { x: 300, y: 300 }, false));
  document.edit((file) => moveSelection(file, { kind: "launcher" }, { x: 420, y: 360 }, false));
  document.endBatch();
  assert.deepEqual(document.value.yard.launcher, { x: 420, y: 360 });
  assert.equal(document.undo(), true);
  assert.deepEqual(document.value.yard.launcher, { x: 160, y: 540 });
  assert.equal(document.redo(), true);
  assert.deepEqual(document.value.yard.launcher, { x: 420, y: 360 });
});

run("older completed saves do not clear newer edits", () => {
  const document = new EditorDocument(blankLevel("save-race"));
  document.edit((file) => { file.yard.name = "First"; });
  const sent = document.value;
  document.edit((file) => { file.yard.name = "Newer"; });
  assert.equal(document.acceptSaved(sent), false);
  assert.equal(document.dirty, true);
  document.undo();
  assert.equal(document.dirty, false);
});

run("fixed catalog pieces duplicate with stable numeric identities", () => {
  const file = blankLevel("pieces");
  const first = addPaletteObject(file, "plank", { x: 300, y: 300 });
  assert.deepEqual(file.yard.pieces[0], { id: 1, kind: "plank", x: 300, y: 300, w: 180, h: 18, angle: 0, color: 0 });
  const copy = duplicateSelection(file, first);
  assert.deepEqual(copy, { kind: "piece", id: 2 });
  assert.equal(file.yard.pieces[1].id, 2);
  assert.equal(file.nextPieceId, 3);
});

run("terrain alone exposes resize and keeps its stable string identity", () => {
  const file = blankLevel("terrain");
  const selection = addPaletteObject(file, "terrain", { x: 500, y: 450 });
  resizeSelection(file, selection, 360, 42);
  assert.deepEqual(file.yard.terrain[0], { id: "terrain-terrain-1", x: 500, y: 450, w: 360, h: 42, angle: 0 });
});

run("multiple controls keep explicit author-selected targets", () => {
  const file = blankLevel("links");
  const lever = addPaletteObject(file, "lever", { x: 200, y: 400 });
  const gate = addPaletteObject(file, "gate", { x: 700, y: 350 });
  assert.equal(gate.kind, "device");
  linkSelection(file, lever, gate.kind === "device" ? gate.id : undefined);
  assert.equal(file.yard.devices[0].targetId, file.yard.devices[1].id);
});

run("directional rectangular devices rotate while a round field does not", () => {
  const file = blankLevel("device-rotation");
  const gate = addPaletteObject(file, "gate", { x: 700, y: 350 });
  const field = addPaletteObject(file, "field", { x: 500, y: 350 });
  rotateSelection(file, gate, Math.PI / 3);
  rotateSelection(file, field, Math.PI / 2);
  assert.equal(file.yard.devices[0].angle, Math.PI / 3);
  assert.equal(file.yard.devices[1].angle, undefined);
});

run("history snapshots round-trip arbitrary draft structure", () => {
  const initial = blankLevel("round-trip");
  const document = new EditorDocument(initial);
  document.edit((file) => {
    addPaletteObject(file, "target", { x: 540, y: 180 });
    addPaletteObject(file, "bellows", { x: 380, y: 600 });
    file.yard.world = { width: 1800, height: 960 };
  });
  const changed = document.value;
  assert.equal(document.undo(), true);
  assert.deepEqual({ ...document.value, nextPieceId: initial.nextPieceId }, initial);
  assert.equal(document.redo(), true);
  assert.deepEqual(document.value, changed);
});

run("undo never reuses an allocated rescue identity", () => {
  const document = new EditorDocument(blankLevel("identity-high-water"));
  document.edit((file) => { addPaletteObject(file, "target", { x: 500, y: 200 }); });
  assert.equal(document.value.yard.pieces[0].id, 1);
  assert.equal(document.undo(), true);
  assert.equal(document.value.nextPieceId, 2);
  document.edit((file) => { addPaletteObject(file, "target", { x: 600, y: 200 }); });
  assert.equal(document.value.yard.pieces[0].id, 2);
});

run("a server high-water merge is adopted without leaving the draft dirty", () => {
  const file = blankLevel("server-high-water");
  const document = new EditorDocument(file);
  const saved = structuredClone(file);
  saved.nextPieceId = 41;
  assert.equal(document.acceptSaved(saved), true);
  assert.equal(document.value.nextPieceId, 41);
  assert.equal(document.dirty, false);
  document.edit((draft) => { addPaletteObject(draft, "target", { x: 500, y: 200 }); });
  assert.equal(document.value.yard.pieces[0].id, 41);
});

run("server parsing and key reordering still accepts the saved draft as clean", () => {
  const document = new EditorDocument(blankLevel("canonical-save"));
  document.edit((file) => {
    addPaletteObject(file, "target", { x: 550, y: 200 });
    addPaletteObject(file, "bellows", { x: 420, y: 600 });
  });
  const serverLevel = parseLevelFile(JSON.parse(JSON.stringify(document.value)));
  assert.equal(document.acceptSaved(serverLevel), true);
  assert.equal(document.dirty, false);
});
