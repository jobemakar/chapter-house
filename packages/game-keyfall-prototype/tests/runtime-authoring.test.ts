import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { CAMPAIGN_ROOMS, GAME_VIEWPORT } from "../src/rooms";
import { CampaignCatalog, RoomValidator } from "../src/catalog";
import { bellowsDirection, makeWorld, PLATFORM_HEIGHT, PLATFORM_WIDTH } from "../src/physics";
import { applyRoomGesture } from "../src/room-input";
import { parseLevelFile, parseLevelIndex, playableRoom } from "../src/level-files";
import { loadLevelFiles } from "../src/level-loader";
import type { RoomDefinition } from "../src/types";
import { addPaletteObject, blankLevel, describeSelection, rotateSelection } from "../src/editor/model";
import { fanHeading } from "../src/fan";

test("fan editor headings and visual headings match the actual fixed-strength push", () => {
  const draft = blankLevel("fan-directions");
  const selection = addPaletteObject(draft.room, "bellows", { x: 280, y: 400 })!;
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.7]) {
    rotateSelection(draft.room, selection, heading);
    const stored = draft.room.props[0].angle;
    const push = bellowsDirection(stored);
    assert.ok(Math.abs(push.x - Math.cos(heading) * Math.hypot(1, .2)) < 1e-12);
    assert.ok(Math.abs(push.y - Math.sin(heading) * Math.hypot(1, .2)) < 1e-12);
    assert.ok(Math.abs(fanHeading(stored) - heading) < 1e-12);
    assert.ok(Math.abs(describeSelection(draft.room, selection)!.rotation! - heading) < 1e-12);
  }
  draft.room.props[0].angle = 0;
  describeSelection(draft.room, selection);
  assert.equal(draft.room.props[0].angle, 0, "selecting legacy fans must not rewrite stored trajectories");
});

function room(): RoomDefinition {
  return { ...structuredClone(CAMPAIGN_ROOMS[2]), keyStart: { x: 280, y: 240 }, cords: [], props: [], elements: [] };
}

test("rotatable flat platforms keep their fixed collision size and redirect a falling key", () => {
  const flat = room();
  flat.props = [{ kind: "platform", position: { x: 280, y: 440 }, radius: 52, angle: Math.PI / 6 }];
  const world = makeWorld(flat);
  try {
    const body = world.props.get("platform-0")!;
    assert.equal(body.isStatic, true);
    assert.equal(body.isSensor, false);
    assert.equal(body.angle, Math.PI / 6);
    const edgeLengths = body.vertices.map((p, i) => Math.hypot(p.x - body.vertices[(i + 1) % 4].x, p.y - body.vertices[(i + 1) % 4].y));
    assert.ok(edgeLengths.some((value) => Math.abs(value - PLATFORM_WIDTH) < 1e-6));
    assert.ok(edgeLengths.some((value) => Math.abs(value - PLATFORM_HEIGHT) < 1e-6));
    let bounced = false;
    for (let tick = 0; tick < 100; tick++) {
      world.fixedUpdate(16);
      if (world.key.velocity.y < -0.1 && world.key.velocity.x > 1) bounced = true;
    }
    assert.ok(bounced, "the sloped collider must redirect the key, not just rotate the drawing");
  } finally { world.dispose(); }
});

test("rotating bellows preserves force and every placed bellows responds to taps", () => {
  assert.deepEqual(bellowsDirection(), { x: 1, y: -0.2 });
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 3]) {
    assert.ok(Math.abs(Math.hypot(...Object.values(bellowsDirection(angle))) - Math.hypot(1, -.2)) < 1e-12);
  }
  const definition = room();
  definition.props = [
    { kind: "bellows", position: { x: 100, y: 500 }, radius: 32 },
    { kind: "bellows", position: { x: 400, y: 500 }, radius: 32, angle: Math.PI / 2 },
  ];
  const world = makeWorld(definition);
  try {
    const result = applyRoomGesture(definition, world, { kind: "tap", point: { x: 400, y: 500 } });
    assert.equal(result.activated, true);
    assert.ok(Math.abs(world.key.force.x - .018) < 1e-12);
    assert.ok(Math.abs(world.key.force.y - .09) < 1e-12);
    assert.equal(result.cuts, 0);
  } finally { world.dispose(); }
});

