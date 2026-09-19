/** Shared lifecycle boundary; transient boards and simulations remain game-specific. */
export interface GameSession {
  setPaused(paused: boolean): void;
  setMuted(muted: boolean): void;
  flushProgress(): void;
  dispose(): void;
  status?(): unknown;
}

/** Application services offered to a game without exposing the profile implementation. */
export interface GameHostServices<TProgress> {
  readonly progress: Readonly<TProgress>;
  readonly muted: boolean;
  readonly reducedMotion: boolean;
  /** Account-wide active-play total used for idempotent currency credit. */
  readonly activePlaySeconds: number;
  exit(): void;
  notify(message: string): void;
  saveProgress(progress: TProgress): void;
  /** Credits an account-wide monotonic total, never a replayable delta. */
  creditActivePlay(totalSeconds: number): number;
  awardReward(rewardId: string): boolean;
}
