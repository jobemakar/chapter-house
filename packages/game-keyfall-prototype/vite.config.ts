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
    port: 5198,
    strictPort: true,
    watch: {
      // Level saves are consumed explicitly by the editor/game. HMR here would
      // destroy unsaved editor history and selection state after every save.
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
