import "./style.css";
import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { StormglideGame } from "./game";
import type { StormglideProgress } from "./progress";
export function createStormglideGame(root: HTMLElement, services: GameHostServices<StormglideProgress>): GameSession { return new StormglideGame(root, services); }
export { StormglideGame };
export { STORMGLIDE_REWARDS, STORMGLIDE_SAVE_KEY, loadStormglideProgress, toLegacyStormglideSave } from "./progress";
export type { StormglideProgress } from "./progress";
export { stormglideManifest } from "./manifest";
export type { StormglideManifest } from "./manifest";
