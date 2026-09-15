import type { PieceDefinition, YardDefinition } from "./types";
const box = (
  x: number,
  y: number,
  w: number,
  h: number,
  color = 0,
): PieceDefinition => ({
  ...{ w: 0, h: 0, color: 0 },
  kind: "box",
  x,
  y,
  w,
  h,
  color,
});
const plank = (x: number, y: number, w: number): PieceDefinition => ({
  ...{ w: 0, h: 0, color: 0 },
  kind: "plank",
  x,
  y,
  w,
  h: 18,
});
const bucket = (x: number, y: number): PieceDefinition => ({
  ...{ w: 0, h: 0, color: 0 },
  kind: "bucket",
  x,
  y,
  w: 60,
  h: 64,
});
const cushion = (x: number, y: number): PieceDefinition => ({
  ...{ w: 0, h: 0, color: 0 },
  kind: "cushion",
  x,
  y,
  w: 90,
  h: 32,
});
const toy = (x: number, y: number, color: number): PieceDefinition => ({
  ...{ w: 0, h: 0, color: 0 },
  kind: "target",
  x,
  y,
  r: 20,
  color,
});
export const yards: YardDefinition[] = [
  {
    id: "teeter",
    name: "The Teeter Tower",
    subtitle: "One little nudge. One big tumble.",
    pieces: [
      box(590, 548, 76, 104),
      box(760, 548, 76, 104, 1),
      plank(675, 487, 300),
      box(620, 433, 78, 90, 2),
      box(747, 433, 78, 90),
      plank(684, 379, 230),
      bucket(684, 338),
      toy(684, 286, 0),
      toy(558, 458, 1),
      toy(790, 350, 2),
      box(949, 558, 78, 84, 1),
      cushion(949, 500),
      bucket(949, 452),
      toy(949, 400, 3),
    ],
  },
  {
    id: "domino",
    name: "The Domino Picnic",
    subtitle: "Start a wobble. Follow the ripple.",
    pieces: [
      box(518, 535, 40, 130, 0),
      box(610, 535, 40, 130, 1),
      box(702, 535, 40, 130, 2),
      box(794, 535, 40, 130, 0),
      plank(565, 461, 164),
      toy(565, 432, 0),
      plank(752, 461, 164),
      bucket(752, 420),
      toy(752, 368, 1),
      box(917, 560, 86, 80, 1),
      box(1030, 560, 70, 80, 2),
      plank(977, 511, 208),
      cushion(969, 486),
      box(974, 427, 70, 86),
      toy(974, 364, 2),
      toy(1057, 482, 3),
    ],
  },
];
