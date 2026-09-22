/** Typed level-authoring contracts. Coordinates use the 12 by 15 simulation world. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface Rock extends Rect {
  inset?: number;
}
export interface Sensor extends Point {
  r?: number;
  w?: number;
  h?: number;
}
export interface IntakePull extends Rect {
  targetX: number;
  targetY: number;
  strength?: number;
  maxSpeed?: number;
}
export interface Intake extends Point {
  id: string;
  facing: "left" | "right" | "up" | "down";
  dummy: boolean;
  sealed?: boolean;
  sensor?: Sensor;
  pull?: IntakePull;
}
export interface Reservoir {
  left: number;
  right: number;
  height: number;
  centerX: number;
  centerY: number;
  halfW: number;
  halfH: number;
}
export interface Canteen extends Point {
  filled: boolean;
  filledAt: number;
}
export interface CanteenDefinition extends Point {}
export interface LevelDefinition {
  id: string;
  name: string;
  required: number;
  floor: number;
  reservoir: Reservoir;
  soil: Point[][];
  protected: Rect[];
  pockets: Rect[];
  rocks: Rock[];
  fixtures: Rect[];
  canteens: CanteenDefinition[];
  intakes: Intake[];
  hint: [number, number][];
  target: Rect;
  fire: Point;
  hose: Point;
  /** Compiled authoring data. Absent for the preserved original level. */
  terrainGrid?: number[];
  reservoirs?: Reservoir[];
  tankWalls?: Rect[];
  tanks?: Array<
    Rect & {
      id: string;
      fillPercent: number;
      outlet: "left" | "right" | "bottom";
    }
  >;
  pipeRects?: Rect[];
  paintedRocks?: Rect[];
  requiredPercent?: number;
}

export interface LevelSnapshot {
  water: number;
  initialWater: number;
  collected: number;
  required: number;
  won: boolean;
  dug: number;
  steps: number;
  wasted: number;
  canteens: boolean[];
  canteenFillSteps: number[];
  lastDelivery: number;
  lastWaste: number;
  lastBlocked: number;
  level: string;
}

/** LiquidFun is third-party JavaScript/WASM. Keep it behind this intentionally narrow boundary. */
export type LiquidFun = any;
