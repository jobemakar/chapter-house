import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import sanctuaryUrl from "./assets/sanctuary.png";
import { DIRECTIONS, HEIGHT, isOpen, LEVELS, parseLevel, solve, step, WIDTH, type Direction, type PuzzleState } from "./core";
import { loadVedaProgress, VEDA_REWARD_IDS, type VedaProgress } from "./progress";
import { VedaAudio, type VedaSurface } from "./audio";
import { VEDA_ASSET_CATALOG, VedaAssetLoader } from "./assets";
import { fitVedaBoardWidth, vedaTerrainEnvironment, VedaEffects, VedaMotionController, VedaSpriteRenderer } from "./renderer";

const required = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Veda's Great Escape is missing ${selector}`);
  return element;
};
const position = (cell: number): string => `left:${cell % WIDTH / WIDTH * 100}%;top:${Math.floor(cell / WIDTH) / HEIGHT * 100}%;`;
const clone = (state: PuzzleState): PuzzleState => structuredClone(state);
let nextVedaInstanceId = 1;

export interface VedaGameOptions {
  showStandaloneControls?: boolean;
  onMutedChanged?: (muted: boolean) => void;
}

/** One typed game implementation shared by the standalone build and Chapter House. */
export class VedasGreatEscapeGame implements GameSession {
  readonly root: HTMLElement;
  readonly progress: VedaProgress;
  private state: PuzzleState;
  private history: PuzzleState[] = [];
  private selected = false;
  private readonly reducedMotion: boolean;
  private readonly sprites = new VedaSpriteRenderer(VEDA_ASSET_CATALOG);
  private readonly assetLoader = new VedaAssetLoader(VEDA_ASSET_CATALOG);
  private readonly motion: VedaMotionController;
  private readonly effects: VedaEffects;
  private paused = false;
  private hostPaused = false;
  private visibilityPaused = false;
  private disposed = false;
  private muted: boolean;
  private readonly audio: VedaAudio;
  private readonly abort = new AbortController();
  private hintTimer = 0;
  private hintGeneration = 0;
  private touch: { x: number; y: number; cell: number | null } | null = null;
  private activeTotal: number;
  private creditedTotal: number;
  private activeRemaining = 0;
  private lastFrame = 0;
  private frameId = 0;
  private motionRenderKey = "";
  private dirty = false;
  private readonly board: HTMLElement;
  private readonly dialog: HTMLDialogElement;
  private readonly helpDialog: HTMLDialogElement;
  private readonly messageElement: HTMLElement;
  private readonly resizeObserver: ResizeObserver;
  private resizeFrame = 0;
  private boardWidth = 0;
  private assetsReady = false;
  private assetsFailed = false;
  private completionAudioLevel: number | null = null;

  constructor(target: HTMLElement, private readonly services: GameHostServices<VedaProgress>, private readonly options: VedaGameOptions = {}) {
    this.progress = loadVedaProgress(services.progress);
    this.state = parseLevel(LEVELS[this.progress.level]!);
    this.muted = services.muted;
    this.reducedMotion = services.reducedMotion || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    this.motion = new VedaMotionController(this.reducedMotion);
    this.audio = new VedaAudio(this.muted);
    this.activeTotal = services.activePlaySeconds;
    this.creditedTotal = Math.floor(this.activeTotal);
    this.root = document.createElement("section");
    this.root.className = "veda-game";
    this.root.classList.toggle("is-standalone", options.showStandaloneControls === true);
    this.root.dataset.reducedMotion = String(this.reducedMotion);
    this.root.dataset.assets = "loading";
    this.root.setAttribute("aria-busy", "true");
    this.root.innerHTML = markup(sanctuaryUrl, nextVedaInstanceId++);
    target.replaceChildren(this.root);
    this.board = required(this.root, "[data-veda='board']");
    this.board.dataset.reducedMotion = String(this.reducedMotion);
    this.board.setAttribute("aria-disabled", "true");
    this.effects = new VedaEffects(this.board, WIDTH, HEIGHT, this.reducedMotion);
    this.dialog = required(this.root, "[data-veda='win']");
    this.helpDialog = required(this.root, "[data-veda='help-dialog']");
    this.messageElement = required(this.root, "[data-veda='message']");
    this.resizeObserver = new ResizeObserver(() => this.scheduleFit());
    this.resizeObserver.observe(this.root);
    if (!options.showStandaloneControls) {
      required<HTMLElement>(this.root, "[data-veda='exit']").hidden = true;
      required<HTMLElement>(this.root, "[data-veda='sound']").hidden = true;
    }
    this.visibilityPaused = document.hidden;
    this.bind();
    this.loadLevel(this.progress.level, false);
    this.syncPausedState();
    this.fitBoard();
    void this.loadAssets();
    this.scheduleFrame();
  }

