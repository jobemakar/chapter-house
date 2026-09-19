import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import sanctuaryUrl from "./assets/sanctuary.png";
import { DIRECTIONS, HEIGHT, isOpen, LEVELS, parseLevel, solve, step, WIDTH, type Direction, type PuzzleState } from "./core";
import { loadVedaProgress, VEDA_REWARD_IDS, type VedaProgress } from "./progress";
import { VedaAudio } from "./audio";

const ARROWS: Record<Direction, string> = { up: "↑", right: "→", down: "↓", left: "←" };
const required = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Veda's Great Escape is missing ${selector}`);
  return element;
};
const position = (cell: number): string => `left:${cell % WIDTH / WIDTH * 100}%;top:${Math.floor(cell / WIDTH) / HEIGHT * 100}%;`;
const clone = (state: PuzzleState): PuzzleState => structuredClone(state);

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
  private facingLeft = false;
  private paused = false;
  private disposed = false;
  private muted: boolean;
  private readonly audio: VedaAudio;
  private readonly abort = new AbortController();
  private hintTimer = 0;
  private touch: { x: number; y: number; cell: number | null } | null = null;
  private activeTotal: number;
  private creditedTotal: number;
  private activeRemaining = 0;
  private lastFrame = 0;
  private frameId = 0;
  private dirty = false;
  private readonly board: HTMLElement;
  private readonly dialog: HTMLDialogElement;
  private readonly messageElement: HTMLElement;

  constructor(target: HTMLElement, private readonly services: GameHostServices<VedaProgress>, private readonly options: VedaGameOptions = {}) {
    this.progress = loadVedaProgress(services.progress);
    this.state = parseLevel(LEVELS[this.progress.level]!);
    this.muted = services.muted;
    this.audio = new VedaAudio(this.muted);
    this.activeTotal = services.activePlaySeconds;
    this.creditedTotal = Math.floor(this.activeTotal);
    this.root = document.createElement("section");
    this.root.className = "veda-game";
    this.root.innerHTML = markup(sanctuaryUrl);
    target.replaceChildren(this.root);
    this.board = required(this.root, "[data-veda='board']");
    this.dialog = required(this.root, "[data-veda='win']");
    this.messageElement = required(this.root, "[data-veda='message']");
    if (!options.showStandaloneControls) {
      required<HTMLElement>(this.root, "[data-veda='exit']").hidden = true;
      required<HTMLElement>(this.root, "[data-veda='sound']").hidden = true;
    }
    this.bind();
    this.loadLevel(this.progress.level, false);
    this.frameId = requestAnimationFrame((time) => this.frame(time));
  }

  setPaused(paused: boolean): void {
    if (this.disposed) return;
    this.paused = paused;
    this.lastFrame = 0;
    this.touch = null;
    this.root.classList.toggle("is-paused", paused);
    this.board.setAttribute("aria-disabled", String(paused));
    if (paused) this.audio.suspend();
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
    window.clearTimeout(this.hintTimer);
    this.abort.abort();
    if (this.dialog.open) this.dialog.close();
    this.flushProgress();
    this.audio.dispose();
    this.root.remove();
  }

  private bind(): void {
    const signal = this.abort.signal;
    const click = (name: string, handler: () => void) => required<HTMLButtonElement>(this.root, `[data-veda='${name}']`).addEventListener("click", handler, { signal });
    click("undo", () => this.undo());
    click("restart", () => this.loadLevel(this.progress.level));
    click("hint", () => this.hint());
    click("continue", () => this.loadLevel(this.progress.level === 4 ? 0 : this.progress.level + 1));
    click("stay", () => { this.dialog.close(); this.undo(); });
    if (this.options.showStandaloneControls) {
      click("sound", () => this.setMuted(!this.muted));
      click("exit", () => this.services.exit());
    }
    required(this.root, "[data-veda='levels']").addEventListener("click", (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-level]");
      if (button && !button.disabled) this.loadLevel(Number(button.dataset.level));
    }, { signal });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>("[data-direction]")) button.addEventListener("click", () => this.move(button.dataset.direction as Direction), { signal });
    document.addEventListener("keydown", this.onKeyDown, { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.setPaused(true); }, { signal });
    this.board.addEventListener("pointerdown", this.onPointerDown, { signal });
    this.board.addEventListener("pointerup", this.onPointerUp, { signal });
    this.board.addEventListener("pointercancel", () => { this.touch = null; }, { signal });
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.paused || this.dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    const direction: Direction | undefined = ({ arrowup: "up", w: "up", arrowright: "right", d: "right", arrowdown: "down", s: "down", arrowleft: "left", a: "left" } as Record<string, Direction>)[key];
    if (direction) { event.preventDefault(); this.move(direction); }
    else if (key === "z") { event.preventDefault(); this.undo(); }
    else if (key === "r") this.loadLevel(this.progress.level);
    else if (key === "h") this.hint();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.paused || this.dialog.open || (event.pointerType === "mouse" && event.button !== 0)) return;
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
    this.progress.level = Math.max(0, Math.min(4, level));
    this.state = parseLevel(LEVELS[this.progress.level]!);
    this.history = [];
    this.facingLeft = false;
    this.selected = false;
    if (this.dialog.open) this.dialog.close();
    this.draw(true);
    this.message(LEVELS[this.progress.level]!.tip);
    if (announce) { this.audio.tone(330, 0.1); this.persist(); }
  }

  private move(direction: Direction): boolean {
    if (this.paused || this.dialog.open) return false;
    this.root.querySelector(".hint-arrow")?.remove();
    const next = step(this.state, direction);
    if (!next) { this.audio.tone(110, 0.07); this.message("No room that way. Try another route, or undo a push."); return false; }
    const previous = this.state;
    this.history.push(clone(previous));
    this.state = next;
    if (direction === "left") this.facingLeft = true;
    if (direction === "right") this.facingLeft = false;
    this.selected = false;
    this.markActivity();
    this.draw();
    this.audio.tone(next.pushed ? 190 : 330, 0.06);
    if (next.taken > previous.taken) { this.audio.tone(720, 0.15); this.message("A peach for the road. Excellent priorities."); }
    else if (isOpen(next)) this.message("The gate is open! Follow the flag to the next adventure.");
    else if (next.pushed) this.message("Nice push. Remember: Veda can push, but she can’t pull crates.");
    else this.message(LEVELS[this.progress.level]!.tip);
    if (next.player === next.exit && isOpen(next)) this.completeLevel();
    return true;
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
    this.dialog.showModal();
    this.audio.tone(880, 0.3);
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
    const previous = this.history.pop();
    if (!previous) return;
    if (this.dialog.open) this.dialog.close();
    this.state = previous;
    this.selected = false;
    this.draw();
    this.message("Rewound one move. Try a different angle.");
  }

  private hint(): void {
    if (this.paused) return;
    this.message("Finding a way through…");
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => {
      if (this.disposed) return;
      const path = solve(this.state);
      if (!path) { this.message("This position is stuck. Undo a few pushes, or restart the level."); return; }
      if (!path.length) { this.message("You’ve already reached the exit. Choose another level to continue."); return; }
      this.root.querySelector(".hint-arrow")?.remove();
      const arrow = document.createElement("span");
      arrow.className = "hint-arrow";
      arrow.textContent = ARROWS[path[0]!];
      required(this.root, "[data-veda='player']").append(arrow);
      this.message(`Try moving ${path[0]}. A path to the exit is still possible.`);
      this.hintTimer = window.setTimeout(() => arrow.remove(), 2400);
    }, 30);
  }

  private boardTap(cell: number): void {
    if (cell === this.state.player) { this.selected = !this.selected; this.draw(); this.message(this.selected ? "Veda is ready. Tap one of the glowing squares to move her." : LEVELS[this.progress.level]!.tip); return; }
    const direction = this.selected ? (Object.keys(DIRECTIONS) as Direction[]).find((candidate) => step(this.state, candidate)?.player === cell) : undefined;
    if (direction) this.move(direction);
    else this.message(this.selected ? "That square is not reachable in one move. Choose a glowing square, or tap Veda again." : "Tap Veda, then tap a glowing destination. You can also swipe the board.");
  }

  private draw(full = false): void {
    required(this.root, "[data-veda='chapter']").textContent = `CHAPTER ${String(this.progress.level + 1).padStart(2, "0")} / 05`;
    required(this.root, "[data-veda='title']").textContent = LEVELS[this.progress.level]!.title;
    required(this.root, "[data-veda='peaches']").textContent = `🍑 ${this.state.taken} / ${this.state.taken + this.state.fruit.length}`;
    required(this.root, "[data-veda='moves']").textContent = `${this.state.moves} moves`;
    required<HTMLButtonElement>(this.root, "[data-veda='undo']").disabled = !this.history.length;
    const levels = required(this.root, "[data-veda='levels']");
    levels.innerHTML = LEVELS.map((definition, index) => `<button type="button" data-level="${index}" title="${definition.title}" aria-label="Level ${index + 1}: ${definition.title}" class="${index === this.progress.level ? "current" : this.progress.completed.includes(index) ? "done" : ""}" ${index > this.progress.unlocked ? "disabled" : ""}>${this.progress.completed.includes(index) ? "✓" : index + 1}</button>`).join("");
    if (full) this.board.innerHTML = Array.from({ length: WIDTH * HEIGHT }, (_, cell) => `<div data-cell="${cell}" class="tile ${this.state.walls.includes(cell) ? "wall" : `floor ${(cell + Math.floor(cell / WIDTH)) % 2 ? "alt" : ""}`} ${cell === this.state.exit ? "exit" : ""}" style="${position(cell)}">${this.state.targets.includes(cell) ? '<span class="target">◎</span>' : cell === this.state.exit ? "<span>🏁</span>" : ""}</div>`).join("") + this.state.boxes.map((cell, index) => `<div data-veda="box-${index}" class="sprite crate" style="${position(cell)}" aria-label="Crate">📦</div>`).join("") + `<div data-veda="player" class="sprite player" style="${position(this.state.player)}" aria-label="Veda the elephant">🐘</div>`;
    this.root.querySelectorAll(".peach").forEach((element) => element.remove());
    for (const fruit of this.state.fruit) { const peach = document.createElement("span"); peach.className = "peach"; peach.textContent = "🍑"; required(this.board, `[data-cell='${fruit}']`).append(peach); }
    this.state.boxes.forEach((cell, index) => { const box = required<HTMLElement>(this.root, `[data-veda='box-${index}']`); box.style.cssText = position(cell); box.className = `sprite crate${this.state.targets.includes(cell) ? " parked" : ""}`; });
    const player = required<HTMLElement>(this.root, "[data-veda='player']");
    player.style.cssText = position(this.state.player);
    player.className = `sprite player${this.facingLeft ? " left" : ""}${this.selected ? " selected" : ""}`;
    this.root.querySelectorAll(".valid-move").forEach((element) => element.classList.remove("valid-move"));
    if (this.selected) for (const direction of Object.keys(DIRECTIONS) as Direction[]) { const next = step(this.state, direction); if (next) required(this.board, `[data-cell='${next.player}']`).classList.add("valid-move"); }
    required(this.board, `[data-cell='${this.state.exit}']`).classList.toggle("open", isOpen(this.state));
    this.board.setAttribute("aria-label", `Puzzle ${this.progress.level + 1}. Veda at row ${Math.floor(this.state.player / WIDTH) + 1}, column ${this.state.player % WIDTH + 1}. ${this.state.boxes.filter((box) => this.state.targets.includes(box)).length} of ${this.state.targets.length} switches filled. ${isOpen(this.state) ? "Exit open." : "Exit closed."}`);
    this.syncSound();
  }

  private syncSound(): void {
    const button = required<HTMLButtonElement>(this.root, "[data-veda='sound']");
    button.textContent = this.muted ? "Sound off" : "Sound on";
    button.setAttribute("aria-pressed", String(!this.muted));
  }
  private message(text: string): void { this.messageElement.textContent = text; }
  private markActivity(): void { this.activeRemaining = 5; }
  private persist(): void { this.dirty = true; this.flushProgress(); }
  private creditActivity(): void { const whole = Math.floor(this.activeTotal); if (whole > this.creditedTotal) { this.creditedTotal = whole; this.services.creditActivePlay(whole); } }
  private frame(time: number): void {
    const elapsed = this.lastFrame ? Math.min(0.05, (time - this.lastFrame) / 1000) : 0;
    this.lastFrame = time;
    if (!this.paused && !document.hidden && this.activeRemaining > 0) { const active = Math.min(elapsed, this.activeRemaining); this.activeRemaining -= active; this.activeTotal += active; this.creditActivity(); }
    if (!this.disposed) this.frameId = requestAnimationFrame((next) => this.frame(next));
  }
}

