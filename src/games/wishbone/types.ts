import type Matter from "matter-js";
export type PowerId = "bounce" | "magnet" | "wind";
export interface PowerState {
  counts: Record<PowerId, number>;
  clears: number;
  discovered: PowerId[];
  autoGust: boolean;
}
export interface PieceDefinition {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  color: number;
}
export interface YardDefinition {
  id: string;
  name: string;
  subtitle: string;
  pieces: PieceDefinition[];
  mechanisms?: ("lever" | "bellows" | "magnet")[];
  devices?: {
    lever?: { x: number; y: number };
    gate?: { x: number; y: number };
    bellows?: { x: number; y: number };
    button?: { x: number; y: number };
    field?: { x: number; y: number; r: number };
  };
  pickups?: { id: PowerId; x: number; y: number }[];
}
export interface PieceMetadata extends PieceDefinition {
  id: number;
  home: Matter.Vector;
}
export interface PieceBody extends Matter.Body {
  game: PieceMetadata;
}
export interface PlushMetadata {
  kind: "plush";
  name: string;
  w: number;
  h: number;
  color: string;
  dx: number;
  dy: number;
  id: number;
}
export interface PlushBody extends Matter.Body {
  game: PlushMetadata;
}
export interface Checkpoint {
  rescued: number[];
  pieces: { id: number; x: number; y: number; angle: number }[];
  gadgets?: {
    claimed: PowerId[];
    clearPaid: boolean;
    reward: PowerId;
    gateOpen: boolean;
    polarity: number;
  };
}
export type GameEvent =
  | { type: "impact"; speed: number; kind: string; x: number; y: number }
  | { type: "throw" | "hop" }
  | { type: "fetch"; x: number; y: number }
  | { type: "rescue"; id: string; x: number; y: number; color: number }
  | { type: "mechanism" | "power-used"; text: string; x: number; y: number }
  | { type: "pickup" | "clear-power"; id: PowerId; x: number; y: number };
export interface AimInput {
  id: number;
  start: { x: number; y: number };
  velocity: { x: number; y: number; power: number };
}
export interface Life {
  time?: number;
  reduced?: boolean;
  near?: boolean;
  look?: number;
  ready?: boolean;
  held?: boolean;
  power?: number;
  sway?: number;
  aim?: number;
}
// Only the base collision observer examines metadata on arbitrary physics bodies.
declare module "matter-js" {
  interface Body {
    game?: { kind: string };
  }
}
