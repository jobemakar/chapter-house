/** Pure Gummy Nook match-three simulation. Values 0-4 are candies; 10-29 add a power. */
export type Candy = number;
export type Board = Candy[];
export type PowerKind = 0 | 1 | 2 | 3 | 4;
export type Random = () => number;
export interface Activation { at: number; kind: PowerKind; }
export interface Fall { from: number; to: number; tier: Candy; }
export type Phase =
  | { kind: "swap"; from: number; to: number; before: Board; after: Board }
  | { kind: "clear"; before: Board; cells: number[]; depth: number; activated: Activation[] }
  | { kind: "fall"; before: Array<Candy | null>; after: Board; falls: Fall[] }
  | { kind: "shuffle"; before: Board; after: Board };
export interface GameState { version: 2; board: Board; discovered: number[]; cleared: number; moves: number; bestCascade: number; owned: string[]; settings: GummySettings; }
export interface GummySettings { muted: boolean; music: boolean; motion: boolean; gloss: boolean; }
export interface SwapResult { ok: boolean; reason?: "neighbor" | "no-match"; phases: Phase[]; cleared?: number; depth?: number; refreshed?: boolean; }

export const LEGACY_REWARDS = ["gn-candy-jar", "gn-gummy-lamp", "gn-sock-cushion", "gn-bear-beanbag"] as const;
export const REWARD_THRESHOLDS = [0, 12, 40, 100] as const;

export class GummyBoard {
  static readonly size = 6;
  static readonly count = 36;
  static readonly names = ["Dewdrop", "Peach heart", "Mint star", "Sunny flower", "Berry butterfly", "Cloud bunny", "Golden bear"];
  static readonly colors = ["#57cbb3", "#fa8e9e", "#82c4ee", "#ffc561", "#ba9ae7", "#f6b8cf", "#f0b744"];
  static readonly powerNames = ["", "Row Ribbon", "Column Ribbon", "Sugar Burst", "Frost Flake"];

