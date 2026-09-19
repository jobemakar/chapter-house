import { VedasGreatEscapeGame } from "./index";
import { loadVedaProgress, VEDA_SAVE_KEY, type VedaProgress } from "./progress";
import type { GameHostServices } from "@chapter-house/game-host";

let stored: VedaProgress;
try { stored = loadVedaProgress(JSON.parse(localStorage.getItem(VEDA_SAVE_KEY) ?? "null")); }
catch { stored = loadVedaProgress(null); }
let activePlaySeconds = 0;
const services: GameHostServices<VedaProgress> = {
  progress: stored,
  muted: stored.muted,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  activePlaySeconds,
  exit: () => { location.hash = "exit"; },
  notify: (message) => console.info(message),
  saveProgress: (progress) => localStorage.setItem(VEDA_SAVE_KEY, JSON.stringify(progress)),
  creditActivePlay: (total) => { activePlaySeconds = Math.max(activePlaySeconds, total); return activePlaySeconds; },
  awardReward: () => true,
};
new VedasGreatEscapeGame(document.getElementById("veda-root")!, services, { showStandaloneControls: true });
