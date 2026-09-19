import test from "node:test"; import assert from "node:assert/strict";
import { ActivePlayWindow } from "../src/activity";
test("credits only bounded interaction time and never repeats a total", () => { const window=new ActivePlayWindow(4, 1000); window.activate(100); assert.equal(window.advance(400,.7),null); assert.equal(window.advance(700,.4),5); assert.equal(window.advance(800,.1),null); assert.equal(window.advance(1200,.4),null); });
