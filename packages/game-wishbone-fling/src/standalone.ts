import type { GameHostServices } from "@chapter-house/game-host";
import { loadWishboneFling, loadWishboneProgress, type WishboneProgress } from "./index";
const key = "chapter-house:wishbone-fling:standalone-progress";
let saved: WishboneProgress;
try { saved = loadWishboneProgress(JSON.parse(localStorage.getItem(key) ?? "null")); } catch { saved = loadWishboneProgress(null); }
const host: GameHostServices<WishboneProgress> = {
  progress: saved, muted: saved.muted, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches, activePlaySeconds: 0,
  exit: () => { window.location.hash = "exit"; }, notify: console.info,
  saveProgress: (value) => localStorage.setItem(key, JSON.stringify(value)),
  creditActivePlay: (value) => Math.floor(value), awardReward: () => true,
};
const root = document.getElementById("wishbone-fling-root");
if (!root) throw new Error("Missing #wishbone-fling-root");
const { WishboneGame } = await loadWishboneFling();
new WishboneGame(root, host);
