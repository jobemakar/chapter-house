import type {
  AirJetDefinition,
  Bounds,
  BubbleDefinition,
  CordDefinition,
  CounterweightDefinition,
  PropDefinition,
  ResetHazardDefinition,
  RoomDefinition,
  RoomSource,
  TicketDefinition,
  Vec,
  WorldElementDefinition,
} from "./types";

export const LEVEL_FILE_VERSION = 1 as const;
export const LEVEL_WIDTH = 560;
export const LEVEL_HEIGHT = 800;

const MAX_LEVEL_ID_LENGTH = 80;
const MAX_OBJECT_ID_LENGTH = 100;
const MAX_COORDINATE_MAGNITUDE = 10_000;
const MAX_DIMENSION = 10_000;
const MAX_ANGLE_MAGNITUDE = Math.PI * 100;
const MAX_CORDS = 32;
const MAX_TICKETS = 64;
const MAX_PROPS = 64;
const MAX_ELEMENTS = 128;
const MAX_OBJECTS = 256;
const LEVEL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OBJECT_ID = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/;
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export type DraftRoom = Omit<RoomDefinition, "keyStart" | "goal"> & {
  keyStart: Vec | null;
  goal: Vec | null;
};

export type LevelFile = {
  version: 1;
  room: DraftRoom;
  playtested: boolean;
};

export type LevelIndex = {
  version: 1;
  levels: string[];
};

export function isSafeLevelId(id: string): boolean {
  return id.length > 0 && id.length <= MAX_LEVEL_ID_LENGTH && id !== "index" && !WINDOWS_RESERVED_NAME.test(id) && LEVEL_ID.test(id);
}

export function parseLevelFile(value: unknown): LevelFile {
  const file = record(value, "level file");
  literal(file.version, LEVEL_FILE_VERSION, "level file version");
  if (typeof file.playtested !== "boolean") fail("playtested must be a boolean");
  return {
    version: LEVEL_FILE_VERSION,
    room: parseDraftRoom(file.room),
    playtested: file.playtested,
  };
}

export function parseLevelIndex(value: unknown): LevelIndex {
  const index = record(value, "level index");
  literal(index.version, LEVEL_FILE_VERSION, "level index version");
  if (!Array.isArray(index.levels)) fail("level index levels must be an array");
  if (index.levels.length > MAX_OBJECTS) fail(`level index cannot contain more than ${MAX_OBJECTS} levels`);
  const levels = index.levels.map((id, position) => levelId(id, `level index entry ${position + 1}`));
  if (new Set(levels).size !== levels.length) fail("level index cannot contain duplicate level ids");
  return { version: LEVEL_FILE_VERSION, levels };
}

export function levelIssues(file: LevelFile): string[] {
  let parsed: LevelFile;
  try {
    parsed = parseLevelFile(file);
  } catch (error) {
    return [error instanceof Error ? error.message : "Invalid Keyfall level data"];
  }
  const { room } = parsed;
  const issues: string[] = [];
  if (!room.title.trim()) issues.push("A title is required.");
  if (room.wing === "prototype" && room.source.kind !== "keyfall-prototype") issues.push("Prototype rooms require keyfall-prototype source metadata.");
  if (room.wing === "campaign" && room.source.kind === "keyfall-prototype") issues.push("Campaign rooms require original or mlgrope source metadata.");
  if (room.source.kind === "mlgrope-mit-adaptation" && room.wing !== "campaign") issues.push("Mlgrope adaptations belong in the campaign wing.");
  if (room.keyStart === null) issues.push("Place one key.");
  if (room.goal === null) issues.push("Place one keyhole.");
  if (room.tickets.length !== 3) issues.push(`Place exactly three tickets (currently ${room.tickets.length}).`);

  if (room.keyStart) checkPoint(issues, "Key", room.keyStart);
  if (room.goal) checkPoint(issues, "Keyhole", room.goal);
  for (const cord of room.cords) checkPoint(issues, `Cord ${cord.id} anchor`, cord.anchor);
  for (const ticket of room.tickets) checkPoint(issues, `Ticket ${ticket.id}`, ticket.position);
  for (const [index, prop] of room.props.entries()) checkPoint(issues, `${label(prop.kind)} ${index + 1}`, prop.position);
  for (const element of room.elements ?? []) {
    if (element.kind === "reset-hazard") {
      checkBounds(issues, `Hazard ${element.id}`, element.bounds);
    } else if (element.kind === "air-jet") {
      checkPoint(issues, `Air jet ${element.id}`, element.position);
      checkBounds(issues, `Air jet ${element.id} zone`, element.zone);
    } else {
      checkPoint(issues, `${label(element.kind)} ${element.id}`, element.position);
    }
  }
  return issues;
}