  private async loadAssets(): Promise<void> {
    try {
      await this.assetLoader.load();
    } catch {
      if (this.disposed) return;
      this.assetsFailed = true;
    }
    if (this.disposed) return;
    this.assetsReady = true;
    this.root.dataset.assets = this.assetsFailed ? "fallback" : "ready";
    this.root.setAttribute("aria-busy", "false");
    this.board.setAttribute("aria-disabled", String(this.paused));
    this.draw(true);
    this.message(this.assetsFailed ? "Illustrations are unavailable, so Veda is using a simple map." : LEVELS[this.progress.level]!.tip);
    this.scheduleFit();
  }

  setPaused(paused: boolean): void {
    if (this.disposed) return;
    this.hostPaused = paused;
    this.syncPausedState();
  }

  private syncPausedState(): void {
    const paused = this.hostPaused || this.visibilityPaused;
    if (paused === this.paused) return;
    this.paused = paused;
    this.lastFrame = 0;
    this.touch = null;
    if (paused && this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
    this.root.classList.toggle("is-paused", paused);
    this.board.setAttribute("aria-disabled", String(paused));
    if (paused) {
      this.clearTransient(true);
      this.audio.suspend();
    } else {
      this.audio.resume();
      this.scheduleFrame();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.progress.muted = muted;
    this.audio.setMuted(muted);
    this.options.onMutedChanged?.(muted);
    this.syncSound();
    this.persist();
  }

  flushProgress(): void {
    this.creditActivity();
    if (!this.dirty) return;
    this.services.saveProgress(loadVedaProgress(this.progress));
    this.dirty = false;
  }

  status(): unknown {
    return { level: this.progress.level + 1, moves: this.state.moves, peaches: this.state.taken, completed: this.progress.completed.length, paused: this.paused, activePlaySeconds: Math.floor(this.activeTotal) };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    cancelAnimationFrame(this.resizeFrame);
    this.resizeObserver.disconnect();
    this.clearTransient(true);
    this.effects.dispose();
    this.abort.abort();
    if (this.dialog.open) this.dialog.close();
    this.flushProgress();
    this.audio.dispose();
    this.root.remove();
  }

  private bind(): void {
    const signal = this.abort.signal;
    const click = (name: string, handler: () => void) => required<HTMLButtonElement>(this.root, `[data-veda='${name}']`).addEventListener("click", handler, { signal });
    click("undo", () => { if (this.assetsReady) this.undo(); });
    click("restart", () => { if (this.assetsReady) this.loadLevel(this.progress.level); });
    click("hint", () => this.hint());
    click("help", () => this.helpDialog.showModal());
    click("help-close", () => this.helpDialog.close());
    click("continue", () => this.loadLevel(this.progress.level === 4 ? 0 : this.progress.level + 1));
    click("stay", () => { this.dialog.close(); this.undo(); });
    this.dialog.addEventListener("cancel", () => this.clearTransient(true), { signal });
    this.dialog.addEventListener("close", () => this.clearTransient(true), { signal });
    if (this.options.showStandaloneControls) {
      click("sound", () => this.setMuted(!this.muted));
      click("exit", () => this.services.exit());
    }
    required(this.root, "[data-veda='levels']").addEventListener("click", (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-level]");
      if (this.assetsReady && button && !button.disabled) this.loadLevel(Number(button.dataset.level));
    }, { signal });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>("[data-direction]")) button.addEventListener("click", () => this.move(button.dataset.direction as Direction), { signal });
    document.addEventListener("keydown", this.onKeyDown, { signal });
    document.addEventListener("visibilitychange", this.onVisibilityChange, { signal });
    this.board.addEventListener("pointerdown", this.onPointerDown, { signal });
    this.board.addEventListener("pointerup", this.onPointerUp, { signal });
    this.board.addEventListener("pointercancel", () => { this.touch = null; }, { signal });
  }

