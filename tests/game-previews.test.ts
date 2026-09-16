import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { GamePreviews } from "../src/core/game-previews";
import { GamePreviewBridge } from "../tools/game-previews";

const root = fileURLToPath(new URL("../", import.meta.url));
test("standalone menu has unique safe routes and separate-tab preview labels", () => {
  assert.equal(
    new Set(GamePreviews.entries.map((p) => p.id)).size,
    GamePreviews.entries.length,
  );
  const markup = GamePreviews.markup();
  assert.match(markup, /saves and rewards stay separate/);
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

test("preview bridge rejects non-allowlisted assets", async () => {
  await assert.rejects(
    new GamePreviewBridge(root).read(
      GamePreviews.entries[0],
      "../../catalog.json",
    ),
    /not allowlisted/,
  );
});

test("preview bridge rejects collection traversal", async () => {
  await assert.rejects(
    new GamePreviewBridge(root).read({
      ...GamePreviews.entries[0],
      source: "../outside.html",
    }),
    /escapes collection/,
  );
});
