import "./legacy-catalog";
import assert from "node:assert/strict";
import { PowerYard } from "../src/powers";
import { aim } from "../src/yard";
const yard = new PowerYard(); assert.ok(yard.throwToy(aim(120, 80))); yard.step(.5); assert.equal(yard.shots, 1); yard.dispose();
