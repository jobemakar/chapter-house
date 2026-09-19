import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { GamePreviews } from "../src/core/game-previews";
import { GamePreviewBridge } from "../tools/game-previews";

const root = fileURLToPath(new URL("../", import.meta.url));
test("all canonical games have left the legacy preview shelf", () => {
  assert.equal(
    new Set(GamePreviews.entries.map((p) => p.id)).size,
    GamePreviews.entries.length,
  );
  const markup = GamePreviews.markup();
  assert.equal(markup, "");
  assert.equal(
    GamePreviews.entries.filter((preview) => preview.technology === "TypeScript")
      .length,
    0,
  );
  assert.deepEqual(
    GamePreviews.entries
      .filter((preview) => preview.technology === "JavaScript")
      .map((preview) => preview.id),
    [],
  );
  for (const preview of GamePreviews.entries) {
    assert.match(preview.id, /^[a-z0-9-]+$/);
    assert.ok(markup.includes(GamePreviews.url(preview)));
    assert.equal(
      GamePreviews.fileName(preview),
      `assets/previews/${preview.id}/index.html`,
    );
  }
  assert.equal(
    (markup.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length,
    GamePreviews.entries.length,
  );
});

test("every preview has its existing build and all required assets packaged", async () => {
  const bridge = new GamePreviewBridge(root);
  for (const preview of GamePreviews.entries) {
    const html = (await bridge.read(preview)).toString("utf8");
    assert.match(html, /<html[\s>]/i, preview.id);
    // Citation anchors are fine; required scripts/images/styles must be packaged inline.
    const dependencies = [
      ...html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) =>
          script.replace(/>[\s\S]*<\/script>/, "></script>"),
        )
        .matchAll(
          /<(?:script|img|audio|video|source|link)\b[^>]*\b(?:src|href)=["']([^"']+)["']/gi,
        ),
    ]
      .map((match) => match[1])
      .filter((url) => !url.startsWith("data:") && !url.startsWith("#"));
    for (const dependency of dependencies)
      assert.ok(
        preview.assets?.includes(dependency.replace(/^\.\//, "")),
        `${preview.id} has unexpected dependency: ${dependency}`,
      );
    for (const asset of preview.assets ?? [])
      assert.ok((await bridge.read(preview, asset)).length > 0);
  }
});

test("preview bridge rejects collection traversal", async () => {
  await assert.rejects(
    new GamePreviewBridge(root).read({
      id: "invalid",
      title: "Invalid",
      book: "Invalid",
      description: "Invalid",
      technology: "JavaScript",
      source: "../outside.html",
    }),
    /escapes collection/,
  );
});

test("preview bridge rejects non-allowlisted assets", async () => {
  await assert.rejects(
    new GamePreviewBridge(root).read({
      id: "invalid",
      title: "Invalid",
      book: "Invalid",
      description: "Invalid",
      technology: "JavaScript",
      source: "preview-sources/vedas-great-escape/index.html",
      assets: [],
    }, "../../catalog.json"),
    /not allowlisted/,
  );
});
