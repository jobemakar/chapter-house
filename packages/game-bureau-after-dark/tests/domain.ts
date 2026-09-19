import assert from "node:assert/strict";
import { LEVELS, Navigator } from "../src/domain";
assert.equal(LEVELS.length, 2);
assert.equal(new Navigator(LEVELS[0].walls).path({ x: 480, y: 610 }, LEVELS[0].spots[0]).length > 0, true);
assert.equal(new Navigator(LEVELS[1].walls).blocked({ x: 150, y: 160 }), true);
console.log("PASS: Bureau's two authored shelf-safe rooms remain navigable");
