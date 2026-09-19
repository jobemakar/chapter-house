import { getLevel } from "./levels";

/** A host-independent persisted summary. Transient particle state is intentionally never saved. */
export interface DigAndDouseProgress {
  version: 1;
  firesExtinguished: number;
  bestCanteens: number;
  totalCanteens: number;
  ownedRewardIds: string[];
}

export const TOTAL_CANTEENS = getLevel().canteens.length;
export const DIG_AND_DOUSE_REWARD_ID = "wildfire:camp-lantern";

function nonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/** Reads partial or pre-migration save data without exposing unsafe values to the host profile. */
export function loadDigAndDouseProgress(raw: unknown): DigAndDouseProgress {
  const value =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const totalCanteens = nonNegativeInteger(value.totalCanteens, 0);
  const ids = Array.isArray(value.ownedRewardIds)
    ? value.ownedRewardIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      )
    : [];
  return {
    version: 1,
    firesExtinguished: nonNegativeInteger(value.firesExtinguished, 0),
    bestCanteens: Math.min(
      TOTAL_CANTEENS,
      nonNegativeInteger(value.bestCanteens, 0),
    ),
    totalCanteens,
    ownedRewardIds: [...new Set(ids)],
  };
}
