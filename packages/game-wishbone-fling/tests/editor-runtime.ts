import assert from "node:assert/strict";
import { test } from "node:test";
import M from "matter-js";
import { PowerYard } from "../src/powers";
import { aim } from "../src/yard";
import { WishboneCamera } from "../src/camera";
import type { YardDefinition } from "../src/types";
const definition = (): YardDefinition => ({
  id: "editor-test",
  name: "Editor test",
  subtitle: "",
  revision: "test-v1",
  world: { width: 1800, height: 1200 },
  launcher: { x: 850, y: 300 },
  terrain: [{ id: "island", x: 1300, y: 900, w: 400, h: 40, angle: 0.12 }],
  pieces: [
    {
      id: 40,
      kind: "target",
      x: 1250,
      y: 820,
      r: 20,
      w: 0,
      h: 0,
      color: 1,
      angle: 0,
    },
    {
      id: 80,
      kind: "box",
      x: 1300,
      y: 820,
      w: 60,
      h: 60,
      color: 0,
      angle: 0.2,
    },
  ],
  deviceInstances: [],
});
const step = (yard: PowerYard, seconds: number) => {
  for (let i = 0; i < seconds * 120; i++) yard.step(1 / 120);
};

test("elevated launcher supports both directions and returns with zero velocity", () => {
  for (const direction of [-1, 1]) {
    const yard = new PowerYard(definition());
    assert.deepEqual(yard.origin, { x: 850, y: 300 });
    assert.equal(Math.sign(aim(direction * 100, 80).x), direction);
    assert.ok(yard.throwToy(aim(direction * 100, 80)));
    step(yard, 0.2);
    assert.equal(Math.sign(yard.dog.position.x - yard.origin.x), direction);
    yard.recall();
    assert.equal(yard.mode, "ready");
    assert.deepEqual(yard.dog.position, yard.origin);
    for (const part of yard.plush.parts) {
      assert.equal(part.speed, 0);
      assert.equal(part.angularVelocity, 0);
    }
    yard.throwToy({ x: 0, y: 0 });
    for (const part of yard.plush.parts)
      M.Body.translate(part, { x: 0, y: 1500 });
    step(yard, 1 / 120);
    assert.equal(yard.mode, "ready");
    assert.deepEqual(yard.dog.position, yard.origin);
    yard.dispose();
  }
});

test("terrain and pieces preserve rotations without an invisible gap floor", () => {
  const yard = new PowerYard(definition(), null, undefined, { settle: false });
  assert.equal(yard.terrain[0].angle, 0.12);
  assert.equal(yard.pieces[1].angle, 0.2);
  assert.equal(M.Query.point(yard.bounds, { x: 300, y: 638 }).length, 0);
  assert.equal(
    M.Query.point(yard.bounds, { x: yard.origin.x, y: yard.origin.y + 79 })
      .length,
    1,
  );
  yard.dispose();
});

test("initial falling toys are diagnostics; active falls rescue once and pieces stay removed", () => {
  const d = definition();
  d.terrain = [];
  const initial = new PowerYard(d);
  step(initial, 6);
  assert.equal(initial.rescued.size, 0);
  assert.ok(initial.unstable.has(40));
  assert.equal(
    initial.drainEvents().filter((e) => e.type === "rescue").length,
    0,
  );
  initial.dispose();
  const yard = new PowerYard(definition());
  yard.throwToy({ x: 3, y: -3 });
  for (const b of yard.pieces) M.Body.setPosition(b, { x: 500, y: 1500 });
  step(yard, 0.1);
  assert.deepEqual([...yard.rescued], [40]);
  assert.ok(yard.removed.has(80));
  assert.equal(yard.drainEvents().filter((e) => e.type === "rescue").length, 1);
  step(yard, 0.5);
  assert.equal(yard.drainEvents().filter((e) => e.type === "rescue").length, 0);
  const checkpoint = yard.checkpoint();
  const restored = new PowerYard(definition(), checkpoint);
  assert.ok(restored.rescued.has(40));
  assert.ok(restored.removed.has(80));
  const restacked = new PowerYard(definition());
  assert.equal(restacked.removed.size, 0);
  yard.dispose();
  restored.dispose();
  restacked.dispose();
});

