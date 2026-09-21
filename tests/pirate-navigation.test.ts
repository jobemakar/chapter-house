import assert from "node:assert/strict";
import test from "node:test";
import {
  PIRATE_AREA_SCALE,
  pirateLandContains,
  PIRATE_COAST,
  PIRATE_ISLAND,
  pirateExpandedPoint,
} from "../src/town/pirate-layout";
import { PirateNavigation } from "../src/town/pirate-navigation";

test("Pirate Island keeps sea and landmark footprints out of exploration routes", () => {
  const nav = new PirateNavigation();
  assert.equal(nav.walkable(PIRATE_ISLAND.entry), true);
  assert.equal(nav.walkable({ x: 0.5, z: 12 }), false, "sea is not walkable");
  assert.ok(Math.abs(PIRATE_AREA_SCALE ** 2 - 2) < 1e-12);
  for (const point of PIRATE_COAST)
    assert.equal(nav.walkable(point), false, "the waterline is not walkable");
  for (const ship of PIRATE_ISLAND.ships) {
    assert.equal(
      pirateLandContains(ship),
      false,
      "floating ships belong beyond the coast",
    );
    assert.equal(nav.walkable(ship), false);
  }
  for (const obstacle of PIRATE_ISLAND.obstacles)
    assert.equal(nav.walkable(obstacle), false);
  const route = nav.path(PIRATE_ISLAND.entry, pirateExpandedPoint(18.5, 13.5));
  assert.ok(route.length > 0);
  route.forEach((point) => assert.equal(nav.walkable(point), true));
});

test("a pirate companion gets a walkable shoulder instead of the captain's feet", () => {
  const nav = new PirateNavigation();
  const captain = pirateExpandedPoint(18, 18);
  const companion = nav.companionTarget(captain, 0);
  assert.equal(nav.walkable(companion), true);
  assert.ok(
    Math.hypot(companion.x - captain.x, companion.z - captain.z) >= 0.9,
  );
});
