/** Durable progress uses level identities, never positions in a changing campaign. */
export interface DigAndDouseProgress {
  version: 2;
  firesExtinguished: number;
  bestCanteens: number;
  totalCanteens: number;
  ownedRewardIds: string[];
  completedLevelIds: string[];
  unlockedLevelIds: string[];
  currentLevelId?: string;
}
/** Historical count, retained for consumers of the original save codec. */
export const TOTAL_CANTEENS = 3;
export const DIG_AND_DOUSE_REWARD_ID = "wildfire:camp-lantern";
const ORIGINAL_LEVEL_ID = "painted-hillside";
function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}
function ids(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      ]
    : [];
}
/** Version-one saves can only describe victories in the original single level. */
export function loadDigAndDouseProgress(raw: unknown): DigAndDouseProgress {
  const value =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const firesExtinguished = nonNegativeInteger(value.firesExtinguished);
  const completedLevelIds =
    value.version === 2
      ? ids(value.completedLevelIds)
      : firesExtinguished > 0
        ? [ORIGINAL_LEVEL_ID]
        : [];
  return {
    version: 2,
    firesExtinguished,
    bestCanteens:
      value.version === 2
        ? nonNegativeInteger(value.bestCanteens)
        : Math.min(TOTAL_CANTEENS, nonNegativeInteger(value.bestCanteens)),
    totalCanteens: nonNegativeInteger(value.totalCanteens),
    ownedRewardIds: ids(value.ownedRewardIds),
    completedLevelIds,
    unlockedLevelIds: [
      ...new Set([...ids(value.unlockedLevelIds), ...completedLevelIds]),
    ],
    ...(typeof value.currentLevelId === "string"
      ? { currentLevelId: value.currentLevelId }
      : {}),
  };
}
export class CampaignProgress {
  constructor(
    readonly progress: DigAndDouseProgress,
    readonly order: readonly string[],
  ) {}
  reconcile(): void {
    const unlocked = new Set(this.progress.unlockedLevelIds);
    if (this.order[0]) unlocked.add(this.order[0]);
    for (let index = 0; index < this.order.length; index++) {
      const id = this.order[index];
      if (this.progress.completedLevelIds.includes(id)) {
        unlocked.add(id);
        if (this.order[index + 1]) unlocked.add(this.order[index + 1]);
      }
    }
    this.progress.unlockedLevelIds = [...unlocked];
  }
  canPlay(id: string): boolean {
    return (
      this.order.includes(id) && this.progress.unlockedLevelIds.includes(id)
    );
  }
  complete(id: string): void {
    if (!this.order.includes(id)) return;
    if (!this.progress.completedLevelIds.includes(id))
      this.progress.completedLevelIds.push(id);
    this.reconcile();
  }
  initial(): string | undefined {
    this.reconcile();
    const current = this.progress.currentLevelId;
    return current && this.canPlay(current) ? current : this.order[0];
  }
}
