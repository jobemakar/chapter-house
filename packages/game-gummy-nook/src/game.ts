import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { GummyBoard, LEGACY_REWARDS, type Board, type GameState, type Phase } from "./engine";
import { GUMMY_NOOK_REWARD_IDS, serializeGummyNookProgress, type GummyNookProgress } from "./progress";

const rewardByLegacy: Record<string, string> = {
  "gn-candy-jar": GUMMY_NOOK_REWARD_IDS.candyJar,
  "gn-gummy-lamp": GUMMY_NOOK_REWARD_IDS.gummyLamp,
  "gn-sock-cushion": GUMMY_NOOK_REWARD_IDS.sockCushion,
  "gn-bear-beanbag": GUMMY_NOOK_REWARD_IDS.bearBeanbag,
};
const candyShape = ["💧", "♥", "★", "✿", "♧"];

class TimerBag {
  private readonly timers = new Set<number>();
  wait(ms: number): Promise<void> { return new Promise(resolve => { const timer = window.setTimeout(() => { this.timers.delete(timer); resolve(); }, ms); this.timers.add(timer); }); }
  dispose(): void { for (const timer of this.timers) window.clearTimeout(timer); this.timers.clear(); }
}
class GummyAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private sources = new Set<OscillatorNode>();
  private muted = false;
  unlock(): void { try { if (!this.context) { this.context = new AudioContext(); this.gain = this.context.createGain(); this.gain.gain.value = .13; this.gain.connect(this.context.destination); } if (this.context.state === "suspended") void this.context.resume(); } catch { /* Audio is optional. */ } }
  setMuted(value: boolean): void { this.muted = value; if (this.gain) this.gain.gain.value = value ? 0 : .13; }
  play(kind: "pick" | "swap" | "clear" | "power"): void { if (this.muted || !this.context || !this.gain) return; const tone = { pick: 520, swap: 280, clear: 640, power: 190 }[kind], oscillator = this.context.createOscillator(), volume = this.context.createGain(), now = this.context.currentTime; oscillator.frequency.setValueAtTime(tone, now); oscillator.frequency.exponentialRampToValueAtTime(tone * (kind === "swap" ? .75 : 1.5), now + .13); volume.gain.setValueAtTime(.0001, now); volume.gain.exponentialRampToValueAtTime(.35, now + .012); volume.gain.exponentialRampToValueAtTime(.0001, now + .18); oscillator.connect(volume).connect(this.gain); oscillator.onended = () => this.sources.delete(oscillator); this.sources.add(oscillator); oscillator.start(now); oscillator.stop(now + .2); }
  dispose(): void { for (const source of this.sources) { try { source.stop(); } catch { /* ended */ } } this.sources.clear(); if (this.context) void this.context.close(); this.context = null; this.gain = null; }
}

