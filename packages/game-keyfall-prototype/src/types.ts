export type Vec = { x: number; y: number };
export type Viewport = { width: number; height: number };
export type RoomKind = "drop" | "pendulum" | "bellows";
export type PropDefinition = { kind: "bumper" | "bellows"; position: Vec; radius: number };
export type CordDefinition = { id: string; anchor: Vec; length: number; angle: number };
export type TicketDefinition = { id: string; position: Vec };
export type RoomDefinition = {
  id: string; title: string; subtitle: string; kind: RoomKind; keyStart: Vec;
  cords: CordDefinition[]; tickets: TicketDefinition[]; goal: Vec; props: PropDefinition[];
};
export type KeyfallProgress = { version: 1; completed: string[]; bestTickets: Record<string, number>; muted: boolean; reducedMotion: boolean };
export type RuntimeState = "ready" | "playing" | "paused" | "complete" | "resetting";
