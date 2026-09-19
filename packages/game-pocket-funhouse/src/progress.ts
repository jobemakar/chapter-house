import { freshRoom, rooms, type RoomState } from "./core";

export const POCKET_FUNHOUSE_PROGRESS_VERSION = 1;
export const POCKET_FUNHOUSE_REWARD_IDS = [
  "pocket-funhouse:brass-key", "pocket-funhouse:mirror-fragment", "pocket-funhouse:passage-lantern", "pocket-funhouse:hidden-door-hinge", "pocket-funhouse:curtain-pull", "pocket-funhouse:sliding-panel", "pocket-funhouse:optical-prism", "pocket-funhouse:secret-door-bookcase", "pocket-funhouse:funhouse-map", "pocket-funhouse:turning-lock", "pocket-funhouse:treasure-latch", "pocket-funhouse:miniature-funhouse",
] as const;
export const POCKET_FUNHOUSE_CURIO_REWARDS = rooms.map((room, roomIndex) => ({ roomIndex, curio: room.curio, rewardId: POCKET_FUNHOUSE_REWARD_IDS[roomIndex]! }));
export interface PocketFunhouseProgress { version: 1; room: number; solved: number[]; rooms: RoomState[]; ownedRewardIds: string[]; }
export interface LegacyPocketFunhouseSave { room: number; solved: number[]; muted: boolean; rooms: RoomState[]; }
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function integer(value: unknown, fallback: number, max: number): number { return typeof value === "number" && Number.isInteger(value) ? Math.max(0, Math.min(max, value)) : fallback; }
function roomStates(value: unknown): RoomState[] { const candidates = Array.isArray(value) ? value : []; return rooms.map((room, index) => { const current = freshRoom(index); const raw = record(candidates[index]); if (!raw || !Array.isArray(raw.rotations) || raw.rotations.length !== 12) return current; current.rotations = raw.rotations.map((rotation) => integer(rotation, 0, 3)); const gates = record(raw.gates); for (const gate of room.gates) current.gates[gate] = gates?.[String(gate)] === true; return current; }); }
function solved(value: unknown): number[] { return Array.isArray(value) ? [...new Set(value.filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id >= 0 && id < rooms.length))] : []; }
function rewardIds(value: unknown, solvedRooms: readonly number[]): string[] { const known = new Set<string>(POCKET_FUNHOUSE_REWARD_IDS); const supplied = Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && known.has(id)) : []; for (const room of solvedRooms) supplied.push(POCKET_FUNHOUSE_REWARD_IDS[room]!); return [...new Set(supplied)]; }
export function freshPocketFunhouseProgress(): PocketFunhouseProgress { return {version: 1, room: 0, solved: [], rooms: rooms.map((_,index) => freshRoom(index)), ownedRewardIds: []}; }
/** Defensive v0 legacy and v1 host-profile codec. No DOM or storage dependency. */
export function loadPocketFunhouseProgress(raw: unknown): PocketFunhouseProgress { const value = record(raw); if (!value) return freshPocketFunhouseProgress(); const savedSolved = solved(value.solved); return { version: 1, room: integer(value.room, 0, rooms.length - 1), solved: savedSolved, rooms: roomStates(value.rooms), ownedRewardIds: rewardIds(value.ownedRewardIds, savedSolved) }; }
/** Keeps the independent original key's exact data shape: no host reward fields. */
export function toLegacyPocketFunhouseSave(progress: PocketFunhouseProgress, muted: boolean): LegacyPocketFunhouseSave { return { room: progress.room, solved: [...progress.solved], muted, rooms: progress.rooms.map((state) => ({rotations:[...state.rotations], gates:{...state.gates}})) }; }
