import { TOWN } from "./layout";
import type { Point } from "../core/profile";
/** A bounded A* over the same obstacle geometry that TownArt draws. */
export class TownNavigation {
  nearFountain(p: Point) {
    return (
      Math.hypot(p.x - TOWN.fountain.x, p.z - TOWN.fountain.z) <=
      TOWN.fountain.interactionRadius + Number.EPSILON * 32
    );
  }

  walkable(p: Point) {
    const r = 0.3;
    const inStream = p.z > TOWN.stream.minZ - r && p.z < TOWN.stream.maxZ + r;
    const onBridge =
      Math.abs(p.x - TOWN.bridge.x) <= TOWN.bridge.width / 2 - r &&
      p.z > TOWN.stream.minZ - r &&
      p.z < TOWN.stream.maxZ + r;
    return (
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      p.x >= r &&
      p.x <= TOWN.width - r &&
      p.z >= r &&
      p.z <= TOWN.depth - r &&
      (!inStream || onBridge) &&
      Math.hypot(p.x - TOWN.fountain.x, p.z - TOWN.fountain.z) >=
        TOWN.fountain.radius + r &&
      !TOWN.trees.some(
        (t) => Math.hypot(p.x - t.x, p.z - t.z) < t.radius + r,
      ) &&
      !TOWN.buildings.some(
        (b) =>
          Math.abs(p.x - b.x) < b.width / 2 + r &&
          Math.abs(p.z - b.z) < b.depth / 2 + r,
      )
    );
  }

  /** Prefer a walkable shoulder position so the companion never settles on the avatar. */
  companionTarget(origin: Point, facing: number): Point {
    const right = { x: Math.cos(facing), z: -Math.sin(facing) };
    const forward = { x: Math.sin(facing), z: Math.cos(facing) };
    const candidates = [
      { x: origin.x + right.x, z: origin.z + right.z },
      { x: origin.x - right.x, z: origin.z - right.z },
      {
        x: origin.x - forward.x * 0.85 + right.x * 0.5,
        z: origin.z - forward.z * 0.85 + right.z * 0.5,
      },
      { x: origin.x - forward.x, z: origin.z - forward.z },
    ];
    return (
      candidates.find((candidate) => this.walkable(candidate)) ?? {
        ...origin,
      }
    );
  }
  private clear(a: Point, b: Point) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1));
    for (let i = 1; i <= n; i++)
      if (
        !this.walkable({
          x: a.x + ((b.x - a.x) * i) / n,
          z: a.z + ((b.z - a.z) * i) / n,
        })
      )
        return false;
    return true;
  }
  path(start: Point, end: Point): Point[] {
    if (!this.walkable(end)) return [];
    if (this.clear(start, end)) return [{ ...end }];
    const step = 0.4,
      key = (x: number, z: number) => `${x},${z}`;
    const sx = Math.round(start.x / step),
      sz = Math.round(start.z / step),
      ex = Math.round(end.x / step),
      ez = Math.round(end.z / step);
    const open = [{ x: sx, z: sz, g: 0, f: 0 }],
      cost = new Map([[key(sx, sz), 0]]),
      previous = new Map<string, string>(),
      closed = new Set<string>();
    let finish = "";
    while (open.length && closed.size < 30000) {
      open.sort((a, b) => a.f - b.f);
      const n = open.shift()!,
        k = key(n.x, n.z);
      if (closed.has(k)) continue;
      closed.add(k);
      if (
        Math.hypot(n.x * step - end.x, n.z * step - end.z) <= step * 2 &&
        this.clear({ x: n.x * step, z: n.z * step }, end)
      ) {
        finish = k;
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
        const x = n.x + dx,
          z = n.z + dz,
          p = { x: x * step, z: z * step };
        const from =
          k === key(sx, sz) ? start : { x: n.x * step, z: n.z * step };
        if (!this.walkable(p) || !this.clear(from, p)) continue;
        if (
          dx &&
          dz &&
          (!this.walkable({ x: n.x * step, z: p.z }) ||
            !this.walkable({ x: p.x, z: n.z * step }))
        )
          continue;
        const nk = key(x, z),
          g = n.g + Math.hypot(dx, dz);
        if (g >= (cost.get(nk) ?? Infinity)) continue;
        cost.set(nk, g);
        previous.set(nk, k);
        open.push({ x, z, g, f: g + Math.hypot(ex - x, ez - z) });
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
    if (!this.clear(path.at(-1) ?? start, end)) return [];
    path.push({ ...end });
    return path;
  }
}
