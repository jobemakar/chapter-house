import type { Point } from "../core/profile";
import { pirateLandContains, PIRATE_ISLAND } from "./pirate-layout";

/** Bounded A* surface for the sand island; sea and landmark footprints are solid. */
export class PirateNavigation {
  walkable(p: Point) {
    const r = 0.3;
    return (
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      pirateLandContains(p, PIRATE_ISLAND.shoreline + r) &&
      !PIRATE_ISLAND.obstacles.some(
        (obstacle) =>
          Math.abs(p.x - obstacle.x) < obstacle.width / 2 + r &&
          Math.abs(p.z - obstacle.z) < obstacle.depth / 2 + r,
      )
    );
  }

  companionTarget(origin: Point, facing: number): Point {
    const right = { x: Math.cos(facing), z: -Math.sin(facing) };
    const forward = { x: Math.sin(facing), z: Math.cos(facing) };
    const candidates = [
      { x: origin.x + right.x, z: origin.z + right.z },
      { x: origin.x - right.x, z: origin.z - right.z },
      { x: origin.x - forward.x, z: origin.z - forward.z },
    ];
    return (
      candidates.find((candidate) => this.walkable(candidate)) ?? {
        ...origin,
      }
    );
  }

  path(start: Point, end: Point): Point[] {
    if (!this.walkable(end)) return [];
    if (this.clear(start, end)) return [{ ...end }];
    const step = 0.4;
    const key = (x: number, z: number) => `${x},${z}`;
    const sx = Math.round(start.x / step),
      sz = Math.round(start.z / step);
    const ex = Math.round(end.x / step),
      ez = Math.round(end.z / step);
    const open = [{ x: sx, z: sz, g: 0, f: 0 }];
    const cost = new Map([[key(sx, sz), 0]]);
    const previous = new Map<string, string>();
    const closed = new Set<string>();
    let finish = "";
    while (open.length && closed.size < 12000) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift()!;
      const currentKey = key(current.x, current.z);
      if (closed.has(currentKey)) continue;
      closed.add(currentKey);
      if (
        Math.hypot(current.x * step - end.x, current.z * step - end.z) <=
          step * 2 &&
        this.clear({ x: current.x * step, z: current.z * step }, end)
      ) {
        finish = currentKey;
        break;
      }
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const point = {
          x: (current.x + dx) * step,
          z: (current.z + dz) * step,
        };
        const from =
          currentKey === key(sx, sz)
            ? start
            : { x: current.x * step, z: current.z * step };
        if (!this.walkable(point) || !this.clear(from, point)) continue;
        if (
          dx &&
          dz &&
          (!this.walkable({ x: current.x * step, z: point.z }) ||
            !this.walkable({ x: point.x, z: current.z * step }))
        )
          continue;
        const nextKey = key(current.x + dx, current.z + dz);
        const g = current.g + Math.hypot(dx, dz);
        if (g >= (cost.get(nextKey) ?? Infinity)) continue;
        cost.set(nextKey, g);
        previous.set(nextKey, currentKey);
        open.push({
          x: current.x + dx,
          z: current.z + dz,
          g,
          f: g + Math.hypot(ex - current.x - dx, ez - current.z - dz),
        });
      }
    }
    if (!finish) return [];
    const path: Point[] = [];
    while (finish !== key(sx, sz)) {
      const [x, z] = finish.split(",").map(Number);
      path.push({ x: x * step, z: z * step });
      finish = previous.get(finish)!;
    }
    path.reverse();
    path.push({ ...end });
    return path;
  }

  private clear(a: Point, b: Point) {
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1),
    );
    for (let i = 1; i <= steps; i++)
      if (
        !this.walkable({
          x: a.x + ((b.x - a.x) * i) / steps,
          z: a.z + ((b.z - a.z) * i) / steps,
        })
      )
        return false;
    return true;
  }
}
