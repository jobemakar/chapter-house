import assert from "node:assert/strict";
import { coverage, splat } from "../src/water-renderer";
const width = 80;
const height = 40;
const field = new Float32Array(width * height);
assert.equal(coverage(0), 0);
assert.equal(coverage(1), 1);
assert(
  coverage(0.55) > 0.4 && coverage(0.55) < 0.6,
  "threshold should have a smooth anti-aliased edge",
);
splat(field, width, height, 20, 20);
splat(field, width, height, 27, 20);
assert(
  coverage(field[20 * width + 24]) > 0.9,
  "nearby particles must form a continuous neck",
);
field.fill(0);
splat(field, width, height, 20, 20);
splat(field, width, height, 40, 20);
assert.equal(
  coverage(field[20 * width + 30]),
  0,
  "separated droplets must not acquire a fake bridge",
);
field.fill(0);
splat(field, width, height, -1, -1);
splat(field, width, height, width, height);
assert(
  Array.from(field).every(Number.isFinite),
  "edge splats must remain bounded",
);
console.log(
  "PASS: TypeScript water surface preserves smooth, bounded joined-fluid rendering",
);