  private readonly onVisibilityChange = (): void => {
    this.visibilityPaused = document.hidden;
    this.syncPausedState();
  };

  /** Measure the existing grid slot so the 9:7 board is always aspect-fit. */
  private fitBoard(): void {
    if (this.disposed) return;
    const boardStage = this.root.querySelector<HTMLElement>(".board-stage");
    if (!boardStage) return;
    const width = fitVedaBoardWidth(boardStage.clientWidth, boardStage.clientHeight, WIDTH, HEIGHT);
    if (width === this.boardWidth) return;
    this.boardWidth = width;
    if (width > 0) {
      this.board.style.width = `${width}px`;
      this.board.dataset.boardWidth = String(width);
    } else {
      this.board.style.width = "100%";
      delete this.board.dataset.boardWidth;
    }
  }

  private scheduleFit(): void {
    if (this.resizeFrame || this.disposed) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      this.fitBoard();
    });
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.assetsReady || this.paused || this.dialog.open || this.helpDialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    const direction: Direction | undefined = ({ arrowup: "up", w: "up", arrowright: "right", d: "right", arrowdown: "down", s: "down", arrowleft: "left", a: "left" } as Record<string, Direction>)[key];
    if (direction) { event.preventDefault(); this.move(direction); }
    else if (key === "z") { event.preventDefault(); this.undo(); }
    else if (key === "r") this.loadLevel(this.progress.level);
    else if (key === "h") this.hint();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.assetsReady || this.paused || this.dialog.open || (event.pointerType === "mouse" && event.button !== 0)) return;
    const tile = (event.target as Element).closest<HTMLElement>("[data-cell]");
    this.touch = { x: event.clientX, y: event.clientY, cell: tile ? Number(tile.dataset.cell) : null };
    this.board.setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.touch) return;
    const { x, y, cell } = this.touch;
    this.touch = null;
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 15) this.move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
    else if (cell !== null) this.boardTap(cell);
  };

  private loadLevel(level: number, announce = true): void {
    this.clearTransient(true);
    this.progress.level = Math.max(0, Math.min(4, level));
    this.state = parseLevel(LEVELS[this.progress.level]!);
    this.history = [];
    this.motion.reset("down");
    this.motionRenderKey = "";
    this.selected = false;
    if (this.dialog.open) this.dialog.close();
    this.draw(true);
    this.message(LEVELS[this.progress.level]!.tip);
    if (announce) { this.completionAudioLevel = null; this.audio.levelStart(); this.persist(); }
  }

  private move(direction: Direction): boolean {
    if (!this.assetsReady || this.paused || this.dialog.open || this.helpDialog.open) return false;
    this.cancelHint();
    const next = step(this.state, direction);
    if (!next) {
      const [dx, dy] = DIRECTIONS[direction];
      const attempted = this.state.player + dx + dy * WIDTH;
      if (attempted === this.state.exit && !isOpen(this.state)) {
        this.audio.gateLocked();
        this.effects.trigger("gate-locked", this.state.exit);
      } else {
        this.audio.blocked();
        this.effects.trigger("blocked", this.state.player);
      }
      this.message("No room that way. Try another route, or undo a push.");
      return false;
    }
    const previous = this.state;
    this.history.push(clone(previous));
    this.state = next;
    this.motion.play(direction, next.pushed, performance.now());
    this.selected = false;
    this.markActivity();
    this.draw();
    this.effects.trigger(next.pushed ? "push" : "walk", next.player);
    if (next.pushed) this.audio.push();
    else this.audio.footstep(this.surfaceFor(next.player, next));
    const previousTargets = previous.boxes.filter((box) => previous.targets.includes(box)).length;
    const nextTargets = next.boxes.filter((box) => next.targets.includes(box)).length;
    if (nextTargets > previousTargets) {
      const activated = next.boxes.find((box) => next.targets.includes(box) && !previous.boxes.includes(box));
      this.effects.trigger("switch", activated ?? next.player);
      this.audio.switchOn();
    }
    const tookPeach = next.taken > previous.taken;
    const openedGate = !isOpen(previous) && isOpen(next);
    if (tookPeach) { this.audio.peach(); this.effects.trigger("peach", next.player); }
    if (openedGate) { this.audio.gateOpen(); this.effects.trigger("gate-open", next.exit); }
    if (tookPeach) this.message("A peach for the road. Excellent priorities.");
    else if (openedGate) this.message("The gate is open! Follow the flag to the next adventure.");
    else if (next.pushed) this.message("Nice push. Remember: Veda can push, but she can’t pull crates.");
    else this.message(LEVELS[this.progress.level]!.tip);
    if (next.player === next.exit && isOpen(next)) this.completeLevel();
    return true;
  }

  private surfaceFor(cell: number, state: PuzzleState): VedaSurface {
    if (cell === state.exit) return "wood";
    if (state.targets.includes(cell)) return "stone";
    return "earth";
  }

  private completeLevel(): void {
    const level = this.progress.level;
    if (!this.progress.completed.includes(level)) this.progress.completed.push(level);
    this.progress.unlocked = Math.max(this.progress.unlocked, Math.min(4, level + 1));
    const best = this.progress.bestMoves[level];
    if (best === null || this.state.moves < best) this.progress.bestMoves[level] = this.state.moves;
    this.progress.bestPeaches[level] = Math.max(this.progress.bestPeaches[level]!, this.state.taken);
    this.unlockRewards();
    this.persist();
    this.draw();
    required(this.dialog, "[data-veda='win-label']").textContent = level === 4 ? "WELCOME HOME" : "PATH CLEARED";
    required(this.dialog, "[data-veda='win-title']").textContent = level === 4 ? "Room for one more elephant." : "Big elephant. Clever moves.";
    required(this.dialog, "[data-veda='win-text']").textContent = level === 4 ? `Veda made it to the sanctuary! You solved the final gate in ${this.state.moves} moves.` : `You found the exit in ${this.state.moves} moves and collected ${this.state.taken} peach${this.state.taken === 1 ? "" : "es"}.`;
    required<HTMLButtonElement>(this.dialog, "[data-veda='continue']").textContent = level === 4 ? "Play from the beginning ↻" : "Next adventure →";
    this.root.classList.add("is-complete");
    this.dialog.dataset.completion = "visible";
    this.effects.trigger("completion", this.state.exit);
    this.dialog.showModal();
    if (this.completionAudioLevel !== level) {
      this.completionAudioLevel = level;
      this.audio.completion();
    }
  }

  private unlockRewards(): void {
    const available = this.progress.completed.length >= 5 ? VEDA_REWARD_IDS : this.progress.completed.length >= 2 ? VEDA_REWARD_IDS.slice(0, 1) : [];
    for (const rewardId of available) {
      if (this.progress.ownedRewardIds.includes(rewardId)) continue;
      this.services.awardReward(rewardId);
      this.progress.ownedRewardIds.push(rewardId);
      this.services.notify(rewardId.endsWith("fountain") ? "Veda’s elephant fountain is ready for your corner." : "Veda’s leafy bench is ready for your corner.");
    }
  }

  private undo(): void {
    this.clearTransient(true);
    const previous = this.history.pop();
    if (!previous) return;
    this.completionAudioLevel = null;
    if (this.dialog.open) this.dialog.close();
    this.state = previous;
    this.selected = false;
    this.motion.reset(this.motion.snapshot().direction);
    this.draw();
    this.audio.undo();
    this.message("Rewound one move. Try a different angle.");
  }

  private hint(): void {
    if (!this.assetsReady || this.paused) return;
    this.cancelHint();
    // Unlock synchronously from the button/key gesture; the solver result is intentionally deferred.
    this.audio.start();
    const generation = this.hintGeneration;
    this.message("Finding a way through…");
    this.hintTimer = window.setTimeout(() => {
      if (this.disposed || this.paused || generation !== this.hintGeneration) return;
      const path = solve(this.state);
      if (!path) { this.message("This position is stuck. Undo a few pushes, or restart the level."); return; }
      if (!path.length) { this.message("You’ve already reached the exit. Choose another level to continue."); return; }
      this.root.querySelector(".hint-arrow")?.remove();
      const arrow = document.createElement("span");
      arrow.className = "hint-arrow";
      arrow.dataset.direction = path[0]!;
      arrow.setAttribute("aria-label", `Hint: move ${path[0]}`);
      required(this.root, "[data-veda='player']").append(arrow);
      this.effects.trigger("hint", this.state.player);
      this.audio.hint();
      this.message(`Try moving ${path[0]}. A path to the exit is still possible.`);
      this.hintTimer = window.setTimeout(() => {
        if (generation === this.hintGeneration) arrow.remove();
      }, 2400);
    }, 30);
  }

  private cancelHint(): void {
    this.hintGeneration += 1;
    window.clearTimeout(this.hintTimer);
    this.hintTimer = 0;
    this.root.querySelector(".hint-arrow")?.remove();
  }

  private clearTransient(clearMessage: boolean): void {
    this.cancelHint();
    this.effects.clear();
    this.root.classList.remove("is-complete");
    delete this.dialog.dataset.completion;
    if (clearMessage) {
      this.messageElement.textContent = "";
      this.scheduleFit();
    }
  }

  private boardTap(cell: number): void {
    if (!this.assetsReady) return;
    if (cell === this.state.player) { this.selected = !this.selected; this.draw(); this.message(this.selected ? "Veda is ready. Tap one of the glowing squares to move her." : LEVELS[this.progress.level]!.tip); return; }
    const direction = this.selected ? (Object.keys(DIRECTIONS) as Direction[]).find((candidate) => step(this.state, candidate)?.player === cell) : undefined;
    if (direction) this.move(direction);
    else this.message(this.selected ? "That square is not reachable in one move. Choose a glowing square, or tap Veda again." : "Tap Veda, then tap a glowing destination. You can also swipe the board.");
  }

  private draw(full = false): void {
    required(this.root, "[data-veda='chapter']").textContent = `CHAPTER ${String(this.progress.level + 1).padStart(2, "0")} / 05`;
    required(this.root, "[data-veda='title']").textContent = LEVELS[this.progress.level]!.title;
    required(this.root, "[data-veda='peaches']").textContent = `Peaches ${this.state.taken} / ${this.state.taken + this.state.fruit.length}`;
    required(this.root, "[data-veda='moves']").textContent = `${this.state.moves} moves`;
    required<HTMLButtonElement>(this.root, "[data-veda='undo']").disabled = !this.history.length;
    const levels = required(this.root, "[data-veda='levels']");
    levels.innerHTML = LEVELS.map((definition, index) => `<button type="button" data-level="${index}" title="${definition.title}" aria-label="Level ${index + 1}: ${definition.title}" class="${index === this.progress.level ? "current" : this.progress.completed.includes(index) ? "done" : ""}" ${index > this.progress.unlocked ? "disabled" : ""}>${this.progress.completed.includes(index) ? "✓" : index + 1}</button>`).join("");
    if (full) {
      this.motionRenderKey = "";
      this.board.innerHTML = Array.from({ length: WIDTH * HEIGHT }, (_, cell) => {
      const wall = this.state.walls.includes(cell);
      const column = cell % WIDTH;
      const row = Math.floor(cell / WIDTH);
      const terrain = vedaTerrainEnvironment(cell, column, row, wall);
      const terrainSeed = (Math.imul(cell + 1, 1103515245) + Math.imul(column + 3, 374761393) + Math.imul(row + 7, 668265263)) >>> 0;
      return `<div data-cell="${cell}" class="tile ${wall ? "wall" : "floor"} ${cell === this.state.exit ? "exit" : ""}" style="${position(cell)}">` +
        `<span class="tile-art terrain" data-environment="${terrain}" aria-hidden="true"></span>` +
        (wall ? `<span class="tile-art fixed-wall" data-object="${(terrainSeed % 5) === 0 ? "foliage" : "wall"}" aria-hidden="true"></span>` : "") +
        (this.state.targets.includes(cell) ? `<span class="tile-art switch" data-object="brassSwitch" aria-label="Switch"></span>` : "") +
        (cell === this.state.exit ? `<span class="tile-art gate" data-object="gateClosed" aria-label="Sanctuary gate"></span>` : "") +
        `</div>`;
      }).join("") + this.state.boxes.map((cell, index) => `<div data-veda="box-${index}" class="sprite crate" style="${position(cell)}" aria-label="Crate"></div>`).join("") + `<div data-veda="player" class="sprite player" style="${position(this.state.player)}" aria-label="Veda the elephant"></div>`;
    }
    this.root.querySelectorAll<HTMLElement>("[data-environment]").forEach((element) => this.sprites.environment(element, element.dataset.environment as "terrainBase"));
    this.root.querySelectorAll<HTMLElement>("[data-object]").forEach((element) => this.sprites.object(element, element.dataset.object as "wall"));
    this.root.querySelectorAll(".peach").forEach((element) => element.remove());
    for (const fruit of this.state.fruit) { const peach = document.createElement("span"); peach.className = "tile-art peach"; this.sprites.object(peach, "peach", "Peach"); required(this.board, `[data-cell='${fruit}']`).append(peach); }
    this.state.boxes.forEach((cell, index) => { const box = required<HTMLElement>(this.root, `[data-veda='box-${index}']`); box.style.cssText = position(cell); box.className = `sprite crate${this.state.targets.includes(cell) ? " parked" : ""}`; this.sprites.object(box, this.state.targets.includes(cell) ? "crateOnSwitch" : "crate", "Crate"); });
    const player = required<HTMLElement>(this.root, "[data-veda='player']");
    player.style.cssText = position(this.state.player);
    player.className = `sprite player${this.selected ? " selected" : ""}`;
    const motion = this.motion.tick(performance.now());
    const motionKey = `${motion.direction}:${motion.state}:${motion.frame}`;
    if (motionKey !== this.motionRenderKey) {
      this.sprites.motion(player, motion);
      this.motionRenderKey = motionKey;
    }
    this.root.querySelectorAll(".valid-move").forEach((element) => element.classList.remove("valid-move"));
    if (this.selected) for (const direction of Object.keys(DIRECTIONS) as Direction[]) { const next = step(this.state, direction); if (next) required(this.board, `[data-cell='${next.player}']`).classList.add("valid-move"); }
    const exitTile = required(this.board, `[data-cell='${this.state.exit}']`);
    exitTile.classList.toggle("open", isOpen(this.state));
    const gate = required<HTMLElement>(exitTile, ".gate");
    this.sprites.object(gate, isOpen(this.state) ? "gateOpen" : "gateClosed", isOpen(this.state) ? "Open sanctuary gate" : "Closed sanctuary gate");
    gate.dataset.gateState = isOpen(this.state) ? "open" : "closed";
    this.board.setAttribute("aria-label", `Puzzle ${this.progress.level + 1}. Veda at row ${Math.floor(this.state.player / WIDTH) + 1}, column ${this.state.player % WIDTH + 1}. ${this.state.boxes.filter((box) => this.state.targets.includes(box)).length} of ${this.state.targets.length} switches filled. ${isOpen(this.state) ? "Exit open." : "Exit closed."}`);
    this.syncSound();
  }

  private syncSound(): void {
    const button = required<HTMLButtonElement>(this.root, "[data-veda='sound']");
    button.textContent = this.muted ? "Sound off" : "Sound on";
    button.setAttribute("aria-pressed", String(!this.muted));
  }
  private message(text: string): void {
    this.messageElement.textContent = text;
    this.scheduleFit();
  }
  private markActivity(): void {
    this.activeRemaining = 5;
    this.scheduleFrame();
  }
  private persist(): void { this.dirty = true; this.flushProgress(); }
  private creditActivity(): void { const whole = Math.floor(this.activeTotal); if (whole > this.creditedTotal) { this.creditedTotal = whole; this.services.creditActivePlay(whole); } }
  private scheduleFrame(): void {
    if (this.frameId || this.disposed || this.paused) return;
    this.frameId = requestAnimationFrame((next) => this.frame(next));
  }
  private frame(time: number): void {
    this.frameId = 0;
    const elapsed = this.lastFrame ? Math.min(0.05, (time - this.lastFrame) / 1000) : 0;
    this.lastFrame = time;
    if (!this.paused && !document.hidden && this.activeRemaining > 0) { const active = Math.min(elapsed, this.activeRemaining); this.activeRemaining -= active; this.activeTotal += active; this.creditActivity(); }
    if (!this.paused) {
      const player = this.root.querySelector<HTMLElement>("[data-veda='player']");
      if (player) {
        const motion = this.motion.tick(time);
        const motionKey = `${motion.direction}:${motion.state}:${motion.frame}`;
        if (motionKey !== this.motionRenderKey) {
          this.sprites.motion(player, motion);
          this.motionRenderKey = motionKey;
        }
      }
    }
    if (this.motion.isActive(time) || this.activeRemaining > 0) this.scheduleFrame();
  }
}

