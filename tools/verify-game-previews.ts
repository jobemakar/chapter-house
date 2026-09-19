import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { GamePreviews } from "../src/core/game-previews.ts";
import { GamePreviewBridge } from "./game-previews.ts";

class PreviewVerification {
  async run() {
    const appRoot = fileURLToPath(new URL("../", import.meta.url));
    const bridge = new GamePreviewBridge(appRoot);
    const origin = process.argv[2] ?? "http://127.0.0.1:5191/";
    let files = 0;
    for (const preview of GamePreviews.entries) {
      for (const asset of [undefined, ...(preview.assets ?? [])]) {
        const path = asset
          ? `assets/previews/${preview.id}/${asset}`
          : GamePreviews.fileName(preview);
        const expected = await bridge.read(preview, asset);
        assert.deepEqual(
          await readFile(resolve(appRoot, "dist", path)),
          expected,
          `${path}: production bytes`,
        );
        const response = await fetch(new URL(path, origin));
        assert.equal(response.status, 200, `${path}: served status`);
        assert.deepEqual(
          Buffer.from(await response.arrayBuffer()),
          expected,
          `${path}: served bytes`,
        );
        const type = response.headers.get("content-type") ?? "";
        const expectedType = asset?.endsWith(".png")
          ? "image/png"
          : asset?.endsWith(".js")
            ? "javascript"
            : asset?.endsWith(".css")
              ? "text/css"
              : asset?.endsWith(".wasm")
                ? "application/wasm"
                : asset?.endsWith(".txt")
                  ? "text/plain"
                  : "text/html";
        assert.ok(
          type.includes(expectedType),
          `${path}: ${type}`,
        );
        files++;
      }
    }
    assert.equal(
      (await fetch(new URL("assets/previews/missing/index.html", origin)))
        .status,
      404,
    );
    console.log(
      `Verified ${GamePreviews.entries.length} previews / ${files} files: exact source, production and served bytes; correct MIME; unknown route 404.`,
    );
  }
}
await new PreviewVerification().run();
