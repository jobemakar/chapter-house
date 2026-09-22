import type { Part } from "./types";
export const CONTRAPTION_SAVE_KEY = "popcorn-contraption.levels.v2";
export const LEGACY_SAVE_KEY = "popcorn-contraption.v1";
export const CONTRAPTION_REWARD_IDS = [
  "popcorn:cc-spring-ornament",
  "popcorn:cc-mini-machine",
] as const;
export const LEGACY_REWARD_IDS = [
  "cc-spring-ornament",
  "cc-mini-machine",
] as const;
export const LEGACY_LEVEL_IDS = [
  "special-delivery",
  "missing-link",
  "over-the-wall",
  "little-breeze",
  "meet-in-the-middle",
  "switchboard-symphony",
] as const;
export interface ContraptionProgress {
  version: 3;
  selectedId: string;
  clearedIds: string[];
  layoutsById: Record<string, Part[]>;
  layoutRevisions: Record<string, string>;
  delivered: number;
  best: number;
  ownedRewardIds: string[];
  mute: boolean;
  slow: boolean;
  trails: boolean;
  /** Legacy numeric fields retained as import history, never used for live identity. */
  board: number;
  cleared: number[];
  layouts: Part[][];
}
const int = (v: unknown, d = 0) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d;
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const safeId = (v: unknown): v is string =>
  typeof v === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(v);
export function freshContraptionProgress(): ContraptionProgress {
  return {
    version: 3,
    selectedId: LEGACY_LEVEL_IDS[0],
    clearedIds: [],
    layoutsById: {},
    layoutRevisions: {},
    board: 0,
    cleared: [],
    layouts: [],
    delivered: 0,
    best: 0,
    ownedRewardIds: [],
    mute: false,
    slow: false,
    trails: true,
  };
}
/** Pure, idempotent codec; no runtime catalog or browser dependencies. */
export function loadContraptionProgress(raw: unknown): ContraptionProgress {
  const o =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
    p = freshContraptionProgress();
  p.delivered = int(o.delivered);
  p.best = int(o.best);
  p.mute = bool(o.mute, false);
  p.slow = bool(o.slow, false);
  p.trails = bool(o.trails, true);
  const owned = Array.isArray(o.ownedRewardIds)
    ? o.ownedRewardIds
    : Array.isArray(o.owned)
      ? o.owned
      : [];
  p.ownedRewardIds = [
    ...new Set(
      owned
        .filter((x): x is string => typeof x === "string")
        .map((x) => {
          const i = LEGACY_REWARD_IDS.indexOf(
            x as (typeof LEGACY_REWARD_IDS)[number],
          );
          return i < 0 ? x : CONTRAPTION_REWARD_IDS[i];
        }),
    ),
  ];
  for (const [i, at] of [5, 20].entries())
    if (
      p.delivered >= at &&
      !p.ownedRewardIds.includes(CONTRAPTION_REWARD_IDS[i])
    )
      p.ownedRewardIds.push(CONTRAPTION_REWARD_IDS[i]);
  if (o.version === 2 || o.version === 3) {
    p.board = Math.min(5, int(o.board));
    p.cleared = [
      ...new Set(
        (Array.isArray(o.cleared) ? o.cleared : []).filter(
          (x): x is number => Number.isInteger(x) && x >= 0 && x < 6,
        ),
      ),
    ];
    p.layouts = (Array.isArray(o.layouts) ? o.layouts : []).map((x) =>
      Array.isArray(x) ? x : [],
    ) as Part[][];
    p.selectedId = LEGACY_LEVEL_IDS[p.board];
    p.clearedIds = p.cleared.map((i) => LEGACY_LEVEL_IDS[i]);
    p.layouts.forEach((layout, i) => {
      if (LEGACY_LEVEL_IDS[i]) p.layoutsById[LEGACY_LEVEL_IDS[i]] = layout;
    });
  }
  if (o.version === 3) {
    p.selectedId = safeId(o.selectedId) ? o.selectedId : p.selectedId;
    p.clearedIds = [
      ...new Set(
        (Array.isArray(o.clearedIds) ? o.clearedIds : []).filter(safeId),
      ),
    ];
    p.layoutsById = {};
    p.layoutRevisions = {};
    if (o.layoutsById && typeof o.layoutsById === "object")
      for (const [id, layout] of Object.entries(o.layoutsById)) {
        if (safeId(id) && Array.isArray(layout))
          p.layoutsById[id] = layout as Part[];
      }
    if (o.layoutRevisions && typeof o.layoutRevisions === "object")
      for (const [id, revision] of Object.entries(o.layoutRevisions)) {
        if (safeId(id) && typeof revision === "string")
          p.layoutRevisions[id] = revision;
      }
  }
  return p;
}
