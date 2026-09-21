import { TOWN } from "./layout";
import type { Point } from "../core/profile";
import { TownStream } from "./stream";
/** A bounded A* over the same obstacle geometry that TownArt draws. */
export class TownNavigation {
  /** Returns a lure point in the stream only while standing on a clear bank. */
  streamTarget(p: Point): Point | null {
    if (!this.walkable(p)) return null;
    const bankReach = 2.15;
    const bridgeClearance = TOWN.bridge.width / 2 + 0.9;
    if (Math.abs(p.x - TOWN.bridge.x) < bridgeClearance) return null;
    const bank = TownStream.bounds(p.x);
    const north = p.z >= bank.maxZ && p.z <= bank.maxZ + bankReach;
    const south = p.z <= bank.minZ && p.z >= bank.minZ - bankReach;
    if (!north && !south) return null;
    return {
      x: Math.max(0.8, Math.min(TOWN.width - 0.8, p.x)),
      z: north ? bank.maxZ - 0.65 : bank.minZ + 0.65,
    };
  }
  nearFountain(p: Point) {
    return (
      Math.hypot(p.x - TOWN.fountain.x, p.z - TOWN.fountain.z) <=
      TOWN.fountain.interactionRadius + Number.EPSILON * 32
    );
  }
  atPiratePortal(p: Point) {
    return Math.hypot(p.x - TOWN.piratePortal.x, p.z - TOWN.piratePortal.z) <= TOWN.piratePortal.radius;
  }

  walkable(p: Point) {
    const r = 0.3;
    const inStream = TownStream.contains(p, r);
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
      !(
        Math.abs(p.x - TOWN.waterfall.x) <
          TOWN.waterfall.terrainWidth / 2 + r &&
        p.z >
          TownStream.bank(TOWN.waterfall.x, -1) -
            TOWN.waterfall.terrainDepth -
            r &&
        p.z < TownStream.bank(TOWN.waterfall.x, -1) + 0.6 + r
      ) &&
      !(
        Math.abs(p.x - TOWN.windmill.x) < TOWN.windmill.width / 2 + r &&
        Math.abs(p.z - TOWN.windmill.z) < TOWN.windmill.depth / 2 + r
      ) &&
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
  /** A walkable roaming target that remains close enough to its avatar. */
  nearbyWanderTarget(origin: Point, angle: number, distance: number): Point {
    const boundedDistance = Math.max(0.7, Math.min(2.8, distance));
    const candidates = [0, Math.PI / 3, -Math.PI / 3, Math.PI].map((turn) => ({
      x: origin.x + Math.cos(angle + turn) * boundedDistance,
      z: origin.z + Math.sin(angle + turn) * boundedDistance,
    }));
    return candidates.find((candidate) => this.walkable(candidate)) ?? {
      ...origin,
    };
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
