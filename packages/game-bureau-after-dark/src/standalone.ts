import type { GameHostServices } from "@chapter-house/game-host";
import { loadBureauAfterDark, loadBureauAfterDarkProgress, type BureauAfterDarkProgress } from "./index";

const key = "chapter-house:bureau-after-dark:standalone-progress";
let progress: BureauAfterDarkProgress;
try { progress = loadBureauAfterDarkProgress(JSON.parse(localStorage.getItem(key) ?? "null")); } catch { progress = loadBureauAfterDarkProgress(null); }
const host: GameHostServices<BureauAfterDarkProgress> = {
  progress, muted: false, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches, activePlaySeconds: 0,
  exit: () => { window.location.hash = "exit"; }, notify: console.info,
  saveProgress: (value) => localStorage.setItem(key, JSON.stringify(value)),
  creditActivePlay: (total) => Math.floor(total), awardReward: () => true,
};
const root = document.getElementById("bureau-after-dark-root");
if (!root) throw new Error("Missing #bureau-after-dark-root");
const { BureauAfterDarkGame } = await loadBureauAfterDark();
new BureauAfterDarkGame(root, host);
