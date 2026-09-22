import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { GamePreviewBridge } from "./tools/game-previews.ts";
import { createLevelCatalogPlugin } from "./packages/game-dig-and-douse/editor-server";
export default defineConfig({
  base: "./",
  plugins: [
    createLevelCatalogPlugin(),
    new GamePreviewBridge(
      fileURLToPath(new URL("./", import.meta.url)),
    ).plugin(),
  ],
  // Windows may briefly lock copied assets; polling avoids native EBUSY watcher exits.
  server: {
    watch: { usePolling: process.platform === "win32", interval: 400 },
  },
});
