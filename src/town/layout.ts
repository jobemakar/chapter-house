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
  // Doubling both dimensions makes the village four times the original area.
  width: 60,
  depth: 48,
  entry: { x: 30, z: 44 },
  fountain: { x: 30, z: 35, radius: 2, interactionRadius: 4.35 },
  stream: { minZ: 22, maxZ: 26 },
  bridge: { x: 30, z: 24, width: 3.8, depth: 5.2 },
  windmill: { x: 14, z: 33, width: 3.2, depth: 3.2 },
  gardenFountain: { x: 36.8, z: 37.8, radius: 1.45 },
  waterfall: { x: 7, width: 3, height: 2.4 },
  trees: [
    { x: 3.5, z: 4, radius: 0.65, variant: 0 },
    { x: 8, z: 3, radius: 0.65, variant: 1 },
    { x: 4.5, z: 10, radius: 0.65, variant: 2 },
    { x: 8, z: 17, radius: 0.6, variant: 0 },
    { x: 14, z: 6, radius: 0.6, variant: 1 },
    { x: 17, z: 15, radius: 0.65, variant: 0 },
    { x: 22, z: 3.5, radius: 0.6, variant: 2 },
    { x: 27, z: 11, radius: 0.6, variant: 0 },
    { x: 35.5, z: 6, radius: 0.65, variant: 1 },
    { x: 36, z: 18.3, radius: 0.6, variant: 0 },
    { x: 42.5, z: 14, radius: 0.65, variant: 2 },
    { x: 48, z: 4, radius: 0.65, variant: 0 },
    { x: 55, z: 8.5, radius: 0.65, variant: 1 },
    { x: 52, z: 18, radius: 0.6, variant: 0 },
    { x: 57, z: 16, radius: 0.6, variant: 2 },
    { x: 20.5, z: 20, radius: 0.55, variant: 1 },
    { x: 3.5, z: 30, radius: 0.65, variant: 1 },
    { x: 5.5, z: 38, radius: 0.65, variant: 0 },
    { x: 4, z: 45, radius: 0.65, variant: 2 },
    { x: 11, z: 28.5, radius: 0.6, variant: 0 },
    { x: 13.5, z: 44, radius: 0.65, variant: 1 },
    { x: 18, z: 27.5, radius: 0.6, variant: 2 },
    { x: 18, z: 42.5, radius: 0.6, variant: 0 },
    { x: 44, z: 28.5, radius: 0.6, variant: 1 },
    { x: 47.5, z: 42, radius: 0.65, variant: 2 },
    { x: 54, z: 29, radius: 0.65, variant: 0 },
    { x: 57, z: 37, radius: 0.65, variant: 1 },
    { x: 55, z: 45, radius: 0.65, variant: 0 },
    { x: 29, z: 46.5, radius: 0.55, variant: 2 },
    { x: 45, z: 46, radius: 0.6, variant: 1 },
  ] satisfies TownTree[],
  buildings: [
    { x: 22, z: 34, width: 5, depth: 4, style: "clubhouse", facing: 0 },
    { x: 39, z: 32.5, width: 3.8, depth: 3.2, style: "reading", facing: 0 },
    { x: 40, z: 41, width: 3.6, depth: 2.4, style: "garden", facing: 0 },
  ] satisfies TownBuilding[],
} as const;
export type TownLayout = typeof TOWN;
