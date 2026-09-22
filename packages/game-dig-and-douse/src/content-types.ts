import type { LevelDefinition, Point, Rect, Reservoir } from "./types";
export type { Point, Rect } from "./types";

export const CONTENT_VERSION = 1 as const;
export const WORLD_WIDTH = 12;
export const WORLD_HEIGHT = 15;
export const CELL_SIZE = 0.15;
export const COLS = 80;
export const ROWS = 100;
export const PIPE_SIZE = 1.2;
export const PIPE_WIDTH = 0.3;

export type TerrainMaterial = "empty" | "dirt" | "rock";

export interface BrushOperation {
  id: string;
  kind: "brush";
  material: TerrainMaterial;
  points: Point[];
  radius: number;
}

export interface PolygonOperation {
  id: string;
  kind: "polygon";
  material: TerrainMaterial;
  points: Point[];
}

export type TerrainOperation = BrushOperation | PolygonOperation;
export type OutletSide = "left" | "right" | "bottom";
export type Facing = "left" | "right" | "up" | "down";
export type PipeKind = "straight" | "elbow" | "tee" | "cross";
export type QuarterTurn = 0 | 90 | 180 | 270;

export interface Tank extends Rect {
  id: string;
  fillPercent: number;
  outlet: OutletSide;
}

export interface Pipe extends Point {
  id: string;
  kind: PipeKind;
  rotation: QuarterTurn;
}

export interface PlacedIntake extends Point {
  facing: Facing;
}

/** JSON source of truth for one editable level. */
export interface LevelDocument {
  version: typeof CONTENT_VERSION;
  id: string;
  name: string;
  requiredPercent: number;
  terrain: TerrainOperation[];
  reservoirs: Tank[];
  rocks: Rect[];
  pipes: Pipe[];
  canteens: Point[];
  intake: PlacedIntake;
  decoys: PlacedIntake[];
  target: Rect;
  /**
   * An imported pre-editor level compiles through this exact geometry until
   * the editor's first mutation calls ContentCompiler.withoutLegacy().
   */
  legacy?: LevelDefinition;
}

export interface CampaignDocument {
  version: typeof CONTENT_VERSION;
  levels: string[];
}

/** Runtime additions consumed by the generalized simulation. */
export interface CompiledLevelDefinition extends LevelDefinition {
  terrainGrid: number[];
  reservoirs: Reservoir[];
  tankWalls: Rect[];
  tanks: Tank[];
  pipeRects: Rect[];
  paintedRocks: Rect[];
  requiredPercent: number;
}
