/** Shared authored geometry for the village renderer and its navigation layer. */
export interface TownPoint {
  x: number;
  z: number;
}

export interface TownTree extends TownPoint {
  /** Collision radius, including the low visible planting ring. */
  radius: number;
  variant?: number;
}

export interface TownBuilding extends TownPoint {
  width: number;
  depth: number;
  style?: "clubhouse" | "bookshop" | "bakery" | "cottage" | "greenhouse";
  /** Faces the open approach, in radians around the vertical axis. */
  facing?: number;
}

export const TOWN = {
  width: 30,
  depth: 24,
  /** Everything at and beyond this line is the uncrossable stream. */
  streamZ: 20,
  entry: { x: 15, z: 17 },
  fountain: { x: 15, z: 10, radius: 2 },
  // Kept away from the main south-to-plaza approach and its two side routes.
  trees: [
    { x: 1.6, z: 3.0, radius: 0.7, variant: 0 },
    { x: 4.1, z: 7.1, radius: 0.72, variant: 1 },
    { x: 2.0, z: 12.1, radius: 0.68, variant: 2 },
    { x: 5.0, z: 18.2, radius: 0.75, variant: 0 },
    { x: 9.0, z: 18.8, radius: 0.66, variant: 1 },
    { x: 21.0, z: 18.7, radius: 0.68, variant: 2 },
    { x: 25.0, z: 17.9, radius: 0.76, variant: 0 },
    { x: 28.0, z: 12.2, radius: 0.7, variant: 1 },
    { x: 25.9, z: 7.0, radius: 0.7, variant: 2 },
    { x: 28.1, z: 3.0, radius: 0.72, variant: 0 },
    { x: 9.0, z: 3.1, radius: 0.67, variant: 2 },
    { x: 20.8, z: 3.0, radius: 0.7, variant: 1 },
  ] satisfies TownTree[],
  buildings: [
    // The return home is deliberately just west of the entrance, with a broad front apron.
    { x: 5.0, z: 15.7, width: 4.2, depth: 2.8, style: "clubhouse", facing: 0 },
    { x: 4.2, z: 4.2, width: 4.7, depth: 3.0, style: "bookshop", facing: 0 },
    { x: 14.8, z: 2.6, width: 4.1, depth: 2.8, style: "bakery", facing: 0 },
    { x: 25.1, z: 4.4, width: 4.0, depth: 3.0, style: "greenhouse", facing: 0 },
    { x: 26.0, z: 15.0, width: 3.8, depth: 2.7, style: "cottage", facing: 0 },
  ] satisfies TownBuilding[],
} as const;

export type TownLayout = typeof TOWN;
