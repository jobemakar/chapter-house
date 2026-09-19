import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { getLevel } from "../src/levels";
import { COLS, WaterSimulation } from "../src/physics";

async function main(): Promise<void> {
  const require = createRequire(import.meta.url);
  const Box2D: any = (await import("liquidfun-wasm/dist/umd/Box2D.js")).default;
  const B = await Box2D({
    wasmBinary: fs.readFileSync(
      require.resolve("liquidfun-wasm/dist/umd/Box2D.wasm"),
    ),
  });
  const config = getLevel();
  const level = new WaterSimulation(B, config);
  const initial = level.initialCount;
  for (let index = 0; index < 300; index++) level.step();
  assert.equal(level.collected, 0);
  assert.equal(level.wasted, 0);
  assert.equal(level.water.GetParticleCount(), initial);
  assert(
    Math.max(...Array.from(level.positions()).filter((_, index) => index % 2)) <
      3.25,
    "intact reservoir floor must not leak before digging",
  );
  assert.equal(level.grid[40 * COLS], 1, "left edge must be sealed by terrain");
  assert.equal(
    level.grid[40 * COLS + 79],
    1,
    "right edge must be sealed by terrain",
  );
  config.hint
    .slice(1)
    .forEach((point, index) => level.digLine(...config.hint[index], ...point));
  for (let index = 0; index < 2400 && !level.won; index++) level.step();
  assert(level.won, "side-facing intake should extinguish fire");
  assert.deepEqual(
    level.canteens.map((canteen) => canteen.filled),
    [true, true, true],
  );
  assert.equal(level.wasted, 0);
  assert(level.canteens.every((canteen) => canteen.filledAt >= 0));
  assert.equal(
    level.solidAt(6.8, 13.15),
    true,
    "working pipe body must be solid",
  );
  assert.equal(
    level.solidAt(6.15, 13.15),
    false,
    "large pipe mouth must remain open",
  );
  for (let index = 0; index < 900; index++) level.step();
  const afterDrain = Array.from(level.positions());
  let pooled = 0;
  for (let index = 0; index < afterDrain.length / 2; index++)
    if (
      afterDrain[2 * index] > 4.5 &&
      afterDrain[2 * index] < 6.55 &&
      afterDrain[2 * index + 1] > 11.85
    )
      pooled++;
  assert(
    pooled < 20,
    `intake draw must drain the lower basin; found ${pooled} pooled particles`,
  );
  level.reset();
  const bodyRoute: [number, number][] = [
    [5.9, 3.15],
    [5.15, 4.65],
    [4.6, 7.35],
    [5.8, 8.6],
    [5.15, 10.65],
    [5.95, 11.8],
    [5.95, 12.35],
  ];
  bodyRoute
    .slice(1)
    .forEach((point, index) => level.digLine(...bodyRoute[index], ...point));
  for (let index = 0; index < 2400 && !level.won; index++) level.step();
  assert(level.won, "straight-down approach must land in visible mouth");
  level.reset();
  const dummyRoute: [number, number][] = [
    [5.9, 3.2],
    [5.2, 4.4],
    [5.2, 6.9],
    [8.9, 7.5],
    [10.1, 8.15],
  ];
  dummyRoute
    .slice(1)
    .forEach((point, index) => level.digLine(...dummyRoute[index], ...point));
  for (let index = 0; index < 1800; index++) level.step();
  assert.equal(level.wasted, 0);
  assert.equal(level.collected, 0);
  assert(!level.won);
  assert.equal(level.water.GetParticleCount(), initial);
  for (let reset = 0; reset < 10; reset++) {
    level.reset();
    assert.equal(level.collected, 0);
    assert.equal(level.dug, 0);
    assert.equal(level.won, false);
    assert.equal(level.water.GetParticleCount(), initial);
  }
  const rock = config.rocks[0];
  assert.equal(
    level.digLine(rock.x + 0.6, rock.y + 0.6, rock.x + 0.7, rock.y + 0.6, 0.2),
    0,
    "bedrock must not be diggable",
  );
  console.log(
    "PASS: TypeScript simulation preserves containment, routes, intake rules, canteens, bedrock, and reset safety",
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
