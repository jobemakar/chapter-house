import assert from "node:assert/strict";
import {
  EditorDocument,
  addPaletteObject,
  blankLevel,
  describeSelection,
  duplicateSelection,
  hitTest,
  moveSelection,
  rotateSelection,
  setSelectionLength,
  setSelectionPower,
} from "../src/editor/model";

const run = (name: string, test: () => void): void => {
  try { test(); process.stdout.write(`✓ ${name}\n`); }
  catch (error) { process.stderr.write(`✗ ${name}\n`); throw error; }
};

run("opening and unrelated edits preserve authored cord metadata", () => {
  const file = blankLevel("cord-preservation");
  file.room.keyStart = { x: 300, y: 300 };
  file.room.cords = [{ id: "authored-cord", anchor: { x: 100, y: 100 }, length: 190, angle: 0.45 }];
  const document = new EditorDocument(file);
  assert.equal(document.value.room.cords[0].length, 190);
  assert.equal(document.value.room.cords[0].angle, 0.45);
  document.edit((draft) => { draft.room.title = "Renamed"; });
  assert.equal(document.value.room.cords[0].length, 190);
  assert.equal(document.value.room.cords[0].angle, 0.45);
});

run("moving an anchor derives its length and angle from the key", () => {
  const file = blankLevel("anchor-derivation");
  file.room.keyStart = { x: 300, y: 400 };
  file.room.cords = [{ id: "cord", anchor: { x: 100, y: 100 }, length: 190, angle: 0 }];
  moveSelection(file.room, { kind: "cord", index: 0 }, { x: 300, y: 200 }, false);
  assert.equal(file.room.cords[0].length, 200);
  assert.equal(file.room.cords[0].angle, Math.PI / 2);
});

run("adding a key derives all pre-existing draft anchors", () => {
  const file = blankLevel("late-key");
  addPaletteObject(file.room, "anchor", { x: 100, y: 100 });
  assert.equal(file.room.cords[0].length, 120);
  addPaletteObject(file.room, "key", { x: 100, y: 300 });
  assert.equal(file.room.cords[0].length, 200);
  assert.equal(file.room.cords[0].angle, Math.PI / 2);
});

run("a drag batch undoes in one step", () => {
  const file = blankLevel("batched-drag");
  file.room.keyStart = { x: 100, y: 100 };
  const document = new EditorDocument(file);
  document.beginBatch();
  document.edit((draft) => moveSelection(draft.room, { kind: "key" }, { x: 150, y: 150 }, false));
  document.edit((draft) => moveSelection(draft.room, { kind: "key" }, { x: 220, y: 240 }, false));
  document.endBatch();
  assert.deepEqual(document.value.room.keyStart, { x: 220, y: 240 });
  assert.equal(document.undo(), true);
  assert.deepEqual(document.value.room.keyStart, { x: 100, y: 100 });
});

run("a completed older save does not clear newer edits", () => {
  const document = new EditorDocument(blankLevel("save-race"));
  document.edit((draft) => { draft.room.title = "First title"; });
  const sent = document.value;
  document.edit((draft) => { draft.room.title = "Newer title"; });
  assert.equal(document.acceptSaved(sent), false);
  assert.equal(document.dirty, true);
  document.undo();
  assert.equal(document.dirty, false);
});

run("new platform and fan store adjustable defaults", () => {
  const file = blankLevel("platform-default");
  addPaletteObject(file.room, "platform", { x: 280, y: 400 });
  addPaletteObject(file.room, "bellows", { x: 200, y: 300 });
  assert.deepEqual(file.room.props[0], { kind: "platform", position: { x: 280, y: 400 }, radius: 52, angle: 0, length: 104 });
  assert.equal(file.room.props[1].power, 1);
});

run("platform length and fan power clamp and survive duplication", () => {
  const file = blankLevel("adjustable-props");
  addPaletteObject(file.room, "platform", { x: 280, y: 400 });
  addPaletteObject(file.room, "bellows", { x: 200, y: 300 });
  setSelectionLength(file.room, { kind: "prop", index: 0 }, 999);
  setSelectionPower(file.room, { kind: "prop", index: 1 }, 0.1);
  assert.equal(file.room.props[0].length, 280);
  assert.equal(file.room.props[1].power, 0.25);
  duplicateSelection(file.room, { kind: "prop", index: 0 });
  assert.equal(file.room.props[2].length, 280);
});

run("walls expose platform-style editing without losing their wall identity", () => {
  const file = blankLevel("wall-editing");
  const selection = addPaletteObject(file.room, "wall", { x: 280, y: 400 });
  assert.deepEqual(selection, { kind: "prop", index: 0 });
  assert.deepEqual(file.room.props[0], { kind: "wall", position: { x: 280, y: 400 }, radius: 52, angle: 0, length: 104 });
  assert.equal(describeSelection(file.room, selection)?.label, "Wall");
  assert.equal(hitTest(file.room, { x: 325, y: 400 })?.kind, "prop");
  rotateSelection(file.room, selection!, Math.PI / 2);
  setSelectionLength(file.room, selection!, 999);
  const copy = duplicateSelection(file.room, selection!);
  assert.equal(file.room.props[0].angle, Math.PI / 2);
  assert.equal(file.room.props[0].length, 280);
  assert.deepEqual(copy, { kind: "prop", index: 1 });
  assert.equal(file.room.props[1].kind, "wall");
  assert.equal(file.room.props[1].length, 280);
});
