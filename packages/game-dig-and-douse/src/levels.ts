import type { LevelDefinition } from "./types";

const paintedHillside: LevelDefinition = {
  id: "painted-hillside",
  name: "The forest relay",
  required: 100,
  floor: 14.7,
  reservoir: {
    left: 3.55,
    right: 8.25,
    height: 3.25,
    centerX: 5.9,
    centerY: 1.65,
    halfW: 2.05,
    halfH: 1.25,
  },
  soil: [
    [
      [0, 3.25],
      [12, 3.25],
      [12, 14.7],
      [7.25, 14.7],
      [6.9, 14.15],
      [0, 14.15],
    ].map(([x, y]) => ({ x, y })),
  ],
  protected: [
    { x: 0, y: 3.2, w: 0.3, h: 11.5 },
    { x: 11.7, y: 3.2, w: 0.3, h: 11.5 },
  ],
  pockets: [
    { x: 5.65, y: 12.65, w: 1, h: 1.15 },
    { x: 7.25, y: 11.45, w: 4.75, h: 3.55 },
  ],
  rocks: [
    { x: 1.05, y: 5.25, w: 2.15, h: 1.55, inset: 0.12 },
    { x: 6.45, y: 5.05, w: 2.4, h: 1.45, inset: 0.12 },
    { x: 2.4, y: 8.25, w: 2.15, h: 1.6, inset: 0.12 },
    { x: 6.75, y: 9.35, w: 2.35, h: 1.5, inset: 0.12 },
  ],
  fixtures: [
    { x: 6.55, y: 12.55, w: 0.7, h: 1.35 },
    { x: 9.55, y: 7.05, w: 1.1, h: 2.15 },
    { x: 7.25, y: 11.45, w: 4.75, h: 3.25 },
  ],
  canteens: [
    { x: 5.15, y: 4.65 },
    { x: 4.6, y: 7.35 },
    { x: 5.15, y: 10.65 },
  ],
  intakes: [
    {
      id: "hose",
      x: 7.05,
      y: 13.25,
      facing: "left",
      dummy: false,
      sensor: { x: 6.15, y: 13.35, r: 0.34 },
      pull: {
        x: 4.5,
        y: 11.55,
        w: 2.75,
        h: 2.35,
        targetX: 6.15,
        targetY: 13.35,
        strength: 1.05,
        maxSpeed: 10,
      },
    },
    { id: "sealed", x: 10.1, y: 8.15, facing: "up", dummy: true, sealed: true },
  ],
  hint: [
    [5.9, 3.15],
    [5.15, 4.65],
    [4.6, 7.35],
    [5.8, 8.6],
    [5.15, 10.65],
    [5.65, 12.1],
    [5.8, 13.18],
    [6.12, 13.28],
  ],
  target: { x: 7.25, y: 11.45, w: 4.75, h: 3.2 },
  fire: { x: 9.7, y: 13.75 },
  hose: { x: 10.35, y: 12.65 },
};

/** The ordered catalog is the single extension point for future authored levels. */
export const LEVELS: readonly LevelDefinition[] = [paintedHillside];
export const DEFAULT_LEVEL_ID = paintedHillside.id;
export function getLevel(id = DEFAULT_LEVEL_ID): LevelDefinition {
  const level = LEVELS.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown Wildfire level: ${id}`);
  return level;
}
export function getNextLevel(id: string): LevelDefinition | undefined {
  const index = LEVELS.findIndex((candidate) => candidate.id === id);
  return index >= 0 ? LEVELS[index + 1] : undefined;
}
