import { parseLevelFile, parseLevelIndex, playableYard, type LevelFile } from "./level-files";
import type { YardDefinition } from "./types";

export type LoadedLevelCatalog = {
  levels: YardDefinition[];
  diagnostics: string[];
};

/** Ordered filesystem data in dev, exactly the same packaged JSON in production. */
export async function loadLevelCatalog(baseUrl = defaultLevelsUrl()): Promise<LoadedLevelCatalog> {
  baseUrl = directoryUrl(baseUrl);
  const diagnostics: string[] = [];
  let index;
  try {
    index = parseLevelIndex(await readJson(new URL("index.json", baseUrl)));
  } catch (error) {
    return { levels: [], diagnostics: [`index.json: ${errorMessage(error)}`] };
  }
  const results = await Promise.allSettled(index.levels.map(async (id) => {
    const file = parseLevelFile(await readJson(new URL(`${id}.json`, baseUrl)));
    if (file.yard.id !== id) throw new Error(`file and yard IDs do not match (${file.yard.id})`);
    return playableYard(file);
  }));
  const levels: YardDefinition[] = [];
  results.forEach((result, position) => {
    if (result.status === "fulfilled") levels.push(result.value);
    else diagnostics.push(`${index.levels[position]}: ${errorMessage(result.reason)}`);
  });
  return { levels, diagnostics };
}

export async function loadLevelFile(id: string, baseUrl = defaultLevelsUrl()): Promise<LevelFile> {
  baseUrl = directoryUrl(baseUrl);
  const file = parseLevelFile(await readJson(new URL(`${id}.json`, baseUrl)));
  if (file.yard.id !== id) throw new Error(`file and yard IDs do not match (${file.yard.id})`);
  return file;
}

async function readJson(url: URL): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function defaultLevelsUrl(): URL {
  // Vite rewrites public-directory URLs without preserving a trailing slash.
  // Restore directory semantics before resolving index.json or an authored ID.
  return directoryUrl(new URL(["..", "levels"].join("/"), import.meta.url));
}

function directoryUrl(value: URL): URL {
  const url = new URL(value.href);
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}
