import type { GameHostServices } from "@chapter-house/game-host";
import { WishboneGame } from "../game";
import { playableYard, type LevelFile } from "../level-files";
import { loadWishboneProgress } from "../progress";
import type { WishboneProgress } from "../progression";
import type { YardDefinition } from "../types";

/** Disposable production gameplay. Its service boundary deliberately has no effects. */
export class EditorPlaytest {
  private game?: WishboneGame;
  private definition?: YardDefinition;
  private paused = false;
  private readonly events = new AbortController();

  constructor(
    private readonly host: HTMLElement,
    private readonly onStatus: (paused: boolean) => void,
    private readonly onExit: () => void,
  ) {
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.game) queueMicrotask(() => this.syncPause());
    }, { signal: this.events.signal });
  }

  start(file: LevelFile): void {
    this.stop();
    this.definition = playableYard(structuredClone(file));
    this.create();
  }

  restart(): void { if (this.definition) { this.game?.dispose(); this.create(); } }

  togglePause(): void {
    if (!this.game) return;
    this.syncPause();
    this.paused = !this.paused;
    this.game.setPaused(this.paused);
    this.onStatus(this.paused);
  }

  stop(): void {
    this.game?.dispose();
    this.game = undefined;
    this.definition = undefined;
    this.paused = false;
    this.host.replaceChildren();
    this.onStatus(false);
  }

  dispose(): void { this.stop(); this.events.abort(); }

  private create(): void {
    if (!this.definition) return;
    this.paused = false;
    this.game = new WishboneGame(this.host, playtestServices(this.onExit), { levels: [structuredClone(this.definition)], playtest: true });
    this.onStatus(false);
  }

  private syncPause(): void {
    const status = this.game?.status() as { paused?: boolean } | undefined;
    if (typeof status?.paused === "boolean") this.paused = status.paused;
    this.onStatus(this.paused);
  }
}

function playtestServices(onExit: () => void): GameHostServices<WishboneProgress> {
  return {
    progress: loadWishboneProgress(undefined), muted: false, reducedMotion: false, activePlaySeconds: 0,
    exit: onExit, notify: () => {}, saveProgress: () => {}, creditActivePlay: () => 0, awardReward: () => false,
  };
}