function markup(imageUrl: string, instanceId: number): string {
  const winTitleId = `veda-win-title-${instanceId}`;
  const helpTitleId = `veda-help-title-${instanceId}`;
  return `<div class="veda-game__shell"><header><div><span class="eyebrow">THE ELEPHANT IN THE ROOM · A PUZZLE ADVENTURE</span><h1>Veda’s Great Escape<span>One big elephant. A few small problems.</span></h1></div><div class="header-actions"><button data-veda="exit" type="button">Exit</button><button data-veda="sound" type="button">Sound off</button></div></header><div class="layout"><section class="play"><div class="topline"><div><span data-veda="chapter"></span><h2 data-veda="title"></h2></div><div class="scores"><span data-veda="peaches"></span><span data-veda="moves"></span></div></div><div class="board-stage"><div data-veda="board" class="board" role="group" aria-label="Elephant puzzle board" tabindex="0"></div></div><p data-veda="message" class="message" aria-live="polite"></p><div class="controls"><button data-veda="undo" type="button">Undo <kbd>Z</kbd></button><button data-veda="restart" type="button">Restart <kbd>R</kbd></button><button data-veda="hint" type="button">Hint <kbd>H</kbd></button><button data-veda="help" type="button" aria-haspopup="dialog">Help</button></div><div class="dpad" aria-label="Movement controls"><button data-direction="up" type="button" aria-label="Move up">↑</button><div><button data-direction="left" type="button" aria-label="Move left">←</button><button data-direction="down" type="button" aria-label="Move down">↓</button><button data-direction="right" type="button" aria-label="Move right">→</button></div></div><div class="journey"><h3>Your journey</h3><div data-veda="levels"></div></div></section><aside><div class="story" style="--sanctuary:url('${imageUrl}')"><span class="eyebrow">THE WAY HOME</span><h2>Big heart.<br>Bigger adventure.</h2><p>Veda needs your help getting to the sanctuary. A strong trunk helps. A clever route helps more.</p></div><div class="how"><h3>Make your move.</h3><p><b>↑ ↓ ← →</b> or <b>W A S D</b> to walk.</p><div><span class="legend-art legend-crate" aria-hidden="true"></span><p>Walk into a crate to push it. You can’t pull it back.</p></div><div><span class="legend-art legend-switch" aria-hidden="true"></span><p>Put every crate on a golden switch to open the exit.</p></div><div><span class="legend-art legend-peach" aria-hidden="true"></span><p>Take a detour for peaches. Optional, but delicious.</p></div></div><p class="note">Inspired by the book’s love of elephants. This adventure is an original game.</p></aside></div></div><dialog data-veda="win" aria-labelledby="${winTitleId}"><div class="completion-burst" aria-hidden="true"></div><div class="win-icon" aria-hidden="true"></div><span class="eyebrow" data-veda="win-label"></span><h2 id="${winTitleId}" data-veda="win-title"></h2><p data-veda="win-text"></p><button data-veda="continue" type="button" class="primary">Next adventure →</button><button data-veda="stay" type="button">Keep exploring this level</button></dialog><dialog data-veda="help-dialog" aria-labelledby="${helpTitleId}"><span class="eyebrow">HOW TO PLAY</span><h2 id="${helpTitleId}">Plan a path home.</h2><p>Tap Veda, then tap a glowing square. You can also swipe the board or use the arrow keys, W A S D, or the direction pad.</p><p>Walk into a crate to push it. Crates cannot be pulled. Fill every switch to open the sanctuary gate. Undo, restart, and hints are always safe.</p><button data-veda="help-close" type="button" class="primary">Close help</button></dialog>`;
}
