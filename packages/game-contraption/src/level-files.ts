import { clone, kit, part } from "./levels";
import type { Level, Part, PartType } from "./types";

export interface LevelFile {
  version: 1;
  level: Level;
}
export interface LevelIndex {
  version: 1;
  levels: string[];
}
export const isSafeLevelId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[a-z][a-z0-9-]{0,63}$/.test(id) &&
  id !== "index" &&
  !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(id);
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Expected an object");
  return v as Record<string, unknown>;
}
function num(v: unknown, name: string, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    throw new Error(`${name} must be between ${min} and ${max}`);
  return v;
}
function str(v: unknown, name: string, max = 160): string {
  if (typeof v !== "string" || v.length > max)
    throw new Error(`${name} must be text up to ${max} characters`);
  return v;
}
function id(v: unknown): string {
  if (!isSafeLevelId(v)) throw new Error("Invalid stable ID");
  return v;
}
function point(v: unknown) {
  const o = record(v);
  return { x: num(o.x, "X", 0, 1100), y: num(o.y, "Y", 0, 600) };
}
function parts(v: unknown): Part[] {
  if (!Array.isArray(v) || v.length > 96)
    throw new Error("Use at most 96 pieces");
  return v.map((raw) => {
    const o = record(raw),
      type = o.type as PartType;
    if (!Object.prototype.hasOwnProperty.call(kit, type))
      throw new Error("Unknown piece type");
    if (o.locked !== undefined && typeof o.locked !== "boolean")
      throw new Error("Fixed must be a boolean");
    const p: Part = {
      id: id(o.id),
      type,
      ...point(o),
      angle: num(o.angle, "Angle", -Math.PI * 20, Math.PI * 20),
      power: 1,
      flip: o.flip === -1 ? -1 : 1,
      locked: o.locked === true,
    };
    if (o.power !== 1) throw new Error("Device strength must remain 1");
    if (o.flip !== 1 && o.flip !== -1)
      throw new Error("Direction must be -1 or 1");
    if (type === "fan") {
      if (o.enabled !== undefined && typeof o.enabled !== "boolean")
        throw new Error("Fan state must be on/off");
      p.enabled = o.enabled !== false;
    }
    if (type === "button" || type === "lever") {
      if (o.mode !== "toggle" && o.mode !== "latch")
        throw new Error("Choose toggle or latch");
      p.mode = o.mode;
      if (o.targetId !== undefined && o.targetId !== "")
        p.targetId = id(o.targetId);
    }
    if (type === "switch") {
      if (!Array.isArray(o.targets) || o.targets.length > 96)
        throw new Error("Invalid legacy links");
      p.targets = o.targets.map(id);
      p.direction = num(o.direction, "Legacy direction", -1, 1);
    }
    return p;
  });
}
export function parseLevelFile(raw: unknown): LevelFile {
  const outer = record(raw);
  if (outer.version !== 1) throw new Error("Unsupported level version");
  const o = record(outer.level);
  if (!Array.isArray(o.sources) || o.sources.length > 12)
    throw new Error("Use at most 12 inlets");
  const level: Level = {
    id: id(o.id),
    name: str(o.name, "Name", 80),
    tag: str(o.tag, "Instructions", 300),
    sources: o.sources.map((s) => ({
      ...point(s),
      vx: num(record(s).vx, "Inlet velocity", -100, 100),
    })),
    period: num(o.period, "Release interval", 0.15, 5),
    bowl: point(o.bowl),
    initial: parts(o.initial),
    spares: parts(o.spares),
  };
  if (o.legacy !== undefined) {
    const l = record(o.legacy);
    level.legacy = {
      solution: parts(l.solution),
      hint: str(l.hint, "Legacy hint", 400),
    };
  }
  if ([...level.initial, ...level.spares].length > 96)
    throw new Error("Use at most 96 total pieces and spares");
  const ids = [...level.initial, ...level.spares].map((p) => p.id);
  if (new Set(ids).size !== ids.length)
    throw new Error("Piece IDs must be unique");
  if (level.spares.some((p) => p.locked))
    throw new Error("Spare pieces cannot be fixed");
  if (!level.legacy && level.sources.some((s) => s.vx !== 0))
    throw new Error("New inlets must drop straight down");
  if (
    !level.legacy &&
    [...level.initial, ...level.spares].some((p) => p.type === "switch")
  )
    throw new Error("Use buttons or levers for new levels");
  return { version: 1, level };
}
export function parseLevelIndex(raw: unknown): LevelIndex {
  const o = record(raw);
  if (o.version !== 1 || !Array.isArray(o.levels) || o.levels.length > 1000)
    throw new Error("Invalid playable list");
  const levels = o.levels.map(id);
  if (new Set(levels).size !== levels.length)
    throw new Error("Duplicate level in playable list");
  return { version: 1, levels };
}
export function levelIssues(file: LevelFile): string[] {
  let level: Level;
  try {
    level = parseLevelFile(file).level;
  } catch (e) {
    return [e instanceof Error ? e.message : String(e)];
  }
  const issues: string[] = [];
  if (!level.name.trim()) issues.push("Give the level a name");
  if (!level.sources.length) issues.push("Add at least one inlet");
  if (
    level.bowl.x < 70 ||
    level.bowl.x > 1030 ||
    level.bowl.y < 65 ||
    level.bowl.y > 550
  )
    issues.push("Keep the bowl fully inside the board (X 70–1030, Y 65–550)");
  if (
    level.sources.some((s) => s.x < 85 || s.x > 1020 || s.y < 95 || s.y > 580)
  )
    issues.push("Keep inlets inside the board (X 85–1020, Y 95–580)");
  const all = [...level.initial, ...level.spares];
  for (const p of all) {
    if (p.type === "button" || p.type === "lever") {
      const target = all.find((q) => q.id === p.targetId);
      if (!target || !["belt", "fan"].includes(target.type))
        issues.push(`${kit[p.type].name} ${p.id}: choose one conveyor or fan`);
    } else if (
      p.type === "switch" &&
      p.targets?.some((t) => !all.some((q) => q.id === t && q.type === "belt"))
    )
      issues.push(`Legacy switch ${p.id} has a missing conveyor`);
  }
  return issues;
}
export function blankLevel(): LevelFile {
  return {
    version: 1,
    level: {
      id: `level-${crypto.randomUUID()}`,
      name: "New machine",
      tag: "",
      sources: [{ x: 180, y: 100, vx: 0 }],
      bowl: { x: 850, y: 550 },
      period: 0.6,
      initial: [],
      spares: [],
    },
  };
}
export function copyLevel(file: LevelFile): LevelFile {
  const copy = clone(file),
    l = copy.level;
  l.id = `level-${crypto.randomUUID()}`;
  l.name = `${l.name.slice(0, 70)} copy`;
  const ids = new Map(
    [...l.initial, ...l.spares].map((p) => [p.id, part(p.type, p.x, p.y).id]),
  );
  const remap = (p: Part) => {
    p.id = ids.get(p.id) ?? part(p.type, p.x, p.y).id;
    if (p.targetId) p.targetId = ids.get(p.targetId) ?? p.targetId;
    if (p.targets) p.targets = p.targets.map((t) => ids.get(t) ?? t);
  };
  [...l.initial, ...l.spares].forEach(remap);
  l.legacy?.solution.forEach(remap);
  return copy;
}
/** Order-insensitive piece fingerprint; metadata does not invalidate player layouts. */
export function fingerprint(level: Level): string {
  const canonical = JSON.stringify({
    sources: level.sources,
    period: level.period,
    bowl: level.bowl,
    initial: [...level.initial].sort((a, b) => a.id.localeCompare(b.id)),
    spares: [...level.spares].sort((a, b) => a.id.localeCompare(b.id)),
  });
  let h = 2166136261;
  for (let i = 0; i < canonical.length; i++)
    h = Math.imul(h ^ canonical.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}
