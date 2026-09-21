import type { RoomDefinition } from "./types";

export const ROOMS: readonly RoomDefinition[] = [
  { id: "velvet-descent", title: "The Velvet Descent", subtitle: "One clean cut. Let the key fall.", kind: "drop", keyStart: { x: 400, y: 175 }, cords: [{ id: "cord-a", anchor: { x: 400, y: 68 }, length: 107, angle: 0 }], tickets: [{ id: "ticket-a", position: { x: 285, y: 245 } }, { id: "ticket-b", position: { x: 400, y: 315 } }, { id: "ticket-c", position: { x: 515, y: 245 } }], goal: { x: 400, y: 470 }, props: [] },
  { id: "moonlit-swing", title: "Moonlit Swing", subtitle: "Cut the upper cord, then release the swing.", kind: "pendulum", keyStart: { x: 300, y: 220 }, cords: [{ id: "cord-left", anchor: { x: 200, y: 76 }, length: 172, angle: 0.62 }, { id: "cord-right", anchor: { x: 600, y: 76 }, length: 172, angle: 2.52 }], tickets: [{ id: "ticket-a", position: { x: 245, y: 305 } }, { id: "ticket-b", position: { x: 400, y: 390 } }, { id: "ticket-c", position: { x: 555, y: 305 } }], goal: { x: 400, y: 485 }, props: [] },
  { id: "bellows-backstage", title: "Backstage Bellows", subtitle: "Cut the cord, then puff from the left to let the bumper send the key to the lock.", kind: "bellows", keyStart: { x: 245, y: 220 }, cords: [{ id: "cord-stage", anchor: { x: 245, y: 72 }, length: 148, angle: 0 }], tickets: [{ id: "ticket-a", position: { x: 355, y: 245 } }, { id: "ticket-b", position: { x: 505, y: 300 } }, { id: "ticket-c", position: { x: 360, y: 385 } }], goal: { x: 650, y: 430 }, props: [{ kind: "bumper", position: { x: 200, y: 300 }, radius: 60 }, { kind: "bellows", position: { x: 125, y: 205 }, radius: 48 }] }
];

export function roomById(id: string): RoomDefinition { return ROOMS.find((room) => room.id === id) ?? ROOMS[0]; }
