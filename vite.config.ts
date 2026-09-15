import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  // Windows may briefly lock copied assets; polling avoids native EBUSY watcher exits.
  server: {
    watch: { usePolling: process.platform === "win32", interval: 400 },
  },
});