test("stable piece IDs survive array reorder and geometry revisions discard transient poses", () => {
  const original = new PowerYard(definition());
  original.throwToy({ x: 3, y: -3 });
  M.Body.setPosition(original.pieces[0], { x: 500, y: 1500 });
  step(original, 0.1);
  const saved = original.checkpoint();
  const reordered = definition();
  reordered.pieces.reverse();
  const restored = new PowerYard(reordered, saved);
  assert.ok(restored.rescued.has(40));
  assert.equal(restored.pieces[0].game.id, 80);
  const edited = definition();
  edited.revision = "test-v2";
  const reset = new PowerYard(edited, saved);
  assert.equal(reset.rescued.size, 0);
  const unversioned = new PowerYard(definition(), {
    pieces: saved.pieces,
    rescued: [40],
  });
  assert.equal(unversioned.rescued.size, 0);
  original.dispose();
  restored.dispose();
  reset.dispose();
  unversioned.dispose();
});

test("multiple linked devices have independent state and rotated spring force", () => {
  const d = definition();
  d.deviceInstances = [
    { id: "lever-a", kind: "lever", x: 200, y: 500, targetId: "gate-b" },
    { id: "lever-b", kind: "lever", x: 400, y: 500, targetId: "gate-a" },
    { id: "gate-a", kind: "gate", x: 1500, y: 550, angle: 0.3 },
    { id: "gate-b", kind: "gate", x: 1600, y: 550 },
    { id: "button-a", kind: "button", x: 600, y: 500, targetId: "field-b" },
    { id: "field-a", kind: "field", x: 1300, y: 500, r: 165 },
    { id: "field-b", kind: "field", x: 1450, y: 500, r: 165 },
    { id: "spring-a", kind: "bellows", x: 300, y: 800, angle: Math.PI / 2 },
    { id: "spring-b", kind: "bellows", x: 600, y: 800, angle: 0 },
  ];
  const yard = new PowerYard(d);
  const trigger = (id: string) => {
    const device = yard.instances.find((i) => i.definition.id === id)!;
    const other = M.Bodies.circle(
      device.body.position.x,
      device.body.position.y - 55,
      12,
    );
    M.Body.setVelocity(other, { x: 0, y: 7 });
    M.Composite.add(yard.engine.world, other);
    step(yard, 0.15);
  };
  trigger("lever-a");
  assert.equal(
    yard.instances.find((i) => i.definition.id === "gate-b")!.open,
    true,
  );
  assert.equal(
    yard.instances.find((i) => i.definition.id === "gate-a")!.open,
    false,
  );
  trigger("button-a");
  assert.equal(
    yard.instances.find((i) => i.definition.id === "field-b")!.polarity,
    1,
  );
  assert.equal(
    yard.instances.find((i) => i.definition.id === "field-a")!.polarity,
    0,
  );
  const spring = yard.instances.find((i) => i.definition.id === "spring-a")!;
  const box = yard.pieces.find((b) => b.game.id === 80)!;
  M.Body.setPosition(box, { x: 400, y: 800 });
  M.Body.setVelocity(box, { x: 0, y: 0 });
  spring.gustUntil = yard.time + 0.5;
  step(yard, 0.1);
  assert.ok(box.velocity.x > 1);
  assert.equal(
    yard.instances.find((i) => i.definition.id === "spring-b")!.gustUntil,
    0,
  );
  const saved = yard.checkpoint(),
    restored = new PowerYard(d, saved);
  assert.equal(
    restored.instances.find((i) => i.definition.id === "gate-b")!.open,
    true,
  );
  assert.equal(
    restored.instances.find((i) => i.definition.id === "field-b")!.polarity,
    1,
  );
  yard.dispose();
  restored.dispose();
});

test("tall world overview includes full height", () => {
  const camera = new WishboneCamera();
  camera.setWorld({ width: 1200, height: 2400 }, { x: 800, y: 1800 });
  camera.home();
  assert.equal(camera.zoom, 0.3);
  assert.equal(camera.y, 1200);
  assert.ok(camera.toScreen({ x: 0, y: 0 }).y >= 0);
  assert.ok(camera.toScreen({ x: 0, y: 2400 }).y <= 720);
});

test("spring still boosts plush parts whose metadata ID matches an earned rescue", () => {
  const make = (active: boolean) => {
    const d = definition();
    d.deviceInstances = [
      { id: "spring", kind: "bellows", x: 300, y: 800, angle: Math.PI / 2 },
    ];
    const yard = new PowerYard(d);
    yard.rescued.add(40);
    yard.throwToy({ x: 0, y: 0 });
    for (const part of yard.plush.parts) {
      part.game.id = 40;
      M.Body.translate(part, {
        x: 400 - yard.origin.x,
        y: 800 - yard.origin.y,
      });
    }
    if (active) yard.instances[0].gustUntil = yard.time + 0.5;
    return yard;
  };
  const boosted = make(true),
    neutral = make(false);
  step(boosted, 0.1);
  step(neutral, 0.1);
  assert.ok(boosted.dog.velocity.x > neutral.dog.velocity.x + 1);
  boosted.dispose();
  neutral.dispose();
});
