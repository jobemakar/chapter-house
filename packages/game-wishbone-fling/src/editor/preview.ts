import { PowerYard, loadPowers } from "../powers";
import { WishboneRenderer } from "../renderer";
import type { LevelFile } from "../level-files";
import type { YardDefinition } from "../types";
import { GRID_SIZE, describeSelection, type Selection } from "./model";

const VIEW_WIDTH = 1200;
const VIEW_HEIGHT = 720;

/** Production-rendered, unstepped yard with a separate authoring overlay. */
export class EditorPreview {
  private readonly renderer: WishboneRenderer;
  private readonly overlayContext: CanvasRenderingContext2D;
  private yard?: PowerYard;
  private current?: { file: LevelFile; selection: Selection | null; snap: boolean };
  private view = { x: 600, y: 360, zoom: 1 };
  private readonly backgroundLoaded = () => this.draw();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly overlay: HTMLCanvasElement) {
    this.renderer = new WishboneRenderer(canvas);
    this.renderer.background.addEventListener("load", this.backgroundLoaded);
    const context = overlay.getContext("2d");
    if (!context) throw new Error("Editor overlay canvas is unavailable.");
    this.overlayContext = context;
  }

  show(file: LevelFile, selection: Selection | null, snap: boolean): void {
    const oldWorld = this.current?.file.yard.world;
    this.current = { file, selection, snap };
    this.yard?.dispose();
    this.yard = new PowerYard(previewDefinition(file), null, loadPowers(), { settle: false });
    if (!oldWorld || oldWorld.width !== file.yard.world.width || oldWorld.height !== file.yard.world.height) this.fit();
    else this.draw();
  }

  resize(): void {
    this.renderer.resize();
    const rect = this.overlay.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.overlay.width = Math.max(1, Math.round(rect.width * ratio));
    this.overlay.height = Math.max(1, Math.round(rect.height * ratio));
    this.draw();
  }

  fit(): void {
    if (!this.current) return;
    const world = this.current.file.yard.world;
    this.view = { x: world.width / 2, y: world.height / 2, zoom: clamp(Math.min(VIEW_WIDTH / world.width, VIEW_HEIGHT / world.height) * 0.92, 0.04, 2.5) };
    this.draw();
  }

  zoomAt(factor: number, screen = { x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 }): void {
    const before = this.toWorld(screen), next = clamp(this.view.zoom * factor, 0.04, 3);
    this.view.zoom = next;
    const after = this.toWorld(screen);
    this.view.x += before.x - after.x;
    this.view.y += before.y - after.y;
    this.draw();
  }

  pan(dx: number, dy: number): void {
    this.view.x -= dx / this.view.zoom;
    this.view.y -= dy / this.view.zoom;
    this.draw();
  }

  toWorld(screen: { x: number; y: number }) {
    return { x: (screen.x - VIEW_WIDTH / 2) / this.view.zoom + this.view.x, y: (screen.y - VIEW_HEIGHT / 2) / this.view.zoom + this.view.y };
  }

  hide(): void { this.yard?.dispose(); this.yard = undefined; }

  dispose(): void {
    this.renderer.background.removeEventListener("load", this.backgroundLoaded);
    this.hide();
  }

  private draw(): void {
    if (!this.current || !this.yard) return;
    this.renderer.draw(this.yard, null, 0, true, true, this.view);
    const c = this.overlayContext;
    c.clearRect(0, 0, this.overlay.width, this.overlay.height);
    c.save();
    c.scale(this.overlay.width / VIEW_WIDTH, this.overlay.height / VIEW_HEIGHT);
    c.translate(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
    c.scale(this.view.zoom, this.view.zoom);
    c.translate(-this.view.x, -this.view.y);
    const { file, selection, snap } = this.current;
    if (snap) this.drawGrid(c, file);
    this.drawLinks(c, file);
    this.drawSelection(c, file, selection);
    c.restore();
  }

  private drawGrid(c: CanvasRenderingContext2D, file: LevelFile): void {
    c.strokeStyle = "rgba(255,248,210,.16)";
    c.lineWidth = 1 / this.view.zoom;
    c.beginPath();
    for (let x = 0; x <= file.yard.world.width; x += GRID_SIZE) { c.moveTo(x, 0); c.lineTo(x, file.yard.world.height); }
    for (let y = 0; y <= file.yard.world.height; y += GRID_SIZE) { c.moveTo(0, y); c.lineTo(file.yard.world.width, y); }
    c.stroke();
  }

  private drawLinks(c: CanvasRenderingContext2D, file: LevelFile): void {
    c.save();
    c.setLineDash([10 / this.view.zoom, 7 / this.view.zoom]);
    c.lineWidth = 2 / this.view.zoom;
    for (const control of file.yard.devices) {
      if ((control.kind !== "lever" && control.kind !== "button") || !control.targetId) continue;
      const target = file.yard.devices.find((item) => item.id === control.targetId);
      if (!target) continue;
      c.strokeStyle = control.kind === "lever" ? "#f6d47b" : "#8fe0ca";
      c.beginPath(); c.moveTo(control.x, control.y); c.lineTo(target.x, target.y); c.stroke();
    }
    c.restore();
  }

  private drawSelection(c: CanvasRenderingContext2D, file: LevelFile, selection: Selection | null): void {
    const selected = describeSelection(file, selection);
    if (!selected) return;
    c.save();
    c.strokeStyle = "#fff1a8"; c.fillStyle = "rgba(255,225,115,.15)"; c.lineWidth = 3 / this.view.zoom;
    c.setLineDash([8 / this.view.zoom, 5 / this.view.zoom]);
    if (selected.width && selected.height) {
      c.translate(selected.x, selected.y); c.rotate(selected.angle ?? 0);
      c.fillRect(-selected.width / 2, -selected.height / 2, selected.width, selected.height);
      c.strokeRect(-selected.width / 2, -selected.height / 2, selected.width, selected.height);
      c.rotate(-(selected.angle ?? 0)); c.translate(-selected.x, -selected.y);
    } else {
      c.beginPath(); c.arc(selected.x, selected.y, 44 / Math.sqrt(this.view.zoom), 0, Math.PI * 2); c.fill(); c.stroke();
    }
    c.setLineDash([]);
    const scale = 1 / this.view.zoom, width = Math.max(88, selected.label.length * 7 + 20) * scale;
    c.fillStyle = "#173832"; c.strokeStyle = "#fff9dc"; c.lineWidth = 1.5 * scale;
    c.beginPath(); c.roundRect(selected.x - width / 2, selected.y - 67 * scale, width, 27 * scale, 7 * scale); c.fill(); c.stroke();
    c.fillStyle = "#fff8df"; c.font = `${12 * scale}px system-ui,sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(selected.label, selected.x, selected.y - 53.5 * scale);
    c.restore();
  }
}

function previewDefinition(file: LevelFile): YardDefinition {
  const yard = file.yard;
  return {
    id: yard.id, name: yard.name, subtitle: yard.subtitle,
    world: { ...yard.world }, launcher: yard.launcher ? { ...yard.launcher } : { x: -500, y: -500 },
    pieces: yard.pieces.map((item) => ({ ...item })), terrain: yard.terrain.map((item) => ({ ...item })),
    deviceInstances: yard.devices.map((item) => ({ ...item })), revision: "editor-preview",
  };
}

function clamp(value: number, low: number, high: number): number { return Math.max(low, Math.min(high, value)); }
