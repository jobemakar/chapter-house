import type { DraftRoom, LevelFile } from "../level-files";
import { fanHeading, fanStoredAngle } from "../fan";
import type {
  AirJetDefinition,
  BubbleDefinition,
  CounterweightDefinition,
  PropDefinition,
  ResetHazardDefinition,
  Vec,
} from "../types";

export const BOARD_WIDTH = 560;
export const BOARD_HEIGHT = 800;
export const GRID_SIZE = 10;

export type Selection =
  | { kind: "key" }
  | { kind: "goal" }
  | { kind: "cord" | "ticket" | "prop" | "element"; index: number };

export type PaletteKind =
  | "key"
  | "goal"
  | "anchor"
  | "ticket"
  | "bumper"
  | "platform"
  | "wall"
  | "bellows"
  | "bubble"
  | "air-jet"
  | "counterweight"
  | "reset-hazard";

export type EditableObject = {
  label: string;
  position: Vec;
  rotation?: number;
  power?: number;
  length?: number;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const serialize = (value: LevelFile): string => JSON.stringify(value);
const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

export function blankLevel(id = "new-keyfall-room"): LevelFile {
  return {
    version: 1,
    playtested: false,
    room: {
      id,
      title: "Untitled Room",
      subtitle: "Guide the key into the lock.",
      wing: "campaign",
      source: { kind: "original" },
      kind: "drop",
      keyStart: null,
      goal: null,
      cords: [],
      tickets: [],
      props: [],
      elements: [],
    },
  };
}

/** Owns draft content, one-action drag batches, and an explicit saved baseline. */
export class EditorDocument {
  private file: LevelFile;
  private saved: string;
  private undoStack: LevelFile[] = [];
  private redoStack: LevelFile[] = [];
  private batchStart?: LevelFile;
  private revision = 0;

  constructor(file: LevelFile) {
    this.file = clone(file);
    this.saved = serialize(this.file);
  }

  get value(): LevelFile { return clone(this.file); }
  get currentRevision(): number { return this.revision; }
  get dirty(): boolean { return serialize(this.file) !== this.saved; }
  get canUndo(): boolean { return this.undoStack.length > 0; }
  get canRedo(): boolean { return this.redoStack.length > 0; }

  replace(file: LevelFile): void {
    this.file = clone(file);
    this.saved = serialize(this.file);
    this.undoStack = [];
    this.redoStack = [];
    this.batchStart = undefined;
    this.revision += 1;
  }

  edit(change: (file: LevelFile) => void): boolean {
    const before = clone(this.file);
    const beforeRoom = JSON.stringify(this.file.room);
    change(this.file);
    if (JSON.stringify(this.file.room) !== beforeRoom) this.file.playtested = false;
    if (serialize(before) === serialize(this.file)) return false;
    if (!this.batchStart) this.undoStack.push(before);
    this.redoStack = [];
    this.revision += 1;
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
    this.batchStart = undefined;
    this.revision += 1;
  }

  undo(): boolean {
    const prior = this.undoStack.pop();
    if (!prior) return false;
    this.redoStack.push(clone(this.file));
    this.file = prior;
    this.batchStart = undefined;
    this.revision += 1;
    return true;
  }

  redo(): boolean {
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(clone(this.file));
    this.file = next;
    this.batchStart = undefined;
    this.revision += 1;
    return true;
  }

  /** Only clears dirty when no edit landed after the saved request began. */
  acceptSaved(payload: LevelFile): boolean {
    const text = serialize(payload);
    this.saved = text;
    return serialize(this.file) === text;
  }

  markPlaytested(expectedRoom: DraftRoom): boolean {
    if (JSON.stringify(this.file.room) !== JSON.stringify(expectedRoom) || this.file.playtested) return false;
    const before = clone(this.file);
    this.file.playtested = true;
    this.undoStack.push(before);
    this.redoStack = [];
    this.revision += 1;
    return true;
  }
}

export function normalizeCords(room: DraftRoom): void {
  if (!room.keyStart) return;
  for (const cord of room.cords) {
    const dx = room.keyStart.x - cord.anchor.x;
    const dy = room.keyStart.y - cord.anchor.y;
    cord.length = Math.max(8, Math.hypot(dx, dy));
    cord.angle = Math.atan2(dy, dx);
  }
}

function normalizeCord(room: DraftRoom, index: number): void {
  if (!room.keyStart) return;
  const cord = room.cords[index];
  if (!cord) return;
  const dx = room.keyStart.x - cord.anchor.x;
  const dy = room.keyStart.y - cord.anchor.y;
  cord.length = Math.max(8, Math.hypot(dx, dy));
  cord.angle = Math.atan2(dy, dx);
}

export function describeSelection(room: DraftRoom, selection: Selection | null): EditableObject | null {
  if (!selection) return null;
  if (selection.kind === "key") return room.keyStart ? { label: "Key", position: clone(room.keyStart) } : null;
  if (selection.kind === "goal") return room.goal ? { label: "Goal", position: clone(room.goal) } : null;
  if (selection.kind === "cord") {
    const item = room.cords[selection.index];
    return item ? { label: `Anchor ${selection.index + 1}`, position: clone(item.anchor) } : null;
  }
  if (selection.kind === "ticket") {
    const item = room.tickets[selection.index];
    return item ? { label: `Ticket ${selection.index + 1}`, position: clone(item.position) } : null;
  }
  if (selection.kind === "prop") {
    const item = room.props[selection.index];
    return item ? {
      label: propLabel(item),
      position: clone(item.position),
      ...(item.kind === "bumper" ? {} : { rotation: item.kind === "bellows" ? fanHeading(item.angle) : item.angle ?? 0 }),
      ...(item.kind === "bellows" ? { power: item.power ?? 1 } : {}),
      ...(item.kind === "platform" || item.kind === "wall" ? { length: item.length ?? 104 } : {}),
    } : null;
  }
  const item = room.elements?.[selection.index];
  if (!item) return null;
  if (item.kind === "reset-hazard") return { label: "Reset hazard", position: boundsCenter(item.bounds) };
  if (item.kind === "air-jet") return { label: "Air jet", position: clone(item.position), rotation: Math.atan2(item.direction.y, item.direction.x) };
  return { label: item.kind === "bubble" ? "Bubble" : "Counterweight", position: clone(item.position) };
}

export function moveSelection(room: DraftRoom, selection: Selection, position: Vec, snap: boolean): void {
  const p = boundedPosition(position, snap);
  if (selection.kind === "key") { if (room.keyStart) { room.keyStart = p; normalizeCords(room); } return; }
  if (selection.kind === "goal") { if (room.goal) room.goal = p; return; }
  if (selection.kind === "cord") { const item = room.cords[selection.index]; if (item) { item.anchor = p; normalizeCord(room, selection.index); } return; }
  if (selection.kind === "ticket") { const item = room.tickets[selection.index]; if (item) item.position = p; return; }
  if (selection.kind === "prop") { const item = room.props[selection.index]; if (item) item.position = p; return; }
  const item = room.elements?.[selection.index];
  if (!item) return;
  if (item.kind === "reset-hazard") {
    item.bounds.x = clamp(p.x - item.bounds.width / 2, 0, BOARD_WIDTH - item.bounds.width);
    item.bounds.y = clamp(p.y - item.bounds.height / 2, 0, BOARD_HEIGHT - item.bounds.height);
  } else if (item.kind === "air-jet") {
    const dx = p.x - item.position.x, dy = p.y - item.position.y;
    item.position = p;
    item.zone.x = clamp(item.zone.x + dx, 0, BOARD_WIDTH - item.zone.width);
    item.zone.y = clamp(item.zone.y + dy, 0, BOARD_HEIGHT - item.zone.height);
  } else item.position = p;
}

export function rotateSelection(room: DraftRoom, selection: Selection, radians: number): void {
  if (!Number.isFinite(radians)) return;
  if (selection.kind === "prop") {
    const item = room.props[selection.index];
    if (item && item.kind !== "bumper") item.angle = item.kind === "bellows" ? fanStoredAngle(radians) : radians;
  } else if (selection.kind === "element") {
    const item = room.elements?.[selection.index];
    if (item?.kind === "air-jet") item.direction = { x: Math.cos(radians), y: Math.sin(radians) };
  }
}

export function setSelectionPower(room: DraftRoom, selection: Selection, power: number): void {
  if (!Number.isFinite(power) || selection.kind !== "prop") return;
  const item = room.props[selection.index];
  if (item?.kind === "bellows") item.power = clamp(power, 0.25, 3);
}

export function setSelectionLength(room: DraftRoom, selection: Selection, length: number): void {
  if (!Number.isFinite(length) || selection.kind !== "prop") return;
  const item = room.props[selection.index];
  if (item?.kind === "platform" || item?.kind === "wall") item.length = clamp(length, 40, 280);
}

export function removeSelection(room: DraftRoom, selection: Selection): void {
  if (selection.kind === "key") room.keyStart = null;
  else if (selection.kind === "goal") room.goal = null;
  else if (selection.kind === "cord") room.cords.splice(selection.index, 1);
  else if (selection.kind === "ticket") room.tickets.splice(selection.index, 1);
  else if (selection.kind === "prop") room.props.splice(selection.index, 1);
  else room.elements?.splice(selection.index, 1);
}

export function duplicateSelection(room: DraftRoom, selection: Selection): Selection | null {
  const offset = { x: 20, y: 20 };
  if (selection.kind === "key") return { kind: "key" };
  if (selection.kind === "goal") return { kind: "goal" };
  if (selection.kind === "cord") {
    const item = room.cords[selection.index]; if (!item) return null;
    const copy = clone(item); copy.id = nextId(room, "cord"); copy.anchor = add(copy.anchor, offset); room.cords.push(copy);
    normalizeCord(room, room.cords.length - 1);
    return { kind: "cord", index: room.cords.length - 1 };
  }
  if (selection.kind === "ticket") {
    const item = room.tickets[selection.index]; if (!item) return null;
    const copy = clone(item); copy.id = nextId(room, "ticket"); copy.position = add(copy.position, offset); room.tickets.push(copy);
    return { kind: "ticket", index: room.tickets.length - 1 };
  }
  if (selection.kind === "prop") {
    const item = room.props[selection.index]; if (!item) return null;
    const copy = clone(item); copy.position = add(copy.position, offset); room.props.push(copy);
    return { kind: "prop", index: room.props.length - 1 };
  }
  const item = room.elements?.[selection.index]; if (!item) return null;
  const copy = clone(item); copy.id = nextId(room, item.kind);
  if (copy.kind === "reset-hazard") { copy.bounds.x += offset.x; copy.bounds.y += offset.y; }
  else if (copy.kind === "air-jet") { copy.position = add(copy.position, offset); copy.zone.x += offset.x; copy.zone.y += offset.y; }
  else copy.position = add(copy.position, offset);
  (room.elements ??= []).push(copy);
  return { kind: "element", index: room.elements.length - 1 };
}

export function addPaletteObject(room: DraftRoom, kind: PaletteKind, at: Vec): Selection | null {
  const position = boundedPosition(at, false);
  if (kind === "key") { if (room.keyStart) return { kind: "key" }; room.keyStart = position; normalizeCords(room); return { kind: "key" }; }
  if (kind === "goal") { if (room.goal) return { kind: "goal" }; room.goal = position; return { kind: "goal" }; }
  if (kind === "anchor") {
    room.cords.push({ id: nextId(room, "cord"), anchor: position, length: 120, angle: 0 });
    normalizeCord(room, room.cords.length - 1);
    return { kind: "cord", index: room.cords.length - 1 };
  }
  if (kind === "ticket") {
    room.tickets.push({ id: nextId(room, "ticket"), position });
    return { kind: "ticket", index: room.tickets.length - 1 };
  }
  if (kind === "bumper" || kind === "platform" || kind === "wall" || kind === "bellows") {
    const prop: PropDefinition = {
      kind,
      position,
      radius: kind === "bumper" ? 32 : kind === "platform" || kind === "wall" ? 52 : 32,
      ...(kind === "bumper" ? {} : { angle: kind === "bellows" ? fanStoredAngle(0) : 0 }),
      ...(kind === "bellows" ? { power: 1 } : {}),
      ...(kind === "platform" || kind === "wall" ? { length: 104 } : {}),
    };
    room.props.push(prop);
    return { kind: "prop", index: room.props.length - 1 };
  }
  const elements = room.elements ??= [];
  let element: BubbleDefinition | AirJetDefinition | CounterweightDefinition | ResetHazardDefinition;
  if (kind === "bubble") element = { id: nextId(room, "bubble"), kind, position, captureRadius: 40, buoyancy: 0.003, popRadius: 60 };
  else if (kind === "air-jet") element = { id: nextId(room, "draft"), kind, position, zone: { x: clamp(position.x + 28, 0, 330), y: clamp(position.y - 90, 0, 620), width: 230, height: 180 }, direction: { x: 1, y: 0 }, strength: 0.00035, mode: "continuous", tapRadius: 44 };
  else if (kind === "counterweight") element = { id: nextId(room, "weight"), kind, position, radius: 25, mass: 1.5, restitution: 0.58 };
  else element = { id: nextId(room, "hazard"), kind, bounds: { x: clamp(position.x - 58, 0, 444), y: clamp(position.y - 14, 0, 772), width: 116, height: 28 }, reason: "The key reached a reset hazard." };
  elements.push(element);
  return { kind: "element", index: elements.length - 1 };
}

export function hitTest(room: DraftRoom, point: Vec): Selection | null {
  const candidates: Array<{ selection: Selection; position: Vec; radius: number; contains?: (point: Vec) => boolean }> = [];
  room.elements?.forEach((item, index) => candidates.push({
    selection: { kind: "element", index },
    position: item.kind === "reset-hazard" ? boundsCenter(item.bounds) : item.position,
    radius: item.kind === "bubble" ? item.captureRadius : item.kind === "counterweight" ? item.radius : 28,
    ...(item.kind === "reset-hazard" ? { contains: (candidate: Vec) => candidate.x >= item.bounds.x && candidate.x <= item.bounds.x + item.bounds.width && candidate.y >= item.bounds.y && candidate.y <= item.bounds.y + item.bounds.height } : {}),
  }));
  room.props.forEach((item, index) => candidates.push({
    selection: { kind: "prop", index }, position: item.position, radius: item.radius,
    ...(item.kind === "platform" || item.kind === "wall" ? { contains: (candidate: Vec) => inRotatedRectangle(candidate, item.position, item.length ?? 104, 20, item.angle ?? 0, 7) } : {}),
  }));
  room.tickets.forEach((item, index) => candidates.push({ selection: { kind: "ticket", index }, position: item.position, radius: 20 }));
  room.cords.forEach((item, index) => candidates.push({ selection: { kind: "cord", index }, position: item.anchor, radius: 18 }));
  if (room.goal) candidates.push({ selection: { kind: "goal" }, position: room.goal, radius: 38 });
  if (room.keyStart) candidates.push({ selection: { kind: "key" }, position: room.keyStart, radius: 28 });
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const item = candidates[index];
    if (item.contains ? item.contains(point) : Math.hypot(point.x - item.position.x, point.y - item.position.y) <= item.radius) return item.selection;
  }
  return null;
}

