import type { LevelFile } from "../level-files";
import type { DeviceDefinition, PieceDefinition } from "../types";

export const GRID_SIZE = 20;

export type Selection =
  | { kind: "launcher" }
  | { kind: "piece"; id: number }
  | { kind: "terrain"; id: string }
  | { kind: "device"; id: string };

export type PaletteKind =
  | "launcher"
  | "target"
  | "box"
  | "plank"
  | "bucket"
  | "cushion"
  | "terrain"
  | DeviceDefinition["kind"];

export interface EditableObject {
  label: string;
  x: number;
  y: number;
  angle?: number;
  width?: number;
  height?: number;
  linkKind?: "gate" | "field";
  targetId?: string;
}

const clone = <T>(value: T): T => structuredClone(value);
/** Property-order-independent draft equality; array order remains authored data. */
const serialize = (value: LevelFile): string => JSON.stringify(sortKeys(value));
const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

export function blankLevel(id = "new-wishbone-yard"): LevelFile {
  return {
    version: 1,
    playtested: false,
    nextPieceId: 1,
    yard: {
      id,
      name: "Untitled Yard",
      subtitle: "Pull, release, and start a happy tumble.",
      legacyIndex: null,
      world: { width: 1200, height: 720 },
      launcher: { x: 160, y: 540 },
      pieces: [],
      terrain: [],
      devices: [],
    },
  };
}

/** Owns immutable snapshots, one-action pointer batches, and a saved baseline. */
export class EditorDocument {
  private file: LevelFile;
  private saved: string;
  private undoStack: LevelFile[] = [];
  private redoStack: LevelFile[] = [];
  private batchStart?: LevelFile;
  private nextPieceIdHighWater: number;

  constructor(file: LevelFile) {
    this.file = clone(file);
    this.saved = serialize(this.file);
    this.nextPieceIdHighWater = file.nextPieceId;
  }

  get value(): LevelFile { return clone(this.file); }
  get dirty(): boolean { return serialize(this.file) !== this.saved; }
  get canUndo(): boolean { return this.undoStack.length > 0; }
  get canRedo(): boolean { return this.redoStack.length > 0; }

  replace(file: LevelFile): void {
    this.file = clone(file);
    this.saved = serialize(this.file);
    this.undoStack = [];
    this.redoStack = [];
    this.batchStart = undefined;
    this.nextPieceIdHighWater = file.nextPieceId;
  }

  edit(change: (file: LevelFile) => void): boolean {
    const before = clone(this.file);
    const authoredBefore = JSON.stringify(this.file.yard);
    change(this.file);
    this.nextPieceIdHighWater = Math.max(this.nextPieceIdHighWater, this.file.nextPieceId);
    this.file.nextPieceId = this.nextPieceIdHighWater;
    if (JSON.stringify(this.file.yard) !== authoredBefore) this.file.playtested = false;
    if (serialize(before) === serialize(this.file)) return false;
    if (!this.batchStart) this.undoStack.push(before);
    this.redoStack = [];
    return true;
  }

  beginBatch(): void { if (!this.batchStart) this.batchStart = clone(this.file); }
  endBatch(): void {
    if (!this.batchStart) return;
    if (serialize(this.batchStart) !== serialize(this.file)) this.undoStack.push(this.batchStart);
    this.batchStart = undefined;
  }
  cancelBatch(): void {
    if (!this.batchStart) return;
    this.file = this.batchStart;
    this.file.nextPieceId = this.nextPieceIdHighWater;
    this.batchStart = undefined;
  }

  undo(): boolean {
    const prior = this.undoStack.pop();
    if (!prior) return false;
    this.redoStack.push(clone(this.file));
    this.file = prior;
    this.file.nextPieceId = this.nextPieceIdHighWater;
    this.batchStart = undefined;
    return true;
  }

  redo(): boolean {
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(clone(this.file));
    this.file = next;
    this.file.nextPieceId = this.nextPieceIdHighWater;
    this.batchStart = undefined;
    return true;
  }

  /** A slow completed save never clears a newer edit. */
  acceptSaved(payload: LevelFile): boolean {
    this.nextPieceIdHighWater = Math.max(this.nextPieceIdHighWater, payload.nextPieceId);
    this.file.nextPieceId = this.nextPieceIdHighWater;
    const canonical = clone(payload);
    canonical.nextPieceId = this.nextPieceIdHighWater;
    const text = serialize(canonical);
    this.saved = text;
    return serialize(this.file) === text;
  }

  markPlaytested(expectedYard: LevelFile["yard"]): boolean {
    if (JSON.stringify(this.file.yard) !== JSON.stringify(expectedYard) || this.file.playtested) return false;
    const before = clone(this.file);
    this.file.playtested = true;
    this.undoStack.push(before);
    this.redoStack = [];
    return true;
  }
}

