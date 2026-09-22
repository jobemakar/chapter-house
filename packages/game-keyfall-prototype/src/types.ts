export type Vec = { x: number; y: number };
export type Viewport = { width: number; height: number };
export type Bounds = { x: number; y: number; width: number; height: number };
export type CollisionId = "key" | "bubble" | "air-zone" | "counterweight" | "hazard" | "ticket" | "goal" | "bumper" | "cord-link";
export type RoomKind = "drop" | "pendulum" | "bellows";
export type RoomWing = "campaign" | "prototype";
export type RoomSource =
  | { kind: "original" }
  | { kind: "keyfall-prototype" }
  | {
      kind: "mlgrope-mit-adaptation";
      repository: "https://github.com/emersion/mlgrope";
      commit: "1c398f18dfb5977fb1f7fcb8a671584a102f406a";
      path: "levels/0.csv" | "levels/1.csv";
      license: "MIT";
    };
export type PropDefinition = { kind: "bumper" | "bellows"; position: Vec; radius: number };
export type BubbleDefinition = { id: string; kind: "bubble"; position: Vec; captureRadius: number; buoyancy: number; popRadius: number };
export type AirJetDefinition = { id: string; kind: "air-jet"; position: Vec; zone: Bounds; direction: Vec; strength: number; mode: "continuous" | "tap"; tapRadius: number };
export type CounterweightDefinition = { id: string; kind: "counterweight"; position: Vec; radius: number; mass: number; restitution: number };
export type ResetHazardDefinition = { id: string; kind: "reset-hazard"; bounds: Bounds; reason: string };
export type WorldElementDefinition = BubbleDefinition | AirJetDefinition | CounterweightDefinition | ResetHazardDefinition;
export type CordDefinition = { id: string; anchor: Vec; length: number; angle: number };
export type TicketDefinition = { id: string; position: Vec };
export type RoomDefinition = {
  id: string; title: string; subtitle: string; wing: RoomWing; source: RoomSource; kind: RoomKind; keyStart: Vec;
  cords: CordDefinition[]; tickets: TicketDefinition[]; goal: Vec; props: PropDefinition[]; elements?: WorldElementDefinition[];
};
export type KeyfallProgress = { version: 1; completed: string[]; bestTickets: Record<string, number>; muted: boolean; reducedMotion: boolean };
export type RuntimeState = "ready" | "playing" | "paused" | "complete" | "resetting";
