import "./style.css";
import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { ArcticDuetGame } from "./game";
import type { ArcticDuetProgress } from "./progress";

/** Lazy integrated entry. Standalone invokes the same game class through its thin adapter. */
export function createArcticDuetGame(
  root: HTMLElement,
  services: GameHostServices<ArcticDuetProgress>,
): GameSession {
  return new ArcticDuetGame(root, services);
}

export { ArcticDuetGame };
export { ARCTIC_DUET_REWARDS, ARCTIC_DUET_SAVE_KEY, loadArcticDuetProgress } from "./progress";
export type { ArcticDuetProgress } from "./progress";
export { default as arcticDuetCardArt } from "./assets/card-art.svg";
export { arcticDuetManifest } from "./manifest";
export type { ArcticDuetManifest } from "./manifest";