/** Shared hostable DOM game. The simulation remains in engine.ts and has no runtime dependencies. */
export class GummyNookGame implements GameSession {
  private state: GameState;
  private readonly timers = new TimerBag();
  private readonly audio = new GummyAudio();
  private history: Board[] = [];
  private selection: number | null = null;
  private drag: { cell: number; x: number; y: number; id: number } | null = null;
  private paused = false;
  private manualPause = false;
  private disposed = false;
  private animating = false;
  private activeUntil = 0;
  private activeSeconds = 0;
  private creditTimer: number | null = null;
  private readonly onClick = (event: Event) => this.click(event);
  private readonly onPointerDown = (event: PointerEvent) => this.pointerDown(event);
  private readonly onPointerUp = (event: PointerEvent) => this.pointerUp(event);
  private readonly onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { this.selection = null; this.render(); } };
  private readonly onVisibility = () => {
    if (document.hidden) this.setPaused(true);
    else if (!this.manualPause) this.setPaused(false);
  };

  constructor(private readonly root: HTMLElement, private readonly host: GameHostServices<GummyNookProgress>) {
    this.state = serializeGummyNookProgress(host.progress);
    this.state.settings.muted ||= host.muted;
    if (host.reducedMotion) this.state.settings.motion = false;
    document.body.classList.add("gummy-nook-active");
    root.classList.add("gummy-nook");
    root.innerHTML = `<section class="gn-shell"><header class="gn-header"><div><p class="gn-kicker">NOT IF I CAN HELP IT</p><h1>Gummy Nook</h1><p id="gn-status" aria-live="polite">Swap neighbors. Match three. Let a little lovely happen.</p></div><div class="gn-header-actions"><button data-action="sound" aria-label="Toggle sound">Sound</button><button data-action="pause">Pause</button><button data-action="exit">Exit</button></div></header><section class="gn-stats" aria-label="Progress"><span><b id="gn-cleared">0</b> cleared</span><span><b id="gn-moves">0</b> lovely moves</span><span id="gn-chain">A little more lovely</span></section><section class="gn-play"><div class="gn-board-wrap"><div id="gn-board" class="gn-board" role="grid" aria-label="Six by six gummy board"></div><div class="gn-tools"><button data-action="hint">Hint</button><button data-action="shuffle">Mix tray</button><button id="gn-undo" data-action="undo">Undo</button></div><p class="gn-help">Swipe in any direction, including diagonally—or tap two touching gummies. Match rows or columns of three.</p></div><aside class="gn-nook"><h2>Your nook</h2><p id="gn-goal"></p><progress id="gn-goal-progress" max="1"></progress><div id="gn-discoveries" class="gn-discoveries" aria-label="Gummy discoveries"></div><h3>Keepsakes <span id="gn-reward-count"></span></h3><div id="gn-rewards"></div><button data-action="settings">Comfort settings</button></aside></section><section id="gn-pause-panel" class="gn-panel" hidden><h2>Taking a cozy pause</h2><button data-action="resume">Resume</button></section><section id="gn-settings-panel" class="gn-panel" hidden><h2>Comfort settings</h2><label><input data-setting="music" type="checkbox" /> Music</label><label><input data-setting="motion" type="checkbox" /> Motion</label><label><input data-setting="gloss" type="checkbox" /> Candy gloss</label><button data-action="close-settings">Done</button></section></section>`;
    root.addEventListener("click", this.onClick); root.addEventListener("pointerdown", this.onPointerDown); document.addEventListener("pointerup", this.onPointerUp); document.addEventListener("pointercancel", this.onPointerUp); document.addEventListener("keydown", this.onKeyDown); document.addEventListener("visibilitychange", this.onVisibility);
    this.creditTimer = window.setInterval(() => this.creditActivePlay(), 1000);
    this.syncRewards(); this.save(); this.render();
  }
  setPaused(value: boolean): void { if (this.disposed) return; this.paused = value; this.drag = null; if (value) this.animating = false; const panel = this.byId("gn-pause-panel"); panel.hidden = !value; this.render(); }
  setMuted(muted: boolean): void { this.state.settings.muted = muted; this.audio.setMuted(muted); this.save(); this.render(); }
  flushProgress(): void { if (!this.disposed) this.save(); }
  status(): unknown { return { paused: this.paused, animating: this.animating, activeSeconds: this.activeSeconds, moves: this.state.moves, cleared: this.state.cleared }; }
  dispose(): void {
    if (this.disposed) return; this.flushProgress(); this.disposed = true; this.timers.dispose(); if (this.creditTimer !== null) window.clearInterval(this.creditTimer); this.creditTimer = null;
    this.root.removeEventListener("click", this.onClick); this.root.removeEventListener("pointerdown", this.onPointerDown); document.removeEventListener("pointerup", this.onPointerUp); document.removeEventListener("pointercancel", this.onPointerUp); document.removeEventListener("keydown", this.onKeyDown); document.removeEventListener("visibilitychange", this.onVisibility); document.body.classList.remove("gummy-nook-active"); this.audio.dispose(); this.root.replaceChildren();
  }
  private byId(id: string): HTMLElement { const element = this.root.querySelector<HTMLElement>(`#${id}`); if (!element) throw new Error(`Missing ${id}`); return element; }
  private cell(target: EventTarget | null): number | null { const node = target instanceof Element ? target.closest<HTMLButtonElement>("[data-cell]") : null; const value = node?.dataset.cell; return value !== undefined ? Number(value) : null; }
  private activity(seconds = 7): void { this.activeUntil = Math.max(this.activeUntil, performance.now() + seconds * 1000); }
  private creditActivePlay(): void { if (this.disposed || this.paused || document.hidden || performance.now() > this.activeUntil) return; this.activeSeconds++; this.host.creditActivePlay(this.host.activePlaySeconds + this.activeSeconds); }
  private save(): void { this.host.saveProgress(serializeGummyNookProgress(this.state)); }
  private syncRewards(): void { for (const legacy of this.state.owned) { const id = rewardByLegacy[legacy]; if (id) this.host.awardReward(id); } }
  private setStatus(message: string): void { this.byId("gn-status").textContent = message; }
  private render(): void {
    if (this.disposed) return;
    const board = this.byId("gn-board"); board.classList.toggle("gn-matte", !this.state.settings.gloss); board.style.setProperty("--gn-tint", this.tint());
    board.replaceChildren(...this.state.board.map((tier, index) => { const power = GummyBoard.power(tier), button = document.createElement("button"), base = GummyBoard.base(tier)!; button.type = "button"; button.dataset.cell = String(index); button.className = `gn-cell${power ? " gn-powered" : ""}${this.selection === index ? " gn-selected" : ""}`; button.setAttribute("role", "gridcell"); button.setAttribute("aria-label", `Row ${Math.floor(index / 6) + 1}, column ${index % 6 + 1}: ${GummyBoard.names[base]}${power ? `, ${GummyBoard.powerNames[power]}` : ""}`); button.innerHTML = `<span class="gn-candy gn-candy-${base}">${candyShape[base]}${power ? `<i>${["", "↔", "↕", "✹", "❄"][power]}</i>` : ""}</span>`; return button; }));
    this.byId("gn-cleared").textContent = String(this.state.cleared); this.byId("gn-moves").textContent = String(this.state.moves); this.byId("gn-chain").textContent = this.state.bestCascade > 1 ? `${this.state.bestCascade}× best cascade` : "A little more lovely";
    const next = LEGACY_REWARDS.find(id => !this.state.owned.includes(id)); const nextIndex = next ? LEGACY_REWARDS.indexOf(next) : -1; const goal = this.byId("gn-goal"), progress = this.byId("gn-goal-progress") as HTMLProgressElement;
    goal.textContent = next ? `${Math.max(0, [0,12,40,100][nextIndex] - this.state.cleared)} more gummies to your ${["candy jar", "gummy lamp", "soft sock cushion", "gummy-bear beanbag"][nextIndex]}.` : "Your cozy corner is complete. Keep the cascades coming."; progress.value = next ? Math.min(1, this.state.cleared / Math.max(1, [0,12,40,100][nextIndex])) : 1;
    this.byId("gn-discoveries").innerHTML = GummyBoard.names.map((name, i) => `<span class="${this.state.discovered.includes(i) ? "" : "gn-locked"}" title="${name}">${this.state.discovered.includes(i) ? candyShape[Math.min(i, 4)] : "?"}<small>${this.state.discovered.includes(i) ? name : "undiscovered"}</small></span>`).join("");
    this.byId("gn-rewards").innerHTML = LEGACY_REWARDS.map((id, i) => `<p class="${this.state.owned.includes(id) ? "" : "gn-locked"}">${this.state.owned.includes(id) ? "✓" : "○"} ${["Candy jar", "Gummy lamp", "Soft sock cushion", "Gummy-bear beanbag"][i]}</p>`).join(""); this.byId("gn-reward-count").textContent = `${this.state.owned.length} / 4`;
    (this.byId("gn-undo") as HTMLButtonElement).disabled = !this.history.length || this.paused || this.animating;
    for (const setting of ["music", "motion", "gloss"] as const) (this.root.querySelector<HTMLInputElement>(`[data-setting="${setting}"]`)!).checked = this.state.settings[setting];
  }
  private tint(): string { const colors = ["#a9d8c5", "#a5cee4", "#c7b4df", "#e1b5c6", "#edcaa8"], position = this.state.cleared / 120, a = Math.floor(position) % colors.length, b = (a + 1) % colors.length; return `color-mix(in srgb, ${colors[a]} ${(1 - (position % 1)) * 100}%, ${colors[b]})`; }
  private click(event: Event): void {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button,[data-setting]") : null; if (!target) return;
    const setting = target.getAttribute("data-setting") as keyof GameState["settings"] | null;
    if (setting) { this.state.settings[setting] = (target as HTMLInputElement).checked; this.save(); this.render(); return; }
    const action = target.dataset.action; if (action) { this.action(action); return; }
    const cell = this.cell(target); if (cell !== null) this.choose(cell);
  }
  private action(action: string): void {
    if (action === "exit") { this.flushProgress(); this.host.exit(); return; }
    if (action === "pause") { this.manualPause = true; this.setPaused(true); return; }
    if (action === "resume") { this.manualPause = false; this.paused = false; this.byId("gn-pause-panel").hidden = true; this.render(); return; }
    if (action === "settings") { this.byId("gn-settings-panel").hidden = false; return; }
    if (action === "close-settings") { this.byId("gn-settings-panel").hidden = true; this.save(); return; }
    if (action === "sound") { this.audio.unlock(); this.setMuted(!this.state.settings.muted); return; }
    if (this.paused || this.animating) return;
    if (action === "undo") { const board = this.history.pop(); if (board) { this.state.board = board; this.selection = null; this.save(); this.render(); this.setStatus("One move back. Your keepsakes stay yours."); } return; }
    if (action === "hint") { const move = GummyBoard.legalMoves(this.state.board)[0]; if (move) { this.selection = move[0]; this.render(); this.setStatus("Try swapping the highlighted gummy with its touching friend."); } return; }
    if (action === "shuffle") { this.history.push([...this.state.board]); this.state.board = GummyBoard.mix(this.state.board); this.selection = null; this.save(); this.activity(3); this.render(); this.setStatus("A fresh mix. All your keepsakes stay yours."); }
  }
  private pointerDown(event: PointerEvent): void { if (event.button !== 0 || this.paused || this.animating) return; const cell = this.cell(event.target); if (cell === null) return; this.audio.unlock(); this.drag = { cell, x: event.clientX, y: event.clientY, id: event.pointerId }; }
  private pointerUp(event: PointerEvent): void { if (!this.drag || event.pointerId !== this.drag.id) return; const drag = this.drag; this.drag = null; const dx = event.clientX - drag.x, dy = event.clientY - drag.y; if (Math.hypot(dx, dy) < 16) return; const x = Math.abs(dx), y = Math.abs(dy), diagonal = Math.min(x, y) / Math.max(x, y) > .42, dc = diagonal || x > y ? Math.sign(dx) : 0, dr = diagonal || y >= x ? Math.sign(dy) : 0, target = drag.cell + dc + dr * 6; if (drag.cell % 6 + dc >= 0 && drag.cell % 6 + dc < 6 && GummyBoard.adjacent(drag.cell, target)) void this.move(drag.cell, target); }
  private choose(cell: number): void { if (this.paused || this.animating) return; this.audio.unlock(); if (this.selection === null) { this.selection = cell; this.audio.play("pick"); this.render(); this.setStatus("Choose a touching gummy—diagonals count too."); return; } if (this.selection === cell) { this.selection = null; this.render(); return; } if (!GummyBoard.adjacent(this.selection, cell)) { this.selection = cell; this.render(); this.setStatus("Choose a touching gummy—diagonals count too."); return; } void this.move(this.selection, cell); }
  private async move(from: number, to: number): Promise<void> {
    if (this.paused || this.animating || this.disposed) return; this.audio.unlock(); this.audio.play("swap"); const before = [...this.state.board], owned = new Set(this.state.owned), result = GummyBoard.swap(this.state, from, to); this.selection = null; this.animating = true; this.activity(result.ok ? 8 : 2); await this.play(result.phases); this.animating = false;
    if (!result.ok) { this.setStatus(result.reason === "neighbor" ? "Swap with a touching neighbor." : "Almost! Line up three or more of the same shape."); this.render(); return; }
    this.history.push(before); if (this.history.length > 30) this.history.shift(); this.save(); this.syncRewards(); this.render(); const newReward = this.state.owned.some(id => !owned.has(id)); this.setStatus(`${result.depth! > 1 ? `${result.depth}× cascade! ` : ""}${result.cleared} gummies cleared.${newReward ? " A new keepsake is in your nook!" : ""}`);
  }
  private async play(phases: Phase[]): Promise<void> {
    if (!this.state.settings.motion || this.host.reducedMotion) return;
    for (const phase of phases) { if (this.disposed || this.paused) return; const board = this.byId("gn-board"); board.classList.remove("gn-clear", "gn-fall", "gn-swap", "gn-power"); board.classList.add(`gn-${phase.kind}`); if (phase.kind === "clear") { if (phase.activated.length) { board.classList.add("gn-power"); this.audio.play("power"); } else this.audio.play("clear"); await this.timers.wait(phase.activated.length ? 360 : 180); } else await this.timers.wait(phase.kind === "fall" ? 240 : 150); board.classList.remove("gn-clear", "gn-fall", "gn-swap", "gn-power"); }
  }
}
