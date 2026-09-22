import assert from "node:assert/strict";
import { describe, test } from "node:test";
import Matter from "matter-js";
import { distance, segmentIntersectionPoint, shouldGentleReset, swipePathCutPoint, swipePathCutPolyline } from "../src/geometry";
import { normalizeProgress, recordCompletion, SAVE_KEY } from "../src/progress";
import { segmentsIntersect, swipeHitsCord } from "../src/geometry";
import { applyOpeningImpulse, CORD_TUNING, makeWorld, PHYSICS_TUNING, puff, removeCord, updateCordFragments } from "../src/physics";
import { CordRemnants, InteractionController, SlashTrail } from "../src/interaction";
import { GAME_VIEWPORT, ROOMS } from "../src/rooms";
import { CAMPAIGN_ROOMS, KEYFALL_CATALOG, PROTOTYPE_ROOMS } from "../src/rooms";
import { CAMPAIGN_ROOM_TARGET, CampaignCatalog, RoomValidator } from "../src/catalog";
import type { RoomDefinition, WorldElementDefinition } from "../src/types";
import { collisionId, PhysicsRoom } from "../src/physics";
import { AIR_JET_TAP_FEEDBACK_TICKS, CounterweightElement } from "../src/elements";
import { CAMPAIGN_COMPLETION_TRACES, CAMPAIGN_THREE_TICKET_TRACES, COMPLETION_TRACE_STEP_MS, COMPLETION_TRACE_TUNING_VERSION, type CompletionTrace } from "../src/completion-traces";
import { replayCompletionTrace } from "../src/trace-replay";
import { ORIGINAL_ROOM_BRIEFS, ORIGINAL_ROOM_REQUIRED_MECHANICS, type RoomSystem } from "../src/original-room-briefs";

