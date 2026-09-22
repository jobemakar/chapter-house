import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import {
  createEditorServerPlugin,
  createLevelCatalogPlugin,
} from "./editor-server.ts";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [createEditorServerPlugin(), createLevelCatalogPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5192,
    strictPort: true,
    watch: {
      // Manual save must not destroy editor selection, undo history, or test state.
      ignored: ["**/game-dig-and-douse/levels/**"],
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
