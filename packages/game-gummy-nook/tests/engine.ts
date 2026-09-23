import assert from "node:assert/strict";
import { GummyBoard } from "../src/engine.ts";

const state = GummyBoard.fresh(() => .31);
assert.equal(state.board.length, 36); assert.equal(GummyBoard.matches(state.board).length, 0); assert.ok(GummyBoard.legalMoves(state.board).length > 0);
assert.equal(GummyBoard.adjacent(0, 7), true); assert.equal(GummyBoard.adjacent(0, 8), false);
assert.deepEqual(GummyBoard.coordinates(-12), { row: -2, col: 0 });
assert.deepEqual(GummyBoard.coordinates(-5), { row: -1, col: 1 });
assert.deepEqual(GummyBoard.coordinates(35), { row: 5, col: 5 });
const board = Array.from({ length: 36 }, (_, i) => i % 5); board[0] = 1; board[1] = 1; board[2] = 1;
const diagonal = Array.from({ length: 36 }, (_, i) => i % 5); diagonal[0] = 4; diagonal[7] = 4; diagonal[14] = 4; diagonal[5] = 3; diagonal[10] = 3; diagonal[15] = 3;
const diagonalMatches = GummyBoard.matches(diagonal);
assert.ok([0, 7, 14, 5, 10, 15].every((cell) => diagonalMatches.includes(cell)));
const expanded = GummyBoard.expandPowers(board, [0,1,2]); assert.deepEqual(expanded.cells, [0,1,2]);
const collapsed = GummyBoard.collapse(board, [1, 7, 13], () => .2);
for (const fall of collapsed.falls.filter(fall => fall.from < 0)) {
  const from = GummyBoard.coordinates(fall.from), to = GummyBoard.coordinates(fall.to);
  assert.equal(from.col, to.col); assert.ok(from.row < 0);
}
for (let i = 0; i < 250; i++) { const moves = GummyBoard.legalMoves(state.board); if (moves.length) GummyBoard.swap(state, ...moves[0], () => ((i * 17) % 97) / 97); else state.board = GummyBoard.mix(state.board); assert.equal(state.board.length, 36); assert.ok(GummyBoard.legalMoves(state.board).length > 0); }
console.log("gummy nook engine tests passed");
