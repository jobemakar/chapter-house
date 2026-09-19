import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GamePreviews } from "../src/core/game-previews.ts";

const canonicalSources: Readonly<Record<string, string>> = {
  stormglide:
    "the-miscalculations-of-lightning-girl/playable/Stormglide.html",
  "pocket-funhouse":
    "the-mystery-of-locked-rooms/playable/Pocket-Funhouse.html",
  "arctic-duet": "the-very-very-far-north/playable/Arctic-Duet.html",
  "moonlight-munch-run": "mabuhay/playable/moonlight-munch-run.html",
  "gummy-nook": "not-if-i-can-help-it/playable/Gummy-Nook.html",
  "bureau-after-dark":
    "amari-and-the-night-brothers/playable/Bureau-After-Dark.html",
  "dig-and-douse": "wildfire/dist/index.html",
  "contraption-club": "popcorn/playable/popcorn-contraption-club.html",
};

/** Mechanical packaging: original standalone builds remain the source of truth. */
class SnapshotRefresh {
  async run() {
    const root = fileURLToPath(new URL("../", import.meta.url));
    const manifestPath = resolve(root, "docs/preview-origin-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const collection = resolve(root, "..");
    const retained = manifest.files.filter(
      (f: { id: string }) => f.id === "vedas-great-escape",
    );
    const files = [...retained];
    for (const preview of GamePreviews.entries) {
      const main = canonicalSources[preview.id];
      if (!main) continue;
      const mainSource = resolve(collection, main);
      const sourceDir = dirname(mainSource);
      files.push({ id: preview.id, file: "index.html", source: mainSource });
      for (const asset of preview.assets ?? [])
        files.push({
          id: preview.id,
          file: asset,
          source: resolve(sourceDir, asset),
        });
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
          verifiedOn: "2026-09-19",
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
