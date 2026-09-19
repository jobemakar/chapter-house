import { GummyNookGame, loadGummyNookProgress, GUMMY_NOOK_LEGACY_SAVE_KEY, GUMMY_NOOK_SAVE_KEY, type GummyNookProgress } from "./index";
import type { GameHostServices } from "@chapter-house/game-host";

// Preserve the canonical standalone key; the old v1 record is deliberately retained.
const standaloneKey = GUMMY_NOOK_SAVE_KEY;
function read(key: string): unknown { try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; } }
const v2 = read(GUMMY_NOOK_SAVE_KEY);
const legacy = v2 ? null : read(GUMMY_NOOK_LEGACY_SAVE_KEY);
const initial = loadGummyNookProgress(read(standaloneKey) ?? v2 ?? legacy);
const host: GameHostServices<GummyNookProgress> = {
  progress: initial,
  muted: false,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  activePlaySeconds: 0,
  exit: () => { window.location.hash = "exit"; },
  notify: message => console.info(message),
  saveProgress: progress => localStorage.setItem(standaloneKey, JSON.stringify(progress)),
  creditActivePlay: total => Math.floor(total),
  awardReward: () => true,
};
new GummyNookGame(document.getElementById("gummy-nook-root")!, host);
