import type { KeyfallProgress } from "./types";
export type { KeyfallProgress } from "./types";
export const SAVE_KEY = "chapter-house:keyfall-prototype:v1";
export function emptyProgress(): KeyfallProgress { return { version: 1, completed: [], bestTickets: {}, muted: false, reducedMotion: false }; }
export function normalizeProgress(value: unknown): KeyfallProgress {
  const fallback = emptyProgress();
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<KeyfallProgress>;
  return { version: 1, completed: Array.isArray(candidate.completed) ? candidate.completed.filter((id): id is string => typeof id === "string") : [], bestTickets: candidate.bestTickets && typeof candidate.bestTickets === "object" ? Object.fromEntries(Object.entries(candidate.bestTickets).filter(([id, score]) => typeof id === "string" && typeof score === "number" && Number.isFinite(score)).map(([id, score]) => [id, Math.max(0, Math.min(3, Math.floor(score as number)))])) : {}, muted: candidate.muted === true, reducedMotion: candidate.reducedMotion === true };
}
export function recordCompletion(progress: KeyfallProgress, roomId: string, tickets: number): KeyfallProgress { const completed = progress.completed.includes(roomId) ? progress.completed : [...progress.completed, roomId]; return { ...progress, completed, bestTickets: { ...progress.bestTickets, [roomId]: Math.max(progress.bestTickets[roomId] ?? 0, Math.min(3, Math.max(0, Math.floor(tickets)))) } }; }
export function completedRoom(progress: KeyfallProgress, roomId: string): boolean { return progress.completed.includes(roomId); }

/** Host-facing names keep Keyfall aligned with the other integrated packages. */
export const loadKeyfallProgress = normalizeProgress;
export const freshKeyfallProgress = emptyProgress;
export const KEYFALL_SAVE_KEY = SAVE_KEY;
