import assert from "node:assert/strict";
import { ActivePlayWindow, DuetHands, DuetRun, levelAt, levelConfig, phrase } from "../src/core";

assert.equal(phrase(1).length, 15);
assert.ok(phrase(1).every((note) => note.x === 0.5));
assert.ok(phrase(2).some((note) => note.x !== 0.5));
assert.ok(new Set(phrase(4).map((note) => note.beat)).size < phrase(4).length);
assert.deepEqual(levelConfig(100, true), levelConfig(2, true));
assert.equal(levelAt(300), 10);

const run = new DuetRun();
run.generated = 1;
run.notes = [
  { id: "left", side: 0, x: 0.5, beat: 4, lead: 4, radius: 0.2, state: "fall", flavor: 0 },
  { id: "right", side: 1, x: 0.5, beat: 4, lead: 4, radius: 0.2, state: "fall", flavor: 1 },
];
assert.equal(run.advance(4).filter((event) => event.type === "catch").length, 2);
assert.equal(run.advance(4).length, 0, "a note is caught only once");
const score = run.score;
run.positions = [0, 0]; run.advance(300);
assert.equal(run.score, score, "misses never remove score");

const hands = new DuetHands(run);
assert.equal(hands.down(1, 0.2), true);
assert.equal(hands.down(2, 0.8), true);
assert.equal(hands.down(3, 0.1), false, "each half has one pointer owner");
hands.move(1, 0.9);
assert.equal(run.positions[0], 0.92, "crossing keeps original left ownership");
assert.ok(Math.abs(run.positions[1] - 0.6) < 0.0001);

const active = new ActivePlayWindow(3);
assert.equal(active.advance(10, 1, 40), null, "idle transport earns nothing");
active.activate(10);
assert.equal(active.advance(10.5, 0.5, 40), null);
assert.equal(active.advance(11, 0.5, 40), 41, "a bounded input consequence reports monotonic total");
assert.equal(active.advance(11.4, 0.4, 40), null, "repeated snapshots cannot pay twice");
assert.equal(active.advance(14, 1, 40), null, "idle music after the window earns nothing");
console.log("PASS: Arctic Duet chart, catch safety, and independent touch ownership");
