import { distance, shouldGentleReset } from "../geometry";
import { applyOpeningImpulse, makeWorld, type KeyfallWorld } from "../physics";
import { KeyfallEffects } from "../interaction";
import { KeyfallRenderer } from "../renderer";
import { applyRoomGesture } from "../room-input";
import { GAME_VIEWPORT } from "../rooms";
import type { RoomDefinition, RuntimeState, Vec } from "../types";

export type PlaytestStatus = { state: RuntimeState; tickets: number; completed: boolean };

/** A disposable gameplay session. No progress store, authored-data writes, or game UI. */
export class EditorPlaytest {
  private readonly renderer: KeyfallRenderer;
  private readonly effects = new KeyfallEffects();
  private readonly events = new AbortController();
  private readonly collected = new Set<string>();
  private room?: RoomDefinition;
  private world?: KeyfallWorld;
  private state: RuntimeState = "ready";
  private frame = 0;
  private previous = 0;
  private accumulator = 0;
  private resetDelay = 0;
  private pointer?: number;
  private running = false;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  constructor(private readonly canvas: HTMLCanvasElement, private readonly onStatus: (status: PlaytestStatus) => void) {
    this.renderer = new KeyfallRenderer(canvas);
    const options = { signal: this.events.signal };
    canvas.addEventListener("pointerdown", (event) => {
      if (!this.running || this.state === "paused" || this.state === "complete" || this.state === "resetting" || this.pointer !== undefined) return;
      this.pointer = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      this.effects.interaction.begin(this.point(event));
    }, options);
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.pointer) this.effects.interaction.move(this.point(event));
    }, options);
    canvas.addEventListener("pointerup", (event) => {
      if (event.pointerId !== this.pointer) return;
      this.pointer = undefined;
      const gesture = this.effects.interaction.release(this.point(event));
      if (this.room && this.world && this.state === "playing") applyRoomGesture(this.room, this.world, gesture);
    }, options);
    canvas.addEventListener("pointercancel", () => this.cancelPointer(), options);
    canvas.addEventListener("lostpointercapture", () => this.cancelPointer(), options);
    window.addEventListener("resize", () => this.resize(), options);
  }

  start(room: RoomDefinition): void {
    this.stop();
    // Simulation code must never be able to mutate the editor's source object.
    this.room = structuredClone(room);
    this.running = true;
    this.renderer.setViewport(GAME_VIEWPORT);
    this.restart();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.cancelPointer();
    this.world?.dispose();
    this.world = undefined;
    this.room = undefined;
    this.effects.clear();
    this.previous = 0;
    this.accumulator = 0;
    this.resetDelay = 0;
    this.collected.clear();
    this.state = "ready";
    this.publish();
  }

  reset(): void { if (this.running) this.restart(); }
  togglePause(): void {
    if (!this.running || this.state === "complete" || this.state === "resetting") return;
    this.cancelPointer();
    this.state = this.state === "paused" ? "playing" : "paused";
    this.accumulator = 0;
    this.publish();
  }
  resize(): void { this.renderer.resize(); }
  dispose(): void { this.stop(); this.events.abort(); }

  private restart(): void {
    if (!this.room) return;
    this.world?.dispose();
    this.world = makeWorld(this.room, GAME_VIEWPORT);
    applyOpeningImpulse(this.world, false);
    this.collected.clear();
    this.effects.clear();
    this.cancelPointer();
    this.state = "playing";
    this.previous = 0;
    this.accumulator = 0;
    this.resetDelay = 0;
    this.publish();
  }

  private readonly tick = (time: number): void => {
    if (!this.running || !this.world || !this.room) return;
    const delta = Math.min(34, this.previous ? time - this.previous : 16);
    this.previous = time;
    if (this.state === "playing") {
      this.accumulator += delta;
      while (this.accumulator >= 16 && this.state === "playing") {
        this.world.fixedUpdate(16);
        this.accumulator -= 16;
        this.checkAttempt();
      }
    } else if (this.state === "resetting") {
      if (time >= this.resetDelay) this.restart();
    }
    this.effects.update(delta, this.world.key.position as Vec, this.world.key.velocity as Vec);
    this.renderer.render(this.room, this.world, this.collected, this.state, this.reducedMotion.matches, this.effects);
    this.frame = requestAnimationFrame(this.tick);
  };

  private checkAttempt(): void {
    if (!this.world || !this.room) return;
    let changed = false;
    for (const ticket of this.room.tickets) {
      if (!this.collected.has(ticket.id) && distance(this.world.key.position, ticket.position) < 32) {
        this.collected.add(ticket.id);
        changed = true;
      }
    }
    if (distance(this.world.key.position, this.room.goal) < 38) {
      this.state = "complete";
      this.cancelPointer();
      this.publish();
      return;
    }
    if (this.world.consumeHazardReset() || shouldGentleReset(this.world.key.position, this.room.goal, GAME_VIEWPORT.width, GAME_VIEWPORT.height)) {
      this.state = "resetting";
      this.resetDelay = performance.now() + 650;
      this.cancelPointer();
      changed = true;
    }
    if (changed) this.publish();
  }

  private publish(): void { this.onStatus({ state: this.state, tickets: this.collected.size, completed: this.state === "complete" }); }
  private point(event: PointerEvent): Vec {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * GAME_VIEWPORT.width / rect.width, y: (event.clientY - rect.top) * GAME_VIEWPORT.height / rect.height };
  }
  private cancelPointer(): void {
    if (this.pointer !== undefined && this.canvas.hasPointerCapture(this.pointer)) this.canvas.releasePointerCapture(this.pointer);
    this.pointer = undefined;
    this.effects.interaction.cancel();
  }
}
