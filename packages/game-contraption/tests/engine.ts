import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { ContraptionEngine } from "../src/engine";
import {
  levelIssues,
  parseLevelFile,
  parseLevelIndex,
} from "../src/level-files";
import { normalizeLayout, part } from "../src/levels";
import type { Level, Part } from "../src/types";

const LEVEL_DIRECTORY = fileURLToPath(
  new URL("../public/levels/", import.meta.url),
);

async function authoredLevels() {
  const index = parseLevelIndex(
    JSON.parse(
      await fs.readFile(path.join(LEVEL_DIRECTORY, "index.json"), "utf8"),
    ) as unknown,
  );
  const files = await Promise.all(
    index.levels.map(async (id) =>
      parseLevelFile(
        JSON.parse(
          await fs.readFile(path.join(LEVEL_DIRECTORY, `${id}.json`), "utf8"),
        ) as unknown,
      ),
    ),
  );
  return { index, files };
}

function fixtureLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: "engine-fixture",
    name: "Engine fixture",
    tag: "",
    sources: [{ x: 100, y: 100, vx: 0 }],
    period: 5,
    bowl: { x: 1000, y: 580 },
    initial: [],
    spares: [],
    ...overrides,
  };
}

describe("Contraption engine and authored levels", () => {
  test("keeps the six included level files valid and preserves each clean-batch solution over three seeds", async () => {
    const { index, files } = await authoredLevels();
    assert.deepEqual(index.levels, [
      "special-delivery",
      "missing-link",
      "over-the-wall",
      "little-breeze",
      "meet-in-the-middle",
      "switchboard-symphony",
    ]);
    assert.equal(files.length, 6);
    for (const file of files) {
      assert.equal(file.level.id, path.basename(file.level.id));
      assert.deepEqual(
        levelIssues(file),
        [],
        `${file.level.id} should remain structurally and playably valid`,
      );
      assert.ok(
        file.level.legacy?.solution.length,
        `${file.level.id} retains its original solution`,
      );
      for (const seed of [1, 42, 701]) {
        const engine = new ContraptionEngine(
          file.level,
          file.level.legacy!.solution.map((piece) => ({ ...piece })),
          seed,
        );
        for (let tick = 0; tick < 10_000 && !engine.cleared; tick++)
          engine.step();
        assert.equal(
          engine.cleared,
          true,
          `${file.level.id} should clear with seed ${seed}`,
        );
        assert.deepEqual(engine.proof, {
          id: 1,
          sent: 12,
          resolved: 12,
          good: 12,
          spilled: 0,
        });
      }
    }
  });

  test("keeps every authored starting layout from clearing automatically and restores fixed pieces", async () => {
    const { files } = await authoredLevels();
    for (const file of files) {
      const engine = new ContraptionEngine(file.level);
      for (let tick = 0; tick < 10_000 && !engine.cleared; tick++)
        engine.step();
      assert.equal(
        engine.cleared,
        false,
        `${file.level.id} starter should still require player changes`,
      );

      const fixed = file.level.initial.find((piece) => piece.locked);
      if (fixed) {
        const altered = normalizeLayout(file.level, [
          ...file.level.initial.map((piece) =>
            piece.id === fixed.id
              ? { ...piece, x: 10, y: 10, angle: 2 }
              : { ...piece },
          ),
        ]);
        assert.deepEqual(
          altered.find((piece) => piece.id === fixed.id),
          fixed,
          `${file.level.id} fixed ${fixed.id} should restore from authored source`,
        );
      }
    }
  });

  test("buttons debounce a resting kernel until it separates and touches again", () => {
    const belt = { ...part("belt", 700, 400, 0, "target-belt") };
    const button: Part = {
      ...part("button", 200, 200, 0, "corn-button"),
      targetId: belt.id,
      mode: "toggle",
    };
    const level = fixtureLevel({ initial: [button, belt] });
    const engine = new ContraptionEngine(level, [button, belt], 9);
    engine.spawn();
    const kernel = engine.particles[0];
    for (let i = 0; i < 12; i++) {
      kernel.x = button.x;
      kernel.y = button.y;
      kernel.vx = 0;
      kernel.vy = 0;
      engine.step();
    }
    assert.equal(
      engine.direction(belt),
      -1,
      "repeated frames from one held contact produce one activation",
    );

    kernel.x = button.x + 100;
    kernel.y = button.y + 100;
    kernel.vx = 0;
    kernel.vy = 0;
    engine.step();
    kernel.x = button.x;
    kernel.y = button.y;
    kernel.vx = 0;
    kernel.vy = 0;
    engine.step();
    assert.equal(
      engine.direction(belt),
      1,
      "a new contact after separation toggles the target again",
    );
  });

  test("separates button and lever activation sources and keeps levers out of particle collision", () => {
    const belt = { ...part("belt", 700, 400, 0, "source-test-belt") };
    const button: Part = {
      ...part("button", 200, 200, 0, "source-test-button"),
      targetId: belt.id,
      mode: "toggle",
    };
    const lever: Part = {
      ...part("lever", 350, 200, 0, "source-test-lever"),
      targetId: belt.id,
      mode: "toggle",
    };
    const engine = new ContraptionEngine(
      fixtureLevel({ initial: [belt, button, lever] }),
      [belt, button, lever],
    );
    assert.equal(engine.press(button, "human"), false);
    assert.equal(engine.press(lever, "corn"), false);
    assert.equal(engine.direction(belt), 1);
    assert.equal(engine.press(lever, "human"), true);
    assert.equal(engine.direction(belt), -1);

    const separate = new ContraptionEngine(
      fixtureLevel({ initial: [belt, lever] }),
      [belt, lever],
    );
    separate.spawn();
    const kernel = separate.particles[0];
    kernel.x = lever.x;
    kernel.y = lever.y;
    kernel.vx = 0;
    kernel.vy = 0;
    separate.step();
    assert.equal(
      separate.direction(belt),
      1,
      "particle overlap alone never actuates a lever",
    );
  });

  test("applies fan enabled state, reverses conveyors, and honors toggle/latch restart semantics", () => {
    const fanOff = { ...part("fan", 100, 100, 0, "fan-off"), enabled: false };
    const off = new ContraptionEngine(
      fixtureLevel({ initial: [fanOff] }),
      [fanOff],
      2,
    );
    off.spawn();
    Object.assign(off.particles[0], { x: 150, y: 100, vx: 0, vy: 0 });
    off.step();
    assert.equal(
      off.particles[0].vx,
      0,
      "disabled fan applies no horizontal force",
    );

    const fanOn = { ...fanOff, id: "fan-on", enabled: true };
    const on = new ContraptionEngine(
      fixtureLevel({ initial: [fanOn] }),
      [fanOn],
      2,
    );
    on.spawn();
    Object.assign(on.particles[0], { x: 150, y: 100, vx: 0, vy: 0 });
    on.step();
    assert.ok(
      on.particles[0].vx > 0,
      "enabled fan accelerates in its facing direction",
    );
    assert.equal(on.fanEnabled(fanOn), true);

    const belt = { ...part("belt", 700, 400, 0, "mode-belt") };
    const toggle: Part = {
      ...part("button", 200, 200, 0, "toggle"),
      targetId: belt.id,
      mode: "toggle",
    };
    const latch: Part = {
      ...part("lever", 300, 200, 0, "latch"),
      targetId: belt.id,
      mode: "latch",
    };
    const controls = new ContraptionEngine(
      fixtureLevel({ initial: [belt, toggle, latch] }),
      [belt, toggle, latch],
    );
    assert.equal(controls.press(toggle, "corn"), true);
    assert.equal(controls.direction(belt), -1);
    assert.equal(controls.press(toggle, "corn"), true);
    assert.equal(controls.direction(belt), 1);
    assert.equal(controls.press(latch), true);
    assert.equal(controls.direction(belt), -1);
    assert.deepEqual([...controls.latched], ["latch"]);
    assert.equal(controls.press(latch), false);
    assert.equal(controls.direction(belt), -1);
    const restarted = new ContraptionEngine(
      controls.level,
      controls.parts.map((piece) => ({ ...piece })),
    );
    assert.deepEqual([...restarted.latched], []);
    assert.equal(restarted.press(latch), true);
    assert.equal(
      restarted.direction(belt),
      -1,
      "a fresh engine reinitializes belt direction before the new latch activation",
    );
  });
});