export function describeSelection(file: LevelFile, selection: Selection | null): EditableObject | null {
  if (!selection) return null;
  const yard = file.yard;
  if (selection.kind === "launcher") return yard.launcher ? { label: "Wishbone launcher", ...yard.launcher } : null;
  if (selection.kind === "piece") {
    const item = yard.pieces.find((piece) => piece.id === selection.id);
    if (!item) return null;
    return { label: pieceLabel(item), x: item.x, y: item.y, ...(item.kind === "target" ? {} : { angle: item.angle ?? 0 }) };
  }
  if (selection.kind === "terrain") {
    const item = yard.terrain.find((terrain) => terrain.id === selection.id);
    return item ? { label: "Fixed terrain", x: item.x, y: item.y, angle: item.angle, width: item.w, height: item.h } : null;
  }
  const item = yard.devices.find((device) => device.id === selection.id);
  if (!item) return null;
  return {
    label: deviceLabel(item.kind), x: item.x, y: item.y,
    ...(item.kind !== "field" ? { angle: item.angle ?? 0 } : {}),
    ...(item.kind === "lever" ? { linkKind: "gate" as const, targetId: item.targetId } : {}),
    ...(item.kind === "button" ? { linkKind: "field" as const, targetId: item.targetId } : {}),
  };
}

export function moveSelection(file: LevelFile, selection: Selection, position: { x: number; y: number }, snap: boolean): void {
  const point = bounded(file, position, snap);
  if (selection.kind === "launcher") { if (file.yard.launcher) file.yard.launcher = point; return; }
  const item = selection.kind === "piece"
    ? file.yard.pieces.find((candidate) => candidate.id === selection.id)
    : selection.kind === "terrain"
      ? file.yard.terrain.find((candidate) => candidate.id === selection.id)
      : file.yard.devices.find((candidate) => candidate.id === selection.id);
  if (item) { item.x = point.x; item.y = point.y; }
}

export function rotateSelection(file: LevelFile, selection: Selection, radians: number): void {
  if (!Number.isFinite(radians)) return;
  if (selection.kind === "piece") {
    const item = file.yard.pieces.find((candidate) => candidate.id === selection.id);
    if (item && item.kind !== "target") item.angle = radians;
  } else if (selection.kind === "terrain") {
    const item = file.yard.terrain.find((candidate) => candidate.id === selection.id);
    if (item) item.angle = radians;
  } else if (selection.kind === "device") {
    const item = file.yard.devices.find((candidate) => candidate.id === selection.id);
    if (item && item.kind !== "field") item.angle = radians;
  }
}

export function resizeSelection(file: LevelFile, selection: Selection, width: number, height: number): void {
  if (selection.kind !== "terrain" || !Number.isFinite(width) || !Number.isFinite(height)) return;
  const item = file.yard.terrain.find((candidate) => candidate.id === selection.id);
  if (item) { item.w = Math.max(10, width); item.h = Math.max(10, height); }
}

export function linkSelection(file: LevelFile, selection: Selection, targetId?: string): void {
  if (selection.kind !== "device") return;
  const item = file.yard.devices.find((candidate) => candidate.id === selection.id);
  if (item?.kind === "lever" || item?.kind === "button") item.targetId = targetId || undefined;
}

export function removeSelection(file: LevelFile, selection: Selection): void {
  if (selection.kind === "launcher") file.yard.launcher = null;
  else if (selection.kind === "piece") file.yard.pieces = file.yard.pieces.filter((item) => item.id !== selection.id);
  else if (selection.kind === "terrain") file.yard.terrain = file.yard.terrain.filter((item) => item.id !== selection.id);
  else {
    file.yard.devices = file.yard.devices.filter((item) => item.id !== selection.id);
    for (const item of file.yard.devices) if (item.targetId === selection.id) item.targetId = undefined;
  }
}

export function duplicateSelection(file: LevelFile, selection: Selection): Selection | null {
  if (selection.kind === "launcher") return { kind: "launcher" };
  if (selection.kind === "piece") {
    const item = file.yard.pieces.find((candidate) => candidate.id === selection.id);
    if (!item) return null;
    const copy = { ...clone(item), id: file.nextPieceId++, x: item.x + 30, y: item.y + 30 };
    file.yard.pieces.push(copy);
    return { kind: "piece", id: copy.id };
  }
  if (selection.kind === "terrain") {
    const item = file.yard.terrain.find((candidate) => candidate.id === selection.id);
    if (!item) return null;
    const copy = { ...clone(item), id: nextStringId(file, "terrain"), x: item.x + 30, y: item.y + 30 };
    file.yard.terrain.push(copy);
    return { kind: "terrain", id: copy.id };
  }
  const item = file.yard.devices.find((candidate) => candidate.id === selection.id);
  if (!item) return null;
  const copy = { ...clone(item), id: nextStringId(file, item.kind), x: item.x + 30, y: item.y + 30 };
  file.yard.devices.push(copy);
  return { kind: "device", id: copy.id };
}

