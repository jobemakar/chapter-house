/** DOM-free durable state for the canonical v2 Bureau save and Chapter House. */
export interface BureauAfterDarkProgress {
  version: 1;
  found: Record<"0" | "1", string[]>;
  rewards: string[];
  selectedLevel: 0 | 1;
  ownedRewardIds: string[];
}

export const BUREAU_REWARD_REQUEST_IDS = {
  "night-garden": "bureau-after-dark:night-garden",
  lanternwing: "bureau-after-dark:lanternwing",
} as const;
export type BureauRewardLegacyId = keyof typeof BUREAU_REWARD_REQUEST_IDS;

const rewards = new Set<BureauRewardLegacyId>(["night-garden", "lanternwing"]);
const strings = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string"))] : [];

/** Accepts the legacy v2 standalone shape as well as the package's v1 profile shape. */
export function loadBureauAfterDarkProgress(raw: unknown): BureauAfterDarkProgress {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const sourceFound = data.found && typeof data.found === "object" && !Array.isArray(data.found) ? data.found as Record<string, unknown> : {};
  const requestedClaims = strings(data.rewards).filter((id): id is BureauRewardLegacyId => rewards.has(id as BureauRewardLegacyId));
  const found0 = strings(sourceFound["0"]).filter((id) => ["moon", "feather", "key"].includes(id));
  const found1 = strings(sourceFound["1"]).filter((id) => ["star", "shell", "flame"].includes(id));
  // Match the legacy ProgressStore invariant: a record exists only after all
  // sigils in its authored floor were found and its archive seal was solved.
  const claimed = requestedClaims.filter((id) =>
    id === "night-garden"
      ? found0.length === 3
      : found0.length === 3 && found1.length === 3 && requestedClaims.includes("night-garden"),
  );
  const owned = strings(data.ownedRewardIds).filter((id) => Object.values(BUREAU_REWARD_REQUEST_IDS).includes(id as never));
  for (const reward of claimed) {
    const request = BUREAU_REWARD_REQUEST_IDS[reward];
    if (!owned.includes(request)) owned.push(request);
  }
  return {
    version: 1,
    found: { "0": found0, "1": found1 },
    rewards: claimed,
    selectedLevel: data.selectedLevel === 1 && claimed.includes("night-garden") ? 1 : 0,
    ownedRewardIds: owned,
  };
}

export function requestIdForLegacyReward(id: string): string | undefined {
  return BUREAU_REWARD_REQUEST_IDS[id as BureauRewardLegacyId];
}