function elementFixture(elements: WorldElementDefinition[], keyStart = { x: 280, y: 400 }): RoomDefinition {
  return {
    id: "isolated-element-fixture", title: "Fixture", subtitle: "Fixture", wing: "campaign", source: { kind: "original" }, kind: "drop",
    keyStart, cords: [], tickets: [{ id: "a", position: { x: 80, y: 80 } }, { id: "b", position: { x: 120, y: 80 } }, { id: "c", position: { x: 160, y: 80 } }],
    goal: { x: 500, y: 740 }, props: [], elements,
  };
}

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
  const dropRoom = PROTOTYPE_ROOMS[0], drop = makeWorld(dropRoom, GAME_VIEWPORT); applyOpeningImpulse(drop, false); removeCord(drop, "cord-a"); let dropReached = false;
  for (let frame = 0; frame < 240; frame += 1) { Matter.Engine.update(drop.engine, 16); if (distance(drop.key.position, dropRoom.goal) < 38) { dropReached = true; break; } }
  const swingRoom = PROTOTYPE_ROOMS[1], swing = makeWorld(swingRoom, GAME_VIEWPORT); applyOpeningImpulse(swing, false); removeCord(swing, "cord-left"); for (let frame = 0; frame < 24; frame += 1) Matter.Engine.update(swing.engine, 16); removeCord(swing, "cord-right"); let swingReached = false;
  for (let frame = 0; frame < 300; frame += 1) { Matter.Engine.update(swing.engine, 16); if (distance(swing.key.position, swingRoom.goal) < 38) { swingReached = true; break; } }
  const bellowsRoom = PROTOTYPE_ROOMS[2], bellows = makeWorld(bellowsRoom, GAME_VIEWPORT); applyOpeningImpulse(bellows, false); removeCord(bellows, "cord-stage"); for (let frame = 0; frame < 52; frame += 1) Matter.Engine.update(bellows.engine, 16); puff(bellows); let bellowsReached = false;
  for (let frame = 0; frame < 300; frame += 1) { Matter.Engine.update(bellows.engine, 16); if (distance(bellows.key.position, bellowsRoom.goal) < 38) { bellowsReached = true; break; } }
  assert.equal(dropReached, true); assert.equal(swingReached, true); assert.equal(bellowsReached, true);
});
test("prototype save is unique and misses trigger reset only outside the safe playfield", () => {
  assert.equal(SAVE_KEY, "chapter-house:keyfall-prototype:v1");
  assert.equal(shouldGentleReset({ x: 280, y: 700 }, { x: 280, y: 657 }), false);
  assert.equal(shouldGentleReset({ x: 280, y: 865 }, { x: 280, y: 657 }), true);
  assert.equal(shouldGentleReset({ x: 605, y: 603 }, { x: 570, y: 603 }), false);
});
test("catalog preserves prototypes and exposes the complete source-classified campaign", () => {
  assert.deepEqual(PROTOTYPE_ROOMS.map((room) => room.id), ["velvet-descent", "moonlit-swing", "bellows-backstage"]);
  assert.equal(CAMPAIGN_ROOMS.length, 20);
  assert.equal(CAMPAIGN_ROOM_TARGET, 20);
  assert.equal(KEYFALL_CATALOG.validation.prototypeCount, 3);
  assert.equal(KEYFALL_CATALOG.validation.campaignCount, 20);
  assert.equal(KEYFALL_CATALOG.validation.campaignComplete, true);
  assert.deepEqual(KEYFALL_CATALOG.validation.errors, []);
  assert.equal(KEYFALL_CATALOG.roomsForWing("prototype")[0], PROTOTYPE_ROOMS[0]);
  const adaptations = CAMPAIGN_ROOMS.filter((room) => room.source.kind === "mlgrope-mit-adaptation");
  const originals = CAMPAIGN_ROOMS.filter((room) => room.source.kind === "original");
  assert.deepEqual(adaptations.map((room) => room.source.kind === "mlgrope-mit-adaptation" ? room.source.path : "wrong"), ["levels/0.csv", "levels/1.csv"]);
  assert.equal(originals.length, 18);
  assert.deepEqual(originals.map((room) => room.id), ORIGINAL_ROOM_BRIEFS.map((brief) => brief.id));
  for (const room of adaptations) {
    if (room.source.kind !== "mlgrope-mit-adaptation") assert.fail("expected mlgrope source metadata");
    assert.equal(room.source.commit, "1c398f18dfb5977fb1f7fcb8a671584a102f406a");
    assert.equal(room.source.license, "MIT");
    assert.equal(room.source.repository, "https://github.com/emersion/mlgrope");
  }
});
test("prototype rooms carry typed wing and source metadata without changing geometry", () => {
  for (const room of PROTOTYPE_ROOMS) {
    assert.equal(room.wing, "prototype");
    assert.deepEqual(room.source, { kind: "keyfall-prototype" });
  }
  assert.deepEqual(PROTOTYPE_ROOMS[0].keyStart, { x: 280, y: 259 });
  assert.deepEqual(PROTOTYPE_ROOMS[1].cords.map((cord) => cord.id), ["cord-left", "cord-right"]);
  assert.deepEqual(PROTOTYPE_ROOMS[2].props.map((prop) => prop.kind), ["bumper", "bellows"]);
});
test("room validation rejects duplicate ids, out-of-bounds data, and invalid source wings", () => {
  const validator = new RoomValidator(GAME_VIEWPORT);
  const invalid: RoomDefinition = { ...PROTOTYPE_ROOMS[0], id: "invalid", wing: "campaign", source: { kind: "keyfall-prototype" }, goal: { x: 900, y: 657 }, tickets: [] };
  assert.deepEqual(validator.validate(invalid), ["invalid: campaign rooms require exactly three tickets", "invalid: campaign rooms require original or mlgrope source metadata", "invalid: goal is outside the 560x800 playfield"]);
  assert.throws(() => new CampaignCatalog([PROTOTYPE_ROOMS[0], PROTOTYPE_ROOMS[0], PROTOTYPE_ROOMS[1]], validator), /Duplicate room id: velvet-descent/);
});
test("a complete campaign requires 18 originals and one adaptation from each pinned mlgrope level", () => {
  const validator = new RoomValidator(GAME_VIEWPORT);
  const original = (index: number): RoomDefinition => ({ ...PROTOTYPE_ROOMS[0], id: `campaign-${index}`, wing: "campaign", source: { kind: "original" } });
  const adaptation = (index: number, path: "levels/0.csv" | "levels/1.csv"): RoomDefinition => ({
    ...PROTOTYPE_ROOMS[0], id: `adaptation-${index}`, wing: "campaign",
    source: { kind: "mlgrope-mit-adaptation", repository: "https://github.com/emersion/mlgrope", commit: "1c398f18dfb5977fb1f7fcb8a671584a102f406a", path, license: "MIT" }
  });
  const validCampaign = [...Array.from({ length: 18 }, (_, index) => original(index)), adaptation(0, "levels/0.csv"), adaptation(1, "levels/1.csv")];
  assert.deepEqual(validator.validateCatalog([...validCampaign, ...PROTOTYPE_ROOMS]).errors, []);
  const duplicateLevel = [...Array.from({ length: 18 }, (_, index) => original(index)), adaptation(0, "levels/0.csv"), adaptation(1, "levels/0.csv")];
  const errors = validator.validateCatalog([...duplicateLevel, ...PROTOTYPE_ROOMS]).errors;
  assert.ok(errors.includes("Complete campaign requires exactly one adaptation of levels/0.csv; found 2"));
  assert.ok(errors.includes("Complete campaign requires exactly one adaptation of levels/1.csv; found 0"));
  const wrongMix = [...Array.from({ length: 19 }, (_, index) => original(index)), adaptation(0, "levels/0.csv")];
  const mixErrors = validator.validateCatalog([...wrongMix, ...PROTOTYPE_ROOMS]).errors;
  assert.ok(mixErrors.includes("Complete campaign requires exactly 18 original rooms; found 19"));
  assert.ok(mixErrors.includes("Complete campaign requires exactly 2 mlgrope adaptations; found 1"));
});
test("v1 progress remains schema-compatible and preserves prior prototype records", () => {
  const oldSave = { version: 1, completed: ["velvet-descent"], bestTickets: { "velvet-descent": 2 }, muted: false, reducedMotion: true };
  const loaded = normalizeProgress(JSON.parse(JSON.stringify(oldSave)));
  assert.deepEqual(loaded, oldSave);
  assert.deepEqual(Object.keys(loaded).sort(), ["bestTickets", "completed", "muted", "reducedMotion", "version"]);
  assert.equal("unlocks" in loaded, false);
  assert.equal(KEYFALL_CATALOG.roomById(loaded.completed[0])?.id, "velvet-descent");
});
test("room 3 authored bellows-and-bumper sequence reaches its goal", () => {
  const room = PROTOTYPE_ROOMS[2];
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
  const dropRoom = PROTOTYPE_ROOMS[0]; const drop = makeWorld(dropRoom); applyOpeningImpulse(drop, false); removeCord(drop, "cord-a"); let dropReached = false;
  for (let frame = 0; frame < 180; frame += 1) { Matter.Engine.update(drop.engine, 16); if (distance(drop.key.position, dropRoom.goal) < 38) { dropReached = true; break; } }
  const pendulumRoom = PROTOTYPE_ROOMS[1]; const pendulum = makeWorld(pendulumRoom); applyOpeningImpulse(pendulum, false); removeCord(pendulum, "cord-left"); for (let frame = 0; frame < 24; frame += 1) Matter.Engine.update(pendulum.engine, 16); removeCord(pendulum, "cord-right"); let pendulumReached = false;
  for (let frame = 0; frame < 240; frame += 1) { Matter.Engine.update(pendulum.engine, 16); if (distance(pendulum.key.position, pendulumRoom.goal) < 38) { pendulumReached = true; break; } }
  assert.equal(dropReached, true); assert.equal(pendulumReached, true);
});
test("each room receives a deterministic opening sway, softened but retained for reduced motion", () => {
  const normal = makeWorld(PROTOTYPE_ROOMS[0]); const reduced = makeWorld(PROTOTYPE_ROOMS[0]);
  applyOpeningImpulse(normal, false); applyOpeningImpulse(reduced, true);
  assert.ok(Math.abs(normal.key.velocity.x - 0.75) < 0.00001); assert.ok(Math.abs(reduced.key.velocity.x - 0.25) < 0.00001); assert.notEqual(reduced.key.velocity.x, 0);
});
test("intact articulated cords retain selected elasticity and rebound", () => {
  const room = PROTOTYPE_ROOMS[0]; const world = makeWorld(room); const cord = room.cords[0]; const rest = Math.hypot(cord.anchor.x - room.keyStart.x, cord.anchor.y - room.keyStart.y); applyOpeningImpulse(world, false);
  let maximum = rest; let rebound = false; let previousVelocity = world.key.velocity.x;
  for (let frame = 0; frame < 240; frame += 1) { Matter.Engine.update(world.engine, 16); const length = Math.hypot(world.key.position.x - cord.anchor.x, world.key.position.y - cord.anchor.y); maximum = Math.max(maximum, length); if (frame > 4 && previousVelocity * world.key.velocity.x < 0) rebound = true; previousVelocity = world.key.velocity.x; }
  assert.equal(world.cords.get(cord.id)?.stiffness, CORD_TUNING.stiffness); assert.equal(world.cords.get(cord.id)?.damping, CORD_TUNING.damping); assert.ok(maximum > rest * 1.08, `extension ${(maximum / rest - 1) * 100}%`); assert.ok(maximum < rest * 1.25, `extension ${(maximum / rest - 1) * 100}%`); assert.equal(rebound, true);
});
test("point density is length-based and gravity produces emergent sag", () => {
  const world = makeWorld(PROTOTYPE_ROOMS[1]); applyOpeningImpulse(world, false); for (let frame = 0; frame < 120; frame += 1) Matter.Engine.update(world.engine, 16);
  const cord = world.cords.get("cord-right"); assert.ok(cord); const points = cord.points, start = points[0], end = points[points.length - 1]; const dx = end.x - start.x, dy = end.y - start.y, chord = Math.hypot(dx, dy); const sag = Math.max(...points.slice(1, -1).map((point) => Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / chord));
  assert.equal(points.length, Math.max(7, Math.round(cord.length / PHYSICS_TUNING.cordPointSpacing)) + 1); assert.ok(sag > 20, `sag ${sag}`);
});
test("a curved-rope swipe severs a physical link and both pieces fade", () => {
  const world = makeWorld(PROTOTYPE_ROOMS[1]); const cord = world.cords.get("cord-right"); assert.ok(cord); for (let frame = 0; frame < 120; frame += 1) Matter.Engine.update(world.engine, 16); const middle = cord.points[Math.floor(cord.points.length / 2)]; const cut = swipePathCutPolyline([{ x: middle.x - 30, y: middle.y }, { x: middle.x + 30, y: middle.y }], cord.points); assert.ok(cut); assert.equal(removeCord(world, cord.id, cut.segmentIndex), true); assert.equal(cord.intact, false); assert.equal(cord.paths.length, 2); updateCordFragments(world, PHYSICS_TUNING.cordFragmentLifetimeMs + 1); assert.equal(cord.expired, true);
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
test("bubble capture floats upward, pops once, restores gravity, and disposes cleanly", () => {
  const room = new PhysicsRoom(elementFixture([{ id: "bubble", kind: "bubble", position: { x: 280, y: 400 }, captureRadius: 34, buoyancy: 0.003, popRadius: 52 }]));
  const startY = room.key.position.y;
  for (let tick = 0; tick < 24; tick += 1) room.fixedUpdate(16);
  const snapshot = room.elementSnapshots()[0];
  assert.equal(snapshot.kind, "bubble"); assert.equal(snapshot.captured, true); assert.ok(room.key.position.y < startY, `key y=${room.key.position.y}`);
  const popPoint = { ...room.key.position };
  assert.equal(room.handleTap(popPoint), true); assert.equal(room.handleTap(popPoint), false);
  const upwardVelocity = room.key.velocity.y;
  for (let tick = 0; tick < 80; tick += 1) room.fixedUpdate(16);
  assert.ok(room.key.velocity.y > upwardVelocity, `gravity did not return: ${room.key.velocity.y} <= ${upwardVelocity}`);
  room.dispose();
  assert.equal(Matter.Composite.allBodies(room.engine.world).length, 0);
  const fresh = new PhysicsRoom(elementFixture([{ id: "bubble", kind: "bubble", position: { x: 280, y: 400 }, captureRadius: 34, buoyancy: 0.003, popRadius: 52 }]));
  assert.deepEqual(fresh.elementSnapshots()[0], { kind: "bubble", id: "bubble", position: { x: 280, y: 400 }, radius: 34, captured: false, popped: false });
  fresh.dispose();
});
test("air jets apply their normalized direction only in the declared continuous or tap mode", () => {
  const continuous = new PhysicsRoom(elementFixture([{ id: "draft", kind: "air-jet", position: { x: 220, y: 400 }, zone: { x: 240, y: 350, width: 100, height: 100 }, direction: { x: 4, y: 0 }, strength: 0.004, mode: "continuous", tapRadius: 42 }]));
  continuous.fixedUpdate(16);
  assert.ok(continuous.key.velocity.x > 0); assert.equal(continuous.elementSnapshots()[0].kind, "air-jet"); continuous.dispose();
  const tapped = new PhysicsRoom(elementFixture([{ id: "bellows", kind: "air-jet", position: { x: 220, y: 400 }, zone: { x: 240, y: 350, width: 100, height: 100 }, direction: { x: -3, y: 0 }, strength: 0.004, mode: "tap", tapRadius: 42 }]));
  tapped.fixedUpdate(16); assert.equal(tapped.key.velocity.x, 0);
  assert.equal(tapped.handleTap({ x: 220, y: 400 }), true); const activeTap = tapped.elementSnapshots()[0]; assert.equal(activeTap.kind, "air-jet"); if (activeTap.kind !== "air-jet") assert.fail("expected air jet"); assert.equal(activeTap.active, true);
  tapped.fixedUpdate(16); const oneShotVelocity = tapped.key.velocity.x; assert.ok(oneShotVelocity < 0);
  tapped.fixedUpdate(16); assert.ok(Math.abs(tapped.key.velocity.x) < Math.abs(oneShotVelocity), "tap mode must not reapply force during visual feedback");
  for (let tick = 2; tick < AIR_JET_TAP_FEEDBACK_TICKS - 1; tick += 1) tapped.fixedUpdate(16);
  const lingeringTap = tapped.elementSnapshots()[0]; assert.equal(lingeringTap.kind, "air-jet"); if (lingeringTap.kind !== "air-jet") assert.fail("expected air jet"); assert.equal(lingeringTap.active, true);
  tapped.fixedUpdate(16); const inactiveTap = tapped.elementSnapshots()[0]; assert.equal(inactiveTap.kind, "air-jet"); if (inactiveTap.kind !== "air-jet") assert.fail("expected air jet"); assert.equal(inactiveTap.active, false);
  assert.equal(tapped.handleTap({ x: 500, y: 100 }), false); tapped.dispose();
  const outside = new PhysicsRoom(elementFixture([{ id: "off-zone-bellows", kind: "air-jet", position: { x: 220, y: 400 }, zone: { x: 240, y: 350, width: 100, height: 100 }, direction: { x: -3, y: 0 }, strength: 0.004, mode: "tap", tapRadius: 42 }], { x: 400, y: 400 }));
  assert.equal(outside.handleTap({ x: 220, y: 400 }), true);
  const outsideActive = outside.elementSnapshots()[0]; assert.equal(outsideActive.kind, "air-jet"); if (outsideActive.kind !== "air-jet") assert.fail("expected air jet"); assert.equal(outsideActive.active, true);
  outside.fixedUpdate(16); assert.equal(outside.key.velocity.x, 0, "handled tap outside the force zone must not push the key"); outside.dispose();
});
test("element snapshots and every nested vector or bounds record resist runtime mutation", () => {
  const room = new PhysicsRoom(elementFixture([
    { id: "bubble", kind: "bubble", position: { x: 100, y: 180 }, captureRadius: 30, buoyancy: 0.003, popRadius: 45 },
    { id: "draft", kind: "air-jet", position: { x: 150, y: 300 }, zone: { x: 170, y: 270, width: 80, height: 70 }, direction: { x: 1, y: -1 }, strength: 0.003, mode: "continuous", tapRadius: 40 },
    { id: "weight", kind: "counterweight", position: { x: 390, y: 300 }, radius: 22, mass: 1, restitution: 0.5 },
    { id: "trap", kind: "reset-hazard", bounds: { x: 420, y: 600, width: 70, height: 45 }, reason: "fixture" },
  ]));
  const snapshots = room.elementSnapshots();
  assert.equal(Object.isFrozen(snapshots), true);
  const nested: object[] = [];
  for (const snapshot of snapshots) {
    assert.equal(Object.isFrozen(snapshot), true);
    if (snapshot.kind === "bubble" || snapshot.kind === "counterweight") nested.push(snapshot.position);
    if (snapshot.kind === "air-jet") nested.push(snapshot.position, snapshot.zone, snapshot.direction);
    if (snapshot.kind === "reset-hazard") nested.push(snapshot.bounds);
  }
  for (const value of nested) {
    assert.equal(Object.isFrozen(value), true);
    const key = Object.keys(value)[0];
    assert.throws(() => { (value as Record<string, number>)[key] = 999; }, TypeError);
  }
  assert.throws(() => { (snapshots as unknown as WorldElementDefinition[]).push({ id: "x", kind: "bubble", position: { x: 0, y: 0 }, captureRadius: 1, buoyancy: 1, popRadius: 1 }); }, TypeError);
  room.dispose();
});
test("a movable counterweight receives momentum from the key with stable collision ids", () => {
  const room = new PhysicsRoom(elementFixture([{ id: "weight", kind: "counterweight", position: { x: 330, y: 400 }, radius: 24, mass: 1.2, restitution: 0.72 }], { x: 270, y: 400 }));
  room.engine.gravity.y = 0;
  Matter.Body.setVelocity(room.key, { x: 8, y: 0 });
  for (let tick = 0; tick < 30; tick += 1) room.fixedUpdate(16);
  const element = room.elements[0]; assert.ok(element instanceof CounterweightElement); const weight = element.runtimeBody; assert.ok(weight);
  assert.ok(weight.velocity.x > 0.1, `counterweight velocity=${weight.velocity.x}`);
  assert.equal(collisionId(room.key), "key"); assert.equal(collisionId(weight), "counterweight");
  room.dispose();
});
test("a reset hazard queues exactly one gentle-reset transition per attempt", () => {
  const room = new PhysicsRoom(elementFixture([{ id: "trap", kind: "reset-hazard", bounds: { x: 250, y: 370, width: 60, height: 60 }, reason: "broken stage" }]));
  for (let tick = 0; tick < 8; tick += 1) room.fixedUpdate(16);
  assert.equal(room.consumeHazardReset(), "broken stage"); assert.equal(room.consumeHazardReset(), undefined);
  for (let tick = 0; tick < 8; tick += 1) room.fixedUpdate(16);
  assert.equal(room.consumeHazardReset(), undefined); room.dispose();
});
test("gesture arbitration makes taps and slashes mutually exclusive", () => {
  const controller = new InteractionController(16);
  controller.begin({ x: 50, y: 50 }); controller.move({ x: 54, y: 52 });
  assert.deepEqual(controller.release({ x: 56, y: 52 }), { kind: "tap", point: { x: 56, y: 52 } });
  controller.begin({ x: 0, y: 40 }); controller.move({ x: 50, y: 40 });
  const slash = controller.release({ x: 100, y: 40 }); assert.equal(slash.kind, "slash");
  controller.begin({ x: 220, y: 400 });
  const deviceTap = controller.release({ x: 224, y: 401 }); assert.equal(deviceTap.kind, "tap"); assert.equal("path" in deviceTap, false);
});
test("a tappable device on a live cord activates without severing the cord", () => {
  const fixture: RoomDefinition = {
    ...elementFixture([{ id: "over-cord-bellows", kind: "air-jet", position: { x: 280, y: 300 }, zone: { x: 250, y: 250, width: 120, height: 120 }, direction: { x: 1, y: 0 }, strength: 0.004, mode: "tap", tapRadius: 44 }]),
    cords: [{ id: "live-cord", anchor: { x: 280, y: 180 }, length: 220, angle: 0 }],
  };
  const room = new PhysicsRoom(fixture);
  const controller = new InteractionController(16);
  controller.begin({ x: 280, y: 300 });
  const gesture = controller.release({ x: 283, y: 302 });
  let deviceActivated = false;
  if (gesture.kind === "slash") {
    const cord = room.cords.get("live-cord"); assert.ok(cord);
    const cut = swipePathCutPolyline(gesture.path, cord.points);
    if (cut) removeCord(room, "live-cord", cut.segmentIndex);
  } else if (gesture.kind === "tap") deviceActivated = room.handleTap(gesture.point);
  assert.equal(deviceActivated, true);
  assert.equal(room.cords.get("live-cord")?.intact, true);
  const snapshot = room.elementSnapshots()[0]; assert.equal(snapshot.kind, "air-jet"); assert.equal(snapshot.active, true);
  room.dispose();
});
test("all checked-in campaign traces replay to zero-ticket completion under production tuning in three batches", () => {
  assert.equal(COMPLETION_TRACE_STEP_MS, 16);
  assert.equal(COMPLETION_TRACE_TUNING_VERSION, "keyfall-production-2026-09-21");
  assert.equal(CAMPAIGN_COMPLETION_TRACES.length, 20);
  for (const [batchIndex, batch] of [CAMPAIGN_COMPLETION_TRACES.slice(2, 8), CAMPAIGN_COMPLETION_TRACES.slice(8, 14), CAMPAIGN_COMPLETION_TRACES.slice(14, 20)].entries()) {
    assert.equal(batch.length, 6, `batch ${batchIndex + 1}`);
    for (const trace of batch) {
      const room = CAMPAIGN_ROOMS.find((candidate) => candidate.id === trace.roomId);
      assert.ok(room, trace.roomId);
      const result = replayCompletionTrace(room, trace);
      assert.equal(result.completed, true, `${trace.roomId} did not complete`);
      assert.deepEqual(result.collectedTicketIds, [], `${trace.roomId} collected optional tickets`);
      assert.equal(result.handledActions, trace.actions.length);
      assert.ok(result.completionTick !== undefined && result.completionTick <= trace.maximumTicks);
    }
  }
  for (const trace of CAMPAIGN_COMPLETION_TRACES.slice(0, 2)) assert.equal(replayCompletionTrace(CAMPAIGN_ROOMS.find((room) => room.id === trace.roomId)!, trace).completed, true);
});
test("checked-in mastery traces collect every reachable campaign ticket and still complete", () => {
  assert.equal(CAMPAIGN_THREE_TICKET_TRACES.length, 20);
  const collectedAcrossCampaign = new Set<string>();
  for (const trace of CAMPAIGN_THREE_TICKET_TRACES) {
    const room = CAMPAIGN_ROOMS.find((candidate) => candidate.id === trace.roomId);
    assert.ok(room, trace.roomId);
    const result = replayCompletionTrace(room, trace);
    assert.equal(result.completed, true, `${trace.roomId} did not complete`);
    assert.equal(result.collectedTicketIds.length, 3, `${trace.roomId} did not collect every ticket`);
    for (const id of result.collectedTicketIds) collectedAcrossCampaign.add(`${room.id}:${id}`);
  }
  assert.equal(collectedAcrossCampaign.size, 60);
});
test("each original room has a truthful coordinate-free design contract", () => {
  assert.equal(ORIGINAL_ROOM_BRIEFS.length, 18);
  assert.deepEqual(ORIGINAL_ROOM_BRIEFS.slice(0, 6).map((brief) => brief.difficulty), Array(6).fill("introductory"));
  assert.deepEqual(ORIGINAL_ROOM_BRIEFS.slice(6, 12).map((brief) => brief.difficulty), Array(6).fill("paired"));
  assert.deepEqual(ORIGINAL_ROOM_BRIEFS.slice(12).map((brief) => brief.difficulty), Array(6).fill("multi-step"));
  for (const brief of ORIGINAL_ROOM_BRIEFS) {
    const room = CAMPAIGN_ROOMS.find((candidate) => candidate.id === brief.id);
    const trace = CAMPAIGN_COMPLETION_TRACES.find((candidate) => candidate.roomId === brief.id);
    assert.ok(room, brief.id); assert.ok(trace, brief.id);
    assert.ok(brief.learningObjective.length > 20, brief.id);
    assert.ok(brief.recovery.length > 20, brief.id);
    assert.equal(brief.intendedPointerActions, trace.actions.length, `${brief.id} pointer-action contract drifted`);

    const actualSystems: RoomSystem[] = [room.cords.length === 1 ? "single-cord" : "two-cord"];
    if (room.elements?.some((element) => element.kind === "bubble")) actualSystems.push("bubble");
    if (room.elements?.some((element) => element.kind === "air-jet" && element.mode === "continuous")) actualSystems.push("continuous-air");
    if (room.elements?.some((element) => element.kind === "air-jet" && element.mode === "tap")) actualSystems.push("tap-air");
    if (room.props.some((prop) => prop.kind === "bumper")) actualSystems.push("bumper");
    if (room.elements?.some((element) => element.kind === "reset-hazard")) actualSystems.push("hazard");
    assert.deepEqual(brief.allowedSystems, actualSystems, `${brief.id} allowed systems drifted`);
    for (const system of brief.requiredSystems) assert.ok(brief.allowedSystems.includes(system), `${brief.id} requires absent ${system}`);

    const slashCount = trace.actions.filter((action) => action.kind === "slash").length;
    const tapCount = trace.actions.filter((action) => action.kind === "tap").length;
    assert.equal(slashCount, room.cords.length, `${brief.id} trace does not release its declared cord topology`);
    assert.ok(tapCount >= 1, `${brief.id} trace does not make its declared bubble decision`);
    if (brief.requiredSystems.includes("tap-air")) assert.ok(tapCount >= 2, `${brief.id} does not tap its required air system`);
    if (brief.difficulty === "multi-step") {
      assert.ok(brief.requiredSystems.includes("two-cord"), `${brief.id} is not a two-release multi-step room`);
      assert.ok(brief.requiredSystems.includes("bubble"), `${brief.id} omits its bubble step`);
      assert.ok(brief.requiredSystems.some((system) => system === "continuous-air" || system === "tap-air" || system === "bumper"), `${brief.id} lacks a causal routing system`);
      assert.ok(brief.intendedPointerActions >= 3, `${brief.id} lacks a multi-step pointer sequence`);
    }

    assert.deepEqual(ORIGINAL_ROOM_REQUIRED_MECHANICS[brief.id], brief.requiredMechanics, `${brief.id} dependency metadata drifted`);
    for (const mechanic of brief.requiredMechanics) {
      if (mechanic.kind === "prop") {
        assert.equal(room.props[mechanic.index]?.kind, "bumper", `${brief.id} required bumper is absent`);
        assert.ok(brief.requiredSystems.includes("bumper"), `${brief.id} required bumper system is undeclared`);
      } else {
        const requiredElement: WorldElementDefinition | undefined = room.elements?.find((candidate: WorldElementDefinition) => candidate.id === mechanic.id);
        assert.equal(requiredElement?.kind, "air-jet", `${brief.id} required air element is absent`);
        if (requiredElement?.kind === "air-jet") assert.ok(brief.requiredSystems.includes(requiredElement.mode === "tap" ? "tap-air" : "continuous-air"), `${brief.id} required air mode is undeclared`);
      }
    }
  }
});
test("every original canonical route fails when each declared required mechanic is neutralized", () => {
  const originals = CAMPAIGN_ROOMS.slice(2);
  let dependencyChecks = 0;
  for (const room of originals) {
    const trace = CAMPAIGN_COMPLETION_TRACES.find((candidate) => candidate.roomId === room.id);
    assert.ok(trace, room.id);
    const requirements = ORIGINAL_ROOM_REQUIRED_MECHANICS[room.id];
    assert.ok(requirements?.length, `${room.id} has no declared runtime dependency`);
    for (const required of requirements) {
      dependencyChecks += 1;
      const neutralized: RoomDefinition = required.kind === "prop"
        ? { ...room, props: room.props.filter((_prop, index) => index !== required.index) }
        : {
          ...room,
          elements: (room.elements ?? []).flatMap((element) => {
            if (element.id !== required.id) return [element];
            if (element.kind === "air-jet") return [{ ...element, strength: 1e-9 }];
            return [];
          }),
        };
      const result = replayCompletionTrace(neutralized, trace);
      assert.equal(result.completed, false, `${room.id} still completed without ${required.kind === "prop" ? `prop ${required.index}` : required.id}`);
    }
  }
  assert.equal(dependencyChecks, 20);
});
test("original rooms have distinct normalized geometry and varied canonical action signatures", () => {
  const originals = CAMPAIGN_ROOMS.slice(2);
  const geometrySignatures = originals.map((room) => JSON.stringify({
    goal: [room.goal.x - room.keyStart.x, room.goal.y - room.keyStart.y],
    cords: room.cords.map((cord) => [cord.anchor.x - room.keyStart.x, cord.anchor.y - room.keyStart.y]),
    tickets: room.tickets.map((ticket) => [ticket.position.x - room.keyStart.x, ticket.position.y - room.keyStart.y]),
    props: room.props.map((prop) => [prop.kind, prop.position.x - room.keyStart.x, prop.position.y - room.keyStart.y, prop.radius]),
    elements: (room.elements ?? []).map((element) => element.kind === "reset-hazard"
      ? [element.kind, element.bounds.x - room.keyStart.x, element.bounds.y - room.keyStart.y, element.bounds.width, element.bounds.height]
      : [element.kind, element.position.x - room.keyStart.x, element.position.y - room.keyStart.y]),
  }));
  assert.equal(new Set(geometrySignatures).size, 18);
  assert.equal(originals.filter((room) => room.cords.length === 1).length, 10);
  assert.equal(originals.filter((room) => room.cords.length === 2).length, 8);
  const actionSignatures = CAMPAIGN_COMPLETION_TRACES.slice(2).map((trace) => trace.actions.map((action) => `${action.tick}:${action.kind}`).join("|"));
  assert.ok(new Set(actionSignatures).size >= 9, `only ${new Set(actionSignatures).size} canonical action signatures`);
});
test("Draft Gallery's taught clear-bubble then cut route tolerates ordinary reaction delays", () => {
  const room = CAMPAIGN_ROOMS[0];
  for (const cutTick of [16, 30, 60, 94]) {
    const trace: CompletionTrace = {
      roomId: room.id,
      tuningVersion: COMPLETION_TRACE_TUNING_VERSION,
      seed: 0,
      fixedStepMs: COMPLETION_TRACE_STEP_MS,
      maximumTicks: 260,
      expectedTickets: 0,
      actions: [
        { tick: 0, kind: "tap", point: { x: 184, y: 397 } },
        { tick: cutTick, kind: "slash", from: { x: 60, y: 160 }, to: { x: 300, y: 160 } },
      ],
    };
    const result = replayCompletionTrace(room, trace);
    assert.equal(result.completed, true, `clear-to-cut delay ${cutTick * COMPLETION_TRACE_STEP_MS}ms failed`);
  }
});
});
