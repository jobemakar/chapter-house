export const VEDA_SAVE_KEY = "veda-great-escape.v1";
export const VEDA_REWARD_IDS = ["vedas-great-escape:leafy-bench", "vedas-great-escape:elephant-fountain"] as const;

export interface VedaProgress {
  version: 1;
  level: number;
  unlocked: number;
  completed: number[];
  bestMoves: Array<number | null>;
  bestPeaches: number[];
  ownedRewardIds: string[];
  muted: boolean;
}

export function freshVedaProgress(): VedaProgress {
  return { version: 1, level: 0, unlocked: 0, completed: [], bestMoves: [null, null, null, null, null], bestPeaches: [0, 0, 0, 0, 0], ownedRewardIds: [], muted: true };
}

const integer = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

export function loadVedaProgress(raw: unknown): VedaProgress {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const progress = freshVedaProgress();
  progress.level = Math.min(4, integer(source.level));
  progress.unlocked = Math.min(4, integer(source.unlocked));
  progress.completed = [...new Set((Array.isArray(source.completed) ? source.completed : []).filter((value): value is number => Number.isInteger(value) && value >= 0 && value < 5))];
  progress.bestMoves = Array.from({ length: 5 }, (_, index) => {
    const value = Array.isArray(source.bestMoves) ? source.bestMoves[index] : null;
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  });
  progress.bestPeaches = Array.from({ length: 5 }, (_, index) => integer(Array.isArray(source.bestPeaches) ? source.bestPeaches[index] : 0));
  progress.ownedRewardIds = [...new Set((Array.isArray(source.ownedRewardIds) ? source.ownedRewardIds : []).filter((value): value is string => typeof value === "string" && (VEDA_REWARD_IDS as readonly string[]).includes(value)))];
  progress.muted = typeof source.muted === "boolean" ? source.muted : true;
  if (progress.completed.length >= 2 && !progress.ownedRewardIds.includes(VEDA_REWARD_IDS[0])) progress.ownedRewardIds.push(VEDA_REWARD_IDS[0]);
  if (progress.completed.length >= 5 && !progress.ownedRewardIds.includes(VEDA_REWARD_IDS[1])) progress.ownedRewardIds.push(VEDA_REWARD_IDS[1]);
  progress.unlocked = Math.max(progress.unlocked, Math.min(4, progress.completed.length));
  return progress;
}
