import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { ContentCompiler } from "../src/content";
import { WaterSimulation } from "../src/physics";
import type { LevelDocument } from "../src/content-types";

async function main(): Promise<void> {
  const require = createRequire(import.meta.url);
  const factory: any = (await import("liquidfun-wasm/dist/umd/Box2D.js"))
    .default;
  const B = await factory({
    wasmBinary: fs.readFileSync(
      require.resolve("liquidfun-wasm/dist/umd/Box2D.wasm"),
    ),
  });
  const doc: LevelDocument = ContentCompiler.createLevel(
    "physics-fixture",
    "Physics fixture",
  );
  doc.requiredPercent = 37;
  doc.reservoirs = [
    { id: "a", x: 1.2, y: 1.2, w: 3, h: 3, fillPercent: 100, outlet: "left" },
    { id: "b", x: 7.2, y: 1.2, w: 3, h: 3, fillPercent: 55, outlet: "bottom" },
  ];
  doc.canteens = [];
  doc.pipes = [{ id: "barrier", x: 4.8, y: 6, kind: "cross", rotation: 0 }];
  doc.rocks = [];
  const config = ContentCompiler.compile(doc);
  const sim = new WaterSimulation(B, config);
  const initial = sim.initialCount;
  assert(initial > 100);
  assert.equal(sim.required, Math.ceil(initial * 0.37));
  for (let i = 0; i < 180; i++) sim.step();
  assert.equal(sim.collected, 0);
  assert.equal(sim.initialCount, sim.water.GetParticleCount());
  let outside = 0;
  for (let i = 0; i < sim.positions().length; i += 2) {
    const x = sim.positions()[i],
      y = sim.positions()[i + 1];
    if (
      !doc.reservoirs.some(
        (t) =>
          x >= t.x - 0.08 &&
          x <= t.x + t.w + 0.08 &&
          y >= t.y - 0.08 &&
          y <= t.y + t.h + 0.08,
      )
    )
      outside++;
  }
  assert.equal(
    outside,
    0,
    "uncarved outlets must retain water inside both tanks",
  );
  sim.digLine(0.35, 2.7, 1.5, 2.7, 0.55);
  sim.digLine(0.35, 2.7, 0.35, 6, 0.55);
  sim.digLine(8.7, 4, 8.7, 7, 0.55);
  for (let i = 0; i < 240; i++) sim.step();
  assert(
    Array.from(sim.positions()).some((v, i) => i % 2 === 1 && v > 4.5),
    "digging centered side/bottom outlets releases water",
  );
  assert.equal(
    sim.required,
    Math.ceil(initial * 0.37),
    "quota must not shrink during flow",
  );
  for (const rect of config.pipeRects ?? []) {
    assert(sim.solidAt(rect.x + rect.w / 2, rect.y + rect.h / 2));
    sim.digLine(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h, 1);
    assert(
      sim.solidAt(rect.x + rect.w / 2, rect.y + rect.h / 2),
      "pipe cannot be dug",
    );
  }
  for (let i = 0; i < 4; i++) {
    sim.reset();
    assert.equal(sim.initialCount, initial);
    assert.equal(sim.collected, 0);
  }
  sim.dispose();
  const empty = structuredClone(doc);
  empty.reservoirs[0].fillPercent = 0;
  const emptySim = new WaterSimulation(B, ContentCompiler.compile(empty));
  assert(emptySim.initialCount < initial);
  assert(emptySim.initialCount > 0);
  emptySim.dispose();
  console.log(
    "PASS: multiple finite reservoirs, centered release, fixed percentage quota, solid pipe barriers and reset safety",
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
