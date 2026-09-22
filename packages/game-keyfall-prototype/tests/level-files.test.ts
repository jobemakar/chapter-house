import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  levelIssues,
  parseLevelFile,
  parseLevelIndex,
  playableRoom,
  type LevelFile,
} from "../src/level-files";
import type { RoomDefinition } from "../src/types";

function room(overrides: Partial<RoomDefinition> = {}): RoomDefinition {
  return {
    id: "test-room",
    title: "Test Room",
    subtitle: "A fixture",
    wing: "campaign",
    source: { kind: "original" },
    kind: "drop",
    keyStart: { x: 280, y: 160 },
    cords: [{ id: "cord-a", anchor: { x: 280, y: 80 }, length: 80, angle: 0 }],
    tickets: [
      { id: "ticket-a", position: { x: 240, y: 300 } },
      { id: "ticket-b", position: { x: 280, y: 380 } },
      { id: "ticket-c", position: { x: 320, y: 460 } },
    ],
    goal: { x: 280, y: 700 },
    props: [],
    ...overrides,
  };
}

function file(overrides: Partial<LevelFile["room"]> = {}): LevelFile {
  return { version: 1, room: { ...room(), ...overrides }, playtested: false };
}

describe("Keyfall level files", () => {
  test("round-trips licensed source metadata and every physics object shape", () => {
    const value: LevelFile = file({
      source: {
        kind: "mlgrope-mit-adaptation",
        repository: "https://github.com/emersion/mlgrope",
        commit: "1c398f18dfb5977fb1f7fcb8a671584a102f406a",
        path: "levels/0.csv",
        license: "MIT",
      },
      props: [
        { kind: "bumper", position: { x: 100, y: 300 }, radius: 30 },
        { kind: "bellows", position: { x: 80, y: 400 }, radius: 40, angle: 0.5 },
        { kind: "platform", position: { x: 280, y: 520 }, radius: 52, angle: -0.25 },
      ],
      elements: [
        { id: "bubble-a", kind: "bubble", position: { x: 100, y: 200 }, captureRadius: 36, buoyancy: 0.003, popRadius: 52 },
        { id: "draft-a", kind: "air-jet", position: { x: 80, y: 350 }, zone: { x: 100, y: 300, width: 200, height: 180 }, direction: { x: 1, y: 0 }, strength: 0.002, mode: "continuous", tapRadius: 44 },
        { id: "weight-a", kind: "counterweight", position: { x: 430, y: 350 }, radius: 22, mass: 1.5, restitution: 0.6 },
        { id: "hazard-a", kind: "reset-hazard", bounds: { x: 20, y: 740, width: 120, height: 30 }, reason: "The key fell backstage." },
      ],
    });
    assert.deepEqual(parseLevelFile(JSON.parse(JSON.stringify(value))), value);
    assert.deepEqual(levelIssues(value), []);
    assert.deepEqual(playableRoom(value), value.room);
  });

  test("accepts incomplete drafts and reports exact playability issues", () => {
    const draft = parseLevelFile({ ...file(), room: { ...room(), title: "", keyStart: null, goal: null, tickets: [] } });
    assert.deepEqual(levelIssues(draft), [
      "A title is required.",
      "Place one key.",
      "Place one keyhole.",
      "Place exactly three tickets (currently 0).",
    ]);
    assert.throws(() => playableRoom(draft), /Place one key/);
  });

  test("reports off-board objects while the defensive parser rejects unsafe values", () => {
    const parsed = parseLevelFile(file({
      goal: { x: 561, y: 700 },
      elements: [{ id: "hazard-a", kind: "reset-hazard", bounds: { x: 500, y: 760, width: 80, height: 40 }, reason: "Offstage" }],
    }));
    assert.deepEqual(levelIssues(parsed), [
      "Keyhole must be inside the 560 by 800 playfield.",
      "Hazard hazard-a must fit inside the 560 by 800 playfield.",
    ]);
    assert.throws(() => parseLevelFile(file({ id: "../escape" })), /room id/);
    assert.throws(() => parseLevelFile(file({ props: [{ kind: "bumper", position: { x: 1, y: 1 }, radius: -1 }] })), /radius/);
    assert.throws(() => parseLevelFile(file({ cords: [{ id: "cord-a", anchor: { x: Number.NaN, y: 1 }, length: 2, angle: 0 }] })), /finite number/);
    assert.throws(() => parseLevelFile(file({ source: { kind: "mlgrope-mit-adaptation", repository: "https://evil.example", commit: "x", path: "../x", license: "MIT" } as never })), /repository/);
  });

  test("campaign order accepts safe unique ids without historical catalog counts", () => {
    assert.deepEqual(parseLevelIndex({ version: 1, levels: ["room-one", "room-2"] }), { version: 1, levels: ["room-one", "room-2"] });
    assert.throws(() => parseLevelIndex({ version: 1, levels: ["room-one", "room-one"] }), /duplicate/);
    assert.throws(() => parseLevelIndex({ version: 1, levels: ["index"] }), /cannot be "index"/);
    assert.equal(playableRoom(file()).id, "test-room");
  });

  test("editor-created values outside the save schema are also blocked from play", () => {
    const excessiveAngle = file({ props: [{ kind: "platform", position: { x: 280, y: 500 }, radius: 52, angle: 1_000 }] });
    assert.match(levelIssues(excessiveAngle)[0], /prop 1 angle/);
    assert.throws(() => playableRoom(excessiveAngle), /prop 1 angle/);

    const tooManyCords = file({
      cords: Array.from({ length: 33 }, (_, index) => ({
        id: `cord-${index + 1}`,
        anchor: { x: 20 + index * 10, y: 80 },
        length: 100,
        angle: 0,
      })),
    });
    assert.match(levelIssues(tooManyCords)[0], /cords cannot contain more than 32 items/);
    assert.throws(() => playableRoom(tooManyCords), /cords cannot contain more than 32 items/);
  });
});
