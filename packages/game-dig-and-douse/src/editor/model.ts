import { ContentCompiler } from "../content";
import type { LevelDocument, Point, TerrainMaterial } from "../content-types";

export const WORLD_WIDTH = 12;
export const WORLD_HEIGHT = 15;
export const GRID_SIZE = 0.15;
export const PIPE_GRID = 1.2;

export type Tool =
  | "select"
  | "brush-dirt"
  | "brush-empty"
  | "brush-rock"
  | "rectangle"
  | "polygon";

export type Selection =
  | { kind: "terrain"; index: number; vertex?: number }
  | { kind: "reservoir"; index: number }
  | { kind: "rock"; index: number }
  | { kind: "pipe"; index: number }
  | { kind: "canteen"; index: number }
  | { kind: "decoy"; index: number }
  | { kind: "intake" }
  | { kind: "target" };

export type AddKind =
  | "reservoir"
  | "rock"
  | "pipe-straight"
  | "pipe-elbow"
  | "pipe-tee"
  | "pipe-cross"
  | "canteen"
  | "decoy"
  | "intake"
  | "target";

export function cloneDocument(document: LevelDocument): LevelDocument {
  return structuredClone(document);
}

export function safeId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return normalized || "untitled-level";
}

export function nextObjectId(document: LevelDocument, stem: string): string {
  const ids = new Set<string>();
  document.terrain.forEach((item) => ids.add(item.id));
  document.reservoirs.forEach((item) => ids.add(item.id));
  document.pipes.forEach((item) => ids.add(item.id));
  let suffix = 1;
  let id = `${document.id}-${stem}-${suffix}`;
  while (ids.has(id)) {
    suffix += 1;
    id = `${document.id}-${stem}-${suffix}`;
  }
  return id;
}

