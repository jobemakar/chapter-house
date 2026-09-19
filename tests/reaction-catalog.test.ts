import { test } from "node:test";
import assert from "node:assert/strict";
import { REACTION_CHOICES } from "../src/room/reaction-catalog";

test("the scalable reaction picker exposes fifty unique emoji choices", () => {
  assert.equal(REACTION_CHOICES.length, 50);
  assert.equal(new Set(REACTION_CHOICES.map((choice) => choice.value)).size, 50);
  for (const choice of REACTION_CHOICES) {
    assert.equal(choice.value, `emoji:${choice.emoji}`);
    assert.ok(choice.label.length > 0);
  }
});

