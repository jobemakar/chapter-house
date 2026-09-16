import { test } from "node:test";
import assert from "node:assert/strict";
import { TownNavigation } from "../src/town/navigation";
import { TOWN } from "../src/town/layout";
import { TownStream } from "../src/town/stream";

const assertRoute = (
  nav: TownNavigation,
  start: { x: number; z: number },
  end: { x: number; z: number },
) => {
  const path = nav.path(start, end);
  assert.ok(path.length > 0, `expected a route to ${end.x},${end.z}`);
  let previous = start;
  for (const point of path) {
    for (let i = 0; i <= 12; i++)
      assert.ok(
        nav.walkable({
          x: previous.x + ((point.x - previous.x) * i) / 12,
          z: previous.z + ((point.z - previous.z) * i) / 12,
        }),
      );
    previous = point;
  }
  assert.deepEqual(path.at(-1), end);
  return path;
};

test("expanded town routes around scenery and crosses the stream only on the bridge", () => {
  const nav = new TownNavigation();
  for (const point of [
    TOWN.fountain,
    { x: 10, z: 24 },
    { x: 51, z: 24 },
    ...TOWN.trees,
    ...TOWN.buildings,
  ])
    assert.equal(nav.walkable(point), false);

  for (const [start, end] of [
    [TOWN.entry, { x: 30, z: 38.2 }],
    [TOWN.entry, { x: 20, z: 36.5 }],
    [TOWN.entry, { x: 39, z: 35 }],
    [TOWN.entry, { x: 40, z: 43 }],
    [
      { x: 26, z: 35 },
      { x: 34, z: 35 },
    ],
  ] as const)
    assertRoute(nav, start, end);

  const crossing = assertRoute(nav, TOWN.entry, { x: 30, z: 16 });
  const inStream = crossing.filter(
    (point) => point.z > TOWN.stream.minZ && point.z < TOWN.stream.maxZ,
  );
  assert.ok(inStream.length > 0);
  assert.ok(
    inStream.every(
      (point) =>
        Math.abs(point.x - TOWN.bridge.x) <= TOWN.bridge.width / 2 - 0.3,
    ),
  );
  assert.deepEqual(nav.path(TOWN.entry, { x: 10, z: 24 }), []);
});

test("a companion settles at a walkable shoulder instead of the avatar position", () => {
  const nav = new TownNavigation();
  const avatar = { x: 30, z: 40 };
  for (const facing of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const target = nav.companionTarget(avatar, facing);
    assert.equal(nav.walkable(target), true);
    assert.ok(Math.hypot(target.x - avatar.x, target.z - avatar.z) >= 0.95);
  }
});

test("the fountain action has a bounded interaction radius", () => {
  const nav = new TownNavigation();
  assert.equal(nav.nearFountain(TOWN.entry), false);
  assert.equal(
    nav.nearFountain({
      x: TOWN.fountain.x,
      z: TOWN.fountain.z + TOWN.fountain.interactionRadius,
    }),
    true,
  );
  assert.equal(
    nav.nearFountain({
      x: TOWN.fountain.x,
      z: TOWN.fountain.z + TOWN.fountain.interactionRadius + 0.01,
    }),
    false,
  );
});

test("fishing targets exist only at clear stream banks and never on the bridge", () => {
  const nav = new TownNavigation();
  assert.deepEqual(nav.streamTarget({ x: 10, z: 27 }), {
    x: 10,
    z: 25.35,
  });
  assert.deepEqual(nav.streamTarget({ x: 48, z: 21 }), {
    x: 48,
    z: TownStream.bounds(48).minZ + 0.65,
  });
  assert.equal(nav.streamTarget({ x: 10, z: 30 }), null);
  assert.equal(nav.streamTarget({ x: 30, z: 27 }), null);
  assert.equal(nav.streamTarget({ x: 10, z: 24 }), null);
});

test("curved stream banks agree with collision and fishing along both shores", () => {
  const nav = new TownNavigation();
  for (const x of [3, 7, 12, 18, 23, 38, 44, 48, 55]) {
    const bank = TownStream.bounds(x);
    assert.equal(nav.walkable({ x, z: (bank.minZ + bank.maxZ) / 2 }), false);
    for (const side of [-1, 1] as const) {
      const edge = TownStream.bank(x, side);
      const position = { x, z: edge + side * 0.8 };
      const target = nav.streamTarget(position);
      if (!nav.walkable(position)) {
        assert.equal(target, null);
        continue;
      }
      assert.ok(target, `clear bank at ${x}/${side}`);
      assert.ok(TownStream.contains(target));
    }
  }
  assert.equal(nav.walkable(TOWN.windmill), false);
  assert.equal(nav.walkable(TOWN.gardenFountain), false);
  assert.equal(TownStream.bounds(TOWN.bridge.x).minZ, TOWN.stream.minZ);
});