export class EditorHistory {
  private undoStack: LevelDocument[] = [];
  private redoStack: LevelDocument[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  remember(document: LevelDocument): void {
    this.undoStack.push(cloneDocument(document));
    if (this.undoStack.length > 150) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(document: LevelDocument): LevelDocument | undefined {
    const previous = this.undoStack.pop();
    if (!previous) return undefined;
    this.redoStack.push(cloneDocument(document));
    return previous;
  }

  redo(document: LevelDocument): LevelDocument | undefined {
    const next = this.redoStack.pop();
    if (!next) return undefined;
    this.undoStack.push(cloneDocument(document));
    return next;
  }
}

export function beginAuthoring(document: LevelDocument): LevelDocument {
  return ContentCompiler.withoutLegacy(cloneDocument(document));
}

export function addObject(document: LevelDocument, kind: AddKind): Selection {
  if (kind === "reservoir") {
    document.reservoirs.push({
      id: nextObjectId(document, "tank"),
      x: 1.2,
      y: 0.9,
      w: 3.6,
      h: 2.25,
      fillPercent: 100,
      outlet: "bottom",
    });
    return { kind: "reservoir", index: document.reservoirs.length - 1 };
  }
  if (kind === "rock") {
    document.rocks.push({ x: 4.8, y: 7.2, w: 1.8, h: 1.05 });
    return { kind: "rock", index: document.rocks.length - 1 };
  }
  if (kind.startsWith("pipe-")) {
    const pipeKind = kind.slice(5) as "straight" | "elbow" | "tee" | "cross";
    document.pipes.push({
      id: nextObjectId(document, "pipe"),
      x: 4.8,
      y: 7.2,
      kind: pipeKind,
      rotation: 0,
    });
    return { kind: "pipe", index: document.pipes.length - 1 };
  }
  if (kind === "canteen") {
    document.canteens.push({ x: 6, y: 7.5 });
    return { kind: "canteen", index: document.canteens.length - 1 };
  }
  if (kind === "decoy") {
    document.decoys.push({ x: 2.4, y: 11.4, facing: "right" });
    return { kind: "decoy", index: document.decoys.length - 1 };
  }
  if (kind === "intake") {
    document.intake = { x: 9.6, y: 10.2, facing: "left" };
    return { kind: "intake" };
  }
  document.target = { x: 8.7, y: 12.45, w: 2.4, h: 1.5 };
  return { kind: "target" };
}

export function removeSelection(
  document: LevelDocument,
  selection: Selection,
): boolean {
  if (selection.kind === "terrain")
    return !!document.terrain.splice(selection.index, 1).length;
  if (selection.kind === "reservoir")
    return !!document.reservoirs.splice(selection.index, 1).length;
  if (selection.kind === "rock")
    return !!document.rocks.splice(selection.index, 1).length;
  if (selection.kind === "pipe")
    return !!document.pipes.splice(selection.index, 1).length;
  if (selection.kind === "canteen")
    return !!document.canteens.splice(selection.index, 1).length;
  if (selection.kind === "decoy")
    return !!document.decoys.splice(selection.index, 1).length;
  return false;
}

export function duplicateSelection(
  document: LevelDocument,
  selection: Selection,
): Selection | null {
  if (selection.kind === "terrain") {
    const source = document.terrain[selection.index];
    if (!source) return null;
    const copy = cloneDocument({ ...document, terrain: [source] }).terrain[0];
    copy.id = nextObjectId(document, source.kind);
    copy.points.forEach((point) => {
      point.x = clamp(point.x + GRID_SIZE * 4, 0, WORLD_WIDTH);
      point.y = clamp(point.y + GRID_SIZE * 4, 0, WORLD_HEIGHT);
    });
    document.terrain.push(copy);
    return { kind: "terrain", index: document.terrain.length - 1 };
  }
  if (selection.kind === "reservoir") {
    const source = document.reservoirs[selection.index];
    if (!source) return null;
    document.reservoirs.push({
      ...source,
      id: nextObjectId(document, "tank"),
      x: clamp(source.x + 0.6, 0, WORLD_WIDTH - source.w),
      y: clamp(source.y + 0.6, 0, WORLD_HEIGHT - source.h),
    });
    return { kind: "reservoir", index: document.reservoirs.length - 1 };
  }
  if (selection.kind === "rock") {
    const source = document.rocks[selection.index];
    if (!source) return null;
    document.rocks.push({
      ...source,
      x: clamp(source.x + 0.6, 0, WORLD_WIDTH - source.w),
      y: clamp(source.y + 0.6, 0, WORLD_HEIGHT - source.h),
    });
    return { kind: "rock", index: document.rocks.length - 1 };
  }
  if (selection.kind === "pipe") {
    const source = document.pipes[selection.index];
    if (!source) return null;
    document.pipes.push({
      ...source,
      id: nextObjectId(document, "pipe"),
      x: snapPipe(source.x + PIPE_GRID),
      y: snapPipe(source.y),
    });
    return { kind: "pipe", index: document.pipes.length - 1 };
  }
  if (selection.kind === "canteen") {
    const source = document.canteens[selection.index];
    if (!source) return null;
    document.canteens.push({
      x: clamp(source.x + 0.6, 0, WORLD_WIDTH),
      y: clamp(source.y + 0.6, 0, WORLD_HEIGHT),
    });
    return { kind: "canteen", index: document.canteens.length - 1 };
  }
  if (selection.kind === "decoy") {
    const source = document.decoys[selection.index];
    if (!source) return null;
    document.decoys.push({
      ...source,
      x: clamp(source.x + 0.6, 0, WORLD_WIDTH),
      y: clamp(source.y + 0.6, 0, WORLD_HEIGHT),
    });
    return { kind: "decoy", index: document.decoys.length - 1 };
  }
  return null;
}

export function selectionPosition(
  document: LevelDocument,
  selection: Selection,
): Point | null {
  if (selection.kind === "terrain") {
    const item = document.terrain[selection.index];
    if (!item?.points.length) return null;
    if (selection.vertex !== undefined)
      return item.points[selection.vertex] ?? null;
    return centroid(item.points);
  }
  if (selection.kind === "reservoir") {
    const item = document.reservoirs[selection.index];
    return item ? { x: item.x + item.w / 2, y: item.y + item.h / 2 } : null;
  }
  if (selection.kind === "rock") {
    const item = document.rocks[selection.index];
    return item ? { x: item.x + item.w / 2, y: item.y + item.h / 2 } : null;
  }
  if (selection.kind === "pipe") return document.pipes[selection.index] ?? null;
  if (selection.kind === "canteen")
    return document.canteens[selection.index] ?? null;
  if (selection.kind === "decoy")
    return document.decoys[selection.index] ?? null;
  if (selection.kind === "intake") return document.intake;
  return {
    x: document.target.x + document.target.w / 2,
    y: document.target.y + document.target.h / 2,
  };
}

export function moveSelection(
  document: LevelDocument,
  selection: Selection,
  dx: number,
  dy: number,
): void {
  if (selection.kind === "terrain") {
    const item = document.terrain[selection.index];
    if (!item) return;
    if (selection.vertex !== undefined) {
      const point = item.points[selection.vertex];
      if (!point) return;
      point.x = clamp(point.x + dx, 0, WORLD_WIDTH);
      point.y = clamp(point.y + dy, 0, WORLD_HEIGHT);
    } else {
      const minX = Math.min(...item.points.map((point) => point.x));
      const maxX = Math.max(...item.points.map((point) => point.x));
      const minY = Math.min(...item.points.map((point) => point.y));
      const maxY = Math.max(...item.points.map((point) => point.y));
      const boundedX = clamp(dx, -minX, WORLD_WIDTH - maxX);
      const boundedY = clamp(dy, -minY, WORLD_HEIGHT - maxY);
      item.points.forEach((point) => {
        point.x += boundedX;
        point.y += boundedY;
      });
    }
  } else if (selection.kind === "reservoir") {
    const item = document.reservoirs[selection.index];
    if (!item) return;
    item.x = clamp(item.x + dx, 0, WORLD_WIDTH - item.w);
    item.y = clamp(item.y + dy, 0, WORLD_HEIGHT - item.h);
  } else if (selection.kind === "rock") {
    const item = document.rocks[selection.index];
    if (!item) return;
    item.x = clamp(item.x + dx, 0, WORLD_WIDTH - item.w);
    item.y = clamp(item.y + dy, 0, WORLD_HEIGHT - item.h);
  } else if (selection.kind === "pipe") {
    const item = document.pipes[selection.index];
    if (!item) return;
    item.x = snapPipeBounded(item.x + dx, WORLD_WIDTH - PIPE_GRID);
    item.y = snapPipeBounded(item.y + dy, WORLD_HEIGHT - PIPE_GRID);
  } else if (selection.kind === "canteen")
    movePoint(document.canteens[selection.index], dx, dy);
  else if (selection.kind === "decoy")
    movePoint(document.decoys[selection.index], dx, dy);
  else if (selection.kind === "intake") movePoint(document.intake, dx, dy);
  else {
    document.target.x = clamp(
      document.target.x + dx,
      0,
      WORLD_WIDTH - document.target.w,
    );
    document.target.y = clamp(
      document.target.y + dy,
      0,
      WORLD_HEIGHT - document.target.h,
    );
  }
}

export function terrainMaterial(
  tool: Tool,
  shapeMaterial: TerrainMaterial,
): TerrainMaterial {
  if (tool === "brush-dirt") return "dirt";
  if (tool === "brush-rock") return "rock";
  if (tool === "brush-empty") return "empty";
  return shapeMaterial;
}

export function hitTest(
  document: LevelDocument,
  point: Point,
): Selection | null {
  for (let index = document.decoys.length - 1; index >= 0; index--)
    if (near(point, document.decoys[index], 0.45))
      return { kind: "decoy", index };
  for (let index = document.canteens.length - 1; index >= 0; index--)
    if (near(point, document.canteens[index], 0.42))
      return { kind: "canteen", index };
  for (let index = document.pipes.length - 1; index >= 0; index--) {
    const item = document.pipes[index];
    if (inside(point, { x: item.x, y: item.y, w: PIPE_GRID, h: PIPE_GRID }))
      return { kind: "pipe", index };
  }
  for (let index = document.rocks.length - 1; index >= 0; index--)
    if (inside(point, document.rocks[index])) return { kind: "rock", index };
  for (let index = document.reservoirs.length - 1; index >= 0; index--)
    if (inside(point, document.reservoirs[index]))
      return { kind: "reservoir", index };
  if (inside(point, document.target)) return { kind: "target" };
  if (near(point, document.intake, 0.5)) return { kind: "intake" };
  for (let index = document.terrain.length - 1; index >= 0; index--) {
    const operation = document.terrain[index];
    for (let vertex = 0; vertex < operation.points.length; vertex++)
      if (near(point, operation.points[vertex], 0.22))
        return { kind: "terrain", index, vertex };
    if (operation.kind === "polygon" && pointInPolygon(point, operation.points))
      return { kind: "terrain", index };
    if (
      operation.kind === "brush" &&
      operation.points.some((candidate) =>
        near(point, candidate, operation.radius),
      )
    )
      return { kind: "terrain", index };
  }
  return null;
}

export function describeSelection(
  document: LevelDocument,
  selection: Selection | null,
): string {
  if (!selection) return "Nothing selected";
  if (selection.kind === "terrain") {
    const item = document.terrain[selection.index];
    return item
      ? `${item.kind === "brush" ? "Brush stroke" : "Outlined shape"} · ${item.material}`
      : "Terrain";
  }
  if (selection.kind === "reservoir") return `Reservoir ${selection.index + 1}`;
  if (selection.kind === "rock") return `Placed rock ${selection.index + 1}`;
  if (selection.kind === "pipe")
    return `${document.pipes[selection.index]?.kind ?? "Pipe"} pipe`;
  if (selection.kind === "canteen") return `Canteen ${selection.index + 1}`;
  if (selection.kind === "decoy") return `Capped decoy ${selection.index + 1}`;
  if (selection.kind === "intake") return "Working intake";
  return "Campsite target";
}

function movePoint(point: Point | undefined, dx: number, dy: number): void {
  if (!point) return;
  point.x = clamp(point.x + dx, 0, WORLD_WIDTH);
  point.y = clamp(point.y + dy, 0, WORLD_HEIGHT);
}
function centroid(points: Point[]): Point {
  return {
    x: points.reduce((sum, item) => sum + item.x, 0) / points.length,
    y: points.reduce((sum, item) => sum + item.y, 0) / points.length,
  };
}
function near(a: Point, b: Point, radius: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= radius;
}
function inside(
  point: Point,
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let insideShape = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      insideShape = !insideShape;
  }
  return insideShape;
}
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
export function snap(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
export function snapPipe(value: number): number {
  return Math.round(value / PIPE_GRID) * PIPE_GRID;
}
function snapPipeBounded(value: number, max: number): number {
  const maxIndex = Math.floor(max / PIPE_GRID);
  return clamp(Math.round(value / PIPE_GRID), 0, maxIndex) * PIPE_GRID;
}
