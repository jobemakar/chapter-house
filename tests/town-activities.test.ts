import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FINDS,
  FISH,
  TownActivities,
  selectWeighted,
} from "../src/town/activities";

const randomSequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
};

test("the activity catalogs keep stable distinct ids across rarity tiers", () => {
  assert.equal(FISH.length, 6);
  assert.equal(FINDS.length, 8);
  for (const catalog of [FISH, FINDS]) {
    assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
    assert.deepEqual(
      new Set(catalog.map((item) => item.rarity)),
      new Set(["common", "uncommon", "rare"]),
    );
    assert.equal(
      catalog.every((item) => item.image?.startsWith("collections/")),
      true,
    );
  }
});

test("weighted selection is deterministic and makes rare definitions reachable", () => {
  assert.equal(selectWeighted(FISH, () => 0).id, "brook-trout");
  assert.equal(selectWeighted(FISH, () => 0.999999).id, "mossback-sturgeon");
  assert.equal(selectWeighted(FINDS, () => 0.999999).id, "star-map-shard");
});

test("digging resolves a 60 percent discovery chance and returns to idle", () => {
  const activities = new TownActivities({
    random: randomSequence(0.59, 0),
    timings: { digging: 0.1, result: 0.1 },
  });
  assert.equal(activities.dig(), true);
  assert.equal(activities.view.canFish, false);
  const outcome = activities.update(0.1);
  assert.equal(outcome?.action, "dig");
  assert.equal(outcome?.success, true);
  assert.equal(outcome?.discovery?.id, "little-fossil");
  assert.equal(activities.state, "result");
  assert.equal(activities.update(0.1), null);
  assert.equal(activities.state, "idle");

  const empty = new TownActivities({
    random: () => 0.6,
    timings: { digging: 0 },
  });
  empty.dig();
  assert.equal(empty.update(0.01)?.success, false);
});

test("fishing does not decide a catch before the non-expiring Reel state", () => {
  const activities = new TownActivities({
    random: randomSequence(0, 0.29, 0),
    timings: { casting: 0.1, waitMin: 0.1, waitMax: 0.1, reeling: 0.1 },
  });
  assert.equal(activities.cast(), true);
  assert.equal(activities.update(0.1), null);
  assert.equal(activities.state, "waiting");
  assert.equal(activities.update(0.1), null);
  assert.equal(activities.state, "reelReady");
  assert.equal(activities.view.remaining, null);
  assert.equal(activities.update(999), null);
  assert.equal(activities.state, "reelReady");
  assert.equal(activities.reel(), true);
  const outcome = activities.update(0.1);
  assert.equal(outcome?.success, true);
  assert.equal(outcome?.discovery?.id, "brook-trout");
});

test("the fishing threshold is thirty percent and invalid action transitions are ignored", () => {
  const activities = new TownActivities({
    random: randomSequence(0, 0.3),
    timings: { casting: 0, waitMin: 0, waitMax: 0, reeling: 0 },
  });
  assert.equal(activities.reel(), false);
  assert.equal(activities.cast(), true);
  assert.equal(activities.dig(), false);
  activities.update(0.01);
  activities.update(0.01);
  assert.equal(activities.state, "reelReady");
  activities.reel();
  assert.equal(activities.update(0.01)?.success, false);
});
