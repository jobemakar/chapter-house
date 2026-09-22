import type { WorldElementSnapshot } from "./elements";
import type { KeyfallEffects } from "./interaction";
import type { KeyfallWorld } from "./physics";
import { GAME_VIEWPORT } from "./rooms";
import type { RoomDefinition, RuntimeState, Vec, Viewport } from "./types";
import { KeyfallCartoonArt } from "./cartoon-art";
import { fanHeading } from "./fan";

export type KeyfallRenderOptions = Readonly<{ hideKey?: boolean; hideGoal?: boolean }>;

export class KeyfallRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly art = new KeyfallCartoonArt();
  private viewport: Viewport = GAME_VIEWPORT;
  private animationTime = 0;
  private lastRenderTime?: number;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    this.ctx = ctx;
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
    this.art.invalidateBackdrop();
    this.resize();
  }

  resize(): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  }

  render(room: RoomDefinition, world: KeyfallWorld, collected: Set<string>, state: RuntimeState, reducedMotion: boolean, effects: KeyfallEffects, options: KeyfallRenderOptions = {}): void {
    const { width, height } = this.viewport;
    const c = this.ctx;
    const now = performance.now();
    if (!reducedMotion && state !== "paused" && state !== "complete") {
      this.animationTime += this.lastRenderTime === undefined ? 0 : Math.min(50, now - this.lastRenderTime);
    }
    this.lastRenderTime = now;
    c.save();
    c.scale(this.canvas.width / width, this.canvas.height / height);
    this.art.drawBackdrop(c, this.viewport);

    for (const prop of room.props) {
      if (prop.kind === "bumper") this.art.drawBumper(c, prop.position, prop.radius);
      else if (prop.kind === "bellows") this.art.drawFan(c, prop.position, prop.radius, fanHeading(prop.angle), reducedMotion ? 0 : this.animationTime * (prop.power ?? 1));
      else if (prop.kind === "wall") this.art.drawWall(c, prop.position, prop.angle ?? 0, prop.length ?? 104);
      else this.art.drawPlatform(c, prop.position, prop.angle ?? 0, prop.length ?? 104);
    }
    for (const element of world.elementSnapshots()) this.drawElement(c, element, reducedMotion);
    for (const definition of room.cords) {
      const cord = world.cords.get(definition.id);
      if (!cord || cord.expired) continue;
      for (const path of cord.paths) this.art.drawCord(c, path, cord.opacity);
      this.art.drawAnchor(c, definition.anchor, cord.opacity);
    }
    for (const ticket of room.tickets) if (!collected.has(ticket.id)) this.art.drawTicket(c, ticket.position, this.animationTime, reducedMotion);

    this.drawInteraction(c, effects, reducedMotion);
    if (!options.hideGoal) this.art.drawGoal(c, room.goal, reducedMotion);
    if (!options.hideKey) this.art.drawKey(c, world.key.position as Vec, world.key.angle, reducedMotion);
    this.drawStateOverlay(c, state, width, height);
    c.restore();
  }

  private drawElement(c: CanvasRenderingContext2D, element: WorldElementSnapshot, reducedMotion: boolean): void {
    this.art.drawElement(c, element, reducedMotion, this.animationTime);
  }

  private drawInteraction(c: CanvasRenderingContext2D, effects: KeyfallEffects, reducedMotion: boolean): void {
    for (const segment of effects.remnants.segments) this.art.drawCord(c, [segment.from, segment.to], segment.opacity);
    if (effects.trail.isSlash) this.art.drawSlash(c, effects.trail.points, effects.trail.opacity, reducedMotion);
  }

  private drawStateOverlay(c: CanvasRenderingContext2D, state: RuntimeState, width: number, height: number): void {
    if (state !== "paused" && state !== "complete") return;
    c.fillStyle = state === "paused" ? "rgba(17,13,34,.7)" : "rgba(17,13,34,.46)";
    c.fillRect(0, 0, width, height);
    if (state === "paused") {
      this.text(c, "PAUSED", width / 2, 260, 30, "#fff0c6");
      this.text(c, "Tap resume to return to the rig", width / 2, 298, 16, "#f4c6bb");
      return;
    }
    this.text(c, "PASSAGE UNLOCKED", width / 2, 260, 25, "#ffe4a4");
  }

  private text(c: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string): void {
    c.fillStyle = color;
    c.font = `800 ${size}px Georgia, serif`;
    c.textAlign = "center";
    c.fillText(value, x, y);
  }
}
