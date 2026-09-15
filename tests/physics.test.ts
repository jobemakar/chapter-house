import { test } from "node:test";
import assert from "node:assert/strict";
import M from "matter-js";
import { createRequire } from "node:module";
import { PowerYard, loadPowers } from "../src/games/wishbone/powers";
import { FloppyYard } from "../src/games/wishbone/floppy-yard";
import { aim } from "../src/games/wishbone/yard";
import type { PowerId } from "../src/games/wishbone/types";
const run = (y: FloppyYard, seconds: number, fps = 120) => {
  for (let n = 0; n < seconds * fps; n++) y.step(1 / fps);
};
const stocked = () => loadPowers({ counts: { bounce: 2, magnet: 2, wind: 2 } });
test("both yards clear with ordinary throws; rewards cannot repeat on reload", () => {
  for (let i = 0; i < 2; i++) {
    const powers = loadPowers(),
      y = new PowerYard(i, null, powers);
    for (const v of [
      { x: 18, y: -5 },
      { x: 20, y: -3 },
      { x: 17, y: -12 },
      { x: 21, y: -3 },
    ]) {
      assert.ok(y.throwToy(v));
      run(y, 8);
    }
    assert.equal(y.rescued.size, 4);
    assert.equal(
      y.drainEvents().filter((e) => e.type === "clear-power").length,
      1,
    );
    const before = { ...powers.counts };
    const restored = new PowerYard(i, y.checkpoint(), powers);
    run(restored, 0.1);
    assert.deepEqual(powers.counts, before);
    assert.equal(restored.clearPaid, true);
    y.dispose();
    restored.dispose();
  }
});
test("limbs really articulate and remain attached during a throw", () => {
  const y = new FloppyYard();
  assert.equal(y.plush.parts.length, 9);
  let gap = 0,
    flop = 0;
  y.throwToy({ x: 18, y: -5 });
  for (let n = 0; n < 720; n++) {
    y.step(1 / 120);
    if (y.mode === "flight") {
      for (const j of y.plush.joints) {
        const a = M.Constraint.pointAWorld(j),
          b = M.Constraint.pointBWorld(j);
        gap = Math.max(gap, Math.hypot(a.x - b.x, a.y - b.y));
      }
      flop = Math.max(flop, Math.abs(y.plush.parts[2].angle - y.dog.angle));
    }
    assert.ok(
      y.plush.parts.every(
        (b) => Number.isFinite(b.position.x) && Number.isFinite(b.position.y),
      ),
    );
  }
  assert.ok(gap < 15);
  assert.ok(flop > 0.4);
  assert.equal(y.mode, "ready");
  y.dispose();
});
test("poor throws and early recall never require a restart or leak bodies", () => {
  const y = new PowerYard();
  const bodies = M.Composite.allBodies(y.engine.world).length;
  for (let i = 0; i < 14; i++) {
    assert.ok(y.throwToy({ x: 2, y: -2 }));
    run(y, 0.2);
    y.recall();
    run(y, 0.7);
    assert.equal(y.mode, "ready");
    assert.equal(M.Composite.allBodies(y.engine.world).length, bodies);
  }
  assert.equal(y.shots, 14);
  y.dispose();
});
test("fixed-step solver preserves outcome at 30, 60, and 120 fps", () => {
  const poses = [30, 60, 120].map((fps) => {
    const y = new PowerYard(1);
    y.throwToy({ x: 16, y: -8 });
    run(y, 2, fps);
    const positions = y.pieces.map((b) => ({ ...b.position }));
    y.dispose();
    return positions;
  });
  for (const positions of poses.slice(1))
    positions.forEach((p, i) =>
      assert.ok(Math.hypot(p.x - poses[0][i].x, p.y - poses[0][i].y) < 1e-6),
    );
});
test("shape pickups bank once across limbs and reload", () => {
  const y = new PowerYard(4);
  y.plush.pose(390, 395);
  y.throwToy({ x: 1, y: 0 });
  run(y, 0.05);
  assert.equal(y.powers.counts.bounce, 1);
  assert.equal(y.drainEvents().filter((e) => e.type === "pickup").length, 1);
  const restored = new PowerYard(4, y.checkpoint(), loadPowers(y.powers));
  restored.plush.pose(390, 395);
  restored.throwToy({ x: 1, y: 0 });
  run(restored, 0.05);
  assert.equal(restored.powers.counts.bounce, 1);
  y.dispose();
  restored.dispose();
});
test("charges are consumed on successful use, never on arming or rejected launch", () => {
  const y = new PowerYard(0, null, stocked());
  y.arm("bounce");
  y.arm("bounce");
  assert.equal(y.armed, null);
  y.arm("magnet");
  assert.equal(y.throwToy({ x: NaN, y: 0 }), false);
  assert.equal(y.powers.counts.magnet, 2);
  y.throwToy({ x: 5, y: -2 });
  assert.equal(y.powers.counts.magnet, 1);
  assert.equal(y.throwToy({ x: 5, y: -2 }), false);
  assert.equal(y.powers.counts.magnet, 1);
  y.dispose();
});
test("wind is retained on recall and spent once on manual or auto gust", () => {
  for (const auto of [false, true]) {
    const y = new PowerYard(0, null, stocked());
    y.arm("wind");
    y.throwToy({ x: 6, y: -5 });
    y.recall();
    run(y, 1);
    assert.equal(y.powers.counts.wind, 2);
    y.powers.autoGust = auto;
    y.arm("wind");
    y.throwToy({ x: 6, y: -5 });
    if (!auto) {
      assert.ok(y.gust());
      assert.equal(y.gust(), false);
    }
    run(y, 2);
    assert.equal(y.powers.counts.wind, 1);
    y.dispose();
  }
});
test("bounce biscuit produces three physical bounces and returns safely", () => {
  const y = new PowerYard(0, null, stocked());
  y.arm("bounce");
  y.throwToy({ x: 1, y: 1 });
  run(y, 8);
  assert.equal(
    y
      .drainEvents()
      .filter((e) => e.type === "power-used" && e.text.startsWith("Boing"))
      .length,
    3,
  );
  assert.equal(y.mode, "ready");
  y.dispose();
});
function collide(y: PowerYard, device: M.Body) {
  const b = M.Bodies.circle(device.position.x, device.position.y - 48, 12, {
    density: 0.001,
  });
  M.Composite.add(y.engine.world, b);
  M.Body.setVelocity(b, { x: 0, y: 7 });
  run(y, 0.12);
}
test("isolated devices respond to real collisions and restore their state", () => {
  const lever = new PowerYard(4);
  collide(lever, lever.lever);
  assert.ok(lever.gateOpen);
  run(lever, 0.5);
  assert.ok(lever.gate.position.y < 300);
  const magnet = new PowerYard(6);
  collide(magnet, magnet.button);
  assert.equal(magnet.polarity, 1);
  const restored = new PowerYard(6, magnet.checkpoint());
  assert.equal(restored.polarity, 1);
  run(magnet, 1);
  collide(magnet, magnet.button);
  assert.equal(magnet.polarity, -1);
  const spring = new PowerYard(5);
  collide(spring, spring.bellows);
  assert.ok(spring.gustUntil > spring.time);
  assert.ok(spring.drainEvents().some((e) => e.type === "mechanism"));
  [lever, magnet, restored, spring].forEach((y) => y.dispose());
});
test("magnet range and polarity have directional effects", () => {
  function velocity(active: boolean, distance: number) {
    const y = new PowerYard(0, null, stocked());
    if (active) y.arm("magnet");
    y.throwToy({ x: 0, y: 0 });
    y.engine.gravity.y = 0;
    const target = y.pieces.find((b) => b.game.kind === "target")!;
    M.Body.setPosition(target, { x: 162 + distance, y: 478 });
    target.game.home = { x: target.position.x + 10, y: 478 };
    M.Body.setVelocity(target, { x: 0, y: 0 });
    y.step(1 / 120);
    const vx = target.velocity.x;
    y.dispose();
    return vx;
  }
  assert.ok(velocity(true, 110) < velocity(false, 110) - 0.1);
  assert.ok(Math.abs(velocity(true, 250) - velocity(false, 250)) < 0.001);
});
test("clear rewards rotate predictably through all three powers", () => {
  const powers = loadPowers(),
    earned: PowerId[] = [];
  for (let n = 0; n < 3; n++) {
    const y = new PowerYard(0, null, powers);
    earned.push(y.clearReward);
    for (const b of y.pieces)
      if (b.game.kind === "target") {
        y.rescued.add(b.game.id);
        M.Composite.remove(y.engine.world, b);
      }
    y.step(1 / 120);
    assert.equal(powers.counts[y.clearReward], 1);
    y.dispose();
  }
  assert.deepEqual(earned, ["bounce", "magnet", "wind"]);
});
test("pull distance is bounded and points toward the yard", () => {
  const v = aim(10000, 10000);
  assert.ok(Math.hypot(v.x, v.y) <= 160 * 0.137 + 0.0001);
  assert.ok(v.x >= 0 && v.y < 0);
  assert.equal(aim(0, 0).power, 0);
});
// Optional differential check against the retained demo, when this sibling repo is present.
test("TypeScript port matches the retained demo trajectory and target outcomes", () => {
  const require = createRequire(import.meta.url);
  let legacy: { Yard: typeof PowerYard };
  try {
    legacy = require("../../wish/experiments/floppy-fetch/src/floppy-core.js");
  } catch {
    return;
  }
  for (let index = 0; index < 2; index++) {
    const old = new legacy.Yard(index),
      ported = new FloppyYard(index);
    old.throwToy({ x: 18, y: -5 });
    ported.throwToy({ x: 18, y: -5 });
    run(old, 2);
    run(ported, 2);
    assert.deepEqual([...ported.rescued], [...old.rescued]);
    ported.pieces.forEach((b, i) =>
      assert.ok(
        Math.hypot(
          b.position.x - old.pieces[i].position.x,
          b.position.y - old.pieces[i].position.y,
        ) < 1e-6,
      ),
    );
    old.dispose();
    ported.dispose();
  }
});
