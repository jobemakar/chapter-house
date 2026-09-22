import type { YardDefinition } from "./types";
/** Runtime catalog; populated from the ordered file list before creating a session. */
export const yards: YardDefinition[] = [];
export function registerYards(levels: YardDefinition[]) {
  yards.splice(0, yards.length, ...levels);
}
