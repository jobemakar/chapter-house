import { GummyBoard, LEGACY_REWARDS, type GameState, type GummySettings } from "./engine";

export type GummyNookProgress = GameState;
export const GUMMY_NOOK_SAVE_KEY = "bob-gummy-nook-v2";
export const GUMMY_NOOK_LEGACY_SAVE_KEY = "bob-gummy-nook-v1";
export const GUMMY_NOOK_REWARD_IDS = {
  candyJar: "gummy-nook:gn-candy-jar",
  gummyLamp: "gummy-nook:gn-gummy-lamp",
  sockCushion: "gummy-nook:gn-sock-cushion",
  bearBeanbag: "gummy-nook:gn-bear-beanbag",
} as const;

export const rewardIdForLegacy = (legacyId: string): string | null => {
  const suffix = legacyId.replace(/^gn-/, "");
  return Object.values(GUMMY_NOOK_REWARD_IDS).find(id => id === `gummy-nook:gn-${suffix}`) ?? null;
};

const settings = (raw: unknown, base: GummySettings): GummySettings => {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return { muted: typeof record.muted === "boolean" ? record.muted : base.muted, music: typeof record.music === "boolean" ? record.music : base.music, motion: typeof record.motion === "boolean" ? record.motion : base.motion, gloss: typeof record.gloss === "boolean" ? record.gloss : base.gloss };
};
const integer = (value: unknown, fallback: number): number => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : fallback;
const recordOf = (raw: unknown): Record<string, unknown> | null => raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : null;

/** Validates v2 and imports only durable v1 discoveries/settings/keepsakes. Never reads storage. */
export function loadGummyNookProgress(raw: unknown): GummyNookProgress {
  const state = GummyBoard.fresh();
  const record = recordOf(raw);
  if (!record || (record.version !== 1 && record.version !== 2)) return state;
  if (record.version === 2) {
    const board = record.board;
    if (Array.isArray(board) && board.length === GummyBoard.count && board.every(GummyBoard.valid) && !GummyBoard.matches(board).length && GummyBoard.legalMoves(board).length) state.board = [...board];
    state.cleared = integer(record.cleared, state.cleared);
    state.moves = integer(record.moves, state.moves);
    state.bestCascade = integer(record.bestCascade, state.bestCascade);
  }
  if (Array.isArray(record.discovered)) state.discovered = record.discovered.filter(value => Number.isInteger(value) && (value as number) >= 0 && (value as number) < 7) as number[];
  if (Array.isArray(record.owned)) state.owned = record.owned.filter((value): value is string => typeof value === "string" && (LEGACY_REWARDS as readonly string[]).includes(value));
  if (record.version === 1) for (const reward of LEGACY_REWARDS) if (!state.owned.includes(reward) && state.discovered.includes([2,3,4,6][LEGACY_REWARDS.indexOf(reward)])) state.owned.push(reward);
  state.settings = settings(record.settings, state.settings);
  GummyBoard.synchronize(state);
  return state;
}

/** Produces a serializable copy so a host cannot retain mutable board references. */
export function serializeGummyNookProgress(progress: GummyNookProgress): GummyNookProgress {
  return loadGummyNookProgress(JSON.parse(JSON.stringify(progress)));
}
