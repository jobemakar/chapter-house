import "./style.css";
import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { GummyNookGame } from "./game";
import type { GummyNookProgress } from "./progress";
export { GummyNookGame };
/** Integrated entry: the Chapter House lazy loader mounts the same class as standalone. */
export function createGummyNookGame(root: HTMLElement, host: GameHostServices<GummyNookProgress>): GameSession {
  return new GummyNookGame(root, host);
}
export { loadGummyNookProgress, GUMMY_NOOK_REWARD_IDS, GUMMY_NOOK_SAVE_KEY, GUMMY_NOOK_LEGACY_SAVE_KEY } from "./progress";
export type { GummyNookProgress } from "./progress";
export { gummyNookManifest } from "./manifest";
