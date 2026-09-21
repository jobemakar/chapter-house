import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import {
  GummyBoard,
  LEGACY_REWARDS,
  type Activation,
  type Board,
  type Candy,
  type GameState,
  type Phase,
} from "./engine";
import {
  GUMMY_NOOK_REWARD_IDS,
  serializeGummyNookProgress,
  type GummyNookProgress,
} from "./progress";

const rewardByLegacy: Record<string, string> = {
  "gn-candy-jar": GUMMY_NOOK_REWARD_IDS.candyJar,
  "gn-gummy-lamp": GUMMY_NOOK_REWARD_IDS.gummyLamp,
  "gn-sock-cushion": GUMMY_NOOK_REWARD_IDS.sockCushion,
  "gn-bear-beanbag": GUMMY_NOOK_REWARD_IDS.bearBeanbag,
};
class GummyArt {
  private static serial = 0;
  private static readonly paths = [
    "M50 12 C39 26 18 42 18 61 C18 101 82 101 82 61 C82 42 61 26 50 12Z",
    "M50 87 C37 76 10 59 10 36 C10 9 41 8 50 28 C59 8 90 9 90 36 C90 59 63 76 50 87Z",
    "M50 8 Q55 8 64 33 L90 35 Q100 38 82 56 L74 65 L78 88 Q76 97 50 79 Q24 97 22 88 L26 65 L8 45 Q0 34 36 33 Q45 8 50 8Z",
    "M50 25 C68 -6 93 18 77 39 C108 44 103 76 77 75 C78 105 47 110 40 82 C16 100 -3 70 23 60 C-4 43 15 14 37 32 Q43 10 50 25Z",
    "M50 44 C18 -8 1 20 12 45 C-4 67 20 97 46 68 L50 86 L54 68 C80 97 104 67 88 45 C99 20 82 -8 50 44Z",
    "M29 45 C11 -10 40 -8 45 39 L55 39 C60 -8 89 -10 71 45 C105 72 77 94 50 92 C23 94 -5 72 29 45Z",
    "M23 36 C0 29 12 3 29 14 L36 24 Q50 18 64 24 L71 14 C88 3 100 29 77 36 Q88 48 78 61 C94 82 70 99 62 84 Q50 92 38 84 C30 99 6 82 22 61 Q12 48 23 36Z",
  ];
  static piece(tier: number): string {
    const base = GummyBoard.base(tier)!;
    const path = this.paths[base];
    const color = GummyBoard.colors[base];
    const gradient = `gummy-${this.serial++}`;
    const power = GummyBoard.power(tier);
    const badge = power
      ? `<g><circle cx="77" cy="24" r="18" fill="${power === 4 ? "#d8f5ff" : "#fff7d6"}" stroke="${power === 4 ? "#82bfd7" : "#ac7750"}" stroke-width="2.5"/><text x="77" y="30" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="22" fill="#8c4f69">${["", "↔", "↕", "✹", "❄"][power]}</text></g>`
      : "";
    return `<svg viewBox="0 0 100 106" aria-hidden="true"><defs><linearGradient id="${gradient}" x2=".3" y2="1"><stop stop-color="#fff" stop-opacity=".62"/><stop offset=".4" stop-color="${color}"/><stop offset="1" stop-color="${color}"/></linearGradient></defs><ellipse cx="50" cy="94" rx="30" ry="6" fill="#305d50" opacity=".12"/><path d="${path}" fill="${color}" stroke="#654c4933" stroke-width="2"/><path class="glaze" d="${path}" fill="url(#${gradient})"/><path class="shine" d="M29 40 Q25 48 28 54" fill="none" stroke="white" stroke-opacity=".65" stroke-width="5" stroke-linecap="round"/><g fill="#443f4c"><ellipse cx="39" cy="57" rx="3" ry="4"/><ellipse cx="61" cy="57" rx="3" ry="4"/><path d="M45 67 Q50 72 55 67" fill="none" stroke="#443f4c" stroke-width="2.5" stroke-linecap="round"/></g><g fill="#f76b88" opacity=".4"><ellipse cx="30" cy="65" rx="6" ry="3"/><ellipse cx="70" cy="65" rx="6" ry="3"/></g>${badge}</svg>`;
  }
}

