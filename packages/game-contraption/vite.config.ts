import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { createLevelStorePlugin } from "./tools/level-store";
import { createContraptionLevelAssetsPlugin } from "./tools/level-assets";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [
    createLevelStorePlugin(),
    {
      ...createContraptionLevelAssetsPlugin({ publicDirectory: "levels" }),
      apply: "serve",
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5197,
    strictPort: true,
    watch: { ignored: ["**/public/levels/**"] },
  },
  build: {
    rollupOptions: {
      input: {
        game: path.resolve(packageRoot, "index.html"),
        editor: path.resolve(packageRoot, "editor.html"),
      },
    },
  },
});
