import { ContentCompiler } from "../content";
import type { LevelDocument, Point } from "../content-types";
import {
  PIPE_GRID,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type Selection,
  type Tool,
} from "./model";

const SCALE = 50;

export interface PreviewState {
  document: LevelDocument;
  selection: Selection | null;
  tool: Tool;
  showGrid: boolean;
  hover: Point | null;
  brushRadius: number;
  pendingPolygon: Point[];
  rectangleStart: Point | null;
}

/** Lightweight authoring preview. Play mode deliberately uses the production renderer. */
export class EditorPreview {
  private readonly context: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable.");
    this.context = context;
  }

  point(event: PointerEvent): Point {
    const box = this.canvas.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          WORLD_WIDTH,
          ((event.clientX - box.left) / box.width) * WORLD_WIDTH,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          WORLD_HEIGHT,
          ((event.clientY - box.top) / box.height) * WORLD_HEIGHT,
        ),
      ),
    };
  }

  render(state: PreviewState): void {
    const c = this.context;
    this.background();
    try {
      this.terrain(ContentCompiler.terrain(state.document));
    } catch {
      this.unavailableTerrain();
    }
    this.terrainOperations(state.document);
    state.document.rocks.forEach((item, index) =>
      this.rock(
        item,
        state.selection?.kind === "rock" && state.selection.index === index,
      ),
    );
    state.document.reservoirs.forEach((item, index) =>
      this.reservoir(
        item,
        state.selection?.kind === "reservoir" &&
          state.selection.index === index,
      ),
    );
    state.document.pipes.forEach((item, index) =>
      this.pipe(
        item,
        state.selection?.kind === "pipe" && state.selection.index === index,
      ),
    );
    state.document.canteens.forEach((item, index) =>
      this.canteen(
        item,
        state.selection?.kind === "canteen" && state.selection.index === index,
      ),
    );
    state.document.decoys.forEach((item, index) =>
      this.intake(
        item,
        true,
        state.selection?.kind === "decoy" && state.selection.index === index,
      ),
    );
    this.intake(
      state.document.intake,
      false,
      state.selection?.kind === "intake",
    );
    this.target(state.document.target, state.selection?.kind === "target");
    this.selectionOutline(state.document, state.selection);
    if (state.showGrid) this.grid();
    this.pendingShape(state);
    if (state.hover && state.tool.startsWith("brush-"))
      this.brushFootprint(state.hover, state.brushRadius, state.tool);
    c.fillStyle = "#071613c7";
    c.fillRect(9, 9, 157, 25);
    c.fillStyle = "#e9d8aa";
    c.font = "700 11px system-ui";
    c.textAlign = "left";
    c.fillText(
      `${state.document.terrain.length} terrain ops · ${state.document.reservoirs.length} tanks`,
      18,
      26,
    );
  }

  private background(): void {
    const c = this.context;
    const sky = c.createLinearGradient(0, 0, 0, this.canvas.height);
    sky.addColorStop(0, "#264c43");
    sky.addColorStop(0.28, "#31523d");
    sky.addColorStop(1, "#17372e");
    c.fillStyle = sky;
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.fillStyle = "#132d28";
    for (let index = 0; index < 18; index++) {
      const x = index * 39 - 22,
        height = 52 + (index % 4) * 13;
      c.beginPath();
      c.moveTo(x, 115);
      c.lineTo(x + 25, 115 - height);
      c.lineTo(x + 50, 115);
      c.fill();
    }
  }

  private terrain(grid: Uint8Array): void {
    const c = this.context;
    const cellW = this.canvas.width / 80,
      cellH = this.canvas.height / 100;
    for (let row = 0; row < 100; row++) {
      let col = 0;
      while (col < 80) {
        const value = grid[row * 80 + col];
        const start = col++;
        while (col < 80 && grid[row * 80 + col] === value) col++;
        if (value === 0) continue;
        c.fillStyle =
          value === 2 ? "#59625e" : (row + start) % 4 ? "#95663d" : "#a87142";
        c.fillRect(
          start * cellW,
          row * cellH,
          (col - start) * cellW + 0.2,
          cellH + 0.2,
        );
      }
    }
    c.globalAlpha = 0.18;
    c.fillStyle = "#ebc07a";
    for (let y = 0; y < this.canvas.height; y += 21)
      for (let x = ((y / 21) % 2) * 8; x < this.canvas.width; x += 29)
        c.fillRect(x, y, 2, 1);
    c.globalAlpha = 1;
  }

  private unavailableTerrain(): void {
    const c = this.context;
    c.fillStyle = "#765137";
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private terrainOperations(document: LevelDocument): void {
    const c = this.context;
    document.terrain.forEach((operation) => {
      if (operation.kind !== "polygon") return;
      c.save();
      c.strokeStyle =
        operation.material === "rock"
          ? "#d5dedb99"
          : operation.material === "empty"
            ? "#8fe0d5a8"
            : "#f0c7789c";
      c.lineWidth = 1.5;
      c.setLineDash([5, 5]);
      c.beginPath();
      operation.points.forEach((point, index) =>
        index
          ? c.lineTo(point.x * SCALE, point.y * SCALE)
          : c.moveTo(point.x * SCALE, point.y * SCALE),
      );
      c.closePath();
      c.stroke();
      c.restore();
    });
  }

  private reservoir(
    item: LevelDocument["reservoirs"][number],
    selected: boolean,
  ): void {
    const c = this.context,
      x = item.x * SCALE,
      y = item.y * SCALE,
      w = item.w * SCALE,
      h = item.h * SCALE;
    c.save();
    c.fillStyle = "#132727dc";
    c.fillRect(x, y, w, h);
    const waterH = (h * item.fillPercent) / 100;
    const water = c.createLinearGradient(0, y + h - waterH, 0, y + h);
    water.addColorStop(0, "#73d2ddc8");
    water.addColorStop(1, "#268da8e8");
    c.fillStyle = water;
    c.fillRect(x + 5, y + h - waterH, Math.max(0, w - 10), waterH);
    const wall = 0.15 * SCALE,
      gap = 0.75 * SCALE;
    c.fillStyle = selected ? "#ffe19a" : "#bdc5b1";
    c.fillRect(x, y, w, wall);
    const verticalRun = Math.max(0, (h - gap) / 2),
      horizontalRun = Math.max(0, (w - gap) / 2);
    if (item.outlet === "left") {
      c.fillRect(x, y, wall, verticalRun);
      c.fillRect(x, y + verticalRun + gap, wall, verticalRun);
    } else c.fillRect(x, y, wall, h);
    if (item.outlet === "right") {
      c.fillRect(x + w - wall, y, wall, verticalRun);
      c.fillRect(x + w - wall, y + verticalRun + gap, wall, verticalRun);
    } else c.fillRect(x + w - wall, y, wall, h);
    if (item.outlet === "bottom") {
      c.fillRect(x, y + h - wall, horizontalRun, wall);
      c.fillRect(x + horizontalRun + gap, y + h - wall, horizontalRun, wall);
    } else c.fillRect(x, y + h - wall, w, wall);
    c.fillStyle = "#f2dfb7";
    c.font = "700 10px system-ui";
    c.textAlign = "center";
    c.fillText(`${item.fillPercent}%`, x + w / 2, y + 15);
    c.restore();
  }

  private rock(item: LevelDocument["rocks"][number], selected: boolean): void {
    const c = this.context,
      x = item.x * SCALE,
      y = item.y * SCALE,
      w = item.w * SCALE,
      h = item.h * SCALE;
    c.save();
    c.fillStyle = "#525c58";
    c.strokeStyle = selected ? "#ffe19a" : "#7e8b85";
    c.lineWidth = selected ? 4 : 2;
    c.beginPath();
    c.roundRect(x, y, w, h, Math.min(13, h / 3));
    c.fill();
    c.stroke();
    c.fillStyle = "#7d8983";
    c.beginPath();
    c.ellipse(
      x + w * 0.35,
      y + h * 0.32,
      w * 0.2,
      h * 0.13,
      -0.2,
      0,
      Math.PI * 2,
    );
    c.fill();
    c.restore();
  }

  private pipe(item: LevelDocument["pipes"][number], selected: boolean): void {
    const c = this.context,
      size = PIPE_GRID * SCALE,
      x = item.x * SCALE,
      y = item.y * SCALE;
    c.save();
    c.translate(x + size / 2, y + size / 2);
    c.rotate((item.rotation * Math.PI) / 180);
    const arms =
      item.kind === "straight"
        ? ["left", "right"]
        : item.kind === "elbow"
          ? ["right", "bottom"]
          : item.kind === "tee"
            ? ["left", "right", "bottom"]
            : ["left", "right", "top", "bottom"];
    const branch = (ax: number, ay: number, bx: number, by: number) => {
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(bx, by);
      c.stroke();
    };
    const drawArms = () =>
      arms.forEach((arm) => {
        if (arm === "left") branch(0, 0, -size / 2, 0);
        if (arm === "right") branch(0, 0, size / 2, 0);
        if (arm === "top") branch(0, 0, 0, -size / 2);
        if (arm === "bottom") branch(0, 0, 0, size / 2);
      });
    c.lineCap = "square";
    if (selected) {
      c.strokeStyle = "#ffe19a";
      c.lineWidth = 0.42 * SCALE;
      drawArms();
    }
    c.strokeStyle = "#85918b";
    c.lineWidth = 0.3 * SCALE;
    drawArms();
    c.fillStyle = "#85918b";
    c.fillRect(-0.15 * SCALE, -0.15 * SCALE, 0.3 * SCALE, 0.3 * SCALE);
    c.strokeStyle = "#303b38";
    c.lineWidth = 1;
    c.strokeRect(-size / 2, -size / 2, size, size);
    c.restore();
  }

  private canteen(item: Point, selected: boolean): void {
    const c = this.context,
      x = item.x * SCALE,
      y = item.y * SCALE;
    c.save();
    c.fillStyle = "#d4a34c";
    c.strokeStyle = selected ? "#fff0a8" : "#6a4a29";
    c.lineWidth = selected ? 4 : 2;
    c.beginPath();
    c.roundRect(x - 13, y - 17, 26, 34, 7);
    c.fill();
    c.stroke();
    c.fillStyle = "#83cdd4";
    c.fillRect(x - 8, y + 2, 16, 9);
    c.restore();
  }

  private intake(
    item: LevelDocument["intake"],
    decoy: boolean,
    selected: boolean,
  ): void {
    const c = this.context,
      x = item.x * SCALE,
      y = item.y * SCALE,
      angle =
        (({ right: 0, down: 90, left: 180, up: 270 } as const)[item.facing] *
          Math.PI) /
        180;
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = decoy ? "#706e68" : "#449fb1";
    c.strokeStyle = selected ? "#ffe19a" : "#d4d6c8";
    c.lineWidth = selected ? 4 : 2;
    c.beginPath();
    c.moveTo(-19, -15);
    c.lineTo(7, -15);
    c.lineTo(20, -9);
    c.lineTo(20, 9);
    c.lineTo(7, 15);
    c.lineTo(-19, 15);
    c.closePath();
    c.fill();
    c.stroke();
    if (decoy) {
      c.strokeStyle = "#3a3430";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-4, -12);
      c.lineTo(-4, 12);
      c.stroke();
    }
    c.restore();
  }

  private target(item: LevelDocument["target"], selected: boolean): void {
    const c = this.context,
      x = item.x * SCALE,
      y = item.y * SCALE,
      w = item.w * SCALE,
      h = item.h * SCALE;
    c.save();
    c.fillStyle = "#2a211cbd";
    c.strokeStyle = selected ? "#ffe19a" : "#806a4a";
    c.lineWidth = selected ? 4 : 2;
    c.beginPath();
    c.roundRect(x, y, w, h, 8);
    c.fill();
    c.stroke();
    c.fillStyle = "#ef7a42";
    c.beginPath();
    c.moveTo(x + w / 2, y + 8);
    c.bezierCurveTo(
      x + w * 0.75,
      y + h * 0.6,
      x + w * 0.64,
      y + h * 0.76,
      x + w / 2,
      y + h * 0.72,
    );
    c.bezierCurveTo(
      x + w * 0.3,
      y + h * 0.58,
      x + w * 0.36,
      y + h * 0.36,
      x + w / 2,
      y + 8,
    );
    c.fill();
    c.fillStyle = "#f5cf5b";
    c.font = "800 9px system-ui";
    c.textAlign = "center";
    c.fillText("TARGET", x + w / 2, y + h - 8);
    c.restore();
  }

  private selectionOutline(
    document: LevelDocument,
    selection: Selection | null,
  ): void {
    if (!selection || selection.kind !== "terrain") return;
    const item = document.terrain[selection.index];
    if (!item) return;
    const c = this.context;
    c.save();
    c.strokeStyle = "#fff0a1";
    c.fillStyle = "#102420";
    c.lineWidth = 3;
    c.setLineDash([6, 4]);
    c.beginPath();
    item.points.forEach((point, index) =>
      index
        ? c.lineTo(point.x * SCALE, point.y * SCALE)
        : c.moveTo(point.x * SCALE, point.y * SCALE),
    );
    if (item.kind === "polygon") c.closePath();
    c.stroke();
    c.setLineDash([]);
    item.points.forEach((point, index) => {
      c.beginPath();
      c.arc(
        point.x * SCALE,
        point.y * SCALE,
        selection.vertex === index ? 7 : 5,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.stroke();
    });
    c.restore();
  }

  private grid(): void {
    const c = this.context;
    c.save();
    c.strokeStyle = "#ecf2dc20";
    c.lineWidth = 1;
    for (let x = 0; x <= WORLD_WIDTH; x += 0.6) {
      c.beginPath();
      c.moveTo(x * SCALE, 0);
      c.lineTo(x * SCALE, this.canvas.height);
      c.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 0.6) {
      c.beginPath();
      c.moveTo(0, y * SCALE);
      c.lineTo(this.canvas.width, y * SCALE);
      c.stroke();
    }
    c.strokeStyle = "#f7e0a544";
    for (let x = 0; x <= WORLD_WIDTH; x += PIPE_GRID) {
      c.beginPath();
      c.moveTo(x * SCALE, 0);
      c.lineTo(x * SCALE, this.canvas.height);
      c.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += PIPE_GRID) {
      c.beginPath();
      c.moveTo(0, y * SCALE);
      c.lineTo(this.canvas.width, y * SCALE);
      c.stroke();
    }
    c.restore();
  }

  private pendingShape(state: PreviewState): void {
    const points = state.pendingPolygon;
    if (!points.length && !state.rectangleStart) return;
    const c = this.context;
    c.save();
    c.strokeStyle = "#fff2a8";
    c.fillStyle = "#fff2a8";
    c.lineWidth = 2;
    c.setLineDash([7, 5]);
    c.beginPath();
    if (state.rectangleStart && state.hover) {
      c.rect(
        state.rectangleStart.x * SCALE,
        state.rectangleStart.y * SCALE,
        (state.hover.x - state.rectangleStart.x) * SCALE,
        (state.hover.y - state.rectangleStart.y) * SCALE,
      );
    } else {
      points.forEach((point, index) =>
        index
          ? c.lineTo(point.x * SCALE, point.y * SCALE)
          : c.moveTo(point.x * SCALE, point.y * SCALE),
      );
      if (state.hover) c.lineTo(state.hover.x * SCALE, state.hover.y * SCALE);
      points.forEach((point) => {
        c.moveTo(point.x * SCALE + 5, point.y * SCALE);
        c.arc(point.x * SCALE, point.y * SCALE, 5, 0, Math.PI * 2);
      });
    }
    c.stroke();
    c.restore();
  }

  private brushFootprint(point: Point, radius: number, tool: Tool): void {
    const c = this.context;
    c.save();
    c.strokeStyle =
      tool === "brush-rock"
        ? "#eef4ef"
        : tool === "brush-empty"
          ? "#82e2d9"
          : "#ffd477";
    c.fillStyle = `${tool === "brush-empty" ? "#62d5cb" : tool === "brush-rock" ? "#d2ddd8" : "#e5aa59"}24`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(point.x * SCALE, point.y * SCALE, radius * SCALE, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  }
}
