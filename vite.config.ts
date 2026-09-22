import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { GamePreviewBridge } from "./tools/game-previews.ts";
import { createLevelCatalogPlugin } from "./packages/game-dig-and-douse/editor-server";
import { createWishboneLevelAssetsPlugin } from "./packages/game-wishbone-fling/tools/level-assets.ts";
import { createContraptionLevelAssetsPlugin } from "./packages/game-contraption/tools/level-assets";
import { createKeyfallLevelAssetsPlugin } from "./packages/game-keyfall-prototype/tools/level-assets";
export default defineConfig({
  base: "./",
  plugins: [
    createContraptionLevelAssetsPlugin(),
    createKeyfallLevelAssetsPlugin(),
    createLevelCatalogPlugin(),
    createWishboneLevelAssetsPlugin(),
    new GamePreviewBridge(
      fileURLToPath(new URL("./", import.meta.url)),
    ).plugin(),
  ],
  // Windows may briefly lock copied assets; polling avoids native EBUSY watcher exits.
  server: {
    watch: { usePolling: process.platform === "win32", interval: 400 },
  },
});
