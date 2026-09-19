export const STORMGLIDE_PROGRESS_VERSION = 1;
export const STORMGLIDE_SAVE_KEY = "stormglide-v1";
export const STORMGLIDE_REWARDS = [
  ...["Pi", "Biscuit", "Mochi", "Pepper", "Clover", "Waffles", "Nimbus", "Fig", "Cricket", "Maple", "Pip", "Comet"].map((name, index) => ({ legacyId: `pup-${index}`, rewardId: `stormglide:pup-${index}`, name: `${name} the rescue pup`, threshold: index })),
  ...["Mint", "Rose", "Honey", "Lilac", "Ice"].map((name, index) => ({ legacyId: `trail-${index}`, rewardId: `stormglide:trail-${index}`, name: `${name} spark trail`, threshold: index * 5 })),
] as const;

export interface StormglideProgress { version: 1; muted: boolean; music: boolean; gentle: boolean; trail: number; total: number; found: number[]; best: number; ownedRewardIds: string[]; }
const integer = (value: unknown, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
/** DOM-free validator and additive legacy migration. The original local key has no host-only ownership field. */
export function loadStormglideProgress(raw: unknown): StormglideProgress {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const found = Array.isArray(value.found) ? [...new Set(value.found.filter((id): id is number => Number.isInteger(id) && id >= 0 && id < 12))] : [];
  const total = integer(value.total);
  const known = new Set(STORMGLIDE_REWARDS.map((reward) => reward.rewardId));
  const owned = Array.isArray(value.ownedRewardIds) ? value.ownedRewardIds.filter((id): id is string => typeof id === "string" && known.has(id)) : [];
  for (const id of found) owned.push(`stormglide:pup-${id}`);
  for (const reward of STORMGLIDE_REWARDS.slice(12)) if (total >= reward.threshold) owned.push(reward.rewardId);
  return { version: 1, muted: value.muted === true, music: value.music !== false, gentle: value.gentle === true, trail: Math.min(4, integer(value.trail)), total, found, best: integer(value.best), ownedRewardIds: [...new Set(owned)] };
}
export function toLegacyStormglideSave(progress: StormglideProgress): Omit<StormglideProgress, "version" | "ownedRewardIds"> { const { version: _version, ownedRewardIds: _owned, ...legacy } = progress; return legacy; }
