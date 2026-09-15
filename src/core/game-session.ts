/** Shared lifecycle boundary for book games; transient boards stay game-specific. */
export interface GameSession {
  setPaused(paused: boolean): void;
  setMuted(muted: boolean): void;
  flushProgress(): void;
  dispose(): void;
}
