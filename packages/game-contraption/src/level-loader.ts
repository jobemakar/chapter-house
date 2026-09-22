import { levelIssues, parseLevelFile, parseLevelIndex } from "./level-files";
import type { Level } from "./types";

export async function loadLevelCatalog(
  baseUrl: URL,
): Promise<{ levels: Level[]; diagnostics: string[] }> {
  const base = new URL(baseUrl);
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  const diagnostics: string[] = [];
  const read = async (path: string) => {
    const r = await fetch(new URL(path, base), { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<unknown>;
  };
  try {
    const index = parseLevelIndex(await read("index.json"));
    const results = await Promise.allSettled(
      index.levels.map(async (id) => {
        const file = parseLevelFile(await read(`${id}.json`));
        if (file.level.id !== id) throw new Error("File ID mismatch");
        const issues = levelIssues(file);
        if (issues.length) throw new Error(issues.join("; "));
        return file.level;
      }),
    );
    const levels: Level[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") levels.push(r.value);
      else diagnostics.push(`${index.levels[i]}: ${String(r.reason)}`);
    });
    return { levels, diagnostics };
  } catch (e) {
    return { levels: [], diagnostics: [String(e)] };
  }
}