export function playableRoom(file: LevelFile): RoomDefinition {
  const issues = levelIssues(file);
  if (issues.length > 0) throw new Error(`Level ${file.room.id} is not playable:\n${issues.join("\n")}`);
  const { keyStart, goal } = file.room;
  if (keyStart === null || goal === null) throw new Error(`Level ${file.room.id} is not playable`);
  return { ...file.room, keyStart: { ...keyStart }, goal: { ...goal } };
}

function parseDraftRoom(value: unknown): DraftRoom {
  const room = record(value, "room");
  const id = levelId(room.id, "room id");
  const title = text(room.title, "room title", 120, true);
  const subtitle = text(room.subtitle, "room subtitle", 500, true);
  const wing = oneOf(room.wing, ["campaign", "prototype"] as const, "room wing");
  const kind = oneOf(room.kind, ["drop", "pendulum", "bellows"] as const, "room kind");
  const keyStart = nullableVec(room.keyStart, "keyStart");
  const goal = nullableVec(room.goal, "goal");
  const cords = array(room.cords, "cords", MAX_CORDS, parseCord);
  const tickets = array(room.tickets, "tickets", MAX_TICKETS, parseTicket);
  const props = array(room.props, "props", MAX_PROPS, parseProp);
  const elements = room.elements === undefined
    ? undefined
    : array(room.elements, "elements", MAX_ELEMENTS, parseElement);
  const objectCount = cords.length + tickets.length + props.length + (elements?.length ?? 0);
  if (objectCount > MAX_OBJECTS) fail(`room cannot contain more than ${MAX_OBJECTS} objects`);
  const ids = [...cords.map(({ id: objectId }) => objectId), ...tickets.map(({ id: objectId }) => objectId), ...(elements ?? []).map(({ id: objectId }) => objectId)];
  if (new Set(ids).size !== ids.length) fail("cord, ticket, and element ids must be unique within a room");
  const parsed: DraftRoom = { id, title, subtitle, wing, source: parseSource(room.source), kind, keyStart, cords, tickets, goal, props };
  if (elements !== undefined) parsed.elements = elements;
  return parsed;
}

function parseSource(value: unknown): RoomSource {
  const source = record(value, "room source");
  if (source.kind === "original") return { kind: "original" };
  if (source.kind === "keyfall-prototype") return { kind: "keyfall-prototype" };
  if (source.kind !== "mlgrope-mit-adaptation") fail("room source kind is invalid");
  literal(source.repository, "https://github.com/emersion/mlgrope", "mlgrope repository");
  literal(source.commit, "1c398f18dfb5977fb1f7fcb8a671584a102f406a", "mlgrope commit");
  const path = oneOf(source.path, ["levels/0.csv", "levels/1.csv"] as const, "mlgrope source path");
  literal(source.license, "MIT", "mlgrope license");
  return {
    kind: "mlgrope-mit-adaptation",
    repository: "https://github.com/emersion/mlgrope",
    commit: "1c398f18dfb5977fb1f7fcb8a671584a102f406a",
    path,
    license: "MIT",
  };
}

function parseCord(value: unknown, index: number): CordDefinition {
  const cord = record(value, `cord ${index + 1}`);
  return {
    id: objectId(cord.id, `cord ${index + 1} id`),
    anchor: vec(cord.anchor, `cord ${index + 1} anchor`),
    length: positive(cord.length, `cord ${index + 1} length`, MAX_DIMENSION),
    angle: boundedNumber(cord.angle, `cord ${index + 1} angle`, -MAX_ANGLE_MAGNITUDE, MAX_ANGLE_MAGNITUDE),
  };
}

function parseTicket(value: unknown, index: number): TicketDefinition {
  const ticket = record(value, `ticket ${index + 1}`);
  return { id: objectId(ticket.id, `ticket ${index + 1} id`), position: vec(ticket.position, `ticket ${index + 1} position`) };
}

function parseProp(value: unknown, index: number): PropDefinition {
  const prop = record(value, `prop ${index + 1}`);
  const angle = prop.angle === undefined ? undefined : boundedNumber(prop.angle, `prop ${index + 1} angle`, -MAX_ANGLE_MAGNITUDE, MAX_ANGLE_MAGNITUDE);
  return {
    kind: oneOf(prop.kind, ["bumper", "bellows", "platform", "wall"] as const, `prop ${index + 1} kind`),
    position: vec(prop.position, `prop ${index + 1} position`),
    radius: positive(prop.radius, `prop ${index + 1} radius`, 1_000),
    ...(angle === undefined ? {} : { angle }),
    ...(prop.power === undefined ? {} : { power: boundedNumber(prop.power, `prop ${index + 1} power`, 0.25, 3) }),
    ...(prop.length === undefined ? {} : { length: boundedNumber(prop.length, `prop ${index + 1} length`, 40, 280) }),
  };
}

