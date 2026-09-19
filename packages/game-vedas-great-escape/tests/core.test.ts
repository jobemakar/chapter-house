import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, isOpen, parseLevel, solve, step } from "../src/core";

test("all five canonical escape puzzles have a solution", () => {
  assert.equal(LEVELS.length, 5);
  for (const level of LEVELS) {
    const path = solve(parseLevel(level));
    assert.ok(path?.length, level.title);
    let state = parseLevel(level);
    for (const direction of path) state = step(state, direction)!;
    assert.ok(isOpen(state));
    assert.equal(state.player, state.exit);
  }
});

test("Veda cannot pull crates or enter a closed exit", () => {
  const state = parseLevel(LEVELS[0]!);
  assert.equal(step(state, "left")?.boxes[0], state.boxes[0]);
  assert.equal(isOpen(state), false);
});
