import Matter from "matter-js";
import { distance, shouldGentleReset, swipeHitsCord } from "./geometry";
import { KeyfallAudio } from "./audio";
import { makeWorld, puff, removeCord, type KeyfallWorld } from "./physics";
import { ROOMS } from "./rooms";
import { emptyProgress, normalizeProgress, recordCompletion, SAVE_KEY } from "./progress";
import { KeyfallRenderer } from "./renderer";
import type { KeyfallProgress, RoomDefinition, RuntimeState, Vec } from "./types";

export type KeyfallCallbacks = { load?: () => KeyfallProgress; save?: (progress: KeyfallProgress) => void };
export class KeyfallGame {
  private roomIndex = 0; private room: RoomDefinition = ROOMS[0]; private world!: KeyfallWorld; private renderer: KeyfallRenderer; private progress: KeyfallProgress; private state: RuntimeState = "ready"; private collected = new Set<string>(); private swipeStart?: Vec; private resetTimer?: number; private lastTime = 0; private audio: KeyfallAudio; private title: HTMLElement; private subtitle: HTMLElement; private tickets: HTMLElement; private roomButtons: HTMLButtonElement[] = [];
  constructor(private root: HTMLElement, private callbacks: KeyfallCallbacks = {}) {
    this.progress = normalizeProgress(callbacks.load?.() ?? this.loadLocal()); this.audio = new KeyfallAudio(() => this.progress.muted);
    root.className = "keyfall-app"; root.innerHTML = `<header><div><p class="eyebrow">KEYFALL · THE ABANDONED FUNHOUSE</p><h1>Drop the Velvet Key</h1><p id="keyfall-subtitle"></p></div><div class="top-actions"><button data-action="pause">Pause</button><button data-action="sound" aria-pressed="false">Sound on</button><button data-action="motion" aria-pressed="false">Motion</button></div></header><section class="room-tabs" aria-label="Rooms"></section><div class="board-wrap"><canvas aria-label="Keyfall physics puzzle"></canvas><div class="hint">Swipe across a cord to cut it · tap the bellows for a puff</div></div><footer><div><strong id="keyfall-title"></strong><span id="keyfall-tickets"></span></div><button data-action="reset">Reset room</button></footer>`;
    this.title = root.querySelector("#keyfall-title") as HTMLElement; this.subtitle = root.querySelector("#keyfall-subtitle") as HTMLElement; this.tickets = root.querySelector("#keyfall-tickets") as HTMLElement; const canvas = root.querySelector("canvas") as HTMLCanvasElement; this.renderer = new KeyfallRenderer(canvas); this.bind(canvas); this.createTabs(root.querySelector(".room-tabs") as HTMLElement); this.loadRoom(0); window.addEventListener("resize", () => this.renderer.resize()); this.renderer.resize(); requestAnimationFrame((time) => this.loop(time));
  }
  private loadLocal(): KeyfallProgress { try { return normalizeProgress(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null")); } catch { return emptyProgress(); } }
  private persist(): void {
    if (this.callbacks.save) {
      try { this.callbacks.save(this.progress); return; } catch { /* fall through to local storage */ }
    }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress)); } catch { /* private browsing */ }
  }
  private createTabs(target: HTMLElement): void { ROOMS.forEach((room, index) => { const button = document.createElement("button"); button.textContent = `${index + 1}. ${room.title}`; button.addEventListener("click", () => this.loadRoom(index)); target.append(button); this.roomButtons.push(button); }); }
  private bind(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("pointerdown", (event) => { canvas.setPointerCapture(event.pointerId); this.audio.unlock(); this.state = this.state === "paused" ? "paused" : "playing"; this.swipeStart = this.mapPoint(event, canvas); this.updateButtons(); });
    canvas.addEventListener("pointerup", (event) => { if (!this.swipeStart) return; const end = this.mapPoint(event, canvas), start = this.swipeStart; this.swipeStart = undefined; if (this.state === "paused" || this.state === "complete") return; for (const cord of this.room.cords) if (this.world.cords.has(cord.id) && swipeHitsCord(start, end, cord.anchor, this.world.key.position as Vec)) { removeCord(this.world, cord.id); this.audio.chime(330); } const bellows = this.room.props.find((prop) => prop.kind === "bellows"); if (bellows && distance(end, bellows.position) < bellows.radius * .9) { puff(this.world); this.audio.chime(520); } });
    canvas.addEventListener("pointercancel", () => { this.swipeStart = undefined; });
    this.root.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((button) => button.addEventListener("click", () => { const action = button.dataset.action; if (action === "pause") this.togglePause(); if (action === "reset") this.resetRoom(); if (action === "sound") { this.progress = { ...this.progress, muted: !this.progress.muted }; this.persist(); this.updateButtons(); } if (action === "motion") { this.progress = { ...this.progress, reducedMotion: !this.progress.reducedMotion }; this.persist(); this.updateButtons(); } }));
  }
  private mapPoint(event: PointerEvent, canvas: HTMLCanvasElement): Vec { const r = canvas.getBoundingClientRect(); return { x: ((event.clientX - r.left) / r.width) * 800, y: ((event.clientY - r.top) / r.height) * 560 }; }
  private loadRoom(index: number): void { this.roomIndex = Math.max(0, Math.min(ROOMS.length - 1, index)); this.room = ROOMS[this.roomIndex]; this.world = makeWorld(this.room); this.collected.clear(); this.state = "ready"; this.title.textContent = this.room.title; this.subtitle.textContent = this.room.subtitle; this.roomButtons.forEach((button, i) => button.classList.toggle("active", i === this.roomIndex)); this.updateButtons(); }
  private resetRoom(): void { this.loadRoom(this.roomIndex); }
  private togglePause(): void { if (this.state === "complete") return; this.state = this.state === "paused" ? "playing" : "paused"; this.updateButtons(); }
  private updateButtons(): void { const pause = this.root.querySelector<HTMLButtonElement>('[data-action="pause"]'); const sound = this.root.querySelector<HTMLButtonElement>('[data-action="sound"]'); const motion = this.root.querySelector<HTMLButtonElement>('[data-action="motion"]'); if (pause) pause.textContent = this.state === "paused" ? "Resume" : "Pause"; if (sound) { sound.textContent = this.progress.muted ? "Sound off" : "Sound on"; sound.setAttribute("aria-pressed", String(!this.progress.muted)); } if (motion) { motion.textContent = this.progress.reducedMotion ? "Reduced motion" : "Motion"; motion.setAttribute("aria-pressed", String(this.progress.reducedMotion)); } this.tickets.textContent = ` · Tickets ${this.collected.size}/3`; }
  private loop(time: number): void { const delta = Math.min(34, this.lastTime ? time - this.lastTime : 16); this.lastTime = time; if (this.state === "playing" || this.state === "ready") { Matter.Engine.update(this.world.engine, this.progress.reducedMotion ? 16 : delta); this.collectAndCheck(); } this.renderer.render(this.room, this.world, this.collected, this.state, this.progress.reducedMotion); requestAnimationFrame((next) => this.loop(next)); }
  private collectAndCheck(): void { for (const ticket of this.room.tickets) if (!this.collected.has(ticket.id) && distance(this.world.key.position as Vec, ticket.position) < 32) { this.collected.add(ticket.id); this.audio.chime(680); this.updateButtons(); } if (distance(this.world.key.position as Vec, this.room.goal) < 38) { this.state = "complete"; this.progress = recordCompletion(this.progress, this.room.id, this.collected.size); this.persist(); this.audio.chime(780); this.updateButtons(); return; } if (shouldGentleReset(this.world.key.position as Vec, this.room.goal)) this.scheduleReset(); }
  private scheduleReset(): void { if (this.resetTimer || this.state === "resetting") return; this.state = "resetting"; this.updateButtons(); this.resetTimer = window.setTimeout(() => { this.resetTimer = undefined; this.loadRoom(this.roomIndex); }, 650); }
}
