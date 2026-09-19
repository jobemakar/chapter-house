import {
  DigAndDouseGame,
  loadDigAndDouseProgress,
  type DigAndDouseProgress,
} from "./index";
import type { GameHostServices } from "@chapter-house/game-host";

const key = "chapter-house:dig-and-douse:standalone-progress";
function readStoredProgress(): DigAndDouseProgress {
  try {
    return loadDigAndDouseProgress(
      JSON.parse(localStorage.getItem(key) ?? "null"),
    );
  } catch {
    return loadDigAndDouseProgress(null);
  }
}
const stored = readStoredProgress();
const host: GameHostServices<DigAndDouseProgress> = {
  progress: stored,
  muted: false,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  activePlaySeconds: 0,
  exit: () => {
    window.location.hash = "exit";
  },
  notify: (message) => console.info(message),
  saveProgress: (progress) =>
    localStorage.setItem(key, JSON.stringify(progress)),
  creditActivePlay: (total) => Math.floor(total),
  awardReward: () => true,
};
void new DigAndDouseGame(document.getElementById("dig-and-douse-root")!, host)
  .ready;
