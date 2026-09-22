import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fitVedaBoardWidth, vedaTerrainEnvironment } from "../src/renderer";
import { LEVELS } from "../src/core";

const css = readFileSync(
  fileURLToPath(new URL("../src/style.css", import.meta.url)),
  "utf8",
);

test("responsive layout contract keeps Veda board-first and horizontally bounded", () => {
  assert.match(css, /aspect-ratio:\s*9\s*\/\s*7/);
  assert.match(css, /\.veda-game \.layout[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /\.veda-game \.play[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(190px,\s*220px\)/);
  assert.match(css, /\.veda-game aside \{ display:\s*none/);
  assert.match(css, /orientation:\s*landscape/);
  assert.match(css, /--veda-rail-width:\s*170px/);
  assert.match(css, /\.veda-game \.play \{ display: contents; \}/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\);\s*grid-template-rows:\s*minmax\(0,\s*1fr\)/);
  assert.doesNotMatch(css, /width:\s*calc\(100%\s*\+\s*16px\)/);
  assert.doesNotMatch(css, /^\s*\.veda-game__shell\s*[,{]/m);
  assert.match(css, /\.veda-game \.controls button[^}]*min-height:\s*44px/);
  assert.match(css, /\.veda-game header button[^}]*min-width:\s*44px[^}]*min-height:\s*44px/);
  assert.match(css, /\.veda-game \.journey button[^}]*min-height:\s*44px/);
  assert.match(css, /\.veda-game \.dpad button[^}]*min-height:\s*44px/);
  assert.match(css, /\.veda-game \.veda-game__shell\s*\{[^}]*position:\s*absolute/);
  assert.match(css, /\.veda-game\[data-reduced-motion="true"\] \.sprite[^}]*transition:\s*none/);
  assert.match(css, /\.veda-game\.is-paused \.board::after/);
  assert.match(css, /\.veda-game \.journey \[data-veda="levels"\][^}]*flex-wrap:\s*nowrap/);
  assert.match(css, /\.veda-game \.journey button \{[^}]*flex:\s*0 0 44px/);
  assert.match(css, /\.veda-game \.message[^}]*-webkit-line-clamp:\s*2/);
  assert.match(css, /\.veda-game \.board-stage \{ position:\s*relative[^}]*grid-column:\s*1[^}]*grid-row:\s*1 \/ 5[^}]*align-self:\s*stretch/);
  assert.match(css, /\.veda-game \.message \{ position:\s*static; grid-column:\s*2; grid-row:\s*1/);
  assert.doesNotMatch(css, /\.veda-game \.message \{ position:\s*absolute/);
  assert.match(css, /pointer-events:\s*none; white-space:\s*normal/);
  assert.match(css, /\.veda-game \.header-actions \{ position:\s*absolute; left:\s*4px/);
});

test("short-landscape rail leaves a useful 9:7 board slot", () => {
  const width = fitVedaBoardWidth(660, 336, 9, 7);
  assert.ok(width >= 400);
  assert.ok(width / 9 >= 38);
  assert.equal(Math.round((width * 7) / 9), 336);
});

test("integrated portrait slot keeps a meaningful board beside one-row recovery", () => {
  const width = fitVedaBoardWidth(346, 252, 9, 7);
  assert.equal(width, 324);
  assert.ok(width >= 320);
  assert.ok((width * 7) / 9 >= 249);
});

test("decorative board art stays out of the accessibility tree", () => {
  const game = readFileSync(
    fileURLToPath(new URL("../src/game.ts", import.meta.url)),
    "utf8",
  );
  assert.match(game, /fixed-wall.*aria-hidden="true"/);
  assert.doesNotMatch(game, /fixed-wall.*aria-label="Sanctuary wall/);
  assert.match(game, /dataset\.reducedMotion/);
});

test("portrait recovery layout and runtime readiness remain board-first", () => {
  const game = readFileSync(
    fileURLToPath(new URL("../src/game.ts", import.meta.url)),
    "utf8",
  );
  assert.match(game, /dataset\.assets\s*=\s*"loading"/);
  assert.match(game, /new VedaAssetLoader/);
  assert.match(game, /dataset\.assets\s*=\s*this\.assetsFailed \? "fallback" : "ready"/);
  assert.match(game, /this\.messageElement\.textContent = text;\s*this\.scheduleFit\(\)/);
  assert.match(game, /fitVedaBoardWidth\(boardStage\.clientWidth, boardStage\.clientHeight/);
  assert.match(game, /boardStage\.clientWidth/);
  assert.match(game, /this\.dialog\.addEventListener\("cancel"/);
  assert.match(game, /this\.dialog\.addEventListener\("close"/);
  assert.match(game, /aria-labelledby="\$\{winTitleId\}"/);
  assert.match(game, /aria-labelledby="\$\{helpTitleId\}"/);
  assert.match(game, /class="board-stage"><div data-veda="board"[^>]*><\/div><\/div><p data-veda="message"/);
  assert.doesNotMatch(game, /\(column \+ row\) % 3/);
  assert.match(game, /terrainSeed/);
  assert.match(css, /max-width: 520px[\s\S]*?\.veda-game \.journey \{[^}]*height:\s*44px/);
});

test("each authored level gets restrained nonperiodic terrain diversity", () => {
  for (const level of LEVELS) {
    const counts = { terrainBase: 0, terrainQuietMoss: 0, terrainQuietRoot: 0, terrainQuietStone: 0 };
    let walkable = 0;
    level.map.forEach((line, row) => [...line].forEach((value, column) => {
      const cell = row * 9 + column;
      const environment = vedaTerrainEnvironment(cell, column, row, value === "#");
      counts[environment] += 1;
      if (value !== "#") walkable += 1;
    }));
    const accents = counts.terrainQuietMoss + counts.terrainQuietRoot;
    assert.ok(counts.terrainBase >= Math.ceil(walkable * 0.5), level.title);
    assert.ok(counts.terrainBase <= Math.ceil(walkable * 0.8), level.title);
    assert.ok(accents >= 2, level.title);
    assert.ok(accents <= Math.ceil(walkable * 0.45), level.title);
    assert.ok(counts.terrainQuietStone > 0, level.title);
  }
});

test("ordinary blocked attempts use restrained blocked feedback while only the closed exit uses gate-locked", () => {
  const game = readFileSync(fileURLToPath(new URL("../src/game.ts", import.meta.url)), "utf8");
  const renderer = readFileSync(fileURLToPath(new URL("../src/renderer.ts", import.meta.url)), "utf8");
  assert.match(game, /this\.audio\.gateLocked\(\);[\s\S]*this\.effects\.trigger\("gate-locked", this\.state\.exit\)/);
  assert.match(game, /this\.audio\.blocked\(\);[\s\S]*this\.effects\.trigger\("blocked", this\.state\.player\)/);
  assert.doesNotMatch(game, /this\.effects\.trigger\("gate-locked", this\.state\.player\)/);
  assert.match(renderer, /\| "blocked"/);
  assert.match(css, /veda-vfx--blocked/);
});
