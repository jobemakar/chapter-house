import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GamePreviews } from "../src/core/game-previews.ts";

/** Mechanical packaging: original standalone builds remain the source of truth. */
class SnapshotRefresh {
  async run() {
    const root = fileURLToPath(new URL("../", import.meta.url));
    const manifestPath = resolve(root, "docs/preview-origin-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const files = manifest.files.filter((f: { id: string }) =>
      GamePreviews.entries.some((p) => p.id === f.id),
    );
    const collection = resolve(root, "..");
    for (const [id, source] of [
      [
        "moonlight-munch-run",
        "mabuhay/experiments/moonlight-munch-run/playable/moonlight-munch-run.html",
      ],
    ]) {
      if (!files.some((f: { id: string }) => f.id === id)) {
        files.push({
          id,
          file: "index.html",
          source: resolve(collection, source),
        });
      }
    }
    for (const entry of files) {
      const preview = GamePreviews.entries.find((p) => p.id === entry.id)!;
      const target =
        entry.file === "index.html"
          ? resolve(root, preview.source)
          : resolve(root, dirname(preview.source), entry.file);
      const bytes = await readFile(entry.source);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(entry.source, target);
      const copied = await readFile(target);
      if (!bytes.equals(copied))
        throw new Error(`Snapshot mismatch: ${entry.id}/${entry.file}`);
      entry.bytes = bytes.length;
      entry.sha256 = createHash("sha256")
        .update(bytes)
        .digest("hex")
        .toUpperCase();
      entry.originalByteEquality = true;
    }
    await writeFile(
      manifestPath,
      JSON.stringify(
        {
          verifiedOn: "2026-09-16",
          kind: "exact standalone build snapshots; not integrated gameplay source",
          files,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`Refreshed ${files.length} exact original build files.`);
  }
}
await new SnapshotRefresh().run();
