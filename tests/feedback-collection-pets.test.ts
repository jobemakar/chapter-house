import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DISCOVERY_CALLOUT_SECONDS } from "../src/town/world";

const mainSource = readFileSync(
  new URL("../src/main.ts", import.meta.url),
  "utf8",
);

test("discovery feedback remains visible for five seconds", () => {
  assert.equal(DISCOVERY_CALLOUT_SECONDS, 5);
});

test("locked cards omit the silhouette label and Little friends omits shortcuts", () => {
  assert.ok(!mainSource.includes(" · silhouette"));
  assert.ok(!mainSource.includes("A little pet corner"));
  assert.ok(!mainSource.includes("Watch fish dart"));
  assert.ok(!mainSource.includes("Trampoline time"));
});
