import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { KEYFALL_REWARD_ID } from "./manifest";
import { distance, shouldGentleReset } from "./geometry";
import { applyRoomGesture } from "./room-input";
import type { CampaignCatalog } from "./catalog";
import { KeyfallAudio } from "./audio";
import { applyOpeningImpulse, makeWorld, type KeyfallWorld } from "./physics";
import { KeyfallEffects } from "./interaction";
import { GAME_VIEWPORT, KEYFALL_CATALOG } from "./rooms";
import { RoomPicker } from "./room-picker";
import { emptyProgress, normalizeProgress, recordCompletion, SAVE_KEY } from "./progress";
import { KeyfallRenderer } from "./renderer";
import type { KeyfallProgress, RoomDefinition, RuntimeState, Vec, Viewport } from "./types";

/** Standalone callbacks remain supported; host lifecycle fields are optional. */
export type KeyfallCallbacks = Partial<GameHostServices<KeyfallProgress>> & {
  load?: () => KeyfallProgress;
  save?: (progress: KeyfallProgress) => void;
};

export type KeyfallGameOptions = Readonly<{ showStandaloneControls?: boolean }>;

/** One shared runtime for the standalone editor/playtest and Chapter House. */
export class KeyfallGame implements GameSession {
  private roomIndex = 0;
  private room: RoomDefinition;
  private world!: KeyfallWorld;
  private readonly renderer: KeyfallRenderer;
  private progress: KeyfallProgress;
  private state: RuntimeState = "ready";
  private readonly collected = new Set<string>();
  private resetTimer?: number;
  private lastTime = 0;
  private physicsAccumulator = 0;
  private readonly audio: KeyfallAudio;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly tickets: HTMLElement;
  private readonly roomPicker: RoomPicker;
  private readonly effects = new KeyfallEffects();
  private readonly viewport: Viewport = GAME_VIEWPORT;
  private readonly abort = new AbortController();
  private frameId = 0;
  private paused = false;
  private disposed = false;
  private activeTotal: number;
  private creditedTotal: number;
  private activityRemaining = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: KeyfallCallbacks = {},
    private readonly catalog: CampaignCatalog = KEYFALL_CATALOG,
    options: KeyfallGameOptions = {},
  ) {
    const firstRoom = catalog.all()[0];
    if (!firstRoom) throw new Error("No playable levels in the campaign");
    this.room = firstRoom;
    this.progress = normalizeProgress(callbacks.progress ?? callbacks.load?.() ?? this.loadLocal());
    if (callbacks.muted !== undefined) this.progress = { ...this.progress, muted: callbacks.muted };
    if (callbacks.reducedMotion !== undefined) this.progress = { ...this.progress, reducedMotion: callbacks.reducedMotion };
    this.activeTotal = callbacks.activePlaySeconds ?? 0;
    this.creditedTotal = Math.floor(this.activeTotal);
    this.audio = new KeyfallAudio(() => this.progress.muted);
    root.className = "keyfall-app";
    root.innerHTML = `<header><div><p class="eyebrow">THE ABANDONED FUNHOUSE</p><h1>Keyfall</h1><p id="keyfall-subtitle"></p><p class="instructions">Swipe across a cord to cut it · tap bubbles or marked devices</p></div><div class="top-actions"><button data-action="pause">Pause</button><button data-action="sound" aria-pressed="false">Sound on</button></div></header><section class="room-picker" aria-label="Choose a room"></section><div class="board-wrap"><canvas aria-label="Keyfall physics puzzle"></canvas></div><footer><div><h2 id="keyfall-title" tabindex="-1"></h2><span id="keyfall-tickets"></span><a class="credits-link" href="credits.html">Credits &amp; licenses</a></div><button data-action="reset">Reset room</button></footer>`;
    this.title = this.required("#keyfall-title");
    this.subtitle = this.required("#keyfall-subtitle");
    this.tickets = this.required("#keyfall-tickets");
    const canvas = this.required<HTMLCanvasElement>("canvas");
    this.renderer = new KeyfallRenderer(canvas);
    if (options.showStandaloneControls === false) this.required<HTMLButtonElement>('[data-action="sound"]').hidden = true;
    this.bind(canvas);
    this.roomPicker = new RoomPicker(this.required(".room-picker"), this.catalog, (room) => this.loadRoom(this.catalog.indexOf(room.id), true), this.room.id, true);
    this.renderer.setViewport(this.viewport);
    this.loadRoom(0);
    window.addEventListener("resize", () => this.renderer.resize(), { signal: this.abort.signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.setPaused(true); }, { signal: this.abort.signal });
    this.frameId = requestAnimationFrame((time) => this.loop(time));
  }

  setPaused(paused: boolean): void {
    if (this.disposed || this.state === "complete") return;
    this.paused = paused;
    this.state = paused ? "paused" : "playing";
    this.lastTime = 0;
    this.effects.interaction.cancel();
    this.audio.setPaused(paused);
    this.updateButtons();
  }

  setMuted(muted: boolean): void {
    if (this.disposed) return;
    this.progress = { ...this.progress, muted };
    this.audio.setMuted(muted);
    this.persist();
    this.updateButtons();
  }

  flushProgress(): void { this.creditActivity(); this.persist(); }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    if (this.resetTimer) window.clearTimeout(this.resetTimer);
    this.abort.abort();
    this.effects.clear();
    this.world.dispose();
    this.flushProgress();
    this.audio.dispose();
    this.root.replaceChildren();
  }

  status(): unknown {
    return { room: this.room.id, complete: this.progress.completed.includes(this.room.id), tickets: this.collected.size, paused: this.paused, activePlaySeconds: Math.floor(this.activeTotal) };
  }

  private required<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Keyfall missing ${selector}`);
    return element;
  }

  private loadLocal(): KeyfallProgress {
    try { return normalizeProgress(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null")); }
    catch { return emptyProgress(); }
  }

  private persist(): void {
    try {
      if (this.callbacks.saveProgress) { this.callbacks.saveProgress(this.progress); return; }
      if (this.callbacks.save) { this.callbacks.save(this.progress); return; }
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress));
    } catch { /* A denied save never makes the current attempt unplayable. */ }
  }

  private bind(canvas: HTMLCanvasElement): void {
    const signal = this.abort.signal;
    canvas.addEventListener("pointerdown", (event) => {
      if (this.paused || this.state === "complete") return;
      canvas.setPointerCapture(event.pointerId);
      this.audio.unlock();
      this.state = "playing";
      this.effects.interaction.begin(this.mapPoint(event, canvas));
      this.updateButtons();
    }, { signal });
    canvas.addEventListener("pointermove", (event) => {
      if (this.effects.interaction.isActive) this.effects.interaction.move(this.mapPoint(event, canvas));
    }, { signal });
    canvas.addEventListener("pointerup", (event) => {
      const gesture = this.effects.interaction.release(this.mapPoint(event, canvas));
      if (this.paused || this.state === "complete") return;
      const result = applyRoomGesture(this.room, this.world, gesture);
      if (result.cuts) this.audio.cordCut();
      if (result.activated) this.audio.fanActivate();
      if (result.cuts || result.activated) this.markActivity();
    }, { signal });
    canvas.addEventListener("pointercancel", () => this.effects.interaction.cancel(), { signal });
    this.root.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "pause") this.setPaused(!this.paused);
      if (action === "reset") this.resetRoom();
      if (action === "sound") this.setMuted(!this.progress.muted);
    }, { signal }));
  }

  private mapPoint(event: PointerEvent, canvas: HTMLCanvasElement): Vec {
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * this.viewport.width, y: ((event.clientY - rect.top) / rect.height) * this.viewport.height };
  }

  private loadRoom(index: number, focusHeading = false): void {
    this.world?.dispose();
    this.roomIndex = Math.max(0, Math.min(this.catalog.all().length - 1, index));
    this.effects.clear();
    this.physicsAccumulator = 0;
    this.room = this.catalog.all()[this.roomIndex]!;
    this.world = makeWorld(this.room, this.viewport);
    applyOpeningImpulse(this.world, this.progress.reducedMotion);
    this.collected.clear();
    this.state = this.paused ? "paused" : "ready";
    this.title.textContent = this.room.title;
    this.subtitle.textContent = this.room.subtitle;
    this.roomPicker.select(this.room.id, this.progress);
    this.updateButtons();
    if (focusHeading) this.title.focus();
  }

  private resetRoom(): void { this.audio.gentleReset(); this.loadRoom(this.roomIndex); }

  private updateButtons(): void {
    const pause = this.root.querySelector<HTMLButtonElement>('[data-action="pause"]');
    const sound = this.root.querySelector<HTMLButtonElement>('[data-action="sound"]');
    if (pause) pause.textContent = this.paused ? "Resume" : "Pause";
    if (sound) { sound.textContent = this.progress.muted ? "Sound off" : "Sound on"; sound.setAttribute("aria-pressed", String(!this.progress.muted)); }
    this.tickets.textContent = ` · Tickets ${this.collected.size}/3`;
    this.roomPicker?.update(this.progress, this.room.id);
  }

  private loop(time: number): void {
    if (this.disposed) return;
    const delta = Math.min(34, this.lastTime ? time - this.lastTime : 16);
    this.lastTime = time;
    if (this.isSimulating()) {
      this.physicsAccumulator += delta;
      while (this.physicsAccumulator >= 16) {
        this.world.fixedUpdate(16);
        this.collectAndCheck();
        this.physicsAccumulator -= 16;
        if (!this.isSimulating()) break;
      }
    }
    if (!this.paused && this.activityRemaining > 0) {
      const active = Math.min(delta / 1000, this.activityRemaining);
      this.activityRemaining -= active;
      this.activeTotal += active;
      this.creditActivity();
    }
    this.effects.update(delta, this.world.key.position as Vec, this.world.key.velocity as Vec);
    this.renderer.render(this.room, this.world, this.collected, this.state, this.progress.reducedMotion, this.effects);
    this.frameId = requestAnimationFrame((next) => this.loop(next));
  }

  private isSimulating(): boolean { return !this.paused && (this.state === "playing" || this.state === "ready"); }

  private collectAndCheck(): void {
    for (const ticket of this.room.tickets) {
      if (this.collected.has(ticket.id) || distance(this.world.key.position as Vec, ticket.position) >= 32) continue;
      this.collected.add(ticket.id);
      this.audio.ticketCollect();
      this.markActivity();
      this.updateButtons();
    }
    if (distance(this.world.key.position as Vec, this.room.goal) < 38) {
      const newlyComplete = !this.progress.completed.includes(this.room.id);
      this.state = "complete";
      this.progress = recordCompletion(this.progress, this.room.id, this.collected.size);
      this.persist();
      this.audio.levelComplete();
      this.markActivity();
      if (newlyComplete && this.callbacks.awardReward?.(KEYFALL_REWARD_ID)) this.callbacks.notify?.("Velvet Key Plaque is ready for your corner.");
      this.updateButtons();
      return;
    }
    if (this.world.consumeHazardReset() || shouldGentleReset(this.world.key.position as Vec, this.room.goal, this.viewport.width, this.viewport.height)) this.scheduleReset();
  }

  private scheduleReset(): void {
    if (this.resetTimer || this.state === "resetting") return;
    this.state = "resetting";
    this.audio.gentleReset();
    this.updateButtons();
    this.resetTimer = window.setTimeout(() => { this.resetTimer = undefined; this.loadRoom(this.roomIndex); }, 650);
  }

  private markActivity(): void { this.activityRemaining = Math.max(this.activityRemaining, 5); }
  private creditActivity(): void {
    const whole = Math.floor(this.activeTotal);
    if (whole <= this.creditedTotal) return;
    this.creditedTotal = whole;
    this.callbacks.creditActivePlay?.(whole);
  }
}
