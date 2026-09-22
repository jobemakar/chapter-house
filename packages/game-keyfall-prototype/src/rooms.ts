import type { RoomDefinition, Viewport } from "./types";

export const GAME_VIEWPORT: Viewport = Object.freeze({ width: 560, height: 800 });

export const ROOMS: readonly RoomDefinition[] = [
  { id: "velvet-descent", title: "The Velvet Descent", subtitle: "One clean cut. Let the key fall.", kind: "drop", keyStart: { x: 280, y: 259 }, cords: [{ id: "cord-a", anchor: { x: 280, y: 114 }, length: 145, angle: 0 }], tickets: [{ id: "ticket-a", position: { x: 202, y: 353 } }, { id: "ticket-b", position: { x: 280, y: 448 } }, { id: "ticket-c", position: { x: 358, y: 353 } }], goal: { x: 280, y: 657 }, props: [] },
  { id: "moonlit-swing", title: "Moonlit Swing", subtitle: "Cut the upper cord, then release the swing.", kind: "pendulum", keyStart: { x: 212, y: 320 }, cords: [{ id: "cord-left", anchor: { x: 144, y: 125 }, length: 206, angle: 0.62 }, { id: "cord-right", anchor: { x: 416, y: 125 }, length: 282, angle: 2.52 }], tickets: [{ id: "ticket-a", position: { x: 175, y: 434 } }, { id: "ticket-b", position: { x: 280, y: 549 } }, { id: "ticket-c", position: { x: 385, y: 434 } }], goal: { x: 280, y: 677 }, props: [] },
  { id: "bellows-backstage", title: "Backstage Bellows", subtitle: "Cut the cord, then puff from the left to let the bumper send the key to the lock.", kind: "bellows", keyStart: { x: 175, y: 320 }, cords: [{ id: "cord-stage", anchor: { x: 175, y: 120 }, length: 200, angle: 0 }], tickets: [{ id: "ticket-a", position: { x: 249, y: 353 } }, { id: "ticket-b", position: { x: 351, y: 428 } }, { id: "ticket-c", position: { x: 253, y: 542 } }], goal: { x: 450, y: 603 }, props: [{ kind: "bumper", position: { x: 144, y: 428 }, radius: 51 }, { kind: "bellows", position: { x: 93, y: 299 }, radius: 41 }] }
];

export function roomById(id: string): RoomDefinition { return ROOMS.find((room) => room.id === id) ?? ROOMS[0]; }
