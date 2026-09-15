import { test } from "node:test";
import assert from "node:assert/strict";
import { getFurniture } from "../src/core/catalog";
import { InteractiveFurnishing } from "../src/room/furnishings";

test("pet furnishing catalog entries preserve their intended compact footprints", () => {
  assert.deepEqual(
    ["pet-bowl", "fish-tank", "pet-trampoline"].map((id) => {
      const def = getFurniture(id)!;
      return [def.kind, def.width, def.depth, def.height, def.price];
    }),
    [
      ["bowl", 0.7, 0.7, 0.26, 12],
      ["aquarium", 1.5, 0.8, 1.6, 36],
      ["trampoline", 1.3, 1.3, 0.35, 30],
    ],
  );
});

test("a bowl exposes fill state while aquarium and trampoline responses settle", () => {
  const bowl = new InteractiveFurnishing(getFurniture("pet-bowl")!);
  assert.equal(bowl.filled, false);
  bowl.interact();
  assert.equal(bowl.filled, true);
  bowl.setFilled(false);
  assert.equal(bowl.status().filled, false);

  const tank = new InteractiveFurnishing(getFurniture("fish-tank")!);
  tank.interact();
  assert.equal(tank.status().fishDarting, true);
  for (let i = 0; i < 45; i++) tank.update(0.05, false);
  assert.equal(tank.status().fishDarting, false);

  const trampoline = new InteractiveFurnishing(getFurniture("pet-trampoline")!);
  trampoline.interact();
  assert.equal(trampoline.status().trampolineWobbling, true);
  trampoline.update(1, false);
  assert.equal(trampoline.status().trampolineWobbling, true);
  for (let i = 0; i < 15; i++) trampoline.update(0.05, false);
  assert.equal(trampoline.status().trampolineWobbling, false);
});

test("reduced motion and resumed frames clamp visual elapsed time", () => {
  const tank = new InteractiveFurnishing(getFurniture("fish-tank")!);
  tank.interact();
  tank.update(10, true);
  // A background frame only consumes one safe visual tick, preserving the
  // short response instead of skipping its readable reduced-motion cue.
  assert.equal(tank.status().fishDarting, true);
  for (let i = 0; i < 40; i++) tank.update(0.05, true);
  assert.equal(tank.status().fishDarting, false);
});

test("a dart changes fish speed without teleporting their swim position", () => {
  const tank = new InteractiveFurnishing(getFurniture("fish-tank")!);
  tank.update(0.2, false);
  const fish = tank.root.getObjectByName("aquarium-fish-0")!;
  const before = fish.position.clone();
  tank.interact();
  tank.update(0, false);
  assert.ok(fish.position.distanceTo(before) < 1e-10);
});

test("models construct without WebGL or ambient timer ownership", () => {
  const original = globalThis.setInterval;
  let intervals = 0;
  globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
    intervals++;
    return original(...args);
  }) as typeof setInterval;
  try {
    new InteractiveFurnishing(getFurniture("pet-bowl")!);
    new InteractiveFurnishing(getFurniture("fish-tank")!);
    new InteractiveFurnishing(getFurniture("pet-trampoline")!);
  } finally {
    globalThis.setInterval = original;
  }
  assert.equal(intervals, 0);
});
