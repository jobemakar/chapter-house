export type PartType =
  | "ramp"
  | "belt"
  | "spring"
  | "fan"
  | "funnel"
  | "bumper"
  | "wall"
  | "switch"
  | "button"
  | "lever";
export interface Point {
  x: number;
  y: number;
}
export interface Part {
  id: string;
  type: PartType;
  x: number;
  y: number;
  angle: number;
  power: number;
  flip: number;
  locked?: boolean;
  targets?: string[];
  direction?: number;
  targetId?: string;
  mode?: "toggle" | "latch";
  enabled?: boolean;
}
export interface Inlet extends Point {
  vx: number;
}
export interface Level {
  id: string;
  name: string;
  tag: string;
  sources: Inlet[];
  period: number;
  bowl: Point;
  initial: Part[];
  /** Each spare has stable identity and options, especially control bindings. */
  spares: Part[];
  /** Preserved old assists and directional switches; never required for new levels. */
  legacy?: { solution: Part[]; hint: string };
}
export interface Kernel {
  id: number;
  proof: number;
  inlet: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  spin: number;
  age: number;
  delay: number;
  returnX?: number;
  dead?: boolean;
  visits: string[];
  types: PartType[];
  cool: Record<string, number>;
  trail: Point[];
}
export interface Effect extends Point {
  type: string;
  life: number;
}
export interface GameEvent {
  type: "delivery" | "return" | "clear" | "touch" | "switch";
  chain?: number;
  part?: PartType;
}
