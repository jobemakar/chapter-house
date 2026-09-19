import assert from "node:assert/strict";
import test from "node:test";
import { ActivePlayMeter } from "../src/activity";

test("only an interaction and its bounded consequence window earn active credit", () => {
  const meter = new ActivePlayMeter(12); assert.equal(meter.step(1, false), 12);
  meter.interact(); assert.equal(meter.step(1, false), 12.05); assert.equal(meter.step(1, true), 12.05);
  meter.suspend(); meter.interact(1); for (let i = 0; i < 30; i++) meter.step(.05, false);
  assert.ok(Math.abs(meter.value - 13.05) < 1e-9); meter.suspend(); assert.ok(Math.abs(meter.step(.05, false) - 13.05) < 1e-9);
});
