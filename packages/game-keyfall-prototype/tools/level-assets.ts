import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { isSafeLevelId } from "../src/level-files";

const DEFAULT_LEVELS_DIRECTORY = fileURLToPath(
  new URL("../public/levels", import.meta.url),
);

/** Read-only Keyfall level bridge for the Chapter House host. */
export function createKeyfallLevelAssetsPlugin(): Plugin {
  const directory = path.resolve(DEFAULT_LEVELS_DIRECTORY);
  const publicDirectory = "game-data/keyfall/levels";
  return {
    name: "keyfall-level-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void serve(request, response, next, directory, publicDirectory);
      });
    },
    async generateBundle() {
      for (const filename of await filenames(directory)) {
        this.emitFile({
          type: "asset",
          fileName: `${publicDirectory}/${filename}`,
          source: await read(directory, filename),
        });
      }
    },
  };
}

async function serve(
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
  directory: string,
  publicDirectory: string,
) {
  if (request.method !== "GET" && request.method !== "HEAD") return next();
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const prefix = `/${publicDirectory}/`;
  if (!pathname.startsWith(prefix)) return next();
  let filename: string;
  try {
    filename = decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    response.statusCode = 400;
    response.end("Invalid level asset path");
    return;
  }
  if (!safe(filename)) {
    response.statusCode = 404;
    response.end("Level asset not found");
    return;
  }
  try {
    const source = await read(directory, filename);
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(request.method === "HEAD" ? undefined : source);
  } catch {
    response.statusCode = 404;
    response.end("Level asset not found");
  }
}

async function filenames(directory: string): Promise<string[]> {
  return (await fs.readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && safe(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function read(directory: string, filename: string): Promise<Buffer> {
  if (!safe(filename)) throw new Error("Unsafe Keyfall level asset name");
  const target = path.resolve(directory, filename);
  if (path.dirname(target) !== directory) throw new Error("Keyfall level escapes directory");
  return fs.readFile(target);
}

function safe(filename: string): boolean {
  return filename === "index.json" || (filename.endsWith(".json") && isSafeLevelId(filename.slice(0, -5)));
}
