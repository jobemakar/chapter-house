import { test } from "node:test";
import assert from "node:assert/strict";
import { fitVedaBoardWidth, VedaMotionController } from "../src/renderer";

test("board fit keeps the authored aspect ratio while prioritizing the primary slot", () => {
  assert.equal(fitVedaBoardWidth(900, 600, 9, 7), 771);
  assert.equal(fitVedaBoardWidth(600, 900, 9, 7), 600);
  assert.equal(fitVedaBoardWidth(900, 100, 9, 7), 128);
  assert.equal(fitVedaBoardWidth(900, 600, 0, 7), 0);
});

test("motion controller selects authored directional frames deterministically", () => {
  const motion = new VedaMotionController(false);
  motion.play("left", false, 1000);
  assert.deepEqual(motion.tick(1000), { direction: "left", state: "walk", frame: 0 });
  assert.deepEqual(motion.tick(1108), { direction: "left", state: "walk", frame: 1 });
  assert.deepEqual(motion.tick(1431), { direction: "left", state: "idle", frame: 0 });
  motion.play("up", true, 2000);
  assert.deepEqual(motion.tick(2010), { direction: "up", state: "push", frame: 0 });
});

test("one ordinary move exposes all four walk frames before returning idle", () => {
  for (const direction of ["up", "right", "down", "left"] as const) {
    const motion = new VedaMotionController(false);
    motion.play(direction, false, 1000);
    assert.deepEqual(
      [1000, 1108, 1216, 1324].map((time) => motion.tick(time).frame),
      [0, 1, 2, 3],
      direction,
    );
    assert.equal(motion.tick(1431).state, "idle");
  }
});

test("rapid directional input reaches every authored walk frame in every direction", () => {
  const motion = new VedaMotionController(false);
  for (const direction of ["up", "right", "down", "left"] as const) {
    motion.reset(direction);
    const frames = new Set<number>();
    for (let index = 0; index < 4; index += 1) {
      motion.play(direction, false, index);
      frames.add(motion.tick(index).frame);
    }
    assert.deepEqual([...frames].sort(), [0, 1, 2, 3], direction);
  }
});

test("a push-to-walk transition restarts the walk cycle at frame zero", () => {
  const motion = new VedaMotionController(false);
  motion.play("down", true, 1000);
  motion.tick(1060);
  motion.play("down", false, 1070);
  assert.equal(motion.tick(1070).frame, 0);
});

test("reduced motion keeps a stable authored idle frame after directional input", () => {
  const motion = new VedaMotionController(true);
  motion.play("right", false, 1000);
  assert.deepEqual(motion.tick(1080), { direction: "right", state: "idle", frame: 0 });
  assert.deepEqual(motion.tick(1300), { direction: "right", state: "idle", frame: 0 });
  assert.equal(motion.snapshot().direction, "right");
});

test("motion exposes an idle-drain boundary for a stoppable frame loop", () => {
  const motion = new VedaMotionController(false);
  assert.equal(motion.isActive(0), false);
  motion.play("down", false, 1000);
  assert.equal(motion.isActive(1000), true);
  assert.equal(motion.remaining(1000), 430);
  motion.tick(1430);
  assert.equal(motion.isActive(1430), false);
  assert.equal(motion.remaining(1430), 0);
});

test("reduced motion never keeps the RAF loop alive for a walk", () => {
  const motion = new VedaMotionController(true);
  motion.play("left", false, 1000);
  assert.equal(motion.isActive(1000), false);
  assert.equal(motion.remaining(1000), 0);
});
