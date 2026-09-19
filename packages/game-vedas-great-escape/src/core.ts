export type Direction = "up" | "right" | "down" | "left";

export interface LevelDefinition {
  title: string;
  tip: string;
  map: readonly string[];
}

export interface PuzzleState {
  player: number;
  boxes: number[];
  walls: number[];
  targets: number[];
  fruit: number[];
  exit: number;
  moves: number;
  taken: number;
  pushed: boolean;
}

export const WIDTH = 9;
export const HEIGHT = 7;
export const DIRECTIONS: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
};

export const LEVELS: readonly LevelDefinition[] = [
  { title: "An elephant-sized entrance", tip: "Push the crate right onto the golden switch. Then head for the flag.", map: ["#########", "#.......#", "#...p...#", "#.E.C.TX#", "#.......#", "#.......#", "#########"] },
  { title: "Room to turn", tip: "You’ll need to get around the crate. Corners are trickier than they look.", map: ["#########", "#...#..X#", "#.p.#.T.#", "#...C...#", "#..E#...#", "#.......#", "#########"] },
  { title: "Two’s a crowd", tip: "Two crates, two switches. Make room before you commit.", map: ["#########", "#.....TX#", "#..C....#", "#.#.#...#", "#..C..T.#", "#E.p....#", "#########"] },
  { title: "The long way round", tip: "The short route isn’t always the right one. Keep a way behind each crate.", map: ["#########", "#..T#..X#", "#.......#", "#.C.#.T.#", "#...C...#", "#E..#p..#", "#########"] },
  { title: "The last gate home", tip: "Three switches stand between Veda and her new home. You’ve got this.", map: ["#########", "#T....TX#", "#..C....#", "#..#C#..#", "#..C....#", "#Ep...T.#", "#########"] },
];

const key = (x: number, y: number): number => y * WIDTH + x;

export function parseLevel(level: LevelDefinition): PuzzleState {
  const state: PuzzleState = { player: 0, boxes: [], walls: [], targets: [], fruit: [], exit: 0, moves: 0, taken: 0, pushed: false };
  level.map.forEach((row, y) => [...row].forEach((value, x) => {
    const position = key(x, y);
    if (value === "#") state.walls.push(position);
    if (value === "E") state.player = position;
    if (value === "C") state.boxes.push(position);
    if (value === "T") state.targets.push(position);
    if (value === "p") state.fruit.push(position);
    if (value === "X") state.exit = position;
  }));
  return state;
}

export const isOpen = (state: PuzzleState): boolean => state.targets.every((target) => state.boxes.includes(target));

export function step(state: PuzzleState, direction: Direction): PuzzleState | null {
  const [dx, dy] = DIRECTIONS[direction];
  const x = state.player % WIDTH + dx;
  const y = Math.floor(state.player / WIDTH) + dy;
  const next = key(x, y);
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || state.walls.includes(next) || (next === state.exit && !isOpen(state))) return null;
  const boxes = [...state.boxes];
  let pushed = false;
  if (boxes.includes(next)) {
    const boxX = x + dx;
    const boxY = y + dy;
    const boxNext = key(boxX, boxY);
    if (boxX < 0 || boxX >= WIDTH || boxY < 0 || boxY >= HEIGHT || state.walls.includes(boxNext) || boxes.includes(boxNext) || boxNext === state.exit) return null;
    boxes[boxes.indexOf(next)] = boxNext;
    pushed = true;
  }
  const ateFruit = state.fruit.includes(next);
  return { ...state, player: next, boxes, fruit: state.fruit.filter((fruit) => fruit !== next), moves: state.moves + 1, taken: state.taken + (ateFruit ? 1 : 0), pushed };
}

export function solve(initial: PuzzleState): Direction[] | null {
  const queue: Array<{ state: PuzzleState; path: Direction[] }> = [{ state: initial, path: [] }];
  const identity = (state: PuzzleState) => `${state.player}|${[...state.boxes].sort((a, b) => a - b).join(",")}`;
  const seen = new Set([identity(initial)]);
  for (let index = 0; index < queue.length && index < 140_000; index += 1) {
    const current = queue[index]!;
    if (current.state.player === current.state.exit && isOpen(current.state)) return current.path;
    for (const direction of Object.keys(DIRECTIONS) as Direction[]) {
      const next = step(current.state, direction);
      if (!next) continue;
      const id = identity(next);
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push({ state: next, path: [...current.path, direction] });
    }
  }
  return null;
}
