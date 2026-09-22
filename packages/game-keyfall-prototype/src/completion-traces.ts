import type { Vec } from "./types";
import { ORIGINAL_ROOM_BRIEFS } from "./original-room-briefs";

export const COMPLETION_TRACE_TUNING_VERSION = "keyfall-production-2026-09-21" as const;
export const COMPLETION_TRACE_STEP_MS = 16 as const;

export type TraceAction =
  | Readonly<{ tick: number; kind: "slash"; from: Readonly<Vec>; to: Readonly<Vec> }>
  | Readonly<{ tick: number; kind: "tap"; point: Readonly<Vec> }>;

export type CompletionTrace = Readonly<{
  roomId: string;
  tuningVersion: typeof COMPLETION_TRACE_TUNING_VERSION;
  seed: 0;
  fixedStepMs: typeof COMPLETION_TRACE_STEP_MS;
  maximumTicks: number;
  expectedTickets: 0 | 1 | 2 | 3;
  actions: readonly TraceAction[];
}>;

function releaseActions(x: number, y: number, split: boolean, startTick: number): readonly TraceAction[] {
  if (!split) return Object.freeze([{ tick: startTick, kind: "slash" as const, from: { x: x - 90, y: y - 95 }, to: { x: x + 90, y: y - 95 } }]);
  return Object.freeze([
    { tick: startTick, kind: "slash" as const, from: { x: x - 110, y: y - 86 }, to: { x: x + 5, y: y - 86 } },
    { tick: startTick + 1, kind: "slash" as const, from: { x: x - 5, y: y - 86 }, to: { x: x + 110, y: y - 86 } },
  ]);
}

function originalRoomId(number: number): string {
  const room = ORIGINAL_ROOM_BRIEFS.find((brief) => brief.roomNumber === number);
  if (!room) throw new Error(`Missing original trace brief for room ${number}`);
  return room.id;
}

function originalZeroTrace(number: number, x: number, y: number, split = false, releaseTick = 1, extraActions: readonly TraceAction[] = []): CompletionTrace {
  return Object.freeze({
    roomId: originalRoomId(number),
    tuningVersion: COMPLETION_TRACE_TUNING_VERSION, seed: 0, fixedStepMs: COMPLETION_TRACE_STEP_MS, maximumTicks: 150, expectedTickets: 0,
    actions: Object.freeze([
      { tick: 0, kind: "tap" as const, point: { x, y } },
      ...releaseActions(x, y, split, releaseTick),
      ...extraActions,
    ]),
  });
}

function originalMasteryTrace(number: number, x: number, y: number, split = false, extraActions: readonly TraceAction[] = [], popTick = 26): CompletionTrace {
  const releases = releaseActions(x, y, split, 0);
  return Object.freeze({
    roomId: originalZeroTrace(number, x, y, split).roomId,
    tuningVersion: COMPLETION_TRACE_TUNING_VERSION, seed: 0, fixedStepMs: COMPLETION_TRACE_STEP_MS, maximumTicks: 180, expectedTickets: 3,
    actions: Object.freeze([
      ...releases,
      { tick: popTick, kind: "tap" as const, point: { x: x + 17, y: y - 181 } },
      ...extraActions,
    ]),
  });
}

/** Checked-in input traces. Coordinates are logical 560x800 pointer positions. */
export const CAMPAIGN_COMPLETION_TRACES = Object.freeze([
  {
    roomId: "campaign-01-draft-gallery",
    tuningVersion: COMPLETION_TRACE_TUNING_VERSION,
    seed: 0,
    fixedStepMs: COMPLETION_TRACE_STEP_MS,
    maximumTicks: 240,
    expectedTickets: 0,
    actions: Object.freeze([
      { tick: 0, kind: "tap", point: { x: 184, y: 397 } },
      { tick: 1, kind: "slash", from: { x: 105, y: 165 }, to: { x: 225, y: 165 } },
    ]),
  },
  {
    roomId: "campaign-02-bubble-column",
    tuningVersion: COMPLETION_TRACE_TUNING_VERSION,
    seed: 0,
    fixedStepMs: COMPLETION_TRACE_STEP_MS,
    maximumTicks: 260,
    expectedTickets: 0,
    actions: Object.freeze([
      { tick: 0, kind: "tap", point: { x: 282, y: 354 } },
      { tick: 1, kind: "tap", point: { x: 290, y: 526 } },
      { tick: 2, kind: "slash", from: { x: 220, y: 128 }, to: { x: 340, y: 128 } },
    ]),
  },
  originalZeroTrace(3, 250, 300, false, 1, [{ tick: 20, kind: "tap", point: { x: 82, y: 430 } }]),
  originalZeroTrace(4, 310, 300),
  originalZeroTrace(5, 220, 305),
  originalZeroTrace(6, 330, 240),
  originalZeroTrace(7, 300, 240, false, 45, [{ tick: 60, kind: "tap", point: { x: 485, y: 430 } }]),
  originalZeroTrace(8, 300, 310, false, 1, [{ tick: 20, kind: "tap", point: { x: 92, y: 420 } }, { tick: 35, kind: "tap", point: { x: 92, y: 420 } }]),
  originalZeroTrace(9, 250, 305, false, 1, [{ tick: 20, kind: "tap", point: { x: 94, y: 440 } }]),
  originalZeroTrace(10, 330, 245),
  originalZeroTrace(11, 300, 245, false, 45, [{ tick: 60, kind: "tap", point: { x: 90, y: 430 } }]),
  originalZeroTrace(12, 280, 305, false, 1, [{ tick: 35, kind: "tap", point: { x: 485, y: 470 } }]),
  originalZeroTrace(13, 255, 305, true),
  originalZeroTrace(14, 285, 300, true, 1, [{ tick: 24, kind: "tap", point: { x: 490, y: 445 } }]),
  originalZeroTrace(15, 235, 305, true),
  originalZeroTrace(16, 330, 245, true),
  originalZeroTrace(17, 225, 305, true, 1, [{ tick: 35, kind: "tap", point: { x: 485, y: 500 } }]),
  originalZeroTrace(18, 300, 300, true),
  originalZeroTrace(19, 330, 245, true, 3),
  originalZeroTrace(20, 330, 245, true),
] satisfies readonly CompletionTrace[]);

