import { distance, swipePathCutPolyline } from "./geometry";
import { applyOpeningImpulse, makeWorld, removeCord } from "./physics";
import type { CompletionTrace } from "./completion-traces";
import type { RoomDefinition } from "./types";

export type TraceReplayResult = Readonly<{
  completed: boolean;
  completionTick?: number;
  collectedTicketIds: readonly string[];
  handledActions: number;
  finalPosition: Readonly<{ x: number; y: number }>;
  resetReason?: string;
  crossingXAtGoalY?: number;
}>;

/** Replays pointer actions through the same cord geometry and element handlers used by production. */
export function replayCompletionTrace(room: RoomDefinition, trace: CompletionTrace): TraceReplayResult {
  if (room.id !== trace.roomId) throw new Error(`Trace ${trace.roomId} cannot replay room ${room.id}`);
  const world = makeWorld(room);
  const collected = new Set<string>();
  let handledActions = 0;
  let crossingXAtGoalY: number | undefined;
  let previousY = world.key.position.y;
  applyOpeningImpulse(world, false);
  try {
    for (let tick = 0; tick <= trace.maximumTicks; tick += 1) {
      for (const action of trace.actions) {
        if (action.tick !== tick) continue;
        if (action.kind === "tap") {
          if (!world.handleTap(action.point)) throw new Error(`${room.id}: unhandled tap at tick ${tick}`);
          handledActions += 1;
          continue;
        }
        let cut = false;
        for (const cord of world.cords.values()) {
          if (!cord.intact) continue;
          const crossing = swipePathCutPolyline([action.from, action.to], cord.points);
          if (crossing && removeCord(world, cord.id, crossing.segmentIndex)) { cut = true; break; }
        }
        if (!cut) throw new Error(`${room.id}: slash missed every live cord at tick ${tick}`);
        handledActions += 1;
      }
      world.fixedUpdate(trace.fixedStepMs);
      if (crossingXAtGoalY === undefined && previousY < room.goal.y && world.key.position.y >= room.goal.y) crossingXAtGoalY = world.key.position.x;
      previousY = world.key.position.y;
      for (const ticket of room.tickets) if (distance(world.key.position, ticket.position) < 32) collected.add(ticket.id);
      if (distance(world.key.position, room.goal) < 38) return Object.freeze({ completed: true, completionTick: tick, collectedTicketIds: Object.freeze([...collected]), handledActions, finalPosition: Object.freeze({ x: world.key.position.x, y: world.key.position.y }), crossingXAtGoalY });
      const resetReason = world.consumeHazardReset();
      if (resetReason) return Object.freeze({ completed: false, collectedTicketIds: Object.freeze([...collected]), handledActions, finalPosition: Object.freeze({ x: world.key.position.x, y: world.key.position.y }), resetReason, crossingXAtGoalY });
    }
    return Object.freeze({ completed: false, collectedTicketIds: Object.freeze([...collected]), handledActions, finalPosition: Object.freeze({ x: world.key.position.x, y: world.key.position.y }), crossingXAtGoalY });
  } finally {
    world.dispose();
  }
}
