import type { DeviceDefinition, PieceDefinition, YardDefinition } from "./types";

export const LEVEL_FILE_VERSION = 1 as const;

const MAX_LEVEL_ID_LENGTH = 80;
const MAX_OBJECT_ID_LENGTH = 100;
const MAX_NAME_LENGTH = 120;
const MAX_SUBTITLE_LENGTH = 500;
const MAX_WORLD_DIMENSION = 10_000;
const MIN_WORLD_DIMENSION = 320;
const MAX_COORDINATE_MAGNITUDE = 20_000;
const MAX_OBJECT_DIMENSION = 20_000;
const MAX_ANGLE_MAGNITUDE = Math.PI * 100;
const MAX_PIECES = 256;
const MAX_TERRAIN = 128;
const MAX_DEVICES = 128;
const MAX_LEVELS = 256;
const MAX_STABLE_ID = 1_000_000_000;
const LEVEL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OBJECT_ID = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/;
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const PIECE_KINDS = ["box", "plank", "bucket", "cushion", "target"] as const;
const DEVICE_KINDS = ["lever", "gate", "bellows", "button", "field"] as const;

export type AuthoredPiece = Omit<PieceDefinition, "id" | "angle"> & {
  id: number;
  angle: number;
};

export type TerrainDefinition = NonNullable<YardDefinition["terrain"]>[number];

export type DraftYard = {
  id: string;
  name: string;
  subtitle: string;
  /** The index used by version-two saves, or null for newly authored levels. */
  legacyIndex: number | null;
  world: { width: number; height: number };
  launcher: { x: number; y: number } | null;
  pieces: AuthoredPiece[];
  terrain: TerrainDefinition[];
  devices: DeviceDefinition[];
};

export type LevelFile = {
  version: 1;
  playtested: boolean;
  /** High-water mark: deleted piece IDs are never reused. */
  nextPieceId: number;
  yard: DraftYard;
};

export type LevelIndex = {
  version: 1;
  levels: string[];
};

export function isSafeLevelId(id: string): boolean {
  return id.length > 0
    && id.length <= MAX_LEVEL_ID_LENGTH
    && id !== "index"
    && !WINDOWS_RESERVED_NAME.test(id)
    && LEVEL_ID.test(id);
}

export function parseLevelFile(value: unknown): LevelFile {
  const file = record(value, "level file");
  literal(file.version, LEVEL_FILE_VERSION, "level file version");
  if (typeof file.playtested !== "boolean") fail("playtested must be a boolean");
  const yard = parseDraftYard(file.yard);
  const nextPieceId = safeInteger(file.nextPieceId, "nextPieceId", 0, MAX_STABLE_ID);
  const highestPieceId = yard.pieces.reduce((highest, piece) => Math.max(highest, piece.id), -1);
  if (nextPieceId <= highestPieceId) fail(`nextPieceId must be greater than every piece id (currently ${highestPieceId})`);
  return { version: LEVEL_FILE_VERSION, playtested: file.playtested, nextPieceId, yard };
}

export function parseLevelIndex(value: unknown): LevelIndex {
  const index = record(value, "level index");
  literal(index.version, LEVEL_FILE_VERSION, "level index version");
  if (!Array.isArray(index.levels)) fail("level index levels must be an array");
  if (index.levels.length > MAX_LEVELS) fail(`level index cannot contain more than ${MAX_LEVELS} levels`);
  const levels = index.levels.map((id, position) => levelId(id, `level index entry ${position + 1}`));
  if (new Set(levels).size !== levels.length) fail("level index cannot contain duplicate level ids");
  return { version: LEVEL_FILE_VERSION, levels };
}

/** Structural issues are kept separate so incomplete but safe drafts can be saved. */
export function levelIssues(file: LevelFile): string[] {
  let parsed: LevelFile;
  try {
    parsed = parseLevelFile(file);
  } catch (error) {
    return [error instanceof Error ? error.message : "Invalid Wishbone level data"];
  }
  const { yard } = parsed;
  const issues: string[] = [];
  if (!yard.name.trim()) issues.push("A level name is required.");
  if (yard.launcher === null) issues.push("Place one launcher.");
  if (!yard.pieces.some((piece) => piece.kind === "target")) issues.push("Place at least one toy.");

  if (yard.launcher) checkLauncher(issues, yard.launcher, yard.world);
  for (const piece of yard.pieces) checkPiece(issues, piece, yard.world);
  for (const terrain of yard.terrain) checkTerrain(issues, terrain, yard.world);
  for (const device of yard.devices) checkDevice(issues, device, yard.world);

  const devices = new Map(yard.devices.map((device) => [device.id, device]));
  for (const device of yard.devices) {
    if (device.kind !== "lever" && device.kind !== "button") continue;
    const expectedKind = device.kind === "lever" ? "gate" : "field";
    if (!device.targetId) {
      issues.push(`${label(device.kind)} ${device.id} must select a ${expectedKind}.`);
      continue;
    }
    const target = devices.get(device.targetId);
    if (!target) issues.push(`${label(device.kind)} ${device.id} targets missing device ${device.targetId}.`);
    else if (target.kind !== expectedKind) issues.push(`${label(device.kind)} ${device.id} must target a ${expectedKind}, not a ${target.kind}.`);
  }
  return issues;
}

