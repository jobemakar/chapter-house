/** Authored scenery footprints are shared by rendering and navigation. */
export interface TownPoint {
  x: number;
  z: number;
}
export interface TownTree extends TownPoint {
  radius: number;
  variant?: number;
}
export interface TownBuilding extends TownPoint {
  width: number;
  depth: number;
  style: "clubhouse" | "reading" | "garden";
  facing?: number;
}
export const TOWN = {
  width: 30,
  depth: 24,
  streamZ: 20,
  entry: { x: 15, z: 17 },
  fountain: { x: 15, z: 10, radius: 2 },
  trees: [
    { x: 2, z: 2.6, radius: 0.65, variant: 0 },
    { x: 4.2, z: 1.8, radius: 0.65, variant: 1 },
    { x: 1.8, z: 7.2, radius: 0.65, variant: 0 },
    { x: 2.5, z: 12.8, radius: 0.6, variant: 2 },
    { x: 4.2, z: 17.7, radius: 0.6, variant: 0 },
    { x: 8.3, z: 18.3, radius: 0.55, variant: 1 },
    { x: 11, z: 2.6, radius: 0.6, variant: 0 },
    { x: 18.7, z: 2.4, radius: 0.6, variant: 2 },
    { x: 21.5, z: 1.7, radius: 0.6, variant: 0 },
    { x: 27.8, z: 3, radius: 0.65, variant: 1 },
    { x: 28, z: 9.7, radius: 0.65, variant: 0 },
    { x: 28, z: 16.7, radius: 0.6, variant: 2 },
    { x: 22, z: 18.2, radius: 0.6, variant: 1 },
  ] satisfies TownTree[],
  buildings: [
    { x: 7, z: 6, width: 5, depth: 4, style: "clubhouse", facing: 0 },
    { x: 24, z: 5.7, width: 3.8, depth: 3.2, style: "reading", facing: 0 },
    { x: 25, z: 14.7, width: 3.6, depth: 2.4, style: "garden", facing: 0 },
  ] satisfies TownBuilding[],
} as const;
export type TownLayout = typeof TOWN;