function parseElement(value: unknown, index: number): WorldElementDefinition {
  const element = record(value, `element ${index + 1}`);
  if (element.kind === "bubble") return parseBubble(element, index);
  if (element.kind === "air-jet") return parseAirJet(element, index);
  if (element.kind === "counterweight") return parseCounterweight(element, index);
  if (element.kind === "reset-hazard") return parseResetHazard(element, index);
  return fail(`element ${index + 1} kind is invalid`);
}

function parseBubble(value: Record<string, unknown>, index: number): BubbleDefinition {
  const name = `bubble ${index + 1}`;
  return {
    id: objectId(value.id, `${name} id`),
    kind: "bubble",
    position: vec(value.position, `${name} position`),
    captureRadius: positive(value.captureRadius, `${name} captureRadius`, 1_000),
    buoyancy: positive(value.buoyancy, `${name} buoyancy`, 1),
    popRadius: positive(value.popRadius, `${name} popRadius`, 1_000),
  };
}

function parseAirJet(value: Record<string, unknown>, index: number): AirJetDefinition {
  const name = `air jet ${index + 1}`;
  const direction = vec(value.direction, `${name} direction`);
  if (Math.hypot(direction.x, direction.y) === 0) fail(`${name} direction cannot be zero`);
  return {
    id: objectId(value.id, `${name} id`),
    kind: "air-jet",
    position: vec(value.position, `${name} position`),
    zone: bounds(value.zone, `${name} zone`),
    direction,
    strength: positive(value.strength, `${name} strength`, 1),
    mode: oneOf(value.mode, ["continuous", "tap"] as const, `${name} mode`),
    tapRadius: positive(value.tapRadius, `${name} tapRadius`, 1_000),
  };
}

function parseCounterweight(value: Record<string, unknown>, index: number): CounterweightDefinition {
  const name = `counterweight ${index + 1}`;
  return {
    id: objectId(value.id, `${name} id`),
    kind: "counterweight",
    position: vec(value.position, `${name} position`),
    radius: positive(value.radius, `${name} radius`, 1_000),
    mass: positive(value.mass, `${name} mass`, 1_000),
    restitution: boundedNumber(value.restitution, `${name} restitution`, 0, 10),
  };
}

function parseResetHazard(value: Record<string, unknown>, index: number): ResetHazardDefinition {
  const name = `hazard ${index + 1}`;
  return {
    id: objectId(value.id, `${name} id`),
    kind: "reset-hazard",
    bounds: bounds(value.bounds, `${name} bounds`),
    reason: text(value.reason, `${name} reason`, 300, false),
  };
}

function nullableVec(value: unknown, name: string): Vec | null {
  return value === null ? null : vec(value, name);
}

function vec(value: unknown, name: string): Vec {
  const point = record(value, name);
  return {
    x: boundedNumber(point.x, `${name}.x`, -MAX_COORDINATE_MAGNITUDE, MAX_COORDINATE_MAGNITUDE),
    y: boundedNumber(point.y, `${name}.y`, -MAX_COORDINATE_MAGNITUDE, MAX_COORDINATE_MAGNITUDE),
  };
}

function bounds(value: unknown, name: string): Bounds {
  const area = record(value, name);
  return {
    x: boundedNumber(area.x, `${name}.x`, -MAX_COORDINATE_MAGNITUDE, MAX_COORDINATE_MAGNITUDE),
    y: boundedNumber(area.y, `${name}.y`, -MAX_COORDINATE_MAGNITUDE, MAX_COORDINATE_MAGNITUDE),
    width: positive(area.width, `${name}.width`, MAX_DIMENSION),
    height: positive(area.height, `${name}.height`, MAX_DIMENSION),
  };
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

function positive(value: unknown, name: string, maximum: number): number {
  return boundedNumber(value, name, Number.MIN_VALUE, maximum);
}

function boundedNumber(value: unknown, name: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    fail(`${name} must be a finite number from ${minimum} to ${maximum}`);
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

function checkPoint(issues: string[], name: string, point: Vec): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > LEVEL_WIDTH || point.y < 0 || point.y > LEVEL_HEIGHT) {
    issues.push(`${name} must be inside the ${LEVEL_WIDTH} by ${LEVEL_HEIGHT} playfield.`);
  }
}

function checkBounds(issues: string[], name: string, area: Bounds): void {
  const valid = Number.isFinite(area.x) && Number.isFinite(area.y) && Number.isFinite(area.width) && Number.isFinite(area.height)
    && area.width > 0 && area.height > 0 && area.x >= 0 && area.y >= 0
    && area.x + area.width <= LEVEL_WIDTH && area.y + area.height <= LEVEL_HEIGHT;
  if (!valid) issues.push(`${name} must fit inside the ${LEVEL_WIDTH} by ${LEVEL_HEIGHT} playfield.`);
}

function label(value: string): string {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function fail(message: string): never {
  throw new Error(`Invalid Keyfall level data: ${message}`);
}
