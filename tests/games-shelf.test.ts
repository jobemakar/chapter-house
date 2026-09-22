import { test } from "node:test";
import assert from "node:assert/strict";
import { IntegratedGames } from "../src/core/integrated-games";

test("the WebGL-free games shelf can offer every integrated game", () => {
  assert.equal(IntegratedGames.entries.length, 10);
  for (const game of IntegratedGames.entries) {
    assert.ok(game.id);
    assert.ok(game.title);
    assert.ok(game.cardArtUrl);
  }
});
