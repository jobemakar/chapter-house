import assert from "node:assert/strict";
import { describe, test } from "node:test";
import Matter from "matter-js";
import { distance, segmentIntersectionPoint, shouldGentleReset, swipePathCutPoint, swipePathCutPolyline } from "../src/geometry";
import { normalizeProgress, recordCompletion, SAVE_KEY } from "../src/progress";
import { segmentsIntersect, swipeHitsCord } from "../src/geometry";
import { applyOpeningImpulse, CORD_TUNING, makeWorld, PHYSICS_TUNING, puff, removeCord, updateCordFragments } from "../src/physics";
import { CordRemnants, SlashTrail } from "../src/interaction";
import { GAME_VIEWPORT, ROOMS } from "../src/rooms";

describe("Keyfall deterministic physics", { concurrency: false }, () => {
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
      assert.equal(constraint.points.length, Math.max(7, Math.round(constraint.length / PHYSICS_TUNING.cordPointSpacing)) + 1);
    }
  }
});
test("every room is authored inside the fixed portrait playfield", () => {
  assert.equal(GAME_VIEWPORT.width / GAME_VIEWPORT.height, 0.7);
  for (const room of ROOMS) {
    for (const point of [room.keyStart, room.goal, ...room.cords.map((cord) => cord.anchor), ...room.tickets.map((ticket) => ticket.position), ...room.props.map((prop) => prop.position)]) {
      assert.ok(point.x >= 40 && point.x <= 520, `${room.id} x=${point.x}`);
      assert.ok(point.y >= 40 && point.y <= 760, `${room.id} y=${point.y}`);
    }
  }
});
test("fixed portrait rooms retain deterministic release and bellows solutions", () => {
  const dropRoom = ROOMS[0], drop = makeWorld(dropRoom, GAME_VIEWPORT); applyOpeningImpulse(drop, false); removeCord(drop, "cord-a"); let dropReached = false;
  for (let frame = 0; frame < 240; frame += 1) { Matter.Engine.update(drop.engine, 16); if (distance(drop.key.position, dropRoom.goal) < 38) { dropReached = true; break; } }
  const swingRoom = ROOMS[1], swing = makeWorld(swingRoom, GAME_VIEWPORT); applyOpeningImpulse(swing, false); removeCord(swing, "cord-left"); for (let frame = 0; frame < 24; frame += 1) Matter.Engine.update(swing.engine, 16); removeCord(swing, "cord-right"); let swingReached = false;
  for (let frame = 0; frame < 300; frame += 1) { Matter.Engine.update(swing.engine, 16); if (distance(swing.key.position, swingRoom.goal) < 38) { swingReached = true; break; } }
  const bellowsRoom = ROOMS[2], bellows = makeWorld(bellowsRoom, GAME_VIEWPORT); applyOpeningImpulse(bellows, false); removeCord(bellows, "cord-stage"); for (let frame = 0; frame < 52; frame += 1) Matter.Engine.update(bellows.engine, 16); puff(bellows); let bellowsReached = false;
  for (let frame = 0; frame < 300; frame += 1) { Matter.Engine.update(bellows.engine, 16); if (distance(bellows.key.position, bellowsRoom.goal) < 38) { bellowsReached = true; break; } }
  assert.equal(dropReached, true); assert.equal(swingReached, true); assert.equal(bellowsReached, true);
});
test("prototype save is unique and misses trigger reset only outside the safe playfield", () => {
  assert.equal(SAVE_KEY, "chapter-house:keyfall-prototype:v1");
  assert.equal(shouldGentleReset({ x: 280, y: 700 }, { x: 280, y: 657 }), false);
  assert.equal(shouldGentleReset({ x: 280, y: 865 }, { x: 280, y: 657 }), true);
  assert.equal(shouldGentleReset({ x: 605, y: 603 }, { x: 570, y: 603 }), false);
});
test("room 3 authored bellows-and-bumper sequence reaches its goal", () => {
  const room = ROOMS[2];
  const world = makeWorld(room);
  applyOpeningImpulse(world, false);
  assert.equal(removeCord(world, room.cords[0].id), true);
  for (let frame = 0; frame < 52; frame += 1) Matter.Engine.update(world.engine, 16);
  puff(world);
  let reached = false;
  for (let frame = 0; frame < 180; frame += 1) {
    Matter.Engine.update(world.engine, 16);
    if (distance(world.key.position, room.goal) < 38) { reached = true; break; }
  }
  assert.equal(reached, true, `key ended at ${Math.round(world.key.position.x)},${Math.round(world.key.position.y)}`);
});
test("rooms 1 and 2 retain deterministic release solutions under extreme elasticity", () => {
  const dropRoom = ROOMS[0]; const drop = makeWorld(dropRoom); applyOpeningImpulse(drop, false); removeCord(drop, "cord-a"); let dropReached = false;
  for (let frame = 0; frame < 180; frame += 1) { Matter.Engine.update(drop.engine, 16); if (distance(drop.key.position, dropRoom.goal) < 38) { dropReached = true; break; } }
  const pendulumRoom = ROOMS[1]; const pendulum = makeWorld(pendulumRoom); applyOpeningImpulse(pendulum, false); removeCord(pendulum, "cord-left"); for (let frame = 0; frame < 24; frame += 1) Matter.Engine.update(pendulum.engine, 16); removeCord(pendulum, "cord-right"); let pendulumReached = false;
  for (let frame = 0; frame < 240; frame += 1) { Matter.Engine.update(pendulum.engine, 16); if (distance(pendulum.key.position, pendulumRoom.goal) < 38) { pendulumReached = true; break; } }
  assert.equal(dropReached, true); assert.equal(pendulumReached, true);
});
test("each room receives a deterministic opening sway, softened but retained for reduced motion", () => {
  const normal = makeWorld(ROOMS[0]); const reduced = makeWorld(ROOMS[0]);
  applyOpeningImpulse(normal, false); applyOpeningImpulse(reduced, true);
  assert.ok(Math.abs(normal.key.velocity.x - 0.75) < 0.00001); assert.ok(Math.abs(reduced.key.velocity.x - 0.25) < 0.00001); assert.notEqual(reduced.key.velocity.x, 0);
});
test("intact articulated cords retain selected elasticity and rebound", () => {
  const room = ROOMS[0]; const world = makeWorld(room); const cord = room.cords[0]; const rest = Math.hypot(cord.anchor.x - room.keyStart.x, cord.anchor.y - room.keyStart.y); applyOpeningImpulse(world, false);
  let maximum = rest; let rebound = false; let previousVelocity = world.key.velocity.x;
  for (let frame = 0; frame < 240; frame += 1) { Matter.Engine.update(world.engine, 16); const length = Math.hypot(world.key.position.x - cord.anchor.x, world.key.position.y - cord.anchor.y); maximum = Math.max(maximum, length); if (frame > 4 && previousVelocity * world.key.velocity.x < 0) rebound = true; previousVelocity = world.key.velocity.x; }
  assert.equal(world.cords.get(cord.id)?.stiffness, CORD_TUNING.stiffness); assert.equal(world.cords.get(cord.id)?.damping, CORD_TUNING.damping); assert.ok(maximum > rest * 1.08, `extension ${(maximum / rest - 1) * 100}%`); assert.ok(maximum < rest * 1.25, `extension ${(maximum / rest - 1) * 100}%`); assert.equal(rebound, true);
});
test("point density is length-based and gravity produces emergent sag", () => {
  const world = makeWorld(ROOMS[1]); applyOpeningImpulse(world, false); for (let frame = 0; frame < 120; frame += 1) Matter.Engine.update(world.engine, 16);
  const cord = world.cords.get("cord-right"); assert.ok(cord); const points = cord.points, start = points[0], end = points[points.length - 1]; const dx = end.x - start.x, dy = end.y - start.y, chord = Math.hypot(dx, dy); const sag = Math.max(...points.slice(1, -1).map((point) => Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / chord));
  assert.equal(points.length, Math.max(7, Math.round(cord.length / PHYSICS_TUNING.cordPointSpacing)) + 1); assert.ok(sag > 20, `sag ${sag}`);
});
test("a curved-rope swipe severs a physical link and both pieces fade", () => {
  const world = makeWorld(ROOMS[1]); const cord = world.cords.get("cord-right"); assert.ok(cord); for (let frame = 0; frame < 120; frame += 1) Matter.Engine.update(world.engine, 16); const middle = cord.points[Math.floor(cord.points.length / 2)]; const cut = swipePathCutPolyline([{ x: middle.x - 30, y: middle.y }, { x: middle.x + 30, y: middle.y }], cord.points); assert.ok(cut); assert.equal(removeCord(world, cord.id, cut.segmentIndex), true); assert.equal(cord.intact, false); assert.equal(cord.paths.length, 2); updateCordFragments(world, PHYSICS_TUNING.cordFragmentLifetimeMs + 1); assert.equal(cord.expired, true);
});
test("slash trails distinguish taps, follow drag points, and fade after release", () => {
  const tap = new SlashTrail(); tap.begin({ x: 20, y: 20 }); tap.release(); assert.equal(tap.isSlash, false); tap.update(120); assert.equal(tap.points.length, 1);
  const slash = new SlashTrail(); slash.begin({ x: 0, y: 40 }); slash.append({ x: 50, y: 40 }); slash.append({ x: 100, y: 50 }); slash.release(); assert.equal(slash.isSlash, true); slash.update(100); assert.ok(slash.opacity > 0); slash.update(300); assert.equal(slash.points.length, 0);
});
test("cut geometry returns the actual cord intersection and remnants react then expire", () => {
  const point = segmentIntersectionPoint({ x: 0, y: 50 }, { x: 100, y: 50 }, { x: 50, y: 0 }, { x: 50, y: 100 });
  assert.deepEqual(point, { x: 50, y: 50 }); assert.deepEqual(swipePathCutPoint([{ x: 0, y: 50 }, { x: 100, y: 50 }], { x: 50, y: 0 }, { x: 50, y: 100 }), { x: 50, y: 50 });
  const remnants = new CordRemnants(); remnants.spawn({ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 60, y: 60 }, { x: 4, y: 0 }); remnants.update(100, { x: 80, y: 80 }, { x: 4, y: 0 }); assert.equal(remnants.segments.length, 2); assert.deepEqual(remnants.segments[1].from, { x: 80, y: 80 }); assert.notDeepEqual(remnants.segments[0].to, remnants.segments[1].to); remnants.update(900, { x: 80, y: 80 }, { x: 4, y: 0 }); assert.equal(remnants.segments.length, 0);
});
});
