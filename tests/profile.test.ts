import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ProfileRepository,
  PROFILE_KEY,
  ActivityClock,
  type StoragePort,
  type OwnedItem,
} from "../src/core/profile";
import {
  loadWishboneProgress,
  WishboneProgression,
} from "@chapter-house/game-wishbone-fling/progress";
import { loadDigAndDouseProgress } from "@chapter-house/game-dig-and-douse/progress";
import { RoomNavigation, ROOM } from "../src/room/navigation";
import { AVATAR_COLOR_CATALOG } from "../src/core/avatar-colors";
import { pets } from "../src/core/catalog";
class MemoryStore implements StoragePort {
  values = new Map<string, string>();
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
}
test("fourteen throws unlock one placeable bed, retained across restarts without duplicate grants", () => {
  const store = new MemoryStore();
  let p = new ProfileRepository(store);
  let wishbone = loadWishboneProgress(p.gameProgress("wishbone-fling"));
  for (let i = 1; i <= 14; i++) {
    wishbone.throws = i;
    WishboneProgression.award(wishbone);
    p.saveGameProgress("wishbone-fling", wishbone);
  }
  assert.ok(wishbone.owned.includes("bed"));
  const bed = p.state.items.find((i) => i.definitionId === "wish-bed")!;
  assert.ok(bed);
  bed.placement = { x: 2, z: 5, rotation: 1 };
  p.save();
  p = new ProfileRepository(store);
  p.syncKeepsakes();
  p.syncKeepsakes();
  assert.equal(
    p.state.items.filter((i) => i.definitionId === "wish-bed").length,
    1,
  );
  assert.deepEqual(
    p.state.items.find((i) => i.definitionId === "wish-bed")!.placement,
    { x: 2, z: 5, rotation: 1 },
  );
});
test("Dig & Douse progress migrates additively and awards one placeable camp lantern", () => {
  const store = new MemoryStore();
  let profile = new ProfileRepository(store);
  assert.deepEqual(profile.gameProgress("dig-and-douse"), {
    version: 2,
    firesExtinguished: 0,
    bestCanteens: 0,
    totalCanteens: 0,
    ownedRewardIds: [],
    completedLevelIds: [],
    unlockedLevelIds: [],
  });
  assert.equal(
    profile.awardGameReward("dig-and-douse", "wildfire:camp-lantern"),
    true,
  );
  assert.equal(
    profile.awardGameReward("dig-and-douse", "wildfire:camp-lantern"),
    false,
  );
  assert.equal(
    profile.state.items.filter(
      (item) => item.definitionId === "wildfire-camp-lantern",
    ).length,
    1,
  );
  const douse = loadDigAndDouseProgress(profile.gameProgress("dig-and-douse"));
  douse.firesExtinguished = 2;
  douse.bestCanteens = 3;
  douse.totalCanteens = 5;
  profile.saveGameProgress("dig-and-douse", douse);
  profile = new ProfileRepository(store);
  const restored = loadDigAndDouseProgress(
    profile.gameProgress("dig-and-douse"),
  );
  assert.equal(restored.firesExtinguished, 2);
  assert.equal(restored.bestCanteens, 3);
  assert.equal(restored.totalCanteens, 5);
  assert.equal(
    profile.state.items.filter(
      (item) => item.definitionId === "wildfire-camp-lantern",
    ).length,
    1,
  );
});
test("legacy Fling progress imports once while all original saves remain untouched", () => {
  const store = new MemoryStore();
  const legacy = JSON.stringify({
    version: 2,
    throws: 16,
    rescued: ["teeter:1"],
    owned: ["sock", "bed", "power-magnet"],
    powers: { counts: { bounce: 3 }, discovered: ["bounce"] },
  });
  store.setItem("wishbone-floppy-fetch-v1", legacy);
  store.setItem("wishbones-big-fetch-v2", "untouched");
  const p = new ProfileRepository(store);
  const imported = loadWishboneProgress(p.gameProgress("wishbone-fling"));
  assert.equal(imported.throws, 16);
  assert.equal(imported.powers.counts.bounce, 3);
  assert.ok(imported.owned.includes("power-magnet"));
  assert.ok(!imported.owned.includes("power-bounce"));
  assert.equal(store.getItem("wishbone-floppy-fetch-v1"), legacy);
  assert.equal(store.getItem("wishbones-big-fetch-v2"), "untouched");
  imported.throws = 20;
  p.saveGameProgress("wishbone-fling", imported);
  assert.equal(
    loadWishboneProgress(
      new ProfileRepository(store).gameProgress("wishbone-fling"),
    ).throws,
    20,
  );
});
test("currency snapshots are idempotent and purchasing preserves duplicate furniture but unique pets", () => {
  const store = new MemoryStore();
  const p = new ProfileRepository(store);
  p.chooseStarter("cat");
  assert.equal(p.chooseStarter("bunny"), false);
  p.creditActivity(600);
  assert.equal(p.state.currency, 60);
  p.creditActivity(600);
  assert.equal(p.state.currency, 60);
  assert.equal(p.buyPet("bunny"), true);
  assert.equal(p.state.currency, 0);
  assert.equal(p.buyPet("bunny"), false);
  p.creditActivity(960);
  assert.ok(p.buyFurniture("cozy-chair"));
  assert.ok(p.buyFurniture("cozy-chair"));
  assert.equal(
    p.state.items.filter((i) => i.definitionId === "cozy-chair").length,
    3,
  );
  assert.equal(p.buyFurniture("wish-bed"), false);
  const loaded = new ProfileRepository(store);
  loaded.creditActivity(960);
  assert.equal(loaded.state.currency, 0);
  assert.deepEqual(loaded.state.pets, ["cat", "bunny"]);
});
test("the official Cube Pet store roster has 23 uniform-price kinds and keeps original IDs stable", () => {
  assert.equal(pets.length, 23);
  assert.equal(new Set(pets.map((pet) => pet.id)).size, 23);
  assert.deepEqual(
    pets.filter((pet) => pet.starter).map((pet) => pet.id),
    ["bunny", "cat"],
  );
  assert.ok(pets.every((pet) => pet.price === 60));
  assert.ok(!pets.some((pet) => pet.id === "tiger"));
  assert.equal(new Set(pets.map((pet) => pet.name)).size, pets.length);
  assert.ok(
    pets.every((pet) => /^\p{L}[\p{L}’'-]* the [a-z][a-z -]*$/u.test(pet.name)),
    "every ordinary pet should have an individual 'Name the species' label",
  );
  for (const [id, name] of [
    ["cat", "Clover"],
    ["bunny", "Pip"],
    ["fox", "Fig"],
  ])
    assert.ok(pets.some((pet) => pet.id === id && pet.name.includes(name)));

  const profile = new ProfileRepository(new MemoryStore());
  assert.ok(profile.chooseStarter("cat"));
  profile.creditActivity(100_000);
  for (const pet of pets.filter((pet) => pet.id !== "cat"))
    assert.ok(profile.buyPet(pet.id), pet.id);
  assert.equal(profile.state.pets.length, 23);
  for (const pet of pets) assert.equal(profile.buyPet(pet.id), false, pet.id);
});
test("idle, paused, and hidden time do not generate currency or catch up after resume", () => {
  const clock = new ActivityClock();
  for (let i = 0; i < 100; i++) clock.step(0.1, false, false);
  assert.equal(clock.total, 0);
  clock.interact();
  for (let i = 0; i < 200; i++) clock.step(0.1, false, false);
  assert.ok(clock.total > 4.8 && clock.total <= 5.1);
  const before = clock.total;
  clock.suspend();
  for (let i = 0; i < 100; i++) clock.step(0.1, true, true);
  clock.step(3600, false, false);
  assert.equal(clock.total, before);
  clock.interact();
  for (let i = 0; i < 100; i++) clock.step(0.1, false, true);
  assert.ok(clock.total - before <= 8.1);
});
test("malformed or unavailable saves preserve a playable in-memory profile", () => {
  const store = new MemoryStore();
  store.setItem(PROFILE_KEY, "{oops");
  const p = new ProfileRepository(store);
  assert.ok(p.state.name.includes("-"));
  assert.equal(p.state.currency, 0);
  const unavailable = new ProfileRepository({
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  });
  assert.equal(unavailable.saved, false);
  assert.ok(unavailable.chooseStarter("cat"));
  assert.ok(unavailable.state.pets.includes("cat"));
});
test("avatar color catalog is unique and every color survives save/reload", () => {
  const values = AVATAR_COLOR_CATALOG.map((color) => color.value);
  const names = AVATAR_COLOR_CATALOG.map((color) => color.name);
  assert.equal(values.length, 10);
  assert.equal(new Set(values).size, values.length);
  assert.equal(new Set(names).size, names.length);
  for (const color of values) {
    const store = new MemoryStore();
    const profile = new ProfileRepository(store);
    profile.state.avatar.color = color;
    profile.save();
    assert.equal(new ProfileRepository(store).state.avatar.color, color);
  }
});
test("malformed avatar colors fall back to Autumn while old colors remain compatible", () => {
  const store = new MemoryStore();
  store.setItem(
    PROFILE_KEY,
    JSON.stringify({ version: 1, avatar: { color: "#not-a-color" } }),
  );
  assert.equal(new ProfileRepository(store).state.avatar.color, "#cc8957");
  for (const color of ["#cc8957", "#8e9eae", "#d3ad85", "#af96b3"] as const) {
    store.setItem(
      PROFILE_KEY,
      JSON.stringify({ version: 1, avatar: { color } }),
    );
    assert.equal(new ProfileRepository(store).state.avatar.color, color);
  }
});
test("routes avoid solid furniture and do not cut diagonal corners", () => {
  const p = new ProfileRepository(new MemoryStore());
  const nav = new RoomNavigation(p.state.items);
  const route = nav.path(ROOM.entry, { x: 2, z: 2 });
  assert.ok(route.length);
  assert.ok(route.every((point) => nav.walkable(point)));
  assert.equal(nav.path(ROOM.entry, { x: 6.4, z: 3.5 }).length, 0);
});
test("placement rejects bounds, overlap, occupied spots, and trapping the entrance", () => {
  const p = new ProfileRepository(new MemoryStore());
  const item = p.state.items.find((i) => i.id === "starter-chair")!;
  const nav = new RoomNavigation(p.state.items);
  assert.ok(nav.validate(item, { x: 0, z: 0, rotation: 0 }, [ROOM.entry]));
  assert.ok(nav.validate(item, { x: 6.4, z: 3.5, rotation: 0 }, [ROOM.entry]));
  assert.ok(nav.validate(item, { ...ROOM.entry, rotation: 0 }, [ROOM.entry]));
  assert.equal(
    nav.validate(item, { x: 2, z: 4, rotation: 0 }, [ROOM.entry]),
    null,
  );
  const gate: OwnedItem = {
    id: "gate",
    definitionId: "library-shelf",
    placement: null,
  };
  const corridor: OwnedItem[] = [
    {
      id: "a",
      definitionId: "reading-table",
      placement: { x: 3.3, z: 6.5, rotation: 1 },
    },
    {
      id: "b",
      definitionId: "reading-table",
      placement: { x: 6.7, z: 6.5, rotation: 1 },
    },
    gate,
  ];
  assert.ok(
    new RoomNavigation(corridor).validate(gate, { x: 5, z: 7.5, rotation: 0 }, [
      { x: 5, z: 6.5 },
    ]),
  );
});
test("replayed purchase requests cannot double-spend across reload", () => {
  const store = new MemoryStore();
  let p = new ProfileRepository(store);
  p.creditActivity(1200);
  assert.ok(p.buyFurniture("little-fern", "purchase-1"));
  const currency = p.state.currency;
  const size = p.state.items.length;
  p = new ProfileRepository(store);
  assert.equal(p.buyFurniture("little-fern", "purchase-1"), false);
  assert.equal(p.state.currency, currency);
  assert.equal(p.state.items.length, size);
  assert.ok(p.buyFurniture("little-fern", "purchase-2"));
  assert.equal(p.state.items.length, size + 1);
});

test("fish and finds stack additively and survive reload", () => {
  const store = new MemoryStore();
  let profile = new ProfileRepository(store);
  assert.deepEqual(profile.state.collection, { fish: {}, finds: {} });
  assert.equal(profile.addDiscovery("fish", "brook-trout"), 1);
  assert.equal(profile.addDiscovery("fish", "brook-trout"), 2);
  assert.equal(profile.addDiscovery("finds", "star-map-shard"), 1);
  assert.equal(profile.addDiscovery("fish", "not-in-the-catalog"), 0);
  profile = new ProfileRepository(store);
  assert.equal(profile.state.collection.fish["brook-trout"], 2);
  assert.equal(profile.state.collection.finds["star-map-shard"], 1);
});

test("old and malformed collection data migrate without affecting the profile", () => {
  const store = new MemoryStore();
  store.setItem(
    PROFILE_KEY,
    JSON.stringify({
      version: 1,
      name: "mossy-otter",
      currency: 7,
      collection: {
        fish: { "brook-trout": 3.8, unknown: 99 },
        finds: { "little-fossil": -2, "pocket-compass": 2 },
      },
    }),
  );
  const profile = new ProfileRepository(store);
  assert.equal(profile.state.name, "mossy-otter");
  assert.equal(profile.state.currency, 7);
  assert.deepEqual(profile.state.collection.fish, { "brook-trout": 3 });
  assert.deepEqual(profile.state.collection.finds, { "pocket-compass": 2 });
});
