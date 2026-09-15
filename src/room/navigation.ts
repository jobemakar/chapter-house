import { getFurniture } from "../core/catalog";
import type { Point, OwnedItem, Placement } from "../core/profile";
export const ROOM = {
  width: 10,
  depth: 8,
  entry: { x: 5, z: 7.4 },
  step: 0.25,
  margin: 0.3,
};
export interface Footprint {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
}
export function footprint(
  item: OwnedItem,
  placement = item.placement,
): Footprint | null {
  const d = getFurniture(item.definitionId);
  if (!d || !placement) return null;
  const rotated = placement.rotation % 2 === 1;
  return {
    x: placement.x,
    z: placement.z,
    halfX: (rotated ? d.depth : d.width) / 2,
    halfZ: (rotated ? d.width : d.depth) / 2,
  };
}
export class RoomNavigation {
  constructor(private items: OwnedItem[]) {}
  walkable(p: Point, radius = 0.24): boolean {
    return (
      p.x >= ROOM.margin &&
      p.z >= ROOM.margin &&
      p.x <= ROOM.width - ROOM.margin &&
      p.z <= ROOM.depth - ROOM.margin &&
      !this.items.some((item) => {
        const f = footprint(item);
        return (
          f &&
          Math.abs(p.x - f.x) < f.halfX + radius &&
          Math.abs(p.z - f.z) < f.halfZ + radius
        );
      })
    );
  }
  /** Grid A* with no diagonal corner cutting. Endpoints are real world coordinates. */
  path(start: Point, end: Point): Point[] {
    if (!this.walkable(end)) return [];
    const step = ROOM.step;
    const key = (x: number, z: number) => `${x},${z}`;
    const sx = Math.round(start.x / step),
      sz = Math.round(start.z / step),
      ex = Math.round(end.x / step),
      ez = Math.round(end.z / step);
    const open = [{ x: sx, z: sz, g: 0, f: 0 }],
      previous = new Map<string, string>(),
      cost = new Map<string, number>([[key(sx, sz), 0]]),
      closed = new Set<string>();
    let finish = "";
    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const n = open.shift()!,
        k = key(n.x, n.z);
      if (closed.has(k)) continue;
      closed.add(k);
      if (n.x === ex && n.z === ez) {
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
        if (!this.walkable(p)) continue;
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
    // Join the real click to the final approach instead of adding a tiny sideways
    // grid-to-click leg. Keep the corner waypoint when that join is obstructed.
    if (path.length) {
      const from = path.length > 1 ? path[path.length - 2] : start;
      const samples = Math.max(
        1,
        Math.ceil(Math.hypot(end.x - from.x, end.z - from.z) / 0.04),
      );
      let clear = true;
      for (let i = 1; i <= samples; i++) {
        if (
          !this.walkable({
            x: from.x + ((end.x - from.x) * i) / samples,
            z: from.z + ((end.z - from.z) * i) / samples,
          })
        ) {
          clear = false;
          break;
        }
      }
      if (clear) path.pop();
    }
    path.push({ ...end });
    return path;
  }
  validate(
    item: OwnedItem,
    placement: Placement,
    actors: Point[],
  ): string | null {
    const f = footprint(item, placement)!;
    if (
      f.x - f.halfX < 0.12 ||
      f.z - f.halfZ < 0.12 ||
      f.x + f.halfX > ROOM.width - 0.12 ||
      f.z + f.halfZ > ROOM.depth - 0.12
    )
      return "Keep the whole item inside the room.";
    if (
      this.items.some((other) => {
        if (other.id === item.id) return false;
        const o = footprint(other);
        return (
          o &&
          Math.abs(f.x - o.x) < f.halfX + o.halfX + 0.06 &&
          Math.abs(f.z - o.z) < f.halfZ + o.halfZ + 0.06
        );
      })
    )
      return "Give your furniture a little breathing room.";
    if (
      [...actors, ROOM.entry].some(
        (p) =>
          Math.abs(p.x - f.x) < f.halfX + 0.32 &&
          Math.abs(p.z - f.z) < f.halfZ + 0.32,
      )
    )
      return "That spot is occupied. Try a little to the side.";
    const updated = this.items.map((i) =>
      i.id === item.id ? { ...i, placement } : i,
    );
    const nav = new RoomNavigation(updated);
    if (actors.some((p) => !nav.path(p, ROOM.entry).length))
      return "Leave a path back to the entrance.";
    return null;
  }
}
