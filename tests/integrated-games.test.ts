import { test } from "node:test";
import assert from "node:assert/strict";
import { IntegratedGames } from "../src/core/integrated-games";
import { getFurniture } from "../src/core/catalog";
import { ProfileRepository, type StoragePort } from "../src/core/profile";

class MemoryStore implements StoragePort {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

test("integrated games have stable unique ids and distinct book entries", () => {
  assert.equal(IntegratedGames.entries.length, 10);
  assert.equal(
    new Set(IntegratedGames.entries.map((game) => game.id)).size,
    IntegratedGames.entries.length,
  );
  assert.equal(
    IntegratedGames.get("dig-and-douse")?.definition.book,
    "Wildfire",
  );
  assert.equal(IntegratedGames.get("missing"), undefined);
  assert.equal(
    IntegratedGames.get("vedas-great-escape")?.definition.book,
    "The Elephant in the Room",
  );
});

test("every integrated reward is allowlisted, catalogued, and idempotent", () => {
  const rewardIds = new Set<string>();
  for (const adapter of IntegratedGames.adapters) {
    const initial = adapter.normalize(null);
    for (const reward of adapter.definition.rewards) {
      assert.ok(!rewardIds.has(reward.rewardId), reward.rewardId);
      rewardIds.add(reward.rewardId);
      assert.ok(getFurniture(reward.catalogId), reward.catalogId);
      const alreadyOwned = adapter.ownedRewardIds(initial).includes(reward.rewardId);
      const awarded = adapter.addReward(initial, reward.rewardId);
      assert.equal(awarded === null, alreadyOwned, reward.rewardId);
      const resulting = awarded ?? initial;
      assert.ok(adapter.ownedRewardIds(resulting).includes(reward.rewardId));
      assert.equal(adapter.addReward(resulting, reward.rewardId), null);
    }
    assert.equal(adapter.addReward(initial, `${adapter.definition.id}:unknown`), null);
  }
  assert.equal(rewardIds.size, 56);
});

test("all 56 integrated rewards synchronize to placeable room inventory", () => {
  const profile = new ProfileRepository(new MemoryStore());
  const expectedCatalogIds = new Set<string>();

  for (const adapter of IntegratedGames.adapters) {
    for (const reward of adapter.definition.rewards) {
      expectedCatalogIds.add(reward.catalogId);
      profile.awardGameReward(adapter.definition.id, reward.rewardId);
    }
  }

  assert.equal(expectedCatalogIds.size, 56);
  for (const catalogId of expectedCatalogIds) {
    const definition = getFurniture(catalogId);
    assert.ok(definition, catalogId);
    assert.ok(definition.width > 0 && definition.depth > 0, catalogId);
    const owned = profile.state.items.filter(
      (item) => item.definitionId === catalogId,
    );
    assert.equal(owned.length, 1, catalogId);
    assert.equal(owned[0]?.placement, null, catalogId);
  }
});