export function playableYard(file: LevelFile): YardDefinition {
  const parsed = parseLevelFile(file);
  const issues = levelIssues(parsed);
  if (issues.length > 0) throw new Error(`Level ${parsed.yard.id} is not playable:\n${issues.join("\n")}`);
  const { yard } = parsed;
  if (yard.launcher === null) throw new Error(`Level ${yard.id} is not playable`);
  return {
    id: yard.id,
    name: yard.name,
    subtitle: yard.subtitle,
    ...(yard.legacyIndex === null ? {} : { legacyIndex: yard.legacyIndex }),
    revision: levelRevision(parsed),
    world: { ...yard.world },
    launcher: { ...yard.launcher },
    pieces: yard.pieces.map(clonePiece),
    terrain: yard.terrain.map((terrain) => ({ ...terrain })),
    deviceInstances: yard.devices.map((device) => ({ ...device })),
  };
}

/** Revision covers physics/layout only; copy edits and playtest metadata do not reset checkpoints. */
export function levelRevision(file: LevelFile): string {
  const { yard } = parseLevelFile(file);
  const physics = JSON.stringify({
    world: yard.world,
    launcher: yard.launcher,
    pieces: [...yard.pieces].sort((left, right) => left.id - right.id),
    terrain: [...yard.terrain].sort((left, right) => left.id.localeCompare(right.id)),
    devices: [...yard.devices].sort((left, right) => left.id.localeCompare(right.id)),
  });
  let hash = 0x811c9dc5;
  for (let index = 0; index < physics.length; index += 1) {
    hash ^= physics.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `v1-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function allocatePieceId(file: LevelFile): { id: number; file: LevelFile } {
  const parsed = parseLevelFile(file);
  if (parsed.nextPieceId >= MAX_STABLE_ID) throw new Error("No more stable piece IDs are available");
  return {
    id: parsed.nextPieceId,
    file: { ...parsed, nextPieceId: parsed.nextPieceId + 1 },
  };
}

export function copyLevelFile(source: LevelFile, id: string): LevelFile {
  const parsed = parseLevelFile(source);
  const safeId = levelId(id, "copied level id");
  const pieces = parsed.yard.pieces.map((piece, index) => ({ ...piece, id: index }));
  const remap = new Map<string, string>();
  let objectNumber = 1;
  const terrain = parsed.yard.terrain.map((item) => {
    const nextId = `terrain-${objectNumber++}`;
    remap.set(item.id, nextId);
    return { ...item, id: nextId };
  });
  const devices = parsed.yard.devices.map((item) => {
    const nextId = `${item.kind}-${objectNumber++}`;
    remap.set(item.id, nextId);
    return { ...item, id: nextId };
  }).map((item) => ({ ...item, ...(item.targetId ? { targetId: remap.get(item.targetId) ?? item.targetId } : {}) }));
  return {
    version: LEVEL_FILE_VERSION,
    playtested: false,
    nextPieceId: pieces.length,
    yard: { ...parsed.yard, id: safeId, legacyIndex: null, pieces, terrain, devices },
  };
}

function parseDraftYard(value: unknown): DraftYard {
  const yard = record(value, "yard");
  const world = parseWorld(yard.world);
  const pieces = array(yard.pieces, "pieces", MAX_PIECES, parsePiece);
  const terrain = array(yard.terrain, "terrain", MAX_TERRAIN, parseTerrain);
  const devices = array(yard.devices, "devices", MAX_DEVICES, parseDevice);
  unique(pieces.map((piece) => String(piece.id)), "piece ids");
  unique(terrain.map((item) => item.id), "terrain ids");
  unique(devices.map((item) => item.id), "device ids");
  unique([...terrain.map((item) => item.id), ...devices.map((item) => item.id)], "terrain and device ids");
  return {
    id: levelId(yard.id, "yard id"),
    name: text(yard.name, "yard name", MAX_NAME_LENGTH, true),
    subtitle: text(yard.subtitle, "yard subtitle", MAX_SUBTITLE_LENGTH, true),
    legacyIndex: yard.legacyIndex === null ? null : safeInteger(yard.legacyIndex, "legacyIndex", 0, MAX_LEVELS - 1),
    world,
    launcher: yard.launcher === null ? null : point(yard.launcher, "launcher"),
    pieces,
    terrain,
    devices,
  };
}

function parseWorld(value: unknown): { width: number; height: number } {
  const world = record(value, "world");
  return {
    width: boundedNumber(world.width, "world width", MIN_WORLD_DIMENSION, MAX_WORLD_DIMENSION),
    height: boundedNumber(world.height, "world height", MIN_WORLD_DIMENSION, MAX_WORLD_DIMENSION),
  };
}

function parsePiece(value: unknown, index: number): AuthoredPiece {
  const piece = record(value, `piece ${index + 1}`);
  const kind = oneOf(piece.kind, PIECE_KINDS, `piece ${index + 1} kind`);
  const radius = piece.r === undefined ? undefined : positive(piece.r, `piece ${index + 1} radius`, MAX_OBJECT_DIMENSION);
  if (kind === "target" && radius === undefined) fail(`piece ${index + 1} target radius is required`);
  if (kind !== "target" && radius !== undefined) fail(`piece ${index + 1} radius is only valid for target pieces`);
  return {
    id: safeInteger(piece.id, `piece ${index + 1} id`, 0, MAX_STABLE_ID),
    kind,
    x: coordinate(piece.x, `piece ${index + 1}.x`),
    y: coordinate(piece.y, `piece ${index + 1}.y`),
    w: kind === "target" ? boundedNumber(piece.w, `piece ${index + 1}.w`, 0, MAX_OBJECT_DIMENSION) : positive(piece.w, `piece ${index + 1}.w`, MAX_OBJECT_DIMENSION),
    h: kind === "target" ? boundedNumber(piece.h, `piece ${index + 1}.h`, 0, MAX_OBJECT_DIMENSION) : positive(piece.h, `piece ${index + 1}.h`, MAX_OBJECT_DIMENSION),
    ...(radius === undefined ? {} : { r: radius }),
    color: safeInteger(piece.color, `piece ${index + 1} color`, 0, 255),
    angle: angle(piece.angle, `piece ${index + 1} angle`),
  };
}

function parseTerrain(value: unknown, index: number): TerrainDefinition {
  const terrain = record(value, `terrain ${index + 1}`);
  return {
    id: objectId(terrain.id, `terrain ${index + 1} id`),
    x: coordinate(terrain.x, `terrain ${index + 1}.x`),
    y: coordinate(terrain.y, `terrain ${index + 1}.y`),
    w: positive(terrain.w, `terrain ${index + 1}.w`, MAX_OBJECT_DIMENSION),
    h: positive(terrain.h, `terrain ${index + 1}.h`, MAX_OBJECT_DIMENSION),
    angle: angle(terrain.angle, `terrain ${index + 1} angle`),
  };
}

function parseDevice(value: unknown, index: number): DeviceDefinition {
  const device = record(value, `device ${index + 1}`);
  const kind = oneOf(device.kind, DEVICE_KINDS, `device ${index + 1} kind`);
  const parsed: DeviceDefinition = {
    id: objectId(device.id, `device ${index + 1} id`),
    kind,
    x: coordinate(device.x, `device ${index + 1}.x`),
    y: coordinate(device.y, `device ${index + 1}.y`),
  };
  if (device.angle !== undefined) parsed.angle = angle(device.angle, `device ${index + 1} angle`);
  if (device.targetId !== undefined) parsed.targetId = objectId(device.targetId, `device ${index + 1} targetId`);
  if (device.r !== undefined) parsed.r = positive(device.r, `device ${index + 1} radius`, MAX_OBJECT_DIMENSION);
  if (kind === "field" && parsed.r === undefined) fail(`device ${index + 1} field radius is required`);
  return parsed;
}

function checkPiece(issues: string[], piece: AuthoredPiece, world: DraftYard["world"]): void {
  const cosine = Math.abs(Math.cos(piece.angle));
  const sine = Math.abs(Math.sin(piece.angle));
  const halfWidth = piece.kind === "target" ? piece.r ?? 0 : cosine * piece.w / 2 + sine * piece.h / 2;
  const halfHeight = piece.kind === "target" ? piece.r ?? 0 : sine * piece.w / 2 + cosine * piece.h / 2;
  if (piece.x - halfWidth < 0 || piece.x + halfWidth > world.width || piece.y - halfHeight < 0 || piece.y + halfHeight > world.height) {
    issues.push(`${label(piece.kind)} piece ${piece.id} must fit inside the ${world.width} by ${world.height} world.`);
  }
}

function checkLauncher(issues: string[], launcher: { x: number; y: number }, world: DraftYard["world"]): void {
  // The authored origin owns the sling, automatic support and returning plush.
  // These extents match their complete production-renderer/physics union.
  if (launcher.x - 62 < 0 || launcher.x + 115 > world.width || launcher.y - 98 < 0 || launcher.y + 96 > world.height) {
    issues.push(`Launcher and its automatic support must fit inside the ${world.width} by ${world.height} world.`);
  }
}

function checkTerrain(issues: string[], terrain: TerrainDefinition, world: DraftYard["world"]): void {
  // The classic floor deliberately overhangs the side walls; its center still
  // has to be authored in-world and every dimension remains parser-bounded.
  checkPoint(issues, `Terrain ${terrain.id}`, terrain, world);
}

function checkDevice(issues: string[], device: DeviceDefinition, world: DraftYard["world"]): void {
  checkPoint(issues, `${label(device.kind)} ${device.id}`, device, world);
}

function checkPoint(issues: string[], name: string, value: { x: number; y: number }, world: DraftYard["world"]): void {
  if (value.x < 0 || value.x > world.width || value.y < 0 || value.y > world.height) {
    issues.push(`${name} must be inside the ${world.width} by ${world.height} world.`);
  }
}

function clonePiece(piece: AuthoredPiece): PieceDefinition {
  return { ...piece };
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(`${name} must be an object`);
  return value as Record<string, unknown>;
}

function array<T>(value: unknown, name: string, maximum: number, parser: (item: unknown, index: number) => T): T[] {
  if (!Array.isArray(value)) fail(`${name} must be an array`);
  if (value.length > maximum) fail(`${name} cannot contain more than ${maximum} items`);
  return value.map(parser);
}

function point(value: unknown, name: string): { x: number; y: number } {
  const parsed = record(value, name);
  return { x: coordinate(parsed.x, `${name}.x`), y: coordinate(parsed.y, `${name}.y`) };
}

function coordinate(value: unknown, name: string): number {
  return boundedNumber(value, name, -MAX_COORDINATE_MAGNITUDE, MAX_COORDINATE_MAGNITUDE);
}

function angle(value: unknown, name: string): number {
  return boundedNumber(value, name, -MAX_ANGLE_MAGNITUDE, MAX_ANGLE_MAGNITUDE);
}

function positive(value: unknown, name: string, maximum: number): number {
  return boundedNumber(value, name, 1, maximum);
}

function boundedNumber(value: unknown, name: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    fail(`${name} must be a finite number from ${minimum} to ${maximum}`);
  }
  return value;
}

function safeInteger(value: unknown, name: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    fail(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function levelId(value: unknown, name: string): string {
  if (typeof value !== "string" || !isSafeLevelId(value)) {
    fail(`${name} must use 1-${MAX_LEVEL_ID_LENGTH} lowercase letters, numbers, or single hyphens and cannot be "index"`);
  }
  return value;
}

function objectId(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length > MAX_OBJECT_ID_LENGTH || !OBJECT_ID.test(value)) {
    fail(`${name} must be a safe identifier of at most ${MAX_OBJECT_ID_LENGTH} characters`);
  }
  return value;
}

function text(value: unknown, name: string, maximum: number, allowEmpty: boolean): string {
  if (typeof value !== "string" || value.length > maximum || (!allowEmpty && !value.trim())) {
    fail(`${name} must be ${allowEmpty ? "a" : "a non-empty"} string of at most ${maximum} characters`);
  }
  return value;
}

function oneOf<const T extends readonly string[]>(value: unknown, choices: T, name: string): T[number] {
  if (typeof value !== "string" || !choices.includes(value)) fail(`${name} must be one of: ${choices.join(", ")}`);
  return value as T[number];
}

function literal<const T extends string | number>(value: unknown, expected: T, name: string): asserts value is T {
  if (value !== expected) fail(`${name} must be ${JSON.stringify(expected)}`);
}

function unique(values: string[], name: string): void {
  if (new Set(values).size !== values.length) fail(`${name} must be unique`);
}

function label(value: string): string {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function fail(message: string): never {
  throw new Error(`Invalid Wishbone level data: ${message}`);
}