test("authored fan power and platform length survive files and affect production physics", () => {
  const definition = room();
  definition.props = [
    { kind: "bellows", position: { x: 100, y: 500 }, radius: 32, power: 2 },
    { kind: "platform", position: { x: 300, y: 500 }, radius: 52, length: 220, angle: .7 },
  ];
  const file = parseLevelFile(JSON.parse(JSON.stringify({ version: 1, room: definition, playtested: false })));
  assert.equal(file.room.props[0].power, 2);
  assert.equal(file.room.props[1].length, 220);
  const world = makeWorld(playableRoom(file));
  try {
    applyRoomGesture(playableRoom(file), world, { kind: "tap", point: { x: 100, y: 500 } });
    assert.ok(Math.abs(world.key.force.x - .18) < 1e-12);
    assert.ok(Math.abs(world.key.force.y + .036) < 1e-12);
    const vertices = world.props.get("platform-1")!.vertices;
    const lengths = vertices.map((p, i) => Math.hypot(p.x - vertices[(i + 1) % 4].x, p.y - vertices[(i + 1) % 4].y));
    assert.ok(lengths.some((n) => Math.abs(n - 220) < 1e-9));
    assert.ok(lengths.some((n) => Math.abs(n - 20) < 1e-9));
  } finally { world.dispose(); }
  for (const power of [0, 3.1, Infinity]) {
    const invalid = structuredClone(file); invalid.room.props[0].power = power;
    assert.throws(() => parseLevelFile(invalid));
  }
  for (const length of [39, 281, NaN]) {
    const invalid = structuredClone(file); invalid.room.props[1].length = length;
    assert.throws(() => parseLevelFile(invalid));
  }
});

test("resizable walls round-trip and stop a bouncy key without rebound", () => {
  const definition = room();
  definition.props = [{ kind: "wall", position: { x: 280, y: 440 }, radius: 52, length: 220, angle: 0 }];
  const file = parseLevelFile({ version: 1, room: definition, playtested: false });
  const world = makeWorld(playableRoom(file));
  try {
    const wall = world.props.get("wall-0")!;
    assert.equal(wall.isSensor, false);
    assert.equal(wall.bounds.max.x - wall.bounds.min.x, 220);
    let strongestRebound = 0;
    for (let tick = 0; tick < 140; tick++) {
      world.fixedUpdate(16);
      strongestRebound = Math.min(strongestRebound, world.key.velocity.y);
    }
    assert.ok(strongestRebound > -.1, `unexpected wall rebound ${strongestRebound}`);
    assert.ok(world.key.position.y > 400 && world.key.position.y < 420, "key rests on top of wall");
    assert.equal(world.key.restitution, .44, "wall must not change key bounce elsewhere");
  } finally { world.dispose(); }
});

test("file catalogs accept arbitrary room counts and preserve explicitly supplied order", () => {
  const custom = new CampaignCatalog([CAMPAIGN_ROOMS[4], CAMPAIGN_ROOMS[2]], new RoomValidator(GAME_VIEWPORT), false);
  assert.equal(custom.all().length, 2);
  assert.equal(custom.all()[0].id, CAMPAIGN_ROOMS[4].id);
  assert.equal(custom.validation.errors.length, 0);
});

test("packaged index references independent valid level files", async () => {
  const directory = new URL("../public/levels/", import.meta.url);
  const index = parseLevelIndex(JSON.parse(await readFile(new URL("index.json", directory), "utf8")));
  const names = await readdir(directory);
  for (const id of index.levels) {
    assert.ok(names.includes(`${id}.json`));
    const file = parseLevelFile(JSON.parse(await readFile(new URL(`${id}.json`, directory), "utf8")));
    assert.equal(playableRoom(file).id, id);
  }
});

test("runtime loads ordered JSON and reports invalid drafts and missing files without fallback", async () => {
  const a = room(); a.id = "first";
  const b = room(); b.id = "second";
  const responses: Record<string, unknown> = {
    "index.json": { version: 1, levels: ["second", "draft", "missing", "first"] },
    "first.json": { version: 1, room: a, playtested: false },
    "second.json": { version: 1, room: b, playtested: false },
    "draft.json": { version: 1, room: { ...a, id: "draft", goal: null }, playtested: false },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const name = new URL(String(input)).pathname.split("/").pop()!;
    return name in responses ? new Response(JSON.stringify(responses[name])) : new Response("missing", { status: 404 });
  };
  try {
    const loaded = await loadLevelFiles(new URL("http://localhost/levels/"));
    assert.deepEqual(loaded.rooms.map((definition) => definition.id), ["second", "first"]);
    assert.equal(loaded.errors.length, 2);
    assert.match(loaded.errors[0], /draft/);
    assert.match(loaded.errors[1], /missing/);
  } finally { globalThis.fetch = originalFetch; }
});
