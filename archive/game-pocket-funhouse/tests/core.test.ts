import assert from "node:assert/strict";
import test from "node:test";
import { freshRoom, nudge, rooms, rotate, trace } from "../src/core";

test("all twelve authored Pocket Funhouse paths remain contiguous and solvable", () => { rooms.forEach((room,index) => { assert.equal(room.path[0]! % 4,0);assert.equal(room.path.at(-1)! % 4,3);assert.equal(new Set(room.path).size,room.path.length);const state=freshRoom(index);state.rotations.fill(0);for(const gate of Object.keys(state.gates))state.gates[Number(gate)]=true;assert.equal(trace(index,state).solved,true,room.name); }); });
test("free nudges solve each original room and tracks/shutters are reversible", () => { rooms.forEach((room,index) => { const state=freshRoom(index);let actions=0;while(!trace(index,state).solved&&actions++<20)assert.ok(nudge(index,state));assert.equal(trace(index,state).solved,true);assert.ok(actions<=room.path.length+room.gates.length); });const state=freshRoom(4), before=JSON.stringify(state);for(let i=0;i<4;i++)rotate(4,state,0);assert.equal(JSON.stringify(state),before); });
