import type { TownPoint } from "./layout";

export interface PirateObstacle extends TownPoint {
  width: number;
  depth: number;
}

export interface PirateShipPlacement extends TownPoint {
  turn: number;
  scale: number;
}

export const PIRATE_AREA_SCALE = Math.SQRT2;
const SOURCE_CENTER = { x: 15, z: 12 } as const;
export const PIRATE_CENTER = { x: 21, z: 17 } as const;

export function pirateExpandedPoint(x: number, z: number): TownPoint {
  return {
    x: PIRATE_CENTER.x + (x - SOURCE_CENTER.x) * PIRATE_AREA_SCALE,
    z: PIRATE_CENTER.z + (z - SOURCE_CENTER.z) * PIRATE_AREA_SCALE,
  };
}

/** One shoreline shared by art and navigation, scaled to exactly twice its former area. */
const SOURCE_COAST = [
  { x: 5, z: 4.2 },
  { x: 9, z: 2.8 },
  { x: 13.5, z: 3.4 },
  { x: 17.8, z: 2.7 },
  { x: 22.6, z: 4.1 },
  { x: 26.1, z: 7 },
  { x: 26.8, z: 11.5 },
  { x: 25.3, z: 15.8 },
  { x: 26, z: 18.7 },
  { x: 22.2, z: 21 },
  { x: 17.2, z: 21.4 },
  { x: 14.8, z: 22.2 },
  { x: 10.1, z: 21 },
  { x: 6, z: 19.4 },
  { x: 3.6, z: 16 },
  { x: 4, z: 12 },
  { x: 3.1, z: 8.1 },
] as const satisfies readonly TownPoint[];

export const PIRATE_COAST = SOURCE_COAST.map(({ x, z }) =>
  pirateExpandedPoint(x, z),
);

const obstacle = (
  x: number,
  z: number,
  width: number,
  depth: number,
): PirateObstacle => ({
  ...pirateExpandedPoint(x, z),
  width: width * PIRATE_AREA_SCALE,
  depth: depth * PIRATE_AREA_SCALE,
});

const ship = (
  x: number,
  z: number,
  turn: number,
  scale: number,
): PirateShipPlacement => ({
  ...pirateExpandedPoint(x, z),
  turn,
  scale,
});

/** A small, self-contained exploration island: about half Willowbrook's area. */
export const PIRATE_ISLAND = {
  width: 42,
  depth: 34,
  center: PIRATE_CENTER,
  entry: pirateExpandedPoint(15, 18.8),
  shoreline: 0.65,
  dock: {
    ...pirateExpandedPoint(15, 20.2),
    width: 4.2 * PIRATE_AREA_SCALE,
    depth: 3.8 * PIRATE_AREA_SCALE,
  },
  obstacles: [
    obstacle(8.3, 8.4, 3.8, 3.6),
    obstacle(8.5, 15.5, 5.4, 2.5),
    obstacle(17, 6, 2.6, 2.5),
    obstacle(21.2, 10.5, 2.6, 2.6),
    obstacle(22.5, 16, 3, 3),
    obstacle(15, 15.9, 2.5, 2.1),
  ] satisfies PirateObstacle[],
  ships: [
    ship(4, 2.2, 0.45, 1),
    ship(29, 12, Math.PI / 2 + 0.15, 0.78),
  ] satisfies PirateShipPlacement[],
} as const;

export type PirateIslandLayout = typeof PIRATE_ISLAND;

/** Point-in-polygon plus a radius-sized coast buffer for actors. */
export function pirateLandContains(point: TownPoint, margin = 0) {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false;
  let inside = false;
  let nearest = Number.POSITIVE_INFINITY;
  for (
    let index = 0, previous = PIRATE_COAST.length - 1;
    index < PIRATE_COAST.length;
    previous = index++
  ) {
    const a = PIRATE_COAST[previous];
    const b = PIRATE_COAST[index];
    if (
      a.z > point.z !== b.z > point.z &&
      point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x
    )
      inside = !inside;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const lengthSquared = dx * dx + dz * dz;
    const amount =
      lengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSquared,
            ),
          );
    nearest = Math.min(
      nearest,
      Math.hypot(point.x - (a.x + dx * amount), point.z - (a.z + dz * amount)),
    );
  }
  return inside && nearest >= margin;
}