function propLabel(item: PropDefinition): string { return item.kind === "bumper" ? "Round bumper" : item.kind === "platform" ? "Bounce platform" : item.kind === "wall" ? "Wall" : "Fan"; }
function boundedPosition(position: Vec, snap: boolean): Vec {
  const x = snap ? Math.round(position.x / GRID_SIZE) * GRID_SIZE : position.x;
  const y = snap ? Math.round(position.y / GRID_SIZE) * GRID_SIZE : position.y;
  return { x: clamp(x, 0, BOARD_WIDTH), y: clamp(y, 0, BOARD_HEIGHT) };
}
function boundsCenter(bounds: { x: number; y: number; width: number; height: number }): Vec { return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }; }
function add(point: Vec, offset: Vec): Vec { return boundedPosition({ x: point.x + offset.x, y: point.y + offset.y }, false); }
function inRotatedRectangle(point: Vec, center: Vec, width: number, height: number, angle: number, padding: number): boolean {
  const dx = point.x - center.x, dy = point.y - center.y;
  const cosine = Math.cos(-angle), sine = Math.sin(-angle);
  const localX = dx * cosine - dy * sine, localY = dx * sine + dy * cosine;
  return Math.abs(localX) <= width / 2 + padding && Math.abs(localY) <= height / 2 + padding;
}
function nextId(room: DraftRoom, stem: string): string {
  const ids = new Set([...room.cords.map((item) => item.id), ...room.tickets.map((item) => item.id), ...(room.elements ?? []).map((item) => item.id)]);
  let suffix = 1, id = `${room.id}-${stem}-${suffix}`;
  while (ids.has(id)) { suffix += 1; id = `${room.id}-${stem}-${suffix}`; }
  return id;
}
