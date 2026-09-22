import { fingerprint } from "./level-files";
import { normalizeLayout } from "./levels";
import type { ContraptionProgress } from "./progress";
import type { Level } from "./types";

/** Resolve a playable catalog without deleting earned or inactive-level history. */
export class CatalogProgress {
  static prepare(progress: ContraptionProgress, levels: Level[]): number {
    for (const level of levels) {
      const revision = fingerprint(level);
      const previous = progress.layoutRevisions[level.id];
      progress.layoutsById[level.id] = normalizeLayout(
        level,
        previous && previous !== revision
          ? level.initial
          : (progress.layoutsById[level.id] ?? level.initial),
      );
      progress.layoutRevisions[level.id] = revision;
    }
    return Math.max(
      0,
      levels.findIndex((level) => level.id === progress.selectedId),
    );
  }
}
