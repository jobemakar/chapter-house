import { MoonlightMunchRunGame } from "./game";
import { loadMoonlightMunchRunProgress, type MoonlightMunchRunProgress } from "./progress";
import type { GameHostServices } from "@chapter-house/game-host";
import "./style.css";

const key = "chapter-house:moonlight-munch-run:standalone-progress";
function stored(): MoonlightMunchRunProgress {
  try { return loadMoonlightMunchRunProgress(JSON.parse(localStorage.getItem(key) ?? "null")); }
  catch { return loadMoonlightMunchRunProgress(null); }
}
const progress = stored();
const host: GameHostServices<MoonlightMunchRunProgress> = {
  progress, muted: progress.muted, reducedMotion: progress.reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches,
  activePlaySeconds: 0,
  exit: () => { window.location.hash = "exit"; }, notify: (message) => console.info(message),
  saveProgress: (next) => localStorage.setItem(key, JSON.stringify(next)),
  creditActivePlay: (seconds) => Math.floor(seconds), awardReward: () => true,
};
new MoonlightMunchRunGame(document.querySelector<HTMLElement>("#moonlight-munch-run-root")!, host);
