import { ContraptionEngine } from "../engine";
import { clone, kit, W, H } from "../levels";
import { ContraptionRenderer } from "../renderer";
import { describe, GRID, type LevelFile, type Selection } from "./model";

/** Authoring view uses the same renderer as production, with editor-only hit/selection chrome. */
export class EditorPreview {
  private renderer = new ContraptionRenderer();
  private context: CanvasRenderingContext2D;
  private engine?: ContraptionEngine;
  constructor(
    private canvas: HTMLCanvasElement,
    private overlay: HTMLCanvasElement,
  ) {
    const c = overlay.getContext("2d");
    if (!c) throw new Error("Editor overlay canvas is unavailable.");
    this.context = c;
  }
  show(
    file: LevelFile,
    selection: Selection | null,
    snap: boolean,
    picking = false,
  ): void {
    const level = clone(file.level);
    this.engine = new ContraptionEngine(level, clone(level.initial));
    this.resize();
    this.renderer.draw(
      this.canvas,
      this.engine,
      selection?.kind === "part" ? selection.id : null,
      null,
      false,
      null,
      true,
    );
    this.drawOverlay(level, selection, snap, picking);
  }
  resize(): void {
    const ratio = Math.min(devicePixelRatio || 1, 2),
      rect = this.overlay.getBoundingClientRect();
    this.overlay.width = Math.max(1, Math.floor(rect.width * ratio));
    this.overlay.height = Math.max(1, Math.floor(rect.height * ratio));
  }
  dispose(): void {
    this.engine = undefined;
    this.context.clearRect(0, 0, this.overlay.width, this.overlay.height);
  }
  private drawOverlay(
    level: LevelFile["level"],
    selection: Selection | null,
    snap: boolean,
    picking: boolean,
  ): void {
    const c = this.context;
    c.clearRect(0, 0, this.overlay.width, this.overlay.height);
    c.save();
    c.scale(this.overlay.width / W, this.overlay.height / H);
    if (snap) {
      c.strokeStyle = "rgba(49,80,92,.12)";
      c.lineWidth = 1;
      for (let x = GRID; x < W; x += GRID) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, H);
        c.stroke();
      }
      for (let y = GRID; y < H; y += GRID) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
    }
    level.sources.forEach((s, i) => {
      c.strokeStyle = "#fff4c3";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(s.x, s.y, 31, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#244b54";
      c.font = "bold 12px system-ui";
      c.textAlign = "center";
      c.fillText(`Inlet ${i + 1}`, s.x, s.y - 37);
    });
    if (picking) {
      for (const part of level.initial.filter(
        (p) => p.type === "belt" || p.type === "fan",
      )) {
        const size = kit[part.type];
        c.save();
        c.translate(part.x, part.y);
        c.rotate(part.angle);
        c.strokeStyle = "#14776b";
        c.fillStyle = "#64d7ba33";
        c.lineWidth = 4;
        c.fillRect(
          -size.w / 2 - 12,
          -size.h / 2 - 12,
          size.w + 24,
          size.h + 24,
        );
        c.strokeRect(
          -size.w / 2 - 12,
          -size.h / 2 - 12,
          size.w + 24,
          size.h + 24,
        );
        c.restore();
      }
    }
    const selected = describe(level, selection);
    if (selected) {
      c.save();
      c.translate(selected.x, selected.y);
      if (selected.angle) c.rotate(selected.angle);
      c.strokeStyle = "#fff2a8";
      c.fillStyle = "rgba(255,232,145,.13)";
      c.lineWidth = 3;
      c.setLineDash([8, 5]);
      const size = selected.part
        ? kit[selected.part.type]
        : selection?.kind === "bowl"
          ? { w: 140, h: 75 }
          : { w: 82, h: 64 };
      c.fillRect(-size.w / 2 - 10, -size.h / 2 - 10, size.w + 20, size.h + 20);
      c.strokeRect(
        -size.w / 2 - 10,
        -size.h / 2 - 10,
        size.w + 20,
        size.h + 20,
      );
      c.restore();
    }
    if (selected?.part) {
      const fixed = selected.part.locked;
      // Keep the label upright and inside the board, even for rotated parts.
      const x = Math.max(55, Math.min(W - 55, selected.x));
      const y = Math.max(20, selected.y - kit[selected.part.type].h / 2 - 30);
      c.fillStyle = fixed ? "#365663" : "#a95842";
      c.beginPath();
      c.roundRect(x - 49, y - 13, 98, 24, 6);
      c.fill();
      c.fillStyle = "#fffaf0";
      c.font = "bold 12px system-ui";
      c.textAlign = "center";
      c.fillText(fixed ? "Fixed" : "↔ Movable", x, y + 4);
    }
    c.restore();
  }
}