/** Optional mastery routes proving every campaign ticket can be banked on success. */
export const CAMPAIGN_THREE_TICKET_TRACES = Object.freeze([
  {
    roomId: "campaign-01-draft-gallery",
    tuningVersion: COMPLETION_TRACE_TUNING_VERSION,
    seed: 0,
    fixedStepMs: COMPLETION_TRACE_STEP_MS,
    maximumTicks: 300,
    expectedTickets: 3,
    actions: Object.freeze([
      { tick: 1, kind: "slash", from: { x: 60, y: 160 }, to: { x: 300, y: 160 } },
      { tick: 120, kind: "tap", point: { x: 296, y: 21 } },
    ]),
  },
  {
    roomId: "campaign-02-bubble-column",
    tuningVersion: COMPLETION_TRACE_TUNING_VERSION,
    seed: 0,
    fixedStepMs: COMPLETION_TRACE_STEP_MS,
    maximumTicks: 260,
    expectedTickets: 3,
    actions: Object.freeze([
      { tick: 0, kind: "tap", point: { x: 282, y: 354 } },
      { tick: 1, kind: "tap", point: { x: 290, y: 526 } },
      { tick: 60, kind: "slash", from: { x: 150, y: 128 }, to: { x: 410, y: 128 } },
    ]),
  },
  originalMasteryTrace(3, 250, 300),
  originalMasteryTrace(4, 310, 300, false, [{ tick: 84, kind: "tap", point: { x: 492, y: 520 } }, { tick: 90, kind: "tap", point: { x: 492, y: 520 } }]),
  originalMasteryTrace(5, 220, 305),
  originalMasteryTrace(6, 330, 240),
  originalMasteryTrace(7, 300, 240, false, [70, 75, 80, 85, 90].map((tick) => ({ tick, kind: "tap" as const, point: { x: 485, y: 430 } }))),
  originalMasteryTrace(8, 300, 310, false, [{ tick: 78, kind: "tap", point: { x: 92, y: 420 } }, { tick: 86, kind: "tap", point: { x: 92, y: 420 } }]),
  originalMasteryTrace(9, 250, 305, false, [{ tick: 60, kind: "tap", point: { x: 94, y: 440 } }, { tick: 72, kind: "tap", point: { x: 94, y: 440 } }]),
  originalMasteryTrace(10, 330, 245),
  originalMasteryTrace(11, 300, 245, false, [75, 82, 89].map((tick) => ({ tick, kind: "tap" as const, point: { x: 90, y: 430 } }))),
  originalMasteryTrace(12, 280, 305),
  originalMasteryTrace(13, 255, 305, true),
  originalMasteryTrace(14, 285, 300, true, [{ tick: 84, kind: "tap", point: { x: 490, y: 445 } }, { tick: 90, kind: "tap", point: { x: 490, y: 445 } }]),
  originalMasteryTrace(15, 235, 305, true),
  originalMasteryTrace(16, 330, 245, true),
  originalMasteryTrace(17, 225, 305, true),
  originalMasteryTrace(18, 300, 300, true, [{ tick: 84, kind: "tap", point: { x: 490, y: 530 } }, { tick: 90, kind: "tap", point: { x: 490, y: 530 } }]),
  originalMasteryTrace(19, 330, 245, true, [], 38),
  originalMasteryTrace(20, 330, 245, true, [], 28),
] satisfies readonly CompletionTrace[]);
