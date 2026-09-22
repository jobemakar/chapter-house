import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { createLevelStorePlugin } from "./tools/level-store";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [createLevelStorePlugin()],
  server: {
    host: "127.0.0.1",
    port: 5193,
    strictPort: true,
    watch: {
      // Saves are explicitly reopened by the game/editor. Reloading here would
      // discard unsaved history, selection, camera and isolated playtest state.
      ignored: ["**/public/levels/**"],
    },
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
