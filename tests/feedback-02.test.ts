import { test } from "node:test";
import assert from "node:assert/strict";
import { PowerYard } from "../src/games/wishbone/powers";
import { yards } from "../src/games/wishbone/levels";
import { WishboneProgression } from "../src/games/wishbone/progression";
import { ProfileRepository, type StoragePort } from "../src/core/profile";
const step = (yard: PowerYard, seconds: number) => {
  for (let n = 0; n < seconds * 120; n++) yard.step(1 / 120);
};
const shots = [
  { x: 18, y: -5 },
  { x: 20, y: -3 },
  { x: 17, y: -12 },
  { x: 21, y: -3 },
  { x: 12, y: 2 },
  { x: 16, y: -3 },
  { x: 22, y: -8 },
  { x: 14, y: -12 },
];
for (let index = 2; index < yards.length; index++)
  test(`${yards[index].id}: stable idle, ordinary-shot completion, isolated mechanism and reload`, () => {
    const yard = new PowerYard(index);
    step(yard, 5);
    assert.equal(yard.rescued.size, 0);
    assert.equal(yard.targetCount, 4);
    const mechanisms: string[] = [];
    for (const shot of shots) {
      assert.ok(yard.throwToy(shot));
      step(yard, 8);
      for (const event of yard.drainEvents())
        if (event.type === "mechanism") mechanisms.push(event.text);
    }
    assert.equal(yard.rescued.size, 4);
    assert.equal(yard.gadgets.length, index === 4 ? 2 : index > 4 ? 1 : 0);
    if (index >= 4) assert.ok(mechanisms.length > 0);
    else assert.equal(mechanisms.length, 0);
    const counts = { ...yard.powers.counts };
    const restored = new PowerYard(index, yard.checkpoint(), yard.powers);
    step(restored, 1);
    assert.deepEqual(restored.powers.counts, counts);
    assert.equal(restored.rescued.size, 4);
    restored.dispose();
    yard.dispose();
  });
test("all yard identities and selections persist, with classics and earned keepsakes intact", () => {
  assert.equal(WishboneProgression.load(null).yard, 2);
  for (let index = 0; index < yards.length; index++) {
    const yard = new PowerYard(index);
    const raw = {
      yard: index,
      throws: 14,
      owned: ["bed"],
      rescued: [`${yards[index].id}:0`, "teeter:7", "domino:5"],
      checkpoints: { [yards[index].id]: yard.checkpoint() },
    };
    const loaded = WishboneProgression.load(raw);
    assert.equal(loaded.yard, index);
    assert.deepEqual(loaded.rescued, raw.rescued);
    assert.ok(loaded.owned.includes("bed"));
    assert.ok(loaded.checkpoints[yards[index].id]);
    yard.dispose();
  }
});

test("simplified classics retain old claimed powers and partial checkpoint identities", () => {
  for (const index of [0, 1]) {
    const yard = new PowerYard(index);
    assert.equal(yard.gadgets.length, 0);
    assert.equal(yard.pickups.length, 0);
    yard.throwToy({ x: 18, y: -5 });
    step(yard, 2);
    const checkpoint = yard.checkpoint();
    checkpoint.gadgets = {
      claimed: ["bounce", "magnet"],
      clearPaid: true,
      reward: "wind",
      gateOpen: true,
      polarity: 1,
    };
    const restored = new PowerYard(index, checkpoint);
    assert.deepEqual([...restored.claimed], ["bounce", "magnet"]);
    assert.equal(restored.clearPaid, true);
    assert.equal(restored.gateOpen, true);
    assert.equal(restored.polarity, 1);
    assert.deepEqual(restored.rescued, yard.rescued);
    assert.deepEqual(
      restored.pieces.map((b) => b.game.id),
      yard.pieces.map((b) => b.game.id),
    );
    yard.dispose();
    restored.dispose();
  }
});
test("preview furniture grants once and bowl filling persists without spending currency", () => {
  const values = new Map<string, string>();
  const store: StoragePort = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
  };
  const first = new ProfileRepository(store);
  const bowl = first.state.items.find((i) => i.definitionId === "pet-bowl")!;
  assert.equal(first.fillBowl(bowl.id), false);
  bowl.placement = { x: 3, z: 3, rotation: 0 };
  assert.equal(first.fillBowl(bowl.id), true);
  assert.equal(first.state.currency, 0);
  for (let n = 0; n < 3; n++) {
    const next = new ProfileRepository(store);
    assert.equal(next.state.items.filter((i) => i.id === bowl.id).length, 1);
    assert.equal(next.state.items.find((i) => i.id === bowl.id)!.filled, true);
    assert.equal(next.state.currency, 0);
  }
});
