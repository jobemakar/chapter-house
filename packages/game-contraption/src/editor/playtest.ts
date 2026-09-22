import type { GameHostServices } from "@chapter-house/game-host";
import { ContraptionGame } from "../game";
import { freshContraptionProgress } from "../progress";
import { clone } from "../levels";
import { cloneLevelForPlaytest } from "./model";
import type { Level } from "../types";

/** Starts the production game with isolated state and services that discard every write. */
export class EditorPlaytest {
  private session?: ContraptionGame;
  private baseline?: Level;
  constructor(private host: HTMLElement, private onExit: () => void = () => this.stop()) {}
  start(level: Level): void {
    this.stop();
    this.baseline = cloneLevelForPlaytest(level);
    this.launch();
  }
  restart(): void {
    if (this.baseline) {
      const copy = clone(this.baseline);
      this.stopSession();
      this.baseline = copy;
      this.launch();
    }
  }
  stop(): void {
    this.stopSession();
    this.baseline = undefined;
  }
  dispose(): void {
    this.stop();
  }
  private launch(): void {
    if (!this.baseline) return;
    const services: GameHostServices<
      ReturnType<typeof freshContraptionProgress>
    > = {
      progress: freshContraptionProgress(),
      muted: true,
      reducedMotion: false,
      activePlaySeconds: 0,
      exit: () => this.onExit(),
      notify: () => undefined,
      saveProgress: () => undefined,
      creditActivePlay: () => 0,
      awardReward: () => false,
    };
    this.session = new ContraptionGame(this.host, services, [
      cloneLevelForPlaytest(this.baseline),
    ]);
    const exit = this.host.querySelector<HTMLButtonElement>("[data-a=exit]");
    if (exit) exit.textContent = "Stop test";
  }
  private stopSession(): void {
    this.session?.dispose();
    this.session = undefined;
    this.host.replaceChildren();
  }
}
