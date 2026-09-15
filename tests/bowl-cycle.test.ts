import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PROFILE_KEY,
  ProfileRepository,
  type StoragePort,
} from "../src/core/profile";
import { ClubhouseRoom } from "../src/room/room";

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("a placed bowl saves fill, only empties once, and never changes coins", () => {
  const storage = new MemoryStorage();
  const profile = new ProfileRepository(storage);
  const bowl = profile.state.items.find((item) => item.definitionId === "pet-bowl")!;
  bowl.placement = { x: 3, z: 3, rotation: 0 };

  assert.equal(profile.emptyBowl(bowl.id), false);
  assert.equal(profile.fillBowl(bowl.id), true);
  assert.equal(bowl.filled, true);
  assert.equal(profile.state.currency, 0);
  assert.equal(profile.emptyBowl(bowl.id), true);
  assert.equal(profile.emptyBowl(bowl.id), false);
  assert.equal(profile.state.currency, 0);

  const restored = new ProfileRepository(storage);
  assert.equal(restored.state.items.find((item) => item.id === bowl.id)!.filled, false);
  assert.equal(restored.state.currency, 0);
  assert.ok(storage.getItem(PROFILE_KEY));
});

test("unplaced and non-bowl items cannot begin or finish a bowl cycle", () => {
  const profile = new ProfileRepository(new MemoryStorage());
  const bowl = profile.state.items.find((item) => item.definitionId === "pet-bowl")!;
  const shelf = profile.state.items.find((item) => item.definitionId === "library-shelf")!;
  assert.equal(profile.fillBowl(bowl.id), false);
  assert.equal(profile.emptyBowl(bowl.id), false);
  assert.equal(profile.fillBowl(shelf.id), false);
  assert.equal(profile.emptyBowl(shelf.id), false);
});

type RoomHarness = {
  profile: ProfileRepository;
  pets: any[];
  furnishings: Map<string, { setFilled(value: boolean): void }>;
  petPlay: any;
  notices: string[];
  start(id: string): void;
  animate(seconds: number): void;
  cancel(): void;
};

/** Exercises room action state directly; Three/WebGL construction is unnecessary here. */
function roomHarness(path: (start: any, end: any) => any[]): RoomHarness {
  const profile = new ProfileRepository(new MemoryStorage());
  const room = Object.create(ClubhouseRoom.prototype) as any;
  const notices: string[] = [];
  room.profile = profile;
  room.pets = [];
  room.furnishings = new Map();
  room.petPlay = null;
  room.notify = (text: string) => notices.push(text);
  Object.defineProperty(room, "nav", {
    value: { walkable: () => true, path },
  });
  return {
    profile,
    pets: room.pets,
    furnishings: room.furnishings,
    get petPlay() {
      return room.petPlay;
    },
    notices,
    start: (id) => room.startPetPlay(id, "bowl"),
    animate: (seconds) => room.animatePetPlay(seconds),
    cancel: () => room.cancelPetPlay(),
  };
}

function bowlRoom(path: (start: any, end: any) => any[]) {
  const h = roomHarness(path);
  const bowl = h.profile.state.items.find((item) => item.definitionId === "pet-bowl")!;
  bowl.placement = { x: 3, z: 3, rotation: 0 };
  h.profile.fillBowl(bowl.id);
  let visible = true;
  h.furnishings.set(bowl.id, { setFilled: (value) => (visible = value) });
  const root = {
    position: {
      x: 3.68,
      y: 0,
      z: 3,
      set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
      },
    },
    rotation: { y: 0.7 },
  };
  h.pets.push({
    id: "cat",
    point: { x: 3.68, z: 3 },
    path: [],
    wait: 0,
    following: false,
    rig: { root },
  });
  return { h, bowl, root, visible: () => visible };
}

test("a pet already at the bowl edge nibbles, faces food, then clears it", () => {
  const { h, bowl, root, visible } = bowlRoom(() => []);
  h.start(bowl.id);
  assert.ok(h.petPlay, "an already-arrived pet still begins feeding");
  h.animate(0.3);
  assert.match(h.notices.join(" "), /nom nom/i);
  assert.notEqual(root.rotation.y, 0.7, "the pet turns toward the bowl");
  assert.ok(root.position.y > 0, "the nibble visibly dips the pet");
  h.animate(1.7);
  assert.equal(h.petPlay, null);
  assert.equal(bowl.filled, false);
  assert.equal(visible(), false);
  assert.equal(root.position.y, 0, "completion restores the normal root height");
  assert.equal(root.rotation.y, 0.7, "completion restores the route facing");
});

test("cancelled, petless, and unreachable feed attempts preserve food", () => {
  const cancelled = bowlRoom(() => [{ x: 3.68, z: 3 }]);
  cancelled.h.start(cancelled.bowl.id);
  cancelled.h.animate(0.3);
  cancelled.h.cancel();
  assert.equal(cancelled.bowl.filled, true);
  assert.equal(cancelled.root.position.y, 0);
  assert.equal(cancelled.root.rotation.y, 0.7);

  const petless = bowlRoom(() => [{ x: 3.68, z: 3 }]);
  petless.h.pets.length = 0;
  petless.h.start(petless.bowl.id);
  assert.equal(petless.h.petPlay, null);
  assert.equal(petless.bowl.filled, true);

  const unreachable = bowlRoom(() => []);
  unreachable.h.pets[0].point = { x: 0, z: 0 };
  unreachable.h.start(unreachable.bowl.id);
  assert.equal(unreachable.h.petPlay, null);
  assert.equal(unreachable.bowl.filled, true);
});
