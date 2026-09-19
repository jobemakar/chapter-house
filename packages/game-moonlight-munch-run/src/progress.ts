import { KEEPSAKES, SaveStore, type Save, type WeaponType } from "./model";

/** Stable host-owned summary. It deliberately excludes canvas actors and wall-clock state. */
export interface MoonlightMunchRunProgress {
  version: 1;
  fed: number;
  supplies: number;
  stage: number;
  wave: number;
  phase: "waves" | "boss";
  bossHp: number | null;
  activeWeapon: WeaponType;
  weaponLevels: Record<WeaponType, number>;
  rapidLevel: number;
  muted: boolean;
  reducedMotion: boolean;
  ownedRewardIds: MoonlightRewardId[];
}

export const MOONLIGHT_REWARD_REQUEST_IDS = {
  "lantern-token": "moonlight-munch-run:keepsake:lantern-token",
  "moon-menu": "moonlight-munch-run:keepsake:moon-menu",
  "tiny-truck": "moonlight-munch-run:keepsake:tiny-truck",
} as const;
export type MoonlightLegacyRewardId = keyof typeof MOONLIGHT_REWARD_REQUEST_IDS;
export type MoonlightRewardId = (typeof MOONLIGHT_REWARD_REQUEST_IDS)[MoonlightLegacyRewardId];

export const MOONLIGHT_LEGACY_REWARD_MAP: Readonly<Record<MoonlightLegacyRewardId, MoonlightRewardId>> = MOONLIGHT_REWARD_REQUEST_IDS;

function recognizedRewards(value: unknown): MoonlightRewardId[] {
  const known = new Set(Object.values(MOONLIGHT_REWARD_REQUEST_IDS));
  const legacy = new Set(Object.keys(MOONLIGHT_REWARD_REQUEST_IDS));
  const result = new Set<MoonlightRewardId>();
  if (!Array.isArray(value)) return [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    if (known.has(item as MoonlightRewardId)) result.add(item as MoonlightRewardId);
    if (legacy.has(item)) result.add(MOONLIGHT_REWARD_REQUEST_IDS[item as MoonlightLegacyRewardId]);
  }
  return [...result];
}

/** Validates new package data and accepts the canonical v2 standalone save shape. */
export function loadMoonlightMunchRunProgress(raw: unknown): MoonlightMunchRunProgress {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const save = SaveStore.sanitize(data);
  const earned = KEEPSAKES.filter((item) => save.fed >= item.feeds).map(
    (item) => MOONLIGHT_REWARD_REQUEST_IDS[item.id],
  );
  return {
    version: 1,
    fed: save.fed,
    supplies: save.supplies,
    stage: save.stage,
    wave: save.wave,
    phase: save.phase,
    bossHp: save.bossHp,
    activeWeapon: save.activeWeapon,
    weaponLevels: { ...save.weaponLevels },
    rapidLevel: save.rapidLevel,
    muted: save.muted,
    reducedMotion: save.reducedMotion,
    ownedRewardIds: [...new Set([...recognizedRewards(data.ownedRewardIds), ...recognizedRewards(data.keeps), ...earned])],
  };
}

export function progressToSave(progress: MoonlightMunchRunProgress): Save {
  return SaveStore.sanitize(progress);
}

export function rewardIdsForFeeds(fed: number): MoonlightRewardId[] {
  return KEEPSAKES.filter((item) => fed >= item.feeds).map(
    (item) => MOONLIGHT_REWARD_REQUEST_IDS[item.id],
  );
}
