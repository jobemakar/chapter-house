import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseLevelFile, playableYard, type LevelFile } from "../src/level-files";
import { LEGACY_LEVELS } from "../src/legacy-levels";
import { registerYards } from "../src/levels";

const levelDirectory = new URL("../public/levels/", import.meta.url);

export const legacyLevelFiles: LevelFile[] = LEGACY_LEVELS.map(({ id }) =>
  parseLevelFile(JSON.parse(readFileSync(new URL(`${id}.json`, levelDirectory), "utf8")) as unknown),
);

export const legacyYards = legacyLevelFiles.map(playableYard);

for (const [index, metadata] of LEGACY_LEVELS.entries()) {
  const yard = legacyYards[index];
  if (yard.id !== metadata.id || yard.revision !== metadata.revision) {
    throw new Error(`Legacy level ${metadata.id} no longer matches its immutable migration metadata`);
  }
}

registerYards(legacyYards);

export const legacyLevelsDirectory = fileURLToPath(levelDirectory);
