import { test } from "node:test";
import assert from "node:assert/strict";
import { TownNavigation } from "../src/town/navigation";
import { TOWN } from "../src/town/layout";
test("town routes around the full fountain and trees, never through stream or buildings", () => {
  const nav = new TownNavigation();
  for (const p of [
    { x: 15, z: 10 },
    { x: 15, z: 21 },
    ...TOWN.trees,
    ...TOWN.buildings,
  ])
    assert.equal(nav.walkable(p), false);
  for (const [start, end] of [
    [TOWN.entry, { x: 15, z: 6 }],
    [
      { x: 12, z: 10 },
      { x: 18, z: 10 },
    ],
    [TOWN.entry, { x: 4, z: 10 }],
    [TOWN.entry, { x: 26, z: 10 }],
    [TOWN.entry, { x: 17.31, z: 10 }],
    [TOWN.entry, { x: 7, z: 8.6 }],
    [TOWN.entry, { x: 24, z: 7.7 }],
    [TOWN.entry, { x: 25, z: 16.5 }],
  ]) {
    const path = nav.path(start, end);
    assert.ok(path.length > 0);
    let previous = start;
    for (const p of path) {
      for (let i = 0; i <= 10; i++)
        assert.ok(
          nav.walkable({
            x: previous.x + ((p.x - previous.x) * i) / 10,
            z: previous.z + ((p.z - previous.z) * i) / 10,
          }),
        );
      previous = p;
    }
    assert.deepEqual(path.at(-1), end);
  }
  assert.deepEqual(nav.path(TOWN.entry, { x: 15, z: 22 }), []);
});
