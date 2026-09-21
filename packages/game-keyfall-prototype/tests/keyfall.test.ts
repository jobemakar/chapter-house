import assert from "node:assert/strict";
import test from "node:test";
import Matter from "matter-js";
import { distance } from "../src/geometry";
import { normalizeProgress, recordCompletion, SAVE_KEY } from "../src/progress";
import { segmentsIntersect, shouldGentleReset, swipeHitsCord } from "../src/geometry";
import { makeWorld, puff, removeCord } from "../src/physics";
import { ROOMS } from "../src/rooms";

test("swipe crossing a cord is detected, while a parallel swipe misses", () => {
  assert.equal(swipeHitsCord({ x: 0, y: 40 }, { x: 100, y: 40 }, { x: 50, y: 0 }, { x: 50, y: 80 }), true);
  assert.equal(swipeHitsCord({ x: 0, y: 10 }, { x: 35, y: 10 }, { x: 50, y: 0 }, { x: 50, y: 80 }), false);
  assert.equal(segmentsIntersect({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }, { x: 5, y: 0 }), true);
});
test("progress normalization clamps tickets and rejects malformed data", () => {
  const progress = normalizeProgress({ completed: ["velvet-descent", 4], bestTickets: { "velvet-descent": 8, bad: "x" }, muted: true });
  assert.deepEqual(progress.completed, ["velvet-descent"]); assert.equal(progress.bestTickets["velvet-descent"], 3); assert.equal(progress.muted, true); assert.equal(progress.version, 1);
});
test("completion is idempotent and preserves the best optional-ticket count", () => {
  const first = recordCompletion(normalizeProgress(null), "moonlit-swing", 2);
  const second = recordCompletion(first, "moonlit-swing", 1);
  const third = recordCompletion(second, "moonlit-swing", 3);
  assert.deepEqual(second.completed, ["moonlit-swing"]); assert.equal(second.bestTickets["moonlit-swing"], 2); assert.equal(third.bestTickets["moonlit-swing"], 3);
});
test("every authored room has exactly three optional tickets and matching cord constraints", () => {
  for (const room of ROOMS) {
    assert.equal(room.tickets.length, 3, room.id);
    const world = makeWorld(room);
    assert.equal(world.cords.size, room.cords.length, room.id);
    for (const cord of room.cords) {
      const constraint = world.cords.get(cord.id);
      assert.ok(constraint);
      assert.equal(constraint.length, Math.hypot(cord.anchor.x - room.keyStart.x, cord.anchor.y - room.keyStart.y));
    }
  }
});
test("prototype save is unique and misses trigger reset only outside the safe playfield", () => {
  assert.equal(SAVE_KEY, "chapter-house:keyfall-prototype:v1");
  assert.equal(shouldGentleReset({ x: 400, y: 500 }, { x: 400, y: 470 }), false);
  assert.equal(shouldGentleReset({ x: 400, y: 625 }, { x: 400, y: 470 }), true);
  assert.equal(shouldGentleReset({ x: 645, y: 470 }, { x: 645, y: 435 }), false);
});
test("room 3 authored bellows-and-bumper sequence reaches its goal", () => {
  const room = ROOMS[2];
  const world = makeWorld(room);
  assert.equal(removeCord(world, room.cords[0].id), true);
  puff(world);
  let reached = false;
  for (let frame = 0; frame < 180; frame += 1) {
    Matter.Engine.update(world.engine, 16);
    if (distance(world.key.position, room.goal) < 38) { reached = true; break; }
  }
  assert.equal(reached, true, `key ended at ${Math.round(world.key.position.x)},${Math.round(world.key.position.y)}`);
});
