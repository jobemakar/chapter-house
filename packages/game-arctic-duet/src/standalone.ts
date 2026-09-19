import { createArcticDuetGame, ARCTIC_DUET_SAVE_KEY, loadArcticDuetProgress, type ArcticDuetProgress } from "./index";
import type { GameHostServices } from "@chapter-house/game-host";

let activePlaySeconds = 0;
function read(): ArcticDuetProgress {
  try { return loadArcticDuetProgress(JSON.parse(localStorage.getItem(ARCTIC_DUET_SAVE_KEY) ?? "null")); }
  catch { return loadArcticDuetProgress(null); }
}
const host: GameHostServices<ArcticDuetProgress> = {
  progress: read(),
  muted: false,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  activePlaySeconds,
  exit: () => { window.location.hash = "exit"; },
  notify: (message) => console.info(message),
  saveProgress: (progress) => { try { localStorage.setItem(ARCTIC_DUET_SAVE_KEY, JSON.stringify(progress)); } catch { /* storage denial leaves play intact */ } },
  creditActivePlay: (total) => (activePlaySeconds = Math.max(activePlaySeconds, Math.floor(total))),
  awardReward: () => true,
};
createArcticDuetGame(document.getElementById("arctic-duet-root")!, host);