class TimerBag {
  private readonly timers = new Set<number>();
  wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.timers.delete(timer);
        resolve();
      }, ms);
      this.timers.add(timer);
    });
  }
  dispose(): void {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.clear();
  }
}
class GummyAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private sources = new Set<OscillatorNode>();
  private muted = false;
  unlock(): void {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.gain.value = 0.13;
        this.gain.connect(this.context.destination);
      }
      if (this.context.state === "suspended") void this.context.resume();
    } catch {
      /* Audio is optional. */
    }
  }
  setMuted(value: boolean): void {
    this.muted = value;
    if (this.gain) this.gain.gain.value = value ? 0 : 0.13;
  }
  play(kind: "pick" | "swap" | "clear" | "power"): void {
    if (this.muted || !this.context || !this.gain) return;
    const tone = { pick: 520, swap: 280, clear: 640, power: 190 }[kind],
      oscillator = this.context.createOscillator(),
      volume = this.context.createGain(),
      now = this.context.currentTime;
    oscillator.frequency.setValueAtTime(tone, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      tone * (kind === "swap" ? 0.75 : 1.5),
      now + 0.13,
    );
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.35, now + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.connect(volume).connect(this.gain);
    oscillator.onended = () => this.sources.delete(oscillator);
    this.sources.add(oscillator);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
  dispose(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* ended */
      }
    }
    this.sources.clear();
    if (this.context) void this.context.close();
    this.context = null;
    this.gain = null;
  }
}

type MotionRun = {
  cancelled: boolean;
  animations: Animation[];
  layers: HTMLElement[];
  overlay: HTMLDivElement;
};

