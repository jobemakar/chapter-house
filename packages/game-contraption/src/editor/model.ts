import type { Level, Part, PartType } from "../types";
import { clone, kit, part, W, H } from "../levels";
import {
  blankLevel as makeBlank,
  copyLevel as makeCopy,
  levelIssues,
  type LevelFile,
} from "../level-files";
export type { LevelFile } from "../level-files";

export type Selection =
  | { kind: "part" | "spare"; id: string }
  | { kind: "source"; index: number }
  | { kind: "bowl" };
export const GRID = 20;
const text = (file: LevelFile) => JSON.stringify(file);
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** Draft ownership, drag transactions and explicit saved baseline. */
export class EditorDocument {
  private file: LevelFile;
  private saved: string;
  private undoStack: LevelFile[] = [];
  private redoStack: LevelFile[] = [];
  private batch?: LevelFile;
  constructor(file: LevelFile, saved = true) {
    this.file = clone(file);
    this.saved = saved ? text(this.file) : "";
  }
  get value(): LevelFile {
    return clone(this.file);
  }
  get dirty(): boolean {
    return text(this.file) !== this.saved;
  }
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  replace(file: LevelFile, saved = true): void {
    this.file = clone(file);
    this.saved = saved ? text(file) : "";
    this.undoStack = [];
    this.redoStack = [];
    this.batch = undefined;
  }
  edit(change: (file: LevelFile) => void): boolean {
    const before = clone(this.file),
      old = text(this.file);
    change(this.file);
    if (old === text(this.file)) return false;
    if (!this.batch) this.undoStack.push(before);
    this.redoStack = [];
    return true;
  }
  beginBatch(): void {
    if (!this.batch) this.batch = clone(this.file);
  }
  endBatch(): void {
    if (this.batch && text(this.batch) !== text(this.file)) {
      this.undoStack.push(this.batch);
      this.redoStack = [];
    }
    this.batch = undefined;
  }
  cancelBatch(): void {
    if (this.batch) this.file = this.batch;
    this.batch = undefined;
  }
  undo(): boolean {
    const prior = this.undoStack.pop();
    if (!prior) return false;
    this.redoStack.push(clone(this.file));
    this.file = prior;
    this.batch = undefined;
    return true;
  }
  redo(): boolean {
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(clone(this.file));
    this.file = next;
    this.batch = undefined;
    return true;
  }
  acceptSaved(payload: LevelFile): boolean {
    this.saved = text(payload);
    return text(this.file) === this.saved;
  }
}

export function blankLevel(
  id: string,
  name = "Untitled Contraption",
): LevelFile {
  const file = makeBlank();
  file.level.id = id;
  file.level.name = name;
  return file;
}
export function copyLevel(file: LevelFile, newId: string): LevelFile {
  const result = makeCopy(file);
  result.level.id = newId;
  return result;
}
export function cloneLevelForPlaytest(level: Level): Level {
  return clone(level);
}

export function addPart(
  level: Level,
  type: PartType,
  x = W / 2,
  y = H / 2,
): Part {
  const value = part(type, x, y);
  value.locked = false;
  if (type === "button" || type === "lever") value.mode = "toggle";
  level.initial.push(value);
  return value;
}

/** Quantity changes preserve records and bindings for controls that remain. */
export function setSpareQuantity(
  level: Level,
  type: PartType,
  quantity: number,
): void {
  const matching = level.spares.filter((value) => value.type === type),
    cap = Math.max(
      0,
      96 - level.initial.length - (level.spares.length - matching.length),
    ),
    wanted = clamp(Math.floor(quantity), 0, cap);
  level.spares = level.spares
    .filter((value) => value.type !== type)
    .concat(matching.slice(0, wanted));
  while (level.spares.filter((value) => value.type === type).length < wanted) {
    const value = part(type, W / 2, H / 2);
    value.locked = false;
    if (type === "button" || type === "lever") value.mode = "toggle";
    level.spares.push(value);
  }
}

export function moveSelection(
  level: Level,
  selection: Selection,
  x: number,
  y: number,
  snap: boolean,
): void {
  const px = clamp(snap ? Math.round(x / GRID) * GRID : x, 0, W),
    py = clamp(snap ? Math.round(y / GRID) * GRID : y, 0, 600);
  if (selection.kind === "source") {
    const source = level.sources[selection.index];
    if (source) {
      source.x = clamp(px, 85, 1020);
      source.y = clamp(py, 95, 580);
    }
    return;
  }
  if (selection.kind === "bowl") {
    level.bowl.x = clamp(px, 70, W - 70);
    level.bowl.y = clamp(py, 65, 550);
    return;
  }
  const list = selection.kind === "part" ? level.initial : level.spares,
    piece = list.find((value) => value.id === selection.id);
  if (piece) {
    piece.x = px;
    piece.y = py;
  }
}

export function describe(
  level: Level,
  selection: Selection | null,
): { label: string; x: number; y: number; angle?: number; part?: Part } | null {
  if (!selection) return null;
  if (selection.kind === "source") {
    const source = level.sources[selection.index];
    return (
      source && {
        label: `Inlet ${selection.index + 1}`,
        x: source.x,
        y: source.y,
      }
    );
  }
  if (selection.kind === "bowl")
    return { label: "Collection bowl", x: level.bowl.x, y: level.bowl.y };
  const piece = (selection.kind === "part" ? level.initial : level.spares).find(
    (value) => value.id === selection.id,
  );
  return piece
    ? {
        label: `${selection.kind === "spare" ? "Spare · " : ""}${kit[piece.type].name}`,
        x: piece.x,
        y: piece.y,
        angle: piece.angle,
        part: piece,
      }
    : null;
}
export function issues(file: LevelFile): string[] {
  try {
    return levelIssues(file);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
}