function markup(imageUrl: string): string {
  return `<div class="veda-game__shell"><header><div><span class="eyebrow">THE ELEPHANT IN THE ROOM · A PUZZLE ADVENTURE</span><h1>Veda’s Great Escape<span>One big elephant. A few small problems.</span></h1></div><div class="header-actions"><button data-veda="exit" type="button">Exit</button><button data-veda="sound" type="button">Sound off</button></div></header><div class="layout"><section class="play"><div class="topline"><div><span data-veda="chapter"></span><h2 data-veda="title"></h2></div><div class="scores"><span data-veda="peaches"></span><span data-veda="moves"></span></div></div><div data-veda="board" class="board" role="group" aria-label="Elephant puzzle board" tabindex="0"></div><p data-veda="message" class="message" aria-live="polite"></p><div class="controls"><button data-veda="undo" type="button">↶ Undo <kbd>Z</kbd></button><button data-veda="restart" type="button">↻ Restart <kbd>R</kbd></button><button data-veda="hint" type="button">✧ Hint <kbd>H</kbd></button></div><div class="dpad" aria-label="Movement controls"><button data-direction="up" type="button" aria-label="Move up">↑</button><div><button data-direction="left" type="button" aria-label="Move left">←</button><button data-direction="down" type="button" aria-label="Move down">↓</button><button data-direction="right" type="button" aria-label="Move right">→</button></div></div></section><aside><div class="story" style="--sanctuary:url('${imageUrl}')"><span class="eyebrow">THE WAY HOME</span><h2>Big heart.<br>Bigger adventure.</h2><p>Veda needs your help getting to the sanctuary. A strong trunk helps. A clever route helps more.</p></div><div class="how"><h3>Make your move.</h3><p><b>↑ ↓ ← →</b> or <b>W A S D</b> to walk.</p><div><span>📦</span><p>Walk into a crate to push it. You can’t pull it back.</p></div><div><span class="legend-target">◎</span><p>Put every crate on a golden switch to open the exit.</p></div><div><span>🍑</span><p>Take a detour for peaches. Optional, but delicious.</p></div></div><div class="journey"><h3>Your journey</h3><div data-veda="levels"></div></div><p class="note">Inspired by the book’s love of elephants. This adventure is an original game.</p></aside></div></div><dialog data-veda="win"><div class="win-icon">🐘</div><span class="eyebrow" data-veda="win-label"></span><h2 data-veda="win-title"></h2><p data-veda="win-text"></p><button data-veda="continue" type="button" class="primary">Next adventure →</button><button data-veda="stay" type="button">Keep exploring this level</button></dialog>`;
}
