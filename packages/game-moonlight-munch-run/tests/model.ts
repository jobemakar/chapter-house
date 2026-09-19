import assert from "node:assert/strict";
import test from "node:test";
import { RunModel, SaveStore } from "../src/model";

test("canonical shooter retains upgrades, special serve, boss recovery, and road-hazard firing jam", () => {
  const model = new RunModel(7, SaveStore.sanitize({ phase: "boss", bossHp: 19 }));
  model.collect("spread"); model.collect("spread"); model.collect("rapid");
  assert.equal(model.weaponLevels.spread, 2); assert.equal(model.rapidLevel, 1);
  assert.equal(model.burst(), true); assert.equal(model.shots.length, 11);
  model.supplies = 7;
  model.creatures.push({ id: 900, x: -.07, y: .52, kind: 0, fed: false, age: 0, departure: 0, bumped: false, hp: 1, maxHp: 1, boss: false, baseY: .52, pattern: 0, vy: 0 });
  model.tick(.05); assert.equal(model.phase, "restock");
  model.restock(); assert.equal(model.phase, "boss"); assert.equal(model.bossHp, 19);
  model.hazards = [{ id: 1, x: model.truckX, y: model.truckY, kind: 0, age: 1, contact: false }];
  model.tick(.05); assert.ok(model.fireLock > 0); assert.equal(model.burst(), false);
});
