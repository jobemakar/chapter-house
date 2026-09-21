import { type DuetRun, type RunEvent, type Side } from "./core";
import friendsUrl from "./assets/arctic-duet-option-a-sprites.png";

interface Reaction { at: number; kind: "" | "catch" | "miss"; }
interface Particle { side: Side; x: number; at: number; color: string; }

interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const FRIEND_FRAMES: Record<Side, { closed: SpriteFrame; open: SpriteFrame }> = {
  0: {
    closed: { x: 116, y: 80, width: 457, height: 541 },
    open: { x: 685, y: 84, width: 459, height: 537 },
  },
  1: {
    closed: { x: 94, y: 697, width: 503, height: 485 },
    open: { x: 655, y: 683, width: 513, height: 499 },
  },
};

export class DuetPainter {
  private readonly context: CanvasRenderingContext2D;
  private readonly friends = new Image();
  private reactions: [Reaction, Reaction] = [{ at: -9, kind: "" }, { at: -9, kind: "" }];
  private particles: Particle[] = [];
  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    this.context = context;
    this.friends.decoding = "async";
    this.friends.src = friendsUrl;
  }
  react(event: RunEvent, at: number): void {
    if (!event.note) return;
    const { note } = event;
    this.reactions[note.side] = { at, kind: event.type === "catch" || event.type === "miss" ? event.type : "" };
    if (event.type !== "catch" && event.type !== "miss") return;
    const colors = ["#fbd48d", "#a0e6cf", "#fbbcb9"];
    for (let index = 0; index < 8; index++) this.particles.push({ side: note.side, x: note.x + (index - 4) * 0.012, at, color: event.type === "miss" ? "#e8f3ed" : colors[index % 3]! });
  }
  private oval(x: number, y: number, rx: number, ry: number, color: string): void {
    const context = this.context; context.fillStyle = color; context.beginPath(); context.ellipse(x, y, rx, Math.max(0.5, ry), 0, 0, Math.PI * 2); context.fill();
  }
  private friend(side: Side, x: number, horizon: number, run: DuetRun, time: number, reduced: boolean): void {
    const context = this.context;
    const reaction = this.reactions[side];
    const reactionAge = time - reaction.at;
    const caught = reaction.kind === "catch" && reactionAge < 0.48;
    const missed = reaction.kind === "miss" && reactionAge < 0.42;
    const bob = reduced ? 0 : Math.sin(time * 3 + side) * 3;
    const next = run.notes.filter((note) => note.side === side && note.state === "fall").sort((a, b) => a.beat - b.beat)[0];
    const anticipating = Boolean(next && next.beat - run.beat >= -0.06 && next.beat - run.beat < 0.82);
    const frame = FRIEND_FRAMES[side][caught || anticipating ? "open" : "closed"];
    const baseHeight = side === 0 ? 194 : 184;
    const pulse = !reduced && caught ? 1 + Math.sin(Math.min(1, reactionAge / 0.48) * Math.PI) * 0.09 : 1;
    const width = baseHeight * frame.width / frame.height * pulse;
    const height = baseHeight * pulse;
    const settle = !reduced && caught ? -Math.sin(Math.min(1, reactionAge / 0.48) * Math.PI) * 13 : 0;
    const flinch = !reduced && missed ? Math.sin(reactionAge * 42) * 4 : 0;

    context.save();
    context.translate(x + flinch, horizon + 151 + bob + settle);
    if (missed && !reduced) context.rotate(Math.sin(reactionAge * 28) * 0.035);
    if (this.friends.complete && this.friends.naturalWidth > 0) {
      context.drawImage(
        this.friends,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -width / 2,
        -height,
        width,
        height,
      );
    }
    context.restore();
  }
  draw(run: DuetRun, time: number, reduced: boolean, active: boolean): void {
    const context = this.context, rect = this.canvas.getBoundingClientRect(), width = 1200;
    const height = Math.max(760, width * rect.height / Math.max(1, rect.width));
    const dpr = Math.min(2, window.devicePixelRatio || 1), scale = rect.width / width;
    if (this.canvas.width !== Math.round(rect.width * dpr) || this.canvas.height !== Math.round(rect.height * dpr)) { this.canvas.width = Math.round(rect.width * dpr); this.canvas.height = Math.round(rect.height * dpr); }
    context.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0); context.clearRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, ["#28314a", "#30304d", "#243f51", "#40334f"][Math.floor((run.level - 1) / 2) % 4]!); gradient.addColorStop(1, "#4e8589");
    context.fillStyle = gradient; context.fillRect(0, 0, width, height); context.fillStyle = "#a6d4ca18"; context.fillRect(0, 95, 600, height - 220); context.fillStyle = "#f7bfaf18"; context.fillRect(600, 95, 600, height - 220);
    context.strokeStyle = "#eff6e445"; context.setLineDash([5, 14]); context.beginPath(); context.moveTo(600, 95); context.lineTo(600, height - 80); context.stroke(); context.setLineDash([]);
    const horizon = height - 220; context.strokeStyle = "#dcefe5a0"; context.lineWidth = 3;
    for (const side of [0, 1] as const) { context.beginPath(); context.moveTo(side * 600 + 40, horizon); context.lineTo(side * 600 + 560, horizon); context.stroke(); }
    context.font = "bold 22px DuetBody, sans-serif"; context.textAlign = "center"; context.fillStyle = "#d8e9e8"; context.fillText("DUANE", 300, 54); context.fillText("MAJOR PUFF", 900, 54);
    this.friend(0, run.positions[0] * 600, horizon, run, time, reduced); this.friend(1, 600 + run.positions[1] * 600, horizon, run, time, reduced);
    const snacks = ["#f9bab6", "#afdfc6", "#d4c0ee"];
    for (const note of run.notes) if (note.state === "fall" && note.beat - run.beat <= note.lead) { const x = note.side * 600 + note.x * 600, y = horizon - ((note.beat - run.beat) / note.lead) * (horizon - 110); this.oval(x, y + 8, 30, 33, "#1b293255"); this.oval(x, y - 7, 27, 25, snacks[note.flavor]!); this.oval(x + 1, y - 34, 6, 6, "#e88b87"); }
    this.particles = this.particles.filter((particle) => time - particle.at < 0.7);
    if (!reduced) for (const particle of this.particles) { const age = time - particle.at; context.globalAlpha = 1 - age / 0.7; this.oval(particle.side * 600 + particle.x * 600, horizon - age * 80, 4, 4, particle.color); }
    context.globalAlpha = 1; if (!active) { context.fillStyle = "#ffffff0c"; context.fillRect(0, 0, width, height); }
  }
}
