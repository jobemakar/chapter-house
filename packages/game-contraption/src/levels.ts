import type { Level, Part, PartType } from "./types";
export const W = 1100,
  H = 660,
  STEP = 1 / 120;
export const kit: Record<
  PartType,
  { name: string; w: number; h: number; angle: number; color: string }
> = {
  ramp: { name: "Ramp", w: 180, h: 22, angle: 0.24, color: "#eac777" },
  belt: { name: "Conveyor", w: 180, h: 28, angle: 0, color: "#6fa7ac" },
  spring: { name: "Trampoline", w: 110, h: 38, angle: 0.25, color: "#dd806c" },
  fan: { name: "Fan", w: 58, h: 68, angle: -Math.PI / 2, color: "#7dafbc" },
  funnel: { name: "Funnel", w: 140, h: 100, angle: 0, color: "#dfb75d" },
  bumper: { name: "Bumper", w: 68, h: 68, angle: 0, color: "#aa8cbe" },
  wall: { name: "Bolted wall", w: 220, h: 28, angle: 0, color: "#8c9aa3" },
  switch: { name: "Legacy switch", w: 54, h: 44, angle: 0, color: "#d89065" },
  button: { name: "Corn button", w: 54, h: 44, angle: 0, color: "#d89065" },
  lever: { name: "Hand lever", w: 54, h: 64, angle: 0, color: "#6fa7ac" },
};
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));
export const part = (
  type: PartType,
  x: number,
  y: number,
  angle = kit[type].angle,
  id = `part-${crypto.randomUUID()}`,
): Part => ({
  id,
  type,
  x,
  y,
  angle,
  power: 1,
  flip: 1,
  locked: false,
  ...(type === "fan" ? { enabled: true } : {}),
  ...(type === "button" || type === "lever" ? { mode: "toggle" as const } : {}),
});
export function inventory(level: Level): Part[] {
  return [...level.initial.filter((p) => !p.locked), ...level.spares];
}
/** Restore authored identity/options; only position/angle and ordinary belt flip are player editable. */
export function normalizeLayout(level: Level, input: unknown): Part[] {
  const fixed = level.initial.filter((p) => p.locked),
    templates = inventory(level),
    seen = new Set<string>(),
    out: Part[] = [];
  for (const candidate of Array.isArray(input) ? input : []) {
    if (!candidate || typeof candidate !== "object") continue;
    const p = candidate as Part,
      authored = templates.find((q) => q.id === p.id);
    if (
      !authored ||
      authored.type !== p.type ||
      seen.has(p.id) ||
      ![p.x, p.y, p.angle].every(Number.isFinite)
    )
      continue;
    seen.add(p.id);
    out.push({
      ...clone(authored),
      x: clamp(p.x, 30, 1070),
      y: clamp(p.y, 35, 580),
      angle: p.angle,
      flip: p.flip === -1 ? -1 : authored.flip,
    });
  }
  return [...clone(fixed), ...out];
}
