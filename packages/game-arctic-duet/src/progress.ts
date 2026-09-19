export const ARCTIC_DUET_SAVE_KEY = "arctic-duet-v1";
export const ARCTIC_DUET_REWARDS = [
  { legacyId: "duet-snow-cushion", rewardId: "arctic-duet:duet-snow-cushion", name: "Duet Snow Cushion", kind: "floor", threshold: 12, description: "A small shared place to rest after a song." },
  { legacyId: "puffin-window-star", rewardId: "arctic-duet:puffin-window-star", name: "Puffin Window Star", kind: "wall", threshold: 30, description: "A warm little star for an Arctic wall." },
  { legacyId: "aurora-wool-rug", rewardId: "arctic-duet:aurora-wool-rug", name: "Aurora Wool Rug", kind: "floor", threshold: 60, description: "A soft original rug for feet and flippers." },
  { legacyId: "together-pennant", rewardId: "arctic-duet:together-pennant", name: "Together Pennant", kind: "wall", threshold: 100, description: "A paper pennant celebrating every catch." },
] as const;

export interface ArcticDuetProgress {
  version: 1;
  total: number;
  bestLevel: number;
  muted: boolean;
  gentle: boolean;
  assist: boolean;
  /** Legacy field name from arctic-duet-v1: true means less decorative motion. */
  motion: boolean;
  keepsakes: string[];
}

const integer = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : fallback;

export function earnedKeepsakes(total: number, prior: readonly string[] = []): string[] {
  const valid = new Set(prior.filter((id) => ARCTIC_DUET_REWARDS.some((reward) => reward.legacyId === id)));
  for (const reward of ARCTIC_DUET_REWARDS) if (total >= reward.threshold) valid.add(reward.legacyId);
  return ARCTIC_DUET_REWARDS.filter((reward) => valid.has(reward.legacyId)).map((reward) => reward.legacyId);
}

/** DOM-free, versioned migration for both host profiles and the untouched legacy key. */
export function loadArcticDuetProgress(raw: unknown): ArcticDuetProgress {
  const candidate = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  // The original key uses version: 1. Missing version is tolerated only for host-profile adoption.
  const value = candidate.version === undefined || candidate.version === 1 ? candidate : {};
  const total = integer(value.total);
  const rawKeepsakes = Array.isArray(value.keepsakes) ? value.keepsakes.filter((id): id is string => typeof id === "string") : [];
  return {
    version: 1,
    total,
    bestLevel: Math.max(1, integer(value.bestLevel, 1)),
    muted: value.muted === true,
    gentle: value.gentle === true,
    assist: value.assist === true,
    motion: value.motion === true || value.reducedMotion === true,
    keepsakes: earnedKeepsakes(total, rawKeepsakes),
  };
}

export function parseArcticDuetProgress(serialized: string | null): ArcticDuetProgress {
  try { return loadArcticDuetProgress(serialized ? JSON.parse(serialized) : null); }
  catch { return loadArcticDuetProgress(null); }
}
