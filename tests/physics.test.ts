import "../packages/game-wishbone-fling/tests/legacy-catalog";
import { test } from "node:test";
import assert from "node:assert/strict";
import M from "matter-js";
import { PowerYard, loadPowers } from "../packages/game-wishbone-fling/src/powers";
import { FloppyYard } from "../packages/game-wishbone-fling/src/floppy-yard";
import { aim } from "../packages/game-wishbone-fling/src/yard";

const run = (yard: FloppyYard, seconds: number, fps = 120) => {
  for (let n = 0; n < seconds * fps; n++) yard.step(1 / fps);
};

test("limbs articulate and settle back at the launcher", () => {
  const yard = new FloppyYard();
  yard.throwToy({ x: 18, y: -5 });
  let gap = 0;
  for (let n = 0; n < 720; n++) {
    yard.step(1 / 120);
    if (yard.mode === "flight")
      for (const joint of yard.plush.joints) {
        const a = M.Constraint.pointAWorld(joint), b = M.Constraint.pointBWorld(joint);
        gap = Math.max(gap, Math.hypot(a.x - b.x, a.y - b.y));
      }
  }
  assert.ok(gap < 15);
  assert.equal(yard.mode, "ready");
  yard.dispose();
});

test("poor throws and recalls are recoverable without leaked bodies", () => {
  const yard = new PowerYard();
  const bodies = M.Composite.allBodies(yard.engine.world).length;
  for (let i = 0; i < 10; i++) {
    assert.ok(yard.throwToy({ x: 2, y: -2 }));
    run(yard, 0.2);
    yard.recall();
    run(yard, 0.8);
    assert.equal(yard.mode, "ready");
    assert.equal(M.Composite.allBodies(yard.engine.world).length, bodies);
  }
  yard.dispose();
});

test("fixed-step physics preserves outcomes at common frame rates", () => {
  const poses = [30, 60, 120].map((fps) => {
    const yard = new PowerYard(1);
    yard.throwToy({ x: 16, y: -8 });
    run(yard, 2, fps);
    const result = yard.pieces.map((body) => ({ ...body.position }));
    yard.dispose();
    return result;
  });
  for (const result of poses.slice(1))
    result.forEach((p, index) =>
      assert.ok(Math.hypot(p.x - poses[0][index].x, p.y - poses[0][index].y) < 1e-6),
    );
});

function collide(yard: PowerYard, device: M.Body) {
  const body = M.Bodies.circle(device.position.x, device.position.y - 48, 12, { density: 0.001 });
  M.Composite.add(yard.engine.world, body);
  M.Body.setVelocity(body, { x: 0, y: 7 });
  run(yard, 0.12);
}

test("authored lever, spring, and magnet mechanisms respond and restore", () => {
  const lever = new PowerYard(4);
  collide(lever, lever.lever);
  assert.ok(lever.gateOpen);
  const magnet = new PowerYard(6);
  collide(magnet, magnet.button);
  assert.equal(magnet.polarity, 1);
  const restored = new PowerYard(6, magnet.checkpoint());
  assert.equal(restored.polarity, 1);
  const spring = new PowerYard(5);
  collide(spring, spring.bellows);
  assert.ok(spring.gustUntil > spring.time);
  [lever, magnet, restored, spring].forEach((yard) => yard.dispose());
});

test("archived power saves remain inert: no pickup, arm, use, or clear grant", () => {
  const archive = loadPowers({ counts: { bounce: 2, magnet: 3, wind: 4 }, discovered: ["bounce", "wind"], clears: 9 });
  const yard = new PowerYard(4, {
    rescued: [], pieces: [],
    gadgets: { claimed: ["bounce", "magnet"], clearPaid: true, reward: "wind", gateOpen: false, polarity: 0 },
  }, archive);
  const before = structuredClone(archive);
  yard.throwToy({ x: 22, y: -8 });
  run(yard, 8);
  assert.deepEqual(archive, before);
  assert.equal(yard.drainEvents().some((event) => event.type === "mechanism"), false);
  assert.deepEqual(yard.checkpoint().gadgets?.claimed, ["bounce", "magnet"]);
  yard.dispose();
});

test("long yard has stable idle, distant targets, ordinary flight and checkpoint coordinates", () => {
  const yard = new PowerYard(7);
  assert.equal(yard.world.width, 2400);
  run(yard, 5);
  assert.equal(yard.rescued.size, 0);
  assert.ok(yard.pieces.some((body) => body.game.kind === "target" && body.position.x > 2000));
  for (const velocity of [{ x: 22, y: -7 }, { x: 22, y: -5 }, { x: 22, y: -3 }, { x: 20, y: -12 }, { x: 22, y: -6 }, { x: 22, y: -10 }, { x: 22, y: -4 }, { x: 22, y: -2 }]) {
    assert.ok(yard.throwToy(velocity));
    run(yard, 8);
  }
  assert.equal(yard.rescued.size, yard.targetCount);
  const checkpoint = yard.checkpoint();
  assert.ok(checkpoint.pieces.every((piece) => piece.x > 0 && piece.x < 2400));
  const restored = new PowerYard(7, checkpoint);
  assert.equal(restored.world.width, 2400);
  restored.dispose();
  yard.dispose();
});

test("pull distance stays bounded and points toward the yard", () => {
  const velocity = aim(10000, 10000);
  assert.ok(Math.hypot(velocity.x, velocity.y) <= 160 * 0.137 + 0.0001);
  assert.ok(velocity.x >= 0 && velocity.y < 0);
  assert.equal(aim(0, 0).power, 0);
});
