import { KeyfallEffects } from "../interaction";
import { makeWorld, type KeyfallWorld } from "../physics";
import { KeyfallRenderer } from "../renderer";
import type { DraftRoom, LevelFile } from "../level-files";
import type { RoomDefinition } from "../types";
import { BOARD_HEIGHT, BOARD_WIDTH, describeSelection, GRID_SIZE, type Selection } from "./model";

/** Renders the production room at rest, with a separate editor-only overlay. */
export class EditorPreview {
  private readonly renderer: KeyfallRenderer;
  private readonly effects = new KeyfallEffects();
  private readonly overlayContext: CanvasRenderingContext2D;
  private world?: KeyfallWorld;
  private current?: { file: LevelFile; selection: Selection | null; snap: boolean };
  private frame?: number;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  constructor(private readonly canvas: HTMLCanvasElement, private readonly overlay: HTMLCanvasElement) {
    this.renderer = new KeyfallRenderer(canvas);
    const context = overlay.getContext("2d");
    if (!context) throw new Error("Editor overlay canvas is unavailable.");
    this.overlayContext = context;
  }

  show(file: LevelFile, selection: Selection | null, snap: boolean): void {
    this.current = { file, selection, snap };
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.world?.dispose();
    const room = previewRoom(file.room);
    this.world = makeWorld(room);
    this.resize();
    this.drawFrame();
  }

  resize(): void {
    this.renderer.resize();
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const rect = this.overlay.getBoundingClientRect();
    this.overlay.width = Math.max(1, Math.floor(rect.width * ratio));
    this.overlay.height = Math.max(1, Math.floor(rect.height * ratio));
    if (this.current && this.world) {
      const room = previewRoom(this.current.file.room);
      this.renderer.render(room, this.world, new Set(), "ready", this.reducedMotion.matches, this.effects, {
        hideKey: !this.current.file.room.keyStart,
        hideGoal: !this.current.file.room.goal,
      });
      this.drawOverlay(this.current.file.room, this.current.selection, this.current.snap);
    }
  }

  hide(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.world?.dispose(); this.world = undefined;
    this.current = undefined;
    this.overlayContext.clearRect(0, 0, this.overlay.width, this.overlay.height);
  }

  dispose(): void { this.hide(); this.effects.clear(); }

  private drawOverlay(room: DraftRoom, selection: Selection | null, snap: boolean): void {
    const c = this.overlayContext;
    c.clearRect(0, 0, this.overlay.width, this.overlay.height);
    c.save();
    c.scale(this.overlay.width / BOARD_WIDTH, this.overlay.height / BOARD_HEIGHT);
    if (snap) {
      c.strokeStyle = "rgba(255, 238, 190, .11)";
      c.lineWidth = 1;
      for (let x = GRID_SIZE; x < BOARD_WIDTH; x += GRID_SIZE) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, BOARD_HEIGHT); c.stroke(); }
      for (let y = GRID_SIZE; y < BOARD_HEIGHT; y += GRID_SIZE) { c.beginPath(); c.moveTo(0, y); c.lineTo(BOARD_WIDTH, y); c.stroke(); }
    }
    if (!room.keyStart) {
      c.strokeStyle = "#f4c76b"; c.fillStyle = "rgba(244,199,107,.18)"; c.lineWidth = 3;
      for (const cord of room.cords) { c.beginPath(); c.arc(cord.anchor.x, cord.anchor.y, 8, 0, Math.PI * 2); c.fill(); c.stroke(); }
    }
    const selected = describeSelection(room, selection);
    if (selected) {
      c.strokeStyle = "#fff1ad";
      c.fillStyle = "rgba(255, 231, 137, .13)";
      c.lineWidth = 3;
      c.setLineDash([8, 5]);
      const element = selection?.kind === "element" ? room.elements?.[selection.index] : undefined;
      const prop = selection?.kind === "prop" ? room.props[selection.index] : undefined;
      if (element?.kind === "air-jet") { c.fillRect(element.zone.x, element.zone.y, element.zone.width, element.zone.height); c.strokeRect(element.zone.x, element.zone.y, element.zone.width, element.zone.height); }
      else if (element?.kind === "reset-hazard") { c.fillRect(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height); c.strokeRect(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height); }
      else if (prop?.kind === "platform" || prop?.kind === "wall") { const length = prop.length ?? 104; c.save(); c.translate(prop.position.x, prop.position.y); c.rotate(prop.angle ?? 0); c.fillRect(-length / 2, -10, length, 20); c.strokeRect(-length / 2, -10, length, 20); c.restore(); }
      else { c.beginPath(); c.arc(selected.position.x, selected.position.y, 37, 0, Math.PI * 2); c.fill(); c.stroke(); }
      c.setLineDash([]);
      c.fillStyle = "#173842";
      c.strokeStyle = "rgba(255,255,255,.75)";
      c.lineWidth = 2;
      const labelWidth = Math.max(72, selected.label.length * 7 + 18);
      const labelX = Math.min(BOARD_WIDTH - labelWidth - 6, Math.max(6, selected.position.x - labelWidth / 2));
      const labelY = Math.max(8, selected.position.y - 64);
      roundedRect(c, labelX, labelY, labelWidth, 28, 8); c.fill(); c.stroke();
      c.fillStyle = "#fff6dc"; c.font = "600 13px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(selected.label, labelX + labelWidth / 2, labelY + 14);
    }
    c.restore();
  }

  private drawFrame = (): void => {
    if (!this.current || !this.world) return;
    const room = previewRoom(this.current.file.room);
    this.renderer.render(room, this.world, new Set(), "ready", this.reducedMotion.matches, this.effects, {
      hideKey: !this.current.file.room.keyStart,
      hideGoal: !this.current.file.room.goal,
    });
    this.drawOverlay(this.current.file.room, this.current.selection, this.current.snap);
    this.frame = requestAnimationFrame(this.drawFrame);
  };
}

function previewRoom(room: DraftRoom): RoomDefinition {
  return {
    ...room,
    keyStart: room.keyStart ?? { x: -120, y: -120 },
    goal: room.goal ?? { x: -120, y: -120 },
    cords: room.keyStart ? room.cords : [],
  };
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}
