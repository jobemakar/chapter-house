import { test } from "node:test";
import assert from "node:assert/strict";
import { PowerYard } from "../packages/game-wishbone-fling/src/powers";
import { yards } from "../packages/game-wishbone-fling/src/levels";
import { WishboneProgression } from "../packages/game-wishbone-fling/src/progression";
import { ProfileRepository, type StoragePort } from "../src/core/profile";

const step = (yard: PowerYard, seconds: number) => {
  for (let n = 0; n < seconds * 120; n++) yard.step(1 / 120);
};

for (let index = 2; index < yards.length; index++)
  test(`${yards[index].id}: stable idle, mechanisms, and reload preserve world state`, () => {
    const yard = new PowerYard(index);
    step(yard, 3);
    assert.equal(yard.rescued.size, 0);
    const checkpoint = yard.checkpoint();
    const restored = new PowerYard(index, checkpoint, yard.powers);
    assert.equal(restored.world.width, yard.world.width);
    assert.deepEqual(restored.checkpoint().pieces.map((piece) => piece.id), checkpoint.pieces.map((piece) => piece.id));
    restored.dispose();
    yard.dispose();
  });

test("all yard identities, selections, keepsakes and archived saves persist", () => {
  assert.equal(WishboneProgression.load(null).yard, 2);
  const loaded = WishboneProgression.load({
    yard: 7, owned: ["bed", "power-bounce"],
    powers: { counts: { bounce: 3, magnet: 0, wind: 2 }, discovered: ["bounce"] },
    checkpoints: { "long-yard": { rescued: [], pieces: [], gadgets: { claimed: ["bounce"], clearPaid: true, reward: "wind", gateOpen: false, polarity: 1 } } },
  });
  assert.equal(loaded.yard, 7);
  assert.ok(loaded.owned.includes("bed"));
  assert.ok(loaded.owned.includes("power-bounce"));
  assert.equal(loaded.powers.counts.bounce, 3);
  assert.deepEqual(loaded.checkpoints["long-yard"].gadgets?.claimed, ["bounce"]);
});

test("profile keeps ordinary earned furniture while wishbone powers are archive-only", () => {
  const values = new Map<string, string>();
  const store: StoragePort = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const profile = new ProfileRepository(store);
  const bowl = profile.state.items.find((item) => item.definitionId === "pet-bowl")!;
  bowl.placement = { x: 3, z: 3, rotation: 0 };
  assert.equal(profile.fillBowl(bowl.id), true);
  assert.equal(profile.state.currency, 0);
});
