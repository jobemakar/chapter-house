import { parseLevelFile, parseLevelIndex, playableRoom } from "./level-files";
import type { RoomDefinition } from "./types";

export type LoadedLevels = { rooms: RoomDefinition[]; errors: string[] };

/** Ordered filesystem data in dev, exactly the same packaged JSON in production. */
export async function loadLevelFiles(baseUrl: URL): Promise<LoadedLevels> {
  const read = async (name: string): Promise<unknown> => {
    const response = await fetch(new URL(name, baseUrl), { cache: "no-store" });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    return response.json();
  };
  const index = parseLevelIndex(await read("index.json"));
  const results = await Promise.allSettled(index.levels.map(async (id) => {
    const file = parseLevelFile(await read(`${id}.json`));
    if (file.room.id !== id) throw new Error("file and room IDs do not match");
    return playableRoom(file);
  }));
  const loaded: LoadedLevels = { rooms: [], errors: [] };
  results.forEach((result, indexPosition) => {
    if (result.status === "fulfilled") loaded.rooms.push(result.value);
    else loaded.errors.push(`${index.levels[indexPosition]}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
  });
  return loaded;
}
