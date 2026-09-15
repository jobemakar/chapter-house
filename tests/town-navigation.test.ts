import { test } from "node:test";
import assert from "node:assert/strict";
import { TownNavigation } from "../src/town/navigation";
import { TOWN } from "../src/town/layout";

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
