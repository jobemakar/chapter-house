import type { KeyfallWorld } from "./physics";
import type { RoomDefinition, RuntimeState, Vec } from "./types";
import type { KeyfallEffects } from "./interaction";

const W = 800, H = 560;
export class KeyfallRenderer {
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) { const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable"); this.ctx = ctx; }
  resize(): void { const ratio = Math.min(window.devicePixelRatio || 1, 2), rect = this.canvas.getBoundingClientRect(); this.canvas.width = Math.max(1, Math.floor(rect.width * ratio)); this.canvas.height = Math.max(1, Math.floor(rect.height * ratio)); }
  render(room: RoomDefinition, world: KeyfallWorld, collected: Set<string>, state: RuntimeState, reducedMotion: boolean, effects: KeyfallEffects): void {
    const c = this.ctx; c.save(); c.scale(this.canvas.width / W, this.canvas.height / H);
    const gradient = c.createLinearGradient(0, 0, 0, H); gradient.addColorStop(0, "#171326"); gradient.addColorStop(0.55, "#28152e"); gradient.addColorStop(1, "#4a2035"); c.fillStyle = gradient; c.fillRect(0, 0, W, H);
    this.drawCurtains(c); this.drawStage(c);
    for (const prop of room.props) this.drawProp(c, prop.kind, prop.position, prop.radius);
    for (const cord of room.cords) { if (!world.cords.has(cord.id)) continue; const end = world.key.position as Vec; this.line(c, cord.anchor, end, "#d59a83", 4); this.line(c, { x: cord.anchor.x - 4, y: cord.anchor.y }, { x: cord.anchor.x + 4, y: cord.anchor.y }, "#f4c76b", 5); }
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
  private drawCurtains(c: CanvasRenderingContext2D): void { c.fillStyle = "#5d1d3d"; c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 0); c.quadraticCurveTo(92, 160, 148, 300); c.quadraticCurveTo(72, 250, 0, 328); c.closePath(); c.fill(); c.beginPath(); c.moveTo(W, 0); c.lineTo(W - 128, 0); c.quadraticCurveTo(W - 92, 160, W - 148, 300); c.quadraticCurveTo(W - 72, 250, W, 328); c.closePath(); c.fill(); }
  private drawStage(c: CanvasRenderingContext2D): void { c.fillStyle = "#7c3850"; c.fillRect(80, 42, 640, 10); c.fillStyle = "#2e1837"; c.fillRect(84, 53, 632, 470); c.strokeStyle = "rgba(255,216,145,.2)"; c.lineWidth = 2; c.strokeRect(84, 53, 632, 470); for (let x = 120; x < 700; x += 80) { c.strokeStyle = "rgba(255,216,145,.07)"; c.beginPath(); c.moveTo(x, 54); c.lineTo(x, 522); c.stroke(); } }
  private drawGoal(c: CanvasRenderingContext2D, p: Vec, reducedMotion: boolean): void { c.save(); if (!reducedMotion) { c.shadowColor = "#ffca64"; c.shadowBlur = 20; } c.fillStyle = "#f1b758"; c.beginPath(); c.arc(p.x, p.y, 34, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; c.fillStyle = "#32182d"; c.beginPath(); c.arc(p.x, p.y, 23, 0, Math.PI * 2); c.fill(); c.fillStyle = "#d79543"; c.fillRect(p.x - 3, p.y - 12, 6, 22); c.restore(); }
  private drawKey(c: CanvasRenderingContext2D, p: Vec, angle: number, reducedMotion: boolean): void { c.save(); c.translate(p.x, p.y); c.rotate(angle); if (!reducedMotion) { c.shadowColor = "#ffc45d"; c.shadowBlur = 14; } c.strokeStyle = "#f5c469"; c.lineWidth = 10; c.lineCap = "round"; c.beginPath(); c.arc(-8, 0, 10, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(2, 0); c.lineTo(29, 0); c.lineTo(29, 8); c.moveTo(18, 0); c.lineTo(18, -7); c.stroke(); c.shadowBlur = 0; c.restore(); }
  private drawTicket(c: CanvasRenderingContext2D, p: Vec): void { c.save(); c.translate(p.x, p.y); c.rotate(-0.12); c.fillStyle = "#e9c780"; c.fillRect(-14, -10, 28, 20); c.strokeStyle = "#8b4e55"; c.lineWidth = 2; c.strokeRect(-14, -10, 28, 20); c.fillStyle = "#743c54"; c.fillRect(-8, -3, 16, 2); c.fillRect(-5, 3, 10, 2); c.restore(); }
  private drawProp(c: CanvasRenderingContext2D, kind: string, p: Vec, radius: number): void { c.save(); c.translate(p.x, p.y); if (kind === "bumper") { c.fillStyle = "#a96b51"; c.beginPath(); c.arc(0, 0, radius, 0, Math.PI * 2); c.fill(); c.fillStyle = "#e0a25d"; c.beginPath(); c.arc(0, 0, radius * .7, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#fff0b0"; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, radius * .4, 0, Math.PI * 2); c.stroke(); } else { c.fillStyle = "#ae724f"; c.fillRect(-radius * .72, -radius * .4, radius * 1.44, radius * .8); c.fillStyle = "#efc877"; c.fillRect(-radius * .54, -radius * .25, radius * 1.08, radius * .14); c.fillRect(-radius * .54, radius * .11, radius * 1.08, radius * .14); } c.restore(); }
  private line(c: CanvasRenderingContext2D, a: Vec, b: Vec, color: string, width: number): void { c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
  private text(c: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign): void { c.fillStyle = color; c.font = `600 ${size}px Georgia, serif`; c.textAlign = align; c.fillText(value, x, y); }
}
