import assert from "node:assert/strict";
import { GummyBoard } from "../src/engine.ts";

const state = GummyBoard.fresh(() => .31);
assert.equal(state.board.length, 36); assert.equal(GummyBoard.matches(state.board).length, 0); assert.ok(GummyBoard.legalMoves(state.board).length > 0);
assert.equal(GummyBoard.adjacent(0, 7), true); assert.equal(GummyBoard.adjacent(0, 8), false);
const board = Array.from({ length: 36 }, (_, i) => i % 5); board[0] = 1; board[1] = 1; board[2] = 1;
const expanded = GummyBoard.expandPowers(board, [0,1,2]); assert.deepEqual(expanded.cells, [0,1,2]);
for (let i = 0; i < 250; i++) { const moves = GummyBoard.legalMoves(state.board); if (moves.length) GummyBoard.swap(state, ...moves[0], () => ((i * 17) % 97) / 97); else state.board = GummyBoard.mix(state.board); assert.equal(state.board.length, 36); assert.ok(GummyBoard.legalMoves(state.board).length > 0); }
console.log("gummy nook engine tests passed");
