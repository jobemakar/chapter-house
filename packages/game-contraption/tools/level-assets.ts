import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { isSafeLevelId } from "../src/level-files";

const DEFAULT_LEVELS_DIRECTORY = fileURLToPath(
  new URL("../public/levels", import.meta.url),
);
const MAX_LEVEL_ASSET_BYTES = 512 * 1024;

export type LevelAssetsOptions = {
  levelsDirectory?: string;
  publicDirectory?: string;
};

/** Read-only bridge for application dev and builds; it never exposes the editor write API. */
export function createContraptionLevelAssetsPlugin(
  options: LevelAssetsOptions = {},
): Plugin {
  const levelsDirectory = path.resolve(
    options.levelsDirectory ?? DEFAULT_LEVELS_DIRECTORY,
  );
  const publicDirectory = (
    options.publicDirectory ?? "contraption-levels"
  ).replace(/^\/+|\/+$/g, "");
  return {
    name: "contraption-level-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void serveLevelAsset(
          request,
          response,
          next,
          levelsDirectory,
          publicDirectory,
        );
      });
    },
    async generateBundle() {
      for (const filename of await levelFilenames(levelsDirectory)) {
        this.emitFile({
          type: "asset",
          fileName: `${publicDirectory}/${filename}`,
          source: await readLevelAsset(levelsDirectory, filename),
        });
      }
    },
  };
}

async function serveLevelAsset(
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
  levelsDirectory: string,
  publicDirectory: string,
): Promise<void> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    next();
    return;
  }
  let pathname: string;
  try {
    pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    next();
    return;
  }
  const prefix = `/${publicDirectory}/`;
  if (!pathname.startsWith(prefix)) {
    next();
    return;
  }
  let filename: string;
  try {
    filename = decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    response.statusCode = 400;
    response.end("Invalid level asset path");
    return;
  }
  if (!isSafeJsonFilename(filename)) {
    response.statusCode = 404;
    response.end("Level asset not found");
    return;
  }
  try {
    const source = await readLevelAsset(levelsDirectory, filename);
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(request.method === "HEAD" ? undefined : source);
  } catch (error) {
    response.statusCode = isNodeError(error, "ENOENT") ? 404 : 500;
    response.end(
      response.statusCode === 404
        ? "Level asset not found"
        : "Level asset unavailable",
    );
  }
}

async function levelFilenames(directory: string): Promise<string[]> {
  const stat = await fs.lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory())
    throw new Error("Contraption levels directory must be a real directory");
  const real = await fs.realpath(directory);
  if (path.resolve(real) !== directory)
    throw new Error(
      "Contraption levels directory cannot traverse a symbolic link",
    );
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const filenames: string[] = [];
  for (const entry of entries) {
    if (!entry.name.endsWith(".json")) continue;
    if (
      !entry.isFile() ||
      entry.isSymbolicLink() ||
      !isSafeJsonFilename(entry.name)
    )
      throw new Error(
        `Contraption level asset ${entry.name} must be a safe regular JSON file`,
      );
    filenames.push(entry.name);
  }
  return filenames.sort((left, right) => left.localeCompare(right));
}

async function readLevelAsset(
  directory: string,
  filename: string,
): Promise<Buffer> {
  if (!isSafeJsonFilename(filename))
    throw new Error("Unsafe Contraption level asset name");
  const target = path.resolve(directory, filename);
  if (path.dirname(target) !== directory)
    throw new Error("Contraption level asset path escapes its directory");
  const stat = await fs.lstat(target);
  if (stat.isSymbolicLink() || !stat.isFile())
    throw new Error(`${filename} must be a regular file`);
  if (stat.size > MAX_LEVEL_ASSET_BYTES)
    throw new Error(`${filename} exceeds the 512 KB limit`);
  return fs.readFile(target);
}

function isSafeJsonFilename(filename: string): boolean {
  if (filename === "index.json") return true;
  return filename.endsWith(".json") && isSafeLevelId(filename.slice(0, -5));
}
function isNodeError(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === code
  );
}
