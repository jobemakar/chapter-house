import { createStormglideGame, loadStormglideProgress, toLegacyStormglideSave, type StormglideProgress } from "./index";
import type { GameHostServices } from "@chapter-house/game-host";
const key = "chapter-house:stormglide:standalone-progress";
let active = 0;
function read(): StormglideProgress { try { return loadStormglideProgress(JSON.parse(localStorage.getItem(key) ?? "null")); } catch { return loadStormglideProgress(null); } }
const host: GameHostServices<StormglideProgress> = { progress: read(), muted: false, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches, activePlaySeconds: active, exit: () => { window.location.hash = "exit"; }, notify: (message) => console.info(message), saveProgress: (progress) => { try { localStorage.setItem(key, JSON.stringify(toLegacyStormglideSave(progress))); } catch { /* storage is optional */ } }, creditActivePlay: (total) => active = Math.max(active, Math.floor(total)), awardReward: () => true };
createStormglideGame(document.getElementById("stormglide-root")!, host);