export function addPaletteObject(file: LevelFile, kind: PaletteKind, at: { x: number; y: number }): Selection {
  const point = bounded(file, at, false);
  if (kind === "launcher") { file.yard.launcher = point; return { kind: "launcher" }; }
  if (kind === "target" || kind === "box" || kind === "plank" || kind === "bucket" || kind === "cushion") {
    const sizes: Record<string, { w: number; h: number; r?: number }> = {
      target: { w: 40, h: 40, r: 20 }, box: { w: 76, h: 84 }, plank: { w: 180, h: 18 },
      bucket: { w: 60, h: 64 }, cushion: { w: 90, h: 32 },
    };
    const size = sizes[kind];
    const piece: PieceDefinition & { id: number; angle: number } = {
      id: file.nextPieceId++, kind, ...point, w: size.w, h: size.h, ...(size.r ? { r: size.r } : {}), angle: 0, color: 0,
    };
    file.yard.pieces.push(piece);
    return { kind: "piece", id: piece.id };
  }
  if (kind === "terrain") {
    const item = { id: nextStringId(file, "terrain"), ...point, w: 220, h: 28, angle: 0 };
    file.yard.terrain.push(item);
    return { kind: "terrain", id: item.id };
  }
  const item: DeviceDefinition = {
    id: nextStringId(file, kind), kind, ...point,
    ...(kind === "bellows" ? { angle: 0 } : {}),
    ...(kind === "field" ? { r: 150 } : {}),
  };
  file.yard.devices.push(item);
  return { kind: "device", id: item.id };
}

export function hitTest(file: LevelFile, point: { x: number; y: number }): Selection | null {
  for (let index = file.yard.devices.length - 1; index >= 0; index -= 1) {
    const item = file.yard.devices[index];
    const radius = item.kind === "field" ? Math.min(item.r ?? 150, 60) : item.kind === "gate" ? 45 : 34;
    if (Math.hypot(point.x - item.x, point.y - item.y) <= radius) return { kind: "device", id: item.id };
  }
  for (let index = file.yard.pieces.length - 1; index >= 0; index -= 1) {
    const item = file.yard.pieces[index];
    if (item.kind === "target") {
      if (Math.hypot(point.x - item.x, point.y - item.y) <= (item.r ?? 20) + 8) return { kind: "piece", id: item.id };
    } else if (inRotatedRectangle(point, item.x, item.y, item.w, item.h, item.angle ?? 0, 8)) return { kind: "piece", id: item.id };
  }
  for (let index = file.yard.terrain.length - 1; index >= 0; index -= 1) {
    const item = file.yard.terrain[index];
    if (inRotatedRectangle(point, item.x, item.y, item.w, item.h, item.angle, 9)) return { kind: "terrain", id: item.id };
  }
  if (file.yard.launcher && Math.hypot(point.x - file.yard.launcher.x, point.y - file.yard.launcher.y) <= 55) return { kind: "launcher" };
  return null;
}

export function selectionExists(file: LevelFile, selection: Selection | null): boolean {
  return describeSelection(file, selection) !== null;
}

function bounded(file: LevelFile, point: { x: number; y: number }, snap: boolean) {
  const x = snap ? Math.round(point.x / GRID_SIZE) * GRID_SIZE : point.x;
  const y = snap ? Math.round(point.y / GRID_SIZE) * GRID_SIZE : point.y;
  return { x: clamp(x, 0, file.yard.world.width), y: clamp(y, 0, file.yard.world.height) };
}

function inRotatedRectangle(point: { x: number; y: number }, x: number, y: number, width: number, height: number, angle: number, padding: number): boolean {
  const dx = point.x - x, dy = point.y - y, cosine = Math.cos(-angle), sine = Math.sin(-angle);
  const localX = dx * cosine - dy * sine, localY = dx * sine + dy * cosine;
  return Math.abs(localX) <= width / 2 + padding && Math.abs(localY) <= height / 2 + padding;
}

function nextStringId(file: LevelFile, stem: string): string {
  const ids = new Set([...file.yard.terrain.map((item) => item.id), ...file.yard.devices.map((item) => item.id)]);
  let suffix = 1, id = `${file.yard.id}-${stem}-${suffix}`;
  while (ids.has(id)) { suffix += 1; id = `${file.yard.id}-${stem}-${suffix}`; }
  return id;
}

function pieceLabel(item: PieceDefinition): string {
  return item.kind === "target" ? "Squeaky toy" : item.kind === "box" ? "Crate" : item.kind === "plank" ? "Plank" : item.kind === "bucket" ? "Magnetic block" : "Cushion";
}

function deviceLabel(kind: DeviceDefinition["kind"]): string {
  return kind === "bellows" ? "Spring pad" : kind === "button" ? "Magnet control" : kind === "field" ? "Magnet field" : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    return sorted;
  }
  return value;
}
