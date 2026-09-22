import type { KeyfallWorld } from "./physics";
import type { RoomDefinition, RuntimeState, Vec, Viewport } from "./types";
import type { KeyfallEffects } from "./interaction";
import { LANDSCAPE_VIEWPORT } from "./rooms";

export class KeyfallRenderer {
  private ctx: CanvasRenderingContext2D;
  private viewport: Viewport = LANDSCAPE_VIEWPORT;
  constructor(private canvas: HTMLCanvasElement) { const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable"); this.ctx = ctx; }
  setViewport(viewport: Viewport): void { this.viewport = viewport; this.resize(); }
  resize(): void { const ratio = Math.min(window.devicePixelRatio || 1, 3), rect = this.canvas.getBoundingClientRect(); this.canvas.width = Math.max(1, Math.floor(rect.width * ratio)); this.canvas.height = Math.max(1, Math.floor(rect.height * ratio)); }
  render(room: RoomDefinition, world: KeyfallWorld, collected: Set<string>, state: RuntimeState, reducedMotion: boolean, effects: KeyfallEffects): void {
    const { width: W, height: H } = this.viewport;
    const c = this.ctx; c.save(); c.scale(this.canvas.width / W, this.canvas.height / H);
    const gradient = c.createLinearGradient(0, 0, 0, H); gradient.addColorStop(0, "#171326"); gradient.addColorStop(0.55, "#28152e"); gradient.addColorStop(1, "#4a2035"); c.fillStyle = gradient; c.fillRect(0, 0, W, H);
    this.drawCurtains(c, W, H); this.drawStage(c, W, H);
    for (const prop of room.props) this.drawProp(c, prop.kind, prop.position, prop.radius);
    for (const definition of room.cords) { const cord = world.cords.get(definition.id); if (!cord || cord.expired) continue; for (const path of cord.paths) this.drawCordPath(c, path, cord.opacity); this.line(c, { x: definition.anchor.x - 4, y: definition.anchor.y }, { x: definition.anchor.x + 4, y: definition.anchor.y }, `rgba(244,199,107,${cord.opacity})`, 5); }
    for (const ticket of room.tickets) if (!collected.has(ticket.id)) this.drawTicket(c, ticket.position);
    this.drawInteraction(c, effects, reducedMotion); this.drawGoal(c, room.goal, reducedMotion); this.drawKey(c, world.key.position as Vec, world.key.angle, reducedMotion);
    if (state === "paused") { c.fillStyle = "rgba(12,8,22,.68)"; c.fillRect(0, 0, W, H); this.text(c, "PAUSED", W / 2, 260, 30, "#fff0c6", "center"); this.text(c, "Tap resume to return to the rig", W / 2, 298, 16, "#dfbb9b", "center"); }
    if (state === "complete") { c.fillStyle = "rgba(12,8,22,.44)"; c.fillRect(0, 0, W, H); this.text(c, "PASSAGE UNLOCKED", W / 2, 260, 25, "#ffe4a4", "center"); }
    c.restore();
  }
  private drawInteraction(c: CanvasRenderingContext2D, effects: KeyfallEffects, reducedMotion: boolean): void {
    for (const segment of effects.remnants.segments) this.line(c, segment.from, segment.to, `rgba(213,154,131,${segment.opacity})`, 4);
    const trail = effects.trail;
    if (!trail.isSlash) return;
    const points = trail.points; c.save(); c.strokeStyle = `rgba(255,238,163,${trail.opacity})`; c.lineWidth = reducedMotion ? 4 : 7; c.lineCap = "round"; c.lineJoin = "round"; if (!reducedMotion) { c.shadowColor = "#ffe88f"; c.shadowBlur = 12; } c.beginPath(); points.forEach((point, index) => index === 0 ? c.moveTo(point.x, point.y) : c.lineTo(point.x, point.y)); c.stroke(); c.restore();
  }
  private drawCurtains(c: CanvasRenderingContext2D, width: number, height: number): void { const edge = width < height ? 78 : 128, reach = width < height ? 94 : 148, drop = height * .54; c.fillStyle = "#5d1d3d"; c.beginPath(); c.moveTo(0, 0); c.lineTo(edge, 0); c.quadraticCurveTo(edge * .72, drop * .52, reach, drop); c.quadraticCurveTo(edge * .56, drop * .84, 0, drop * 1.08); c.closePath(); c.fill(); c.beginPath(); c.moveTo(width, 0); c.lineTo(width - edge, 0); c.quadraticCurveTo(width - edge * .72, drop * .52, width - reach, drop); c.quadraticCurveTo(width - edge * .56, drop * .84, width, drop * 1.08); c.closePath(); c.fill(); }
  private drawStage(c: CanvasRenderingContext2D, width: number, height: number): void { const portrait = width < height, x = portrait ? 42 : 84, y = portrait ? 48 : 53, stageWidth = width - x * 2, stageHeight = height - y - (portrait ? 48 : 37); c.fillStyle = "#7c3850"; c.fillRect(x - 4, y - 11, stageWidth + 8, 10); c.fillStyle = "#2e1837"; c.fillRect(x, y, stageWidth, stageHeight); c.strokeStyle = "rgba(255,216,145,.2)"; c.lineWidth = 2; c.strokeRect(x, y, stageWidth, stageHeight); const spacing = portrait ? 68 : 80; for (let lineX = x + 36; lineX < x + stageWidth; lineX += spacing) { c.strokeStyle = "rgba(255,216,145,.07)"; c.beginPath(); c.moveTo(lineX, y + 1); c.lineTo(lineX, y + stageHeight - 1); c.stroke(); } }
  private drawGoal(c: CanvasRenderingContext2D, p: Vec, reducedMotion: boolean): void { c.save(); if (!reducedMotion) { c.shadowColor = "#ffca64"; c.shadowBlur = 20; } c.fillStyle = "#f1b758"; c.beginPath(); c.arc(p.x, p.y, 34, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; c.fillStyle = "#32182d"; c.beginPath(); c.arc(p.x, p.y, 23, 0, Math.PI * 2); c.fill(); c.fillStyle = "#d79543"; c.fillRect(p.x - 3, p.y - 12, 6, 22); c.restore(); }
  private drawKey(c: CanvasRenderingContext2D, p: Vec, angle: number, reducedMotion: boolean): void { c.save(); c.translate(p.x, p.y); c.rotate(angle); if (!reducedMotion) { c.shadowColor = "#ffc45d"; c.shadowBlur = 14; } c.strokeStyle = "#f5c469"; c.lineWidth = 10; c.lineCap = "round"; c.beginPath(); c.arc(-8, 0, 10, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(2, 0); c.lineTo(29, 0); c.lineTo(29, 8); c.moveTo(18, 0); c.lineTo(18, -7); c.stroke(); c.shadowBlur = 0; c.restore(); }
  private drawTicket(c: CanvasRenderingContext2D, p: Vec): void { c.save(); c.translate(p.x, p.y); c.rotate(-0.12); c.fillStyle = "#e9c780"; c.fillRect(-14, -10, 28, 20); c.strokeStyle = "#8b4e55"; c.lineWidth = 2; c.strokeRect(-14, -10, 28, 20); c.fillStyle = "#743c54"; c.fillRect(-8, -3, 16, 2); c.fillRect(-5, 3, 10, 2); c.restore(); }
  private drawProp(c: CanvasRenderingContext2D, kind: string, p: Vec, radius: number): void { c.save(); c.translate(p.x, p.y); if (kind === "bumper") { c.fillStyle = "#a96b51"; c.beginPath(); c.arc(0, 0, radius, 0, Math.PI * 2); c.fill(); c.fillStyle = "#e0a25d"; c.beginPath(); c.arc(0, 0, radius * .7, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#fff0b0"; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, radius * .4, 0, Math.PI * 2); c.stroke(); } else { c.fillStyle = "#ae724f"; c.fillRect(-radius * .72, -radius * .4, radius * 1.44, radius * .8); c.fillStyle = "#efc877"; c.fillRect(-radius * .54, -radius * .25, radius * 1.08, radius * .14); c.fillRect(-radius * .54, radius * .11, radius * 1.08, radius * .14); } c.restore(); }
  private drawCordPath(c: CanvasRenderingContext2D, points: readonly Vec[], opacity: number): void { if (points.length < 2) return; c.save(); c.strokeStyle = `rgba(213,154,131,${opacity})`; c.lineWidth = 4; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(points[0].x, points[0].y); for (let index = 1; index < points.length - 1; index += 1) { const next = points[index + 1]; c.quadraticCurveTo(points[index].x, points[index].y, (points[index].x + next.x) / 2, (points[index].y + next.y) / 2); } const last = points[points.length - 1]; c.lineTo(last.x, last.y); c.stroke(); c.restore(); }
  private line(c: CanvasRenderingContext2D, a: Vec, b: Vec, color: string, width: number): void { c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
  private text(c: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign): void { c.fillStyle = color; c.font = `600 ${size}px Georgia, serif`; c.textAlign = align; c.fillText(value, x, y); }
}
