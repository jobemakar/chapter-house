import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { ContraptionGame } from "./game";
import type { ContraptionProgress } from "./progress";
import type { Level } from "./types";

class EmptyCatalogSession implements GameSession {
  constructor(
    private target: HTMLElement,
    services: GameHostServices<ContraptionProgress>,
    diagnostics: string[],
  ) {
    const box = document.createElement("section"),
      message = document.createElement("p"),
      exit = document.createElement("button");
    box.className = "contraption-game";
    message.textContent =
      "No playable machines are included yet." +
      (diagnostics.length ? ` ${diagnostics.join(" · ")}` : "");
    exit.textContent = "Back";
    exit.onclick = () => services.exit();
    box.append(message, exit);
    target.replaceChildren(box);
  }
  setPaused(_p: boolean) {}
  setMuted(_m: boolean) {}
  flushProgress() {}
  dispose() {
    this.target.replaceChildren();
  }
}
export function createContraptionSession(
  target: HTMLElement,
  services: GameHostServices<ContraptionProgress>,
  catalog: { levels: Level[]; diagnostics: string[] },
): GameSession {
  if (!catalog.levels.length)
    return new EmptyCatalogSession(target, services, catalog.diagnostics);
  const game = new ContraptionGame(target, services, catalog.levels);
  if (catalog.diagnostics.length) {
    const p = document.createElement("p");
    p.setAttribute("role", "status");
    p.textContent = `Some machines could not load: ${catalog.diagnostics.join(" · ")}`;
    target.append(p);
  }
  return game;
}
