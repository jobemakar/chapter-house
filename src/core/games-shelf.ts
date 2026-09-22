import type { GameSession } from "@chapter-house/game-host";
import { browserStorage, ProfileRepository } from "./profile";
import { IntegratedGames, type IntegratedGameId } from "./integrated-games";

/**
 * Keeps play available in embedded or managed browsers that intentionally do
 * not expose WebGL. It uses the same local profile as the clubhouse; only the
 * 3D room, town, and collection presentation are unavailable here.
 */
export class GamesShelf {
  private readonly profile = new ProfileRepository(browserStorage());
  private game: GameSession | null = null;
  private loadToken = 0;

  constructor(private readonly root: HTMLElement) {
    root.addEventListener("click", this.handleClick);
    this.profile.subscribe(() => this.refreshChrome());
    this.renderMenu();
  }

  private handleClick = (event: Event) => {
    const action = (event.target as Element).closest<HTMLElement>(
      "[data-games-action]",
    );
    if (!action) return;
    if (action.dataset.gamesAction === "play")
      void this.open(action.dataset.id as IntegratedGameId);
    if (action.dataset.gamesAction === "back") this.closeGame();
    if (action.dataset.gamesAction === "sound") {
      this.profile.state.muted = !this.profile.state.muted;
      this.profile.save();
      this.game?.setMuted(this.profile.state.muted);
    }
  };

  private renderMenu(message = "") {
    this.game?.dispose();
    this.game = null;
    this.root.innerHTML = `<main class="games-shelf"><header class="games-shelf-header"><div><span class="eyebrow">CHAPTER HOUSE</span><h1>Games are ready to play.</h1><p>The 3D clubhouse needs WebGL in this browser, but your game progress and coins still save here.</p></div><button class="icon-button" data-games-action="sound" aria-label="Toggle sound" aria-pressed="${String(!this.profile.state.muted)}">${this.profile.state.muted ? "♩" : "♪"}</button></header>${message ? `<p class="games-shelf-notice" role="status">${message}</p>` : ""}<section class="games-shelf-list" aria-label="Available games">${IntegratedGames.entries.map((game) => `<article class="games-shelf-card"><img src="${game.cardArtUrl}" alt="${game.cardArtAlt}"><div><span>${game.book}</span><h2>${game.title}</h2><p>${game.heading}</p><button class="primary" data-games-action="play" data-id="${game.id}">Let’s play</button></div></article>`).join("")}</section></main>`;
    this.refreshChrome();
  }

  private refreshChrome() {
    const sound = this.root.querySelector<HTMLButtonElement>(
      '[data-games-action="sound"]',
    );
    if (!sound) return;
    sound.textContent = this.profile.state.muted ? "♩" : "♪";
    sound.setAttribute("aria-pressed", String(!this.profile.state.muted));
  }

  private async open(id: IntegratedGameId) {
    const adapter = IntegratedGames.get(id);
    if (!adapter) return;
    this.game?.dispose();
    this.game = null;
    const loadToken = ++this.loadToken;
    this.root.innerHTML = `<main class="games-shelf games-shelf-playing"><header class="games-shelf-header"><button class="text-button" data-games-action="back">← All games</button><button class="icon-button" data-games-action="sound" aria-label="Toggle sound">${this.profile.state.muted ? "♩" : "♪"}</button></header><div class="game-host"><div class="game-loading" role="status">Opening ${adapter.definition.title}…</div></div></main>`;
    try {
      const createGame = await adapter.load();
      if (loadToken !== this.loadToken) return;
      const host = this.root.querySelector<HTMLElement>(".game-host")!;
      this.game = createGame(host, {
        progress: this.profile.gameProgress(id),
        muted: this.profile.state.muted,
        reducedMotion: this.profile.state.reduced,
        activePlaySeconds: this.profile.state.activeSeconds,
        exit: () => this.closeGame(),
        notify: (message) => this.showNotice(message),
        saveProgress: (progress) => this.profile.saveGameProgress(id, progress),
        creditActivePlay: (total) => this.profile.creditActivity(total),
        awardReward: (rewardId) => this.profile.awardGameReward(id, rewardId),
      });
    } catch (error) {
      console.error("Unable to open integrated game", error);
      if (loadToken === this.loadToken)
        this.renderMenu(`We couldn’t open ${adapter.definition.title}. Try another game or reload this page.`);
    }
  }

  private closeGame() {
    this.loadToken++;
    this.renderMenu();
  }

  private showNotice(message: string) {
    const notice = this.root.querySelector<HTMLElement>(".games-shelf-notice");
    if (notice) notice.textContent = message;
  }
}