/** Replays the simulation's phase list without changing the authoritative state. */
class GummyMotion {
  private active: MotionRun | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly audio: GummyAudio,
  ) {}

  cancel(): void {
    if (!this.active) return;
    this.active.cancelled = true;
    for (const animation of this.active.animations) animation.cancel();
    for (const layer of this.active.layers) layer.remove();
    this.active = null;
  }

  private board(): HTMLElement {
    const board = this.root.querySelector<HTMLElement>("#gn-board");
    if (!board) throw new Error("Missing gn-board");
    return board;
  }

  private cell(index: number): HTMLButtonElement {
    const normalized = index < 0 ? index + GummyBoard.count : index;
    const cell = this.root.querySelector<HTMLButtonElement>(
      `#gn-board > [data-cell="${normalized}"]`,
    );
    if (!cell) throw new Error(`Missing gummy cell ${normalized}`);
    return cell;
  }

  private box(index: number): DOMRect {
    return this.cell(index).getBoundingClientRect();
  }

  private async animate(
    run: MotionRun,
    element: Element,
    frames: Keyframe[],
    duration: number,
  ): Promise<void> {
    if (run.cancelled) return;
    const animation = element.animate(frames, {
      duration,
      easing: "cubic-bezier(.18,.8,.25,1)",
      fill: "forwards",
    });
    run.animations.push(animation);
    await animation.finished.catch(() => undefined);
  }

  private async flight(
    run: MotionRun,
    from: number,
    to: number,
    tier: Candy,
    arc = 0,
  ): Promise<void> {
    const start = this.box(from),
      end = this.box(to),
      overlayBox = run.overlay.getBoundingClientRect(),
      element = document.createElement("div");
    element.className = "gn-flight";
    element.innerHTML = GummyArt.piece(tier);
    element.style.cssText = `left:${start.x - overlayBox.x}px;top:${start.y - overlayBox.y}px;width:${start.width}px;height:${start.height}px`;
    run.overlay.append(element);
    run.layers.push(element);
    const dx = end.x - start.x,
      dy = end.y - start.y;
    await this.animate(
      run,
      element,
      [
        { transform: "translate(0,0)" },
        {
          transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1.04,.98)`,
          offset: 0.5,
        },
        { transform: `translate(${dx}px,${dy}px) scale(1)` },
      ],
      from < 0 ? 280 : 210,
    );
  }

  private effect(
    run: MotionRun,
    name: string,
    box: DOMRect,
    html = "",
  ): HTMLElement {
    const overlayBox = run.overlay.getBoundingClientRect(),
      element = document.createElement("div");
    element.className = `gn-power-wave ${name}`;
    element.style.cssText = `left:${box.x - overlayBox.x}px;top:${box.y - overlayBox.y}px;width:${box.width}px;height:${box.height}px`;
    element.innerHTML = html;
    run.overlay.append(element);
    run.layers.push(element);
    return element;
  }

  private async power(run: MotionRun, activation: Activation): Promise<void> {
    const box = this.box(activation.at),
      centerX = box.x + box.width / 2,
      centerY = box.y + box.height / 2;
    this.audio.play("power");
    if (activation.kind === 4) {
      const jobs: Promise<void>[] = [],
        row = Math.floor(activation.at / 6),
        col = activation.at % 6;
      for (let index = 0; index < GummyBoard.count; index++) {
        if (
          Math.abs(Math.floor(index / 6) - row) !==
          Math.abs((index % 6) - col)
        )
          continue;
        const tile = this.effect(
          run,
          "gn-frost-tile",
          this.box(index),
          "<span>❄</span>",
        );
        jobs.push(
          this.animate(
            run,
            tile,
            [
              { transform: "scale(.2)", opacity: 0 },
              { transform: "scale(1)", opacity: 1, offset: 0.3 },
              { transform: "scale(1)", opacity: 1, offset: 0.75 },
              { transform: "scale(.5)", opacity: 0 },
            ],
            990,
          ),
        );
      }
      await Promise.all(jobs);
      return;
    }
    if (activation.kind === 3) {
      const ringBox = new DOMRect(
          centerX - box.width * 1.9,
          centerY - box.width * 1.9,
          box.width * 3.8,
          box.width * 3.8,
        ),
        ring = this.effect(run, "gn-burst-ring", ringBox),
        spark = this.effect(run, "gn-sugar-spark", box, "✹");
      await Promise.all([
        this.animate(
          run,
          ring,
          [
            { transform: "scale(.08)", opacity: 1 },
            { transform: "scale(1)", opacity: 0 },
          ],
          480,
        ),
        this.animate(
          run,
          spark,
          [
            { transform: "scale(.2)", opacity: 1 },
            { transform: "scale(2.2)", opacity: 0 },
          ],
          400,
        ),
      ]);
      return;
    }
    const horizontal = activation.kind === 1,
      first = this.box(
        horizontal
          ? Math.floor(activation.at / 6) * 6
          : activation.at % 6,
      ),
      last = this.box(
        horizontal
          ? Math.floor(activation.at / 6) * 6 + 5
          : 30 + (activation.at % 6),
      ),
      lane = this.effect(
        run,
        "gn-ribbon-lane",
        horizontal
          ? new DOMRect(first.x, box.y, last.right - first.x, box.height)
          : new DOMRect(box.x, first.y, box.width, last.bottom - first.y),
      );
    await this.animate(
      run,
      lane,
      [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }],
      480,
    );
  }

  async play(
    phases: Phase[],
    paint: (board: Array<Candy | null>) => void,
    onClear: (phase: Extract<Phase, { kind: "clear" }>) => void,
  ): Promise<void> {
    this.cancel();
    const overlay = document.createElement("div");
    overlay.className = "gn-board-motion";
    this.board().append(overlay);
    const run: MotionRun = {
      cancelled: false,
      animations: [],
      layers: [overlay],
      overlay,
    };
    this.active = run;
    for (const phase of phases) {
      if (run.cancelled) return;
      paint(phase.before);
      if (phase.kind === "swap") {
        this.audio.play("swap");
        for (const index of [phase.from, phase.to])
          this.cell(index).querySelector<HTMLElement>(".gn-candy")!.style.visibility =
            "hidden";
        await Promise.all([
          this.flight(run, phase.from, phase.to, phase.before[phase.from], -9),
          this.flight(run, phase.to, phase.from, phase.before[phase.to], 9),
        ]);
      } else if (phase.kind === "clear") {
        onClear(phase);
        await Promise.all(
          phase.activated.map((activation) => this.power(run, activation)),
        );
        if (run.cancelled) return;
        await Promise.all(
          phase.cells.map((index) => {
            const candy = this.cell(index).querySelector(".gn-candy");
            return candy
              ? this.animate(
                  run,
                  candy,
                  [
                    { transform: "scale(1)", opacity: 1 },
                    { transform: "scale(.3)", opacity: 0 },
                  ],
                  190,
                )
              : Promise.resolve();
          }),
        );
      } else if (phase.kind === "fall") {
        for (const fall of phase.falls)
          if (fall.from >= 0) {
            const candy = this.cell(fall.from).querySelector<HTMLElement>(
              ".gn-candy",
            );
            if (candy) candy.style.visibility = "hidden";
          }
        await Promise.all(
          phase.falls.map((fall) =>
            this.flight(run, fall.from, fall.to, fall.tier),
          ),
        );
      } else {
        await this.animate(
          run,
          this.board(),
          [{ opacity: 1 }, { opacity: 0.35 }],
          120,
        );
        if (run.cancelled) return;
        paint(phase.after);
        await this.animate(
          run,
          this.board(),
          [{ opacity: 0.35 }, { opacity: 1 }],
          160,
        );
      }
      if (run.cancelled) return;
      if ("after" in phase) paint(phase.after);
      run.overlay.replaceChildren();
      for (const animation of run.animations) animation.cancel();
      run.animations = [];
    }
    if (this.active === run) this.cancel();
  }
}

/** Shared hostable DOM game. The simulation remains in engine.ts and has no runtime dependencies. */
export class GummyNookGame implements GameSession {
  private state: GameState;
  private readonly timers = new TimerBag();
  private readonly audio = new GummyAudio();
  private readonly motion: GummyMotion;
  private history: Board[] = [];
  private selection: number | null = null;
  private drag: { cell: number; x: number; y: number; id: number } | null =
    null;
  private paused = false;
  private manualPause = false;
  private disposed = false;
  private animating = false;
  private displayBoard: Board | null = null;
  private activeUntil = 0;
  private activeSeconds = 0;
  private creditTimer: number | null = null;
  private readonly onClick = (event: Event) => this.click(event);
  private readonly onPointerDown = (event: PointerEvent) =>
    this.pointerDown(event);
  private readonly onPointerUp = (event: PointerEvent) => this.pointerUp(event);
  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.selection = null;
      this.render();
    }
  };
  private readonly onVisibility = () => {
    if (document.hidden) this.setPaused(true);
    else if (!this.manualPause) this.setPaused(false);
  };

  constructor(
    private readonly root: HTMLElement,
    private readonly host: GameHostServices<GummyNookProgress>,
  ) {
    this.motion = new GummyMotion(root, this.audio);
    this.state = serializeGummyNookProgress(host.progress);
    this.state.settings.muted ||= host.muted;
    if (host.reducedMotion) this.state.settings.motion = false;
    document.body.classList.add("gummy-nook-active");
    root.classList.add("gummy-nook");
    root.innerHTML = `<section class="gn-shell"><header class="gn-header"><div><p class="gn-kicker">NOT IF I CAN HELP IT</p><h1>Gummy Nook</h1><p id="gn-status" aria-live="polite">Swap neighbors. Match three. Let a little lovely happen.</p></div><div class="gn-header-actions"><button data-action="sound" aria-label="Toggle sound">Sound</button><button data-action="pause">Pause</button><button data-action="exit">Exit</button></div></header><section class="gn-stats" aria-label="Progress"><span><b id="gn-cleared">0</b> cleared</span><span><b id="gn-moves">0</b> lovely moves</span><span id="gn-chain">A little more lovely</span></section><section class="gn-play"><div class="gn-board-wrap"><div id="gn-board" class="gn-board" role="grid" aria-label="Six by six gummy board"></div><div class="gn-tools"><button data-action="hint">Hint</button><button data-action="shuffle">Mix tray</button><button id="gn-undo" data-action="undo">Undo</button></div><p class="gn-help">Swipe in any direction, including diagonally—or tap two touching gummies. Match rows or columns of three.</p></div><aside class="gn-nook"><h2>Your nook</h2><p id="gn-goal"></p><progress id="gn-goal-progress" max="1"></progress><div id="gn-discoveries" class="gn-discoveries" aria-label="Gummy discoveries"></div><h3>Keepsakes <span id="gn-reward-count"></span></h3><div id="gn-rewards"></div><button data-action="settings">Comfort settings</button></aside></section><section id="gn-pause-panel" class="gn-panel" hidden><h2>Taking a cozy pause</h2><button data-action="resume">Resume</button></section><section id="gn-settings-panel" class="gn-panel" hidden><h2>Comfort settings</h2><label><input data-setting="music" type="checkbox" /> Music</label><label><input data-setting="motion" type="checkbox" /> Motion</label><label><input data-setting="gloss" type="checkbox" /> Candy gloss</label><button data-action="close-settings">Done</button></section></section>`;
    root.addEventListener("click", this.onClick);
    root.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.creditTimer = window.setInterval(() => this.creditActivePlay(), 1000);
    this.syncRewards();
    this.save();
    this.render();
  }
  setPaused(value: boolean): void {
    if (this.disposed) return;
    this.paused = value;
    this.drag = null;
    if (value) {
      this.motion.cancel();
      this.displayBoard = null;
      this.animating = false;
    }
    const panel = this.byId("gn-pause-panel");
    panel.hidden = !value;
    this.render();
  }
  setMuted(muted: boolean): void {
    this.state.settings.muted = muted;
    this.audio.setMuted(muted);
    this.save();
    this.render();
  }
  flushProgress(): void {
    if (!this.disposed) this.save();
  }
  status(): unknown {
    return {
      paused: this.paused,
      animating: this.animating,
      activeSeconds: this.activeSeconds,
      moves: this.state.moves,
      cleared: this.state.cleared,
    };
  }
  dispose(): void {
    if (this.disposed) return;
    this.flushProgress();
    this.disposed = true;
    this.timers.dispose();
    if (this.creditTimer !== null) window.clearInterval(this.creditTimer);
    this.creditTimer = null;
    this.root.removeEventListener("click", this.onClick);
    this.root.removeEventListener("pointerdown", this.onPointerDown);
    document.removeEventListener("pointerup", this.onPointerUp);
    document.removeEventListener("pointercancel", this.onPointerUp);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibility);
    document.body.classList.remove("gummy-nook-active");
    this.audio.dispose();
    this.motion.cancel();
    this.root.replaceChildren();
  }
  private byId(id: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(`#${id}`);
    if (!element) throw new Error(`Missing ${id}`);
    return element;
  }
  private cell(target: EventTarget | null): number | null {
    const node =
      target instanceof Element
        ? target.closest<HTMLButtonElement>("[data-cell]")
        : null;
    const value = node?.dataset.cell;
    return value !== undefined ? Number(value) : null;
  }
  private activity(seconds = 7): void {
    this.activeUntil = Math.max(
      this.activeUntil,
      performance.now() + seconds * 1000,
    );
  }
  private creditActivePlay(): void {
    if (
      this.disposed ||
      this.paused ||
      document.hidden ||
      performance.now() > this.activeUntil
    )
      return;
    this.activeSeconds++;
    this.host.creditActivePlay(
      this.host.activePlaySeconds + this.activeSeconds,
    );
  }
  private save(): void {
    this.host.saveProgress(serializeGummyNookProgress(this.state));
  }
  private syncRewards(): void {
    for (const legacy of this.state.owned) {
      const id = rewardByLegacy[legacy];
      if (id) this.host.awardReward(id);
    }
  }
  private setStatus(message: string): void {
    this.byId("gn-status").textContent = message;
  }
  private paintBoard(boardData: Array<Candy | null>): void {
    const board = this.byId("gn-board");
    for (let index = 0; index < GummyBoard.count; index++) {
      const tier = boardData[index],
        existing = board.querySelector<HTMLButtonElement>(
          `:scope > [data-cell="${index}"]`,
        ),
        button = existing ?? document.createElement("button");
      if (!existing) {
        button.type = "button";
        button.dataset.cell = String(index);
        const overlay = board.querySelector(":scope > .gn-board-motion");
        board.insertBefore(button, overlay);
      }
      if (tier === null) {
        button.className = "gn-cell gn-empty";
        delete button.dataset.value;
        button.replaceChildren();
        button.setAttribute("aria-label", `Empty row ${Math.floor(index / 6) + 1}, column ${(index % 6) + 1}`);
        continue;
      }
      const power = GummyBoard.power(tier),
        base = GummyBoard.base(tier)!;
      button.className = `gn-cell${power ? " gn-powered" : ""}${this.selection === index ? " gn-selected" : ""}`;
      button.setAttribute("role", "gridcell");
      button.setAttribute(
        "aria-label",
        `Row ${Math.floor(index / 6) + 1}, column ${(index % 6) + 1}: ${GummyBoard.names[base]}${power ? `, ${GummyBoard.powerNames[power]}` : ""}`,
      );
      if (button.dataset.value !== String(tier)) {
        button.dataset.value = String(tier);
        button.innerHTML = `<span class="gn-candy gn-candy-${base}">${GummyArt.piece(tier)}</span>`;
      }
      const candy = button.querySelector<HTMLElement>(".gn-candy");
      if (candy) {
        candy.style.removeProperty("visibility");
        candy.style.removeProperty("opacity");
        candy.style.removeProperty("transform");
      }
    }
  }
  private render(): void {
    if (this.disposed) return;
    const board = this.byId("gn-board");
    board.classList.toggle("gn-matte", !this.state.settings.gloss);
    board.style.setProperty("--gn-tint", this.tint());
    this.paintBoard(this.displayBoard ?? this.state.board);
    this.byId("gn-cleared").textContent = String(this.state.cleared);
    this.byId("gn-moves").textContent = String(this.state.moves);
    this.byId("gn-chain").textContent =
      this.state.bestCascade > 1
        ? `${this.state.bestCascade}× best cascade`
        : "A little more lovely";
    const next = LEGACY_REWARDS.find((id) => !this.state.owned.includes(id));
    const nextIndex = next ? LEGACY_REWARDS.indexOf(next) : -1;
    const goal = this.byId("gn-goal"),
      progress = this.byId("gn-goal-progress") as HTMLProgressElement;
    goal.textContent = next
      ? `${Math.max(0, [0, 12, 40, 100][nextIndex] - this.state.cleared)} more gummies to your ${["candy jar", "gummy lamp", "soft sock cushion", "gummy-bear beanbag"][nextIndex]}.`
      : "Your cozy corner is complete. Keep the cascades coming.";
    progress.value = next
      ? Math.min(
          1,
          this.state.cleared / Math.max(1, [0, 12, 40, 100][nextIndex]),
        )
      : 1;
    this.byId("gn-discoveries").innerHTML = GummyBoard.names
      .map(
        (name, i) =>
          `<span class="${this.state.discovered.includes(i) ? "" : "gn-locked"}" title="${name}">${this.state.discovered.includes(i) ? GummyArt.piece(i) : "?"}<small>${this.state.discovered.includes(i) ? name : "undiscovered"}</small></span>`,
      )
      .join("");
    this.byId("gn-rewards").innerHTML = LEGACY_REWARDS.map(
      (id, i) =>
        `<p class="${this.state.owned.includes(id) ? "" : "gn-locked"}">${this.state.owned.includes(id) ? "✓" : "○"} ${["Candy jar", "Gummy lamp", "Soft sock cushion", "Gummy-bear beanbag"][i]}</p>`,
    ).join("");
    this.byId("gn-reward-count").textContent = `${this.state.owned.length} / 4`;
    (this.byId("gn-undo") as HTMLButtonElement).disabled =
      !this.history.length || this.paused || this.animating;
    for (const setting of ["music", "motion", "gloss"] as const)
      this.root.querySelector<HTMLInputElement>(
        `[data-setting="${setting}"]`,
      )!.checked = this.state.settings[setting];
  }
  private tint(): string {
    const colors = ["#a9d8c5", "#a5cee4", "#c7b4df", "#e1b5c6", "#edcaa8"],
      position = this.state.cleared / 120,
      a = Math.floor(position) % colors.length,
      b = (a + 1) % colors.length;
    return `color-mix(in srgb, ${colors[a]} ${(1 - (position % 1)) * 100}%, ${colors[b]})`;
  }
  private click(event: Event): void {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("button,[data-setting]")
        : null;
    if (!target) return;
    const setting = target.getAttribute("data-setting") as
      keyof GameState["settings"] | null;
    if (setting) {
      this.state.settings[setting] = (target as HTMLInputElement).checked;
      this.save();
      this.render();
      return;
    }
    const action = target.dataset.action;
    if (action) {
      this.action(action);
      return;
    }
    const cell = this.cell(target);
    if (cell !== null) this.choose(cell);
  }
  private action(action: string): void {
    if (action === "exit") {
      this.flushProgress();
      this.host.exit();
      return;
    }
    if (action === "pause") {
      this.manualPause = true;
      this.setPaused(true);
      return;
    }
    if (action === "resume") {
      this.manualPause = false;
      this.paused = false;
      this.byId("gn-pause-panel").hidden = true;
      this.render();
      return;
    }
    if (action === "settings") {
      this.byId("gn-settings-panel").hidden = false;
      return;
    }
    if (action === "close-settings") {
      this.byId("gn-settings-panel").hidden = true;
      this.save();
      return;
    }
    if (action === "sound") {
      this.audio.unlock();
      this.setMuted(!this.state.settings.muted);
      return;
    }
    if (this.paused || this.animating) return;
    if (action === "undo") {
      const board = this.history.pop();
      if (board) {
        this.state.board = board;
        this.selection = null;
        this.save();
        this.render();
        this.setStatus("One move back. Your keepsakes stay yours.");
      }
      return;
    }
    if (action === "hint") {
      const move = GummyBoard.legalMoves(this.state.board)[0];
      if (move) {
        this.selection = move[0];
        this.render();
        this.setStatus(
          "Try swapping the highlighted gummy with its touching friend.",
        );
      }
      return;
    }
    if (action === "shuffle") {
      this.history.push([...this.state.board]);
      this.state.board = GummyBoard.mix(this.state.board);
      this.selection = null;
      this.save();
      this.activity(3);
      this.render();
      this.setStatus("A fresh mix. All your keepsakes stay yours.");
    }
  }
  private pointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.paused || this.animating) return;
    const cell = this.cell(event.target);
    if (cell === null) return;
    this.audio.unlock();
    this.drag = {
      cell,
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    };
  }
  private pointerUp(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    const drag = this.drag;
    this.drag = null;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) < 16) return;
    const x = Math.abs(dx),
      y = Math.abs(dy),
      diagonal = Math.min(x, y) / Math.max(x, y) > 0.42,
      dc = diagonal || x > y ? Math.sign(dx) : 0,
      dr = diagonal || y >= x ? Math.sign(dy) : 0,
      target = drag.cell + dc + dr * 6;
    if (
      (drag.cell % 6) + dc >= 0 &&
      (drag.cell % 6) + dc < 6 &&
      GummyBoard.adjacent(drag.cell, target)
    )
      void this.move(drag.cell, target);
  }
  private choose(cell: number): void {
    if (this.paused || this.animating) return;
    this.audio.unlock();
    if (this.selection === null) {
      this.selection = cell;
      this.audio.play("pick");
      this.render();
      this.setStatus("Choose a touching gummy—diagonals count too.");
      return;
    }
    if (this.selection === cell) {
      this.selection = null;
      this.render();
      return;
    }
    if (!GummyBoard.adjacent(this.selection, cell)) {
      this.selection = cell;
      this.render();
      this.setStatus("Choose a touching gummy—diagonals count too.");
      return;
    }
    void this.move(this.selection, cell);
  }
  private async move(from: number, to: number): Promise<void> {
    if (this.paused || this.animating || this.disposed) return;
    this.audio.unlock();
    if (!this.state.settings.motion || this.host.reducedMotion)
      this.audio.play("swap");
    const before = [...this.state.board],
      owned = new Set(this.state.owned),
      result = GummyBoard.swap(this.state, from, to);
    this.selection = null;
    this.animating = true;
    this.activity(result.ok ? 8 : 2);
    await this.play(result.phases);
    this.animating = false;
    if (!result.ok) {
      this.setStatus(
        result.reason === "neighbor"
          ? "Swap with a touching neighbor."
          : "Almost! Line up three or more of the same shape.",
      );
      this.render();
      return;
    }
    this.history.push(before);
    if (this.history.length > 30) this.history.shift();
    this.save();
    this.syncRewards();
    this.render();
    const newReward = this.state.owned.some((id) => !owned.has(id));
    this.setStatus(
      `${result.depth! > 1 ? `${result.depth}× cascade! ` : ""}${result.cleared} gummies cleared.${newReward ? " A new keepsake is in your nook!" : ""}`,
    );
  }
  private async play(phases: Phase[]): Promise<void> {
    if (!this.state.settings.motion || this.host.reducedMotion) return;
    await this.motion.play(phases, (board) => this.paintBoard(board), (phase) => {
      this.audio.play(phase.activated.length ? "power" : "clear");
      this.setStatus(
        phase.depth > 1
          ? `${phase.depth}× cascade! Another ${phase.cells.length} gummies.`
          : `${phase.cells.length} gummies matched!`,
      );
    });
  }
}
