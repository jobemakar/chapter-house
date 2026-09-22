import assert from "node:assert/strict";
import {
  blankLevel,
  cloneLevelForPlaytest,
  copyLevel,
  EditorDocument,
  setSpareQuantity,
} from "../src/editor/model";
import type { LevelFile } from "../src/level-files";
import { parseLevelFile } from "../src/level-files";
import { part } from "../src/levels";

const run = (name: string, test: () => void): void => {
  test();
  process.stdout.write(`✓ ${name}\n`);
};

run("drag batch undo and redo preserve one authoring transaction", () => {
  const file = blankLevel("history");
  file.level.initial.push(part("belt", 200, 200));
  const doc = new EditorDocument(file);
  doc.beginBatch();
  doc.edit((draft) => {
    draft.level.initial[0].x = 240;
  });
  doc.edit((draft) => {
    draft.level.initial[0].x = 320;
  });
  doc.endBatch();
  assert.equal(doc.value.level.initial[0].x, 320);
  assert.equal(doc.undo(), true);
  assert.equal(doc.value.level.initial[0].x, 200);
  assert.equal(doc.redo(), true);
  assert.equal(doc.value.level.initial[0].x, 320);
});

run("copy makes independent stable IDs and remaps control links", () => {
  const file = blankLevel("original"),
    fan = part("fan", 400, 280),
    button = part("button", 280, 170),
    spare = part("lever", 650, 180);
  button.targetId = fan.id;
  spare.targetId = fan.id;
  file.level.initial.push(fan, button);
  file.level.spares.push(spare);
  const copied = copyLevel(file, "copied"),
    [fanCopy, buttonCopy] = copied.level.initial;
  assert.equal(copied.level.id, "copied");
  assert.notEqual(fanCopy.id, fan.id);
  assert.notEqual(buttonCopy.id, button.id);
  assert.equal(buttonCopy.targetId, fanCopy.id);
  assert.equal(copied.level.spares[0].targetId, fanCopy.id);
  assert.equal(
    new Set(
      [...copied.level.initial, ...copied.level.spares].map(
        (piece) => piece.id,
      ),
    ).size,
    3,
  );
});

run("spare quantity changes preserve control records and options", () => {
  const file = blankLevel("spares"),
    first = part("button", 100, 120),
    second = part("button", 100, 120);
  first.targetId = "fan-a";
  first.mode = "latch";
  second.targetId = "fan-b";
  file.level.spares.push(first, second);
  setSpareQuantity(file.level, "button", 3);
  assert.equal(
    file.level.spares.filter((piece) => piece.type === "button").length,
    3,
  );
  assert.equal(file.level.spares[0].id, first.id);
  assert.equal(file.level.spares[0].targetId, "fan-a");
  assert.equal(file.level.spares[0].mode, "latch");
  setSpareQuantity(file.level, "button", 1);
  assert.equal(file.level.spares[0].id, first.id);
});

run("test copy cannot mutate editor document", () => {
  const file = blankLevel("isolation");
  file.level.initial.push(part("ramp", 250, 300));
  const doc = new EditorDocument(file);
  const baseline: LevelFile = structuredClone(doc.value),
    testCopy = cloneLevelForPlaytest(baseline.level);
  testCopy.initial[0].x = 999;
  testCopy.sources[0].x = 777;
  assert.equal(doc.value.level.initial[0].x, 250);
  assert.equal(doc.value.level.sources[0].x, 180);
  assert.equal(parseLevelFile(doc.value).level.initial[0].x, 250);
});

run("save acknowledgement leaves newer edits dirty", () => {
  const doc = new EditorDocument(blankLevel("save-race"));
  doc.edit((file) => {
    file.level.name = "first";
  });
  const sent = doc.value;
  doc.edit((file) => {
    file.level.name = "newer";
  });
  assert.equal(doc.acceptSaved(sent), false);
  assert.equal(doc.dirty, true);
  assert.equal(doc.undo(), true);
  assert.equal(doc.dirty, false);
});

run(
  "save acknowledgement clears dirty state for the exact submitted draft",
  () => {
    const doc = new EditorDocument(blankLevel("raw-save"), false),
      submitted = doc.value;
    assert.equal(doc.acceptSaved(submitted), true);
    assert.equal(doc.dirty, false);
  },
);
