import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { DuetMusic, type DuetSong } from "./audio";
import { ActivePlayWindow, clamp, DuetHands, DuetRun, LEVEL_NAMES, SECONDS_PER_BEAT, type Side } from "./core";
import { ARCTIC_DUET_REWARDS, earnedKeepsakes, loadArcticDuetProgress, type ArcticDuetProgress } from "./progress";
import { DuetPainter } from "./render";

const SONG: DuetSong = { roots: [48, 53, 55, 48], melody: [0, 4, 7, 9, 7, 4, 2, 0] };

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Arctic Duet element: ${selector}`);
  return element;
}

/** Shared DOM game implementation for both standalone Vite and the lazy host entry. */
export class ArcticDuetGame implements GameSession {
  private progress: ArcticDuetProgress;
  private readonly run = new DuetRun();
  private readonly hands = new DuetHands(this.run);
  private readonly music = new DuetMusic();
  private readonly pressed = new Set<string>();
  private readonly cleanup: Array<() => void> = [];
  private readonly canvas: HTMLCanvasElement;
  private readonly painter: DuetPainter;
  private readonly stage: HTMLElement;
  private readonly level: HTMLElement;
  private readonly chapter: HTMLElement;
  private readonly score: HTMLElement;
  private readonly track: HTMLElement;
  private readonly banner: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly welcome: HTMLElement;
  private readonly paused: HTMLElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly soundButton: HTMLButtonElement;
  private readonly record: HTMLElement;
  private readonly keepsakes: HTMLElement;
  private readonly saveStatus: HTMLElement;
  private playing = false;
  private started = false;
  private starting = false;
  private disposed = false;
  private anchor = 0;
  private frozenBeat = 0;
  private scheduledHalfBeat = 0;
  private lastClock = 0;
  private lastSaveClock = 0;
  private animationFrame = 0;
  private activeSide: Side = 0;
  private bannerUntil = 0;
  private readonly activePlay = new ActivePlayWindow();

  constructor(private readonly root: HTMLElement, private readonly services: GameHostServices<ArcticDuetProgress>) {
    this.progress = loadArcticDuetProgress(services.progress);
    this.progress.motion ||= services.reducedMotion;
    this.run.gentle = this.progress.gentle;
    this.root.classList.add("arctic-duet");
    this.root.replaceChildren(this.template());
    this.canvas = required(this.root, '[data-duet="canvas"]');
    this.painter = new DuetPainter(this.canvas);
    this.stage = required(this.root, '[data-duet="stage"]');
    this.level = required(this.root, '[data-duet="level"]');
    this.chapter = required(this.root, '[data-duet="chapter"]');
    this.score = required(this.root, '[data-duet="score"]');
    this.track = required(this.root, '[data-duet="track"]');
    this.banner = required(this.root, '[data-duet="banner"]');
    this.hint = required(this.root, '[data-duet="hint"]');
    this.welcome = required(this.root, '[data-duet="welcome"]');
    this.paused = required(this.root, '[data-duet="paused"]');
    this.pauseButton = required(this.root, '[data-duet="pause"]');
    this.soundButton = required(this.root, '[data-duet="sound"]');
    this.record = required(this.root, '[data-duet="record"]');
    this.keepsakes = required(this.root, '[data-duet="keepsakes"]');
    this.saveStatus = required(this.root, '[data-duet="save-status"]');
    this.bind(); this.syncRewards(); this.renderRecord(); this.updateHud(); this.lastClock = this.music.now();
    this.animationFrame = requestAnimationFrame(() => this.frame());
  }

  setPaused(paused: boolean): void { if (paused) this.pause(); else if (this.started) void this.start(); }
  setMuted(muted: boolean): void { this.progress.muted = muted; this.music.setMuted(muted); this.updateSoundLabel(); this.flushProgress(); }
  flushProgress(): void {
    if (this.disposed) return;
    this.progress.keepsakes = earnedKeepsakes(this.progress.total, this.progress.keepsakes);
    this.services.saveProgress({ ...this.progress, keepsakes: [...this.progress.keepsakes] });
    this.lastSaveClock = this.music.now();
  }
  dispose(): void {
    if (this.disposed) return;
    this.pause(); this.flushProgress(); this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    for (const remove of this.cleanup.splice(0)) remove();
    this.music.dispose(); this.root.replaceChildren(); this.root.classList.remove("arctic-duet");
  }
  status(): unknown { return { playing: this.playing, level: this.run.level, catches: this.progress.total }; }

  private template(): HTMLElement {
    const shell = document.createElement("main");
    shell.innerHTML = `
      <header class="arctic-duet__header"><div><div class="arctic-duet__eyebrow">THE VERY, VERY FAR NORTH · A MUSICAL PLAYGROUND</div><h1>Arctic <em>Duet</em><span>✦</span></h1></div><div class="arctic-duet__tools"><button type="button" data-duet="sound" aria-label="Toggle sound">Sound on</button><button type="button" data-duet="pause" disabled>Pause</button></div></header>
      <section class="arctic-duet__status"><div><span class="arctic-duet__tag" data-duet="level">LEVEL 1</span><strong data-duet="chapter">First bites</strong></div><div class="arctic-duet__score"><b data-duet="score">0</b> sweet points</div><div class="arctic-duet__track"><div data-duet="track"></div></div></section>
      <section class="arctic-duet__stage" data-duet="stage" aria-label="Split playfield. Drag left half to move Duane; drag right half to move Major Puff."><canvas data-duet="canvas" width="1200" height="760"></canvas><div class="arctic-duet__banner" data-duet="banner" aria-live="polite"></div><div class="arctic-duet__hint" data-duet="hint">One friend for each thumb. Slide underneath the snacks.</div><div class="arctic-duet__overlay" data-duet="welcome"><div class="arctic-duet__card"><div class="arctic-duet__eyebrow">TWO FRIENDS. ONE SWEET GROOVE.</div><h2>A little slide.<br />A lot of <em>yum.</em></h2><p>Slide each friend underneath the falling snacks.<br />Start slow. Find your groove. Grow together.</p><button type="button" data-duet="play">Let’s duet <span>↗</span></button><small>Two thumbs on iPad · A / D &amp; ← / → on keyboard<br />Using a mouse? Turn on One hand below.</small></div></div><div class="arctic-duet__overlay arctic-duet__paused" data-duet="paused" hidden><h2>A little breather.</h2><button type="button" data-duet="resume">Keep the groove going ↗</button></div></section>
      <footer class="arctic-duet__footer"><div class="arctic-duet__settings"><label><input type="checkbox" data-duet="assist" /> One hand <span title="The friend you are not moving catches automatically">ⓘ</span></label><label><input type="checkbox" data-duet="gentle" /> Gentle pace</label><label><input type="checkbox" data-duet="motion" /> Less motion</label></div><div data-duet="record">Every snack is a small celebration.</div></footer>
      <p class="arctic-duet__keepsakes" data-duet="keepsakes">Keepsakes arrive with your catches.</p><p class="arctic-duet__footnote">Miss a bite? The music keeps going. <span data-duet="save-status">Progress stays with this Chapter House profile.</span></p>`;
    return shell;
  }

  private listen(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
    target.addEventListener(type, handler, options); this.cleanup.push(() => target.removeEventListener(type, handler, options));
  }
  private bind(): void {
    this.listen(required<HTMLButtonElement>(this.root, '[data-duet="play"]'), "click", () => void this.start());
    this.listen(required<HTMLButtonElement>(this.root, '[data-duet="resume"]'), "click", () => void this.start());
    this.listen(this.pauseButton, "click", () => this.playing ? this.pause() : void this.start());
    this.listen(this.soundButton, "click", () => this.setMuted(!this.progress.muted));
    for (const [key, field] of [["assist", "assist"], ["gentle", "gentle"], ["motion", "motion"]] as const) {
      const input = required<HTMLInputElement>(this.root, `[data-duet="${key}"]`); input.checked = this.progress[field];
      this.listen(input, "change", () => { this.progress[field] = input.checked; this.run.gentle = this.progress.gentle; this.noteActivity(); this.flushProgress(); });
    }
    const point = (event: PointerEvent): number => { const rect = this.stage.getBoundingClientRect(); return clamp((event.clientX - rect.left) / rect.width, 0, 1); };
    this.listen(this.stage, "pointerdown", (event) => {
      const pointer = event as PointerEvent;
      if (!this.playing || (pointer.target as Element).closest("button")) return;
      const x = point(pointer); if (this.hands.down(pointer.pointerId, x)) { this.activeSide = x < 0.5 ? 0 : 1; this.stage.setPointerCapture(pointer.pointerId); this.noteActivity(); pointer.preventDefault(); }
    });
    this.listen(this.stage, "pointermove", (event) => { const pointer = event as PointerEvent; if (this.playing && this.hands.pointers.has(pointer.pointerId)) { this.hands.move(pointer.pointerId, point(pointer)); this.noteActivity(); } });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) this.listen(this.stage, type, (event) => this.hands.up((event as PointerEvent).pointerId));
    this.listen(window, "keydown", (event) => {
      const key = event as KeyboardEvent;
      if (["INPUT", "SELECT"].includes(document.activeElement?.tagName ?? "")) return;
      if (["KeyA", "KeyD", "ArrowLeft", "ArrowRight"].includes(key.code) && this.playing) { this.pressed.add(key.code); this.activeSide = key.code.startsWith("Arrow") ? 1 : 0; this.noteActivity(); key.preventDefault(); }
      if (key.code === "Space" && this.started && !key.repeat && document.activeElement?.tagName !== "BUTTON") { key.preventDefault(); this.playing ? this.pause() : void this.start(); }
    });
    this.listen(window, "keyup", (event) => this.pressed.delete((event as KeyboardEvent).code));
    this.listen(window, "blur", () => { this.pressed.clear(); this.hands.clear(); });
    this.listen(document, "visibilitychange", () => { if (document.hidden) this.pause(); });
    this.listen(window, "pagehide", () => this.flushProgress());
    this.updateSoundLabel();
  }
  private async start(): Promise<void> {
    if (this.starting || this.playing || this.disposed) return;
    this.starting = true; const audio = await this.music.start(); this.starting = false;
    if (this.disposed || document.hidden) { this.music.stop(); return; }
    this.music.setMuted(this.progress.muted); this.anchor = this.music.now() - this.frozenBeat * SECONDS_PER_BEAT; this.lastClock = this.music.now(); this.scheduledHalfBeat = Math.ceil(this.frozenBeat * 2); this.playing = true; this.started = true; this.noteActivity();
    this.welcome.hidden = true; this.paused.hidden = true; this.pauseButton.disabled = false; this.pauseButton.textContent = "Pause";
    if (!audio) this.saveStatus.textContent = "Audio unavailable — enjoy the silent groove.";
  }
  private pause(): void {
    if (!this.playing) return;
    this.frozenBeat = this.run.beat; this.playing = false; this.music.stop(); this.hands.clear(); this.pressed.clear(); this.pauseButton.textContent = "Resume"; this.paused.hidden = false; this.flushProgress();
  }
  private noteActivity(): void { this.activePlay.activate(this.lastClock); }
  private syncRewards(): void {
    this.progress.keepsakes = earnedKeepsakes(this.progress.total, this.progress.keepsakes);
    for (const reward of ARCTIC_DUET_REWARDS) if (this.progress.total >= reward.threshold) this.services.awardReward(reward.rewardId);
  }
  private renderRecord(): void {
    this.record.textContent = `${this.progress.total} bites caught · Best level ${this.progress.bestLevel}`;
    this.keepsakes.textContent = this.progress.keepsakes.length ? `Keepsakes: ${this.progress.keepsakes.map((id) => ARCTIC_DUET_REWARDS.find((reward) => reward.legacyId === id)?.name).join(" · ")}` : "Keepsakes arrive with your catches.";
  }
  private updateSoundLabel(): void { this.soundButton.textContent = this.progress.muted ? "Sound off" : "Sound on"; }
  private updateHud(): void {
    this.level.textContent = `LEVEL ${this.run.level}`; this.chapter.textContent = LEVEL_NAMES[Math.min(7, this.run.level - 1)] ?? LEVEL_NAMES[0]; this.score.textContent = this.run.score.toLocaleString(); this.track.style.width = `${(Math.max(0, this.run.beat - 4) % 32) / 32 * 100}%`;
    if (this.run.beat > this.bannerUntil) this.banner.classList.remove("arctic-duet__banner--show");
    this.hint.textContent = this.run.beat < 4 ? "Get comfy. First bites are coming…" : this.progress.assist ? "One hand on · your partner follows along." : "Two friends, two thumbs. Missed bites don’t stop the groove.";
  }
  private announce(text: string): void { this.banner.textContent = text; this.bannerUntil = this.run.beat + 4; this.banner.classList.add("arctic-duet__banner--show"); }
  private reportActive(delta: number): void {
    const total = this.activePlay.advance(this.lastClock, delta, this.services.activePlaySeconds);
    if (total !== null) this.services.creditActivePlay(total);
  }
  private frame(): void {
    if (this.disposed) return;
    const now = this.music.now(); const delta = Math.min(0.05, Math.max(0, now - this.lastClock)); this.lastClock = now;
    if (this.playing) {
      const beat = (now - this.anchor) / SECONDS_PER_BEAT;
      this.run.positions[0] = clamp(this.run.positions[0] + ((this.pressed.has("KeyD") ? 1 : 0) - (this.pressed.has("KeyA") ? 1 : 0)) * delta * 1.25, 0.08, 0.92);
      this.run.positions[1] = clamp(this.run.positions[1] + ((this.pressed.has("ArrowRight") ? 1 : 0) - (this.pressed.has("ArrowLeft") ? 1 : 0)) * delta * 1.25, 0.08, 0.92);
      if (this.progress.assist) { const side: Side = this.activeSide === 0 ? 1 : 0; if (![...this.hands.pointers.values()].includes(side)) { const next = this.run.notes.filter((note) => note.side === side && note.state === "fall" && note.beat >= beat - 0.24).sort((a, b) => a.beat - b.beat)[0]; if (next) this.run.positions[side] += (next.x - this.run.positions[side]) * Math.min(1, delta * 12); } }
      for (const event of this.run.advance(beat)) {
        this.painter.react(event, now);
        if (event.type === "level" && event.level) { this.progress.bestLevel = Math.max(this.progress.bestLevel, event.level); this.announce(`Level ${event.level} · ${LEVEL_NAMES[Math.min(7, event.level - 1)] ?? LEVEL_NAMES[0]}`); this.music.flourish(); this.flushProgress(); }
        if (event.type === "catch" && event.note) { this.progress.total++; const note = 60 + SONG.melody[Math.floor(event.note.beat) % 8]! + event.note.side * 12; this.music.tone(note, now, 0.16, 0.14, "triangle", 3); this.syncRewards(); this.renderRecord(); }
      }
      const horizon = beat + 0.12 / SECONDS_PER_BEAT; this.scheduledHalfBeat = Math.max(this.scheduledHalfBeat, Math.ceil((beat - 0.08) * 2));
      while (this.scheduledHalfBeat / 2 <= horizon) { this.music.schedule(SONG, this.scheduledHalfBeat / 2, this.anchor + this.scheduledHalfBeat / 2 * SECONDS_PER_BEAT, Math.min(4, 1 + this.run.level), this.run.level >= 6); this.scheduledHalfBeat++; }
      this.reportActive(delta); if (now - this.lastSaveClock > 5) this.flushProgress(); this.updateHud();
    }
    this.painter.draw(this.run, now, this.progress.motion, this.playing);
    this.animationFrame = requestAnimationFrame(() => this.frame());
  }
}