  static base(value: Candy | null): Candy | null { return value === null ? null : value % 5; }
  static power(value: Candy): PowerKind { return value >= 10 ? (Math.floor(value / 5) - 1) as PowerKind : 0; }
  static valid(value: unknown): value is Candy { return Number.isInteger(value) && ((value as number >= 0 && value as number < 5) || (value as number >= 10 && value as number < 30)); }
  static adjacent(a: number, b: number): boolean {
    return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a < 36 && b < 36 && a !== b && Math.max(Math.abs(Math.floor(a / 6) - Math.floor(b / 6)), Math.abs(a % 6 - b % 6)) === 1;
  }
  static matches(board: Array<Candy | null>): number[] {
    const found = new Set<number>();
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
      const index = row * 6 + col, candy = this.base(board[index]);
      if (candy === null) continue;
      if (col <= 3 && candy === this.base(board[index + 1]) && candy === this.base(board[index + 2])) for (let x = col; x < 6 && this.base(board[row * 6 + x]) === candy; x++) found.add(row * 6 + x);
      if (row <= 3 && candy === this.base(board[index + 6]) && candy === this.base(board[index + 12])) for (let y = row; y < 6 && this.base(board[y * 6 + col]) === candy; y++) found.add(y * 6 + col);
    }
    return [...found].sort((a, b) => a - b);
  }
  static legalMoves(board: Board): Array<[number, number]> {
    const moves: Array<[number, number]> = [];
    for (let a = 0; a < 36; a++) for (const b of [a + 1, a + 5, a + 6, a + 7]) {
      if (!this.adjacent(a, b)) continue;
      if (this.power(board[a]) || this.power(board[b])) { moves.push([a, b]); continue; }
      if (board[a] === board[b]) continue;
      const copy = [...board]; [copy[a], copy[b]] = [copy[b], copy[a]];
      if (this.matches(copy).length) moves.push([a, b]);
    }
    return moves;
  }
  static fresh(random: Random = Math.random): GameState { return { version: 2, board: this.newBoard(random), discovered: [0, 1, 2, 3, 4], cleared: 0, moves: 0, bestCascade: 0, owned: [LEGACY_REWARDS[0]], settings: { muted: false, music: true, motion: true, gloss: true } }; }
  static newBoard(random: Random = Math.random): Board {
    for (let attempt = 0; attempt < 50; attempt++) {
      const board: Board = [];
      for (let index = 0; index < 36; index++) {
        const options = [0, 1, 2, 3, 4].filter(value => !(index % 6 >= 2 && board[index - 1] === value && board[index - 2] === value) && !(index >= 12 && board[index - 6] === value && board[index - 12] === value));
        board.push(options[Math.min(options.length - 1, Math.max(0, Math.floor(random() * options.length)))]);
      }
      if (this.legalMoves(board).length) return board;
    }
    return [0,1,0,3,4,2,2,0,3,4,1,2,1,3,4,0,2,1,3,4,1,2,0,3,4,2,0,1,3,4,2,0,1,3,4,2];
  }
  static mix(board: Board, random: Random = Math.random): Board {
    const next = this.newBoard(random), powers = board.filter(value => this.power(value));
    powers.forEach((value, index) => { next[index] = this.base(next[index])! + (this.power(value) + 1) * 5; });
    return next;
  }
  static synchronize(state: GameState): void {
    state.discovered = [...new Set([...state.discovered, 0, 1, 2, 3, 4, ...(state.cleared >= 40 ? [5] : []), ...(state.cleared >= 100 ? [6] : [])])].sort((a, b) => a - b);
    state.owned = [...new Set([...state.owned, ...LEGACY_REWARDS.filter((_, index) => state.cleared >= REWARD_THRESHOLDS[index])])];
  }
  static expandPowers(board: Board, cells: number[]): { cells: number[]; activated: Activation[] } {
    const cleared = new Set(cells), activated: Activation[] = [];
    for (const index of cleared) {
      const kind = this.power(board[index]); if (!kind) continue;
      activated.push({ at: index, kind }); const row = Math.floor(index / 6), col = index % 6;
      for (let candidate = 0; candidate < 36; candidate++) { const r = Math.floor(candidate / 6), c = candidate % 6;
        if ((kind === 1 && r === row) || (kind === 2 && c === col) || (kind === 3 && Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) || (kind === 4 && Math.abs(r - row) === Math.abs(c - col))) cleared.add(candidate);
      }
    }
    return { cells: [...cleared], activated };
  }
  static collapse(board: Board, cells: number[], random: Random = Math.random): { board: Board; falls: Fall[] } {
    const next = [...board], removed = new Set(cells), falls: Fall[] = [];
    for (let col = 0; col < 6; col++) { let destination = 5;
      for (let row = 5; row >= 0; row--) { const from = row * 6 + col; if (removed.has(from)) continue; const to = destination-- * 6 + col; next[to] = board[from]; if (from !== to) falls.push({ from, to, tier: board[from] }); }
      const missing = destination + 1;
      while (destination >= 0) { const to = destination * 6 + col, tier = Math.min(4, Math.floor(random() * 5)); next[to] = tier; falls.push({ from: (destination - missing) * 6 + col, to, tier }); destination--; }
    }
    return { board: next, falls };
  }
  static swap(state: GameState, a: number, b: number, random: Random = Math.random): SwapResult {
    if (!this.adjacent(a, b)) return { ok: false, reason: "neighbor", phases: [] };
    const original = [...state.board], swapped = [...original]; [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    const phases: Phase[] = [{ kind: "swap", from: a, to: b, before: original, after: swapped }]; let found = this.matches(swapped);
    if (this.power(swapped[a]) || this.power(swapped[b])) found = [...new Set([...found, a, b])];
    if (!found.length) { phases.push({ kind: "swap", from: a, to: b, before: swapped, after: original }); return { ok: false, reason: "no-match", phases }; }
    let board = swapped, cleared = 0, depth = 0;
    while (found.length && depth < 30) {
      depth++; const expanded = this.expandPowers(board, found); found = expanded.cells; cleared += found.length; const fallen = this.collapse(board, found, random);
      if (depth === 1 && state.moves % 3 === 0) { const incoming = fallen.falls.find(fall => fall.from < 0); if (incoming) { const kind = (Math.floor(state.moves / 3) % 4 + 1) as PowerKind; incoming.tier += (kind + 1) * 5; fallen.board[incoming.to] = incoming.tier; } }
      phases.push({ kind: "clear", before: [...board], cells: found, depth, activated: expanded.activated }); phases.push({ kind: "fall", before: board.map((tier, index) => found.includes(index) ? null : tier), after: fallen.board, falls: fallen.falls }); board = fallen.board; found = this.matches(board);
    }
    const refreshed = found.length > 0 || !this.legalMoves(board).length;
    if (refreshed) { const after = this.mix(board, random); phases.push({ kind: "shuffle", before: board, after }); board = after; }
    state.board = board; state.cleared += cleared; state.moves++; state.bestCascade = Math.max(state.bestCascade, depth); this.synchronize(state);
    return { ok: true, phases, cleared, depth, refreshed };
  }
}
