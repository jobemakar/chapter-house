import type { LevelDefinition, Point, Rect, Reservoir } from "./types";
import {
  CELL_SIZE,
  COLS,
  CONTENT_VERSION,
  PIPE_SIZE,
  PIPE_WIDTH,
  ROWS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type CampaignDocument,
  type CompiledLevelDefinition,
  type LevelDocument,
  type Pipe,
  type PlacedIntake,
  type Tank,
  type TerrainMaterial,
} from "./content-types";

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WINDOWS_DEVICE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const WALL = 0.15;
const OUTLET = 0.75;

export class ContentCompiler {
  static createLevel(id: string, name: string): LevelDocument {
    return {
      version: CONTENT_VERSION,
      id,
      name,
      requiredPercent: 60,
      terrain: [],
      reservoirs: [
        {
          id: "reservoir-1",
          x: 4.2,
          y: 0.45,
          w: 3.6,
          h: 2.4,
          fillPercent: 100,
          outlet: "bottom",
        },
      ],
      rocks: [],
      pipes: [],
      canteens: [],
      intake: { x: 6.1, y: 13.1, facing: "left" },
      decoys: [],
      target: { x: 7.25, y: 11.45, w: 4.5, h: 3.2 },
    };
  }

  static withoutLegacy(document: LevelDocument): LevelDocument {
    const copy = clone(document);
    delete copy.legacy;
    return copy;
  }

  /** Rasterizes ordered operations over the filled-dirt 80 by 100 grid. */
  static terrain(document: LevelDocument): Uint8Array {
    const grid = new Uint8Array(COLS * ROWS);
    grid.fill(1);
    for (const operation of document.terrain) {
      const value = materialValue(operation.material);
      if (operation.kind === "polygon") {
        forEachCell((point, index) => {
          if (inPolygon(point, operation.points)) grid[index] = value;
        });
        continue;
      }
      forEachCell((point, index) => {
        if (nearStroke(point, operation.points, operation.radius))
          grid[index] = value;
      });
    }
    // Reservoir interiors must remain free of authored terrain.
    for (const tank of document.reservoirs) {
      const interior = {
        x: tank.x + WALL,
        y: tank.y + WALL,
        w: tank.w - 2 * WALL,
        h: tank.h - 2 * WALL,
      };
      forEachCell((point, index) => {
        if (inRect(point, interior)) grid[index] = 0;
      });
    }
    return grid;
  }

  static validate(document: LevelDocument): string[] {
    const issues: string[] = [];
    if (!isSafeLevelId(document.id))
      issues.push(
        "Level id must use lowercase letters, numbers, and single hyphens.",
      );
    if (!document.name.trim()) issues.push("Give the level a name.");
    if (
      !finite(document.requiredPercent) ||
      document.requiredPercent <= 0 ||
      document.requiredPercent > 100
    )
      issues.push(
        "Required water must be greater than 0% and no more than 100%.",
      );
    if (document.reservoirs.length === 0)
      issues.push("Place at least one reservoir.");
    if (
      !document.reservoirs.some((tank) => {
        const spawn = reservoirSpawn(tank);
        return spawn.halfW >= 0.073 && spawn.halfH >= 0.073;
      })
    )
      issues.push(
        "At least one reservoir needs enough starting water to spawn a water particle.",
      );
    uniqueIds(document.reservoirs, "reservoir", issues);
    uniqueIds(document.pipes, "pipe", issues);
    uniqueIds(document.terrain, "terrain operation", issues);
    for (const tank of document.reservoirs) {
      checkRect(tank, `Reservoir ${tank.id}`, issues, 0.6, 0.6);
      if (
        !finite(tank.fillPercent) ||
        tank.fillPercent < 0 ||
        tank.fillPercent > 100
      )
        issues.push(`Reservoir ${tank.id} fill must be from 0% to 100%.`);
      const interior = insetRect(tank, WALL);
      if (
        interior.x < 0.3 ||
        interior.x + interior.w > WORLD_WIDTH - 0.3 ||
        interior.y < 0 ||
        interior.y + interior.h > 14.7
      )
        issues.push(
          `Reservoir ${tank.id} interior overlaps the playfield boundary.`,
        );
    }
    for (let index = 0; index < document.reservoirs.length; index++) {
      const tank = document.reservoirs[index];
      const interior = insetRect(tank, WALL);
      for (let other = index + 1; other < document.reservoirs.length; other++)
        if (overlaps(tank, document.reservoirs[other]))
          issues.push(
            `Reservoirs ${tank.id} and ${document.reservoirs[other].id} overlap.`,
          );
      const solids = [
        ...document.rocks,
        document.target,
        intakeBody(document.intake, false),
        ...document.decoys.map((placed) => intakeBody(placed, true)),
        ...document.pipes.map((pipe) => ({
          x: pipe.x,
          y: pipe.y,
          w: PIPE_SIZE,
          h: PIPE_SIZE,
        })),
      ];
      if (solids.some((solid) => overlaps(interior, solid)))
        issues.push(`Reservoir ${tank.id} overlaps a solid object.`);
    }
    document.rocks.forEach((rock, index) =>
      checkRect(rock, `Rock ${index + 1}`, issues),
    );
    checkRect(document.target, "Target", issues);
    checkPoint(document.intake, "Working intake", issues);
    document.decoys.forEach((point, index) =>
      checkPoint(point, `Capped intake ${index + 1}`, issues),
    );
    document.canteens.forEach((point, index) =>
      checkPoint(point, `Canteen ${index + 1}`, issues),
    );
    for (const pipe of document.pipes) {
      checkPoint(
        pipe,
        `Pipe ${pipe.id}`,
        issues,
        WORLD_WIDTH - PIPE_SIZE,
        WORLD_HEIGHT - PIPE_SIZE,
      );
      if (!nearInteger(pipe.x / PIPE_SIZE) || !nearInteger(pipe.y / PIPE_SIZE))
        issues.push(`Pipe ${pipe.id} must snap to the ${PIPE_SIZE}-unit grid.`);
    }
    for (const operation of document.terrain) {
      if (operation.kind === "brush") {
        if (operation.points.length === 0)
          issues.push(`Brush ${operation.id} needs at least one point.`);
        if (!finite(operation.radius) || operation.radius <= 0)
          issues.push(`Brush ${operation.id} needs a positive radius.`);
      } else if (operation.points.length < 3)
        issues.push(`Polygon ${operation.id} needs at least three points.`);
      operation.points.forEach((point, index) =>
        checkPoint(point, `${operation.id} point ${index + 1}`, issues),
      );
    }
    return issues;
  }

  static compile(document: LevelDocument): LevelDefinition {
    const grid = this.terrain(document);
    const tankWalls = document.reservoirs.flatMap(tankWallRects);
    const reservoirs = document.reservoirs.map(reservoirSpawn);
    const pipeRects = document.pipes.flatMap(pipeRectsFor);
    const paintedRocks = gridRuns(grid, 2);
    const emptyPockets = gridRuns(grid, 0);
    const intake = intakeDefinition("hose", document.intake, false);
    const decoys = document.decoys.map((placed, index) =>
      intakeDefinition(`sealed-${index + 1}`, placed, true),
    );
    const primary = reservoirs[0] ?? {
      left: 0,
      right: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
      halfW: 0,
      halfH: 0,
    };
    const modern: CompiledLevelDefinition = {
      id: document.id,
      name: document.name,
      required: 0,
      requiredPercent: document.requiredPercent,
      floor: 14.7,
      reservoir: primary,
      reservoirs,
      tanks: clone(document.reservoirs),
      tankWalls,
      terrainGrid: Array.from(grid),
      soil: [
        [
          { x: 0, y: 0 },
          { x: WORLD_WIDTH, y: 0 },
          { x: WORLD_WIDTH, y: WORLD_HEIGHT },
          { x: 0, y: WORLD_HEIGHT },
        ],
      ],
      pockets: emptyPockets,
      paintedRocks,
      rocks: clone(document.rocks),
      protected: [
        { x: 0, y: 0, w: 0.3, h: WORLD_HEIGHT },
        { x: WORLD_WIDTH - 0.3, y: 0, w: 0.3, h: WORLD_HEIGHT },
      ],
      fixtures: [
        clone(document.target),
        intakeBody(document.intake, false),
        ...document.decoys.map((placed) => intakeBody(placed, true)),
      ],
      pipeRects,
      canteens: clone(document.canteens),
      intakes: [intake, ...decoys],
      hint: [],
      target: clone(document.target),
      fire: {
        x: document.target.x + document.target.w * 0.52,
        y: document.target.y + document.target.h * 0.72,
      },
      hose: {
        x: document.target.x + document.target.w * 0.7,
        y: document.target.y + document.target.h * 0.37,
      },
    };
    return document.legacy
      ? { ...clone(document.legacy), id: document.id, name: document.name }
      : modern;
  }
}

export function isSafeLevelId(id: string): boolean {
  return SAFE_ID.test(id) && !WINDOWS_DEVICE.test(id) && id.length <= 80;
}

export function parseCampaignDocument(value: unknown): CampaignDocument {
  const source = record(value, "campaign");
  if (source.version !== CONTENT_VERSION)
    throw new Error("Campaign version must be 1.");
  const levels = array(source.levels, "campaign levels").map((entry, index) =>
    string(entry, `campaign level ${index + 1}`),
  );
  for (const id of levels)
    if (!isSafeLevelId(id))
      throw new Error(`Campaign level id ${id} is unsafe.`);
  if (new Set(levels).size !== levels.length)
    throw new Error("Campaign cannot contain duplicate level ids.");
  return { version: CONTENT_VERSION, levels };
}

/** Strict structural parser; semantic incompleteness remains saveable as a draft. */
export function parseLevelDocument(value: unknown): LevelDocument {
  const source = record(value, "level");
  if (source.version !== CONTENT_VERSION)
    throw new Error("Level version must be 1.");
  const terrain = array(source.terrain, "terrain").map((entry, index) => {
    const operation = record(entry, `terrain operation ${index + 1}`);
    const common = {
      id: string(operation.id, "terrain operation id"),
      material: oneOf(
        operation.material,
        ["empty", "dirt", "rock"] as const,
        "terrain material",
      ),
      points: points(operation.points, "terrain points"),
    };
    if (operation.kind === "brush")
      return {
        ...common,
        kind: "brush" as const,
        radius: number(operation.radius, "brush radius"),
      };
    if (operation.kind === "polygon")
      return { ...common, kind: "polygon" as const };
    throw new Error("Terrain operation kind must be brush or polygon.");
  });
  const reservoirs = array(source.reservoirs, "reservoirs").map(
    (entry, index) => {
      const tank = record(entry, `reservoir ${index + 1}`);
      return {
        id: string(tank.id, "reservoir id"),
        ...rect(tank, "reservoir"),
        fillPercent: number(tank.fillPercent, "reservoir fill"),
        outlet: oneOf(
          tank.outlet,
          ["left", "right", "bottom"] as const,
          "reservoir outlet",
        ),
      };
    },
  );
  const pipes = array(source.pipes, "pipes").map((entry, index) => {
    const pipe = record(entry, `pipe ${index + 1}`);
    return {
      id: string(pipe.id, "pipe id"),
      ...point(pipe, "pipe"),
      kind: oneOf(
        pipe.kind,
        ["straight", "elbow", "tee", "cross"] as const,
        "pipe kind",
      ),
      rotation: oneOf(
        pipe.rotation,
        [0, 90, 180, 270] as const,
        "pipe rotation",
      ),
    };
  });
  const result: LevelDocument = {
    version: CONTENT_VERSION,
    id: string(source.id, "level id"),
    name: string(source.name, "level name"),
    requiredPercent: number(source.requiredPercent, "required percent"),
    terrain,
    reservoirs,
    rocks: array(source.rocks, "rocks").map((entry) =>
      rect(record(entry, "rock"), "rock"),
    ),
    pipes,
    canteens: points(source.canteens, "canteens"),
    intake: placedIntake(source.intake, "working intake"),
    decoys: array(source.decoys, "decoys").map((entry) =>
      placedIntake(entry, "capped intake"),
    ),
    target: rect(record(source.target, "target"), "target"),
  };
  if (source.legacy !== undefined)
    result.legacy = parseLegacyDefinition(source.legacy);
  return result;
}

function parseLegacyDefinition(value: unknown): LevelDefinition {
  const source = record(value, "legacy level");
  string(source.id, "legacy level id");
  string(source.name, "legacy level name");
  number(source.required, "legacy required water");
  number(source.floor, "legacy floor");
  const reservoir = record(source.reservoir, "legacy reservoir");
  for (const field of [
    "left",
    "right",
    "height",
    "centerX",
    "centerY",
    "halfW",
    "halfH",
  ])
    number(reservoir[field], `legacy reservoir ${field}`);
  array(source.soil, "legacy soil").forEach((polygon, index) =>
    points(polygon, `legacy soil polygon ${index + 1}`),
  );
  for (const field of ["protected", "pockets", "rocks", "fixtures"])
    array(source[field], `legacy ${field}`).forEach((entry, index) =>
      rect(
        record(entry, `legacy ${field} ${index + 1}`),
        `legacy ${field} ${index + 1}`,
      ),
    );
  points(source.canteens, "legacy canteens");
  array(source.intakes, "legacy intakes").forEach((entry, index) => {
    const intake = record(entry, `legacy intake ${index + 1}`);
    string(intake.id, "legacy intake id");
    point(intake, "legacy intake");
    oneOf(
      intake.facing,
      ["left", "right", "up", "down"] as const,
      "legacy intake facing",
    );
    if (typeof intake.dummy !== "boolean")
      throw new Error("legacy intake dummy must be a boolean.");
    if (intake.sensor !== undefined) {
      const sensor = record(intake.sensor, "legacy intake sensor");
      point(sensor, "legacy intake sensor");
      if (sensor.r !== undefined) number(sensor.r, "legacy sensor radius");
    }
    if (intake.pull !== undefined) {
      const pull = record(intake.pull, "legacy intake pull");
      rect(pull, "legacy intake pull");
      number(pull.targetX, "legacy pull target x");
      number(pull.targetY, "legacy pull target y");
    }
  });
  array(source.hint, "legacy hint").forEach((entry) => {
    const pair = array(entry, "legacy hint point");
    if (pair.length !== 2)
      throw new Error("legacy hint point must contain x and y.");
    number(pair[0], "legacy hint x");
    number(pair[1], "legacy hint y");
  });
  rect(record(source.target, "legacy target"), "legacy target");
  point(source.fire, "legacy fire");
  point(source.hose, "legacy hose");
  return clone(value) as LevelDefinition;
}

function reservoirSpawn(tank: Tank): Reservoir {
  const usableH = Math.max(0, tank.h - 2 * WALL);
  const fillH = (usableH * tank.fillPercent) / 100;
  return {
    left: tank.x,
    right: tank.x + tank.w,
    height: tank.y + tank.h,
    centerX: tank.x + tank.w / 2,
    centerY: tank.y + tank.h - WALL - fillH / 2,
    halfW: Math.max(0, tank.w / 2 - WALL - 0.06),
    halfH: Math.max(0, fillH / 2 - 0.06),
  };
}

function tankWallRects(tank: Tank): Rect[] {
  const result: Rect[] = [{ x: tank.x, y: tank.y, w: tank.w, h: WALL }];
  const halfVertical = Math.max(0, (tank.h - OUTLET) / 2);
  const halfHorizontal = Math.max(0, (tank.w - OUTLET) / 2);
  if (tank.outlet === "left") {
    result.push(
      { x: tank.x, y: tank.y, w: WALL, h: halfVertical },
      {
        x: tank.x,
        y: tank.y + halfVertical + OUTLET,
        w: WALL,
        h: halfVertical,
      },
    );
  } else result.push({ x: tank.x, y: tank.y, w: WALL, h: tank.h });
  if (tank.outlet === "right") {
    result.push(
      { x: tank.x + tank.w - WALL, y: tank.y, w: WALL, h: halfVertical },
      {
        x: tank.x + tank.w - WALL,
        y: tank.y + halfVertical + OUTLET,
        w: WALL,
        h: halfVertical,
      },
    );
  } else
    result.push({ x: tank.x + tank.w - WALL, y: tank.y, w: WALL, h: tank.h });
  if (tank.outlet === "bottom") {
    result.push(
      { x: tank.x, y: tank.y + tank.h - WALL, w: halfHorizontal, h: WALL },
      {
        x: tank.x + halfHorizontal + OUTLET,
        y: tank.y + tank.h - WALL,
        w: halfHorizontal,
        h: WALL,
      },
    );
  } else
    result.push({ x: tank.x, y: tank.y + tank.h - WALL, w: tank.w, h: WALL });
  return result.filter((wall) => wall.w > 0 && wall.h > 0);
}

function pipeRectsFor(pipe: Pipe): Rect[] {
  let arms =
    pipe.kind === "straight"
      ? ["left", "right"]
      : pipe.kind === "elbow"
        ? ["right", "bottom"]
        : pipe.kind === "tee"
          ? ["left", "right", "bottom"]
          : ["left", "right", "top", "bottom"];
  const turns = pipe.rotation / 90;
  arms = arms.map((arm) => rotateArm(arm, turns));
  const cx = pipe.x + PIPE_SIZE / 2;
  const cy = pipe.y + PIPE_SIZE / 2;
  const half = PIPE_WIDTH / 2;
  const rects: Rect[] = [
    { x: cx - half, y: cy - half, w: PIPE_WIDTH, h: PIPE_WIDTH },
  ];
  for (const arm of arms) {
    if (arm === "left")
      rects.push({ x: pipe.x, y: cy - half, w: PIPE_SIZE / 2, h: PIPE_WIDTH });
    if (arm === "right")
      rects.push({ x: cx, y: cy - half, w: PIPE_SIZE / 2, h: PIPE_WIDTH });
    if (arm === "top")
      rects.push({ x: cx - half, y: pipe.y, w: PIPE_WIDTH, h: PIPE_SIZE / 2 });
    if (arm === "bottom")
      rects.push({ x: cx - half, y: cy, w: PIPE_WIDTH, h: PIPE_SIZE / 2 });
  }
  return rects;
}

function rotateArm(arm: string, turns: number): string {
  const arms = ["top", "right", "bottom", "left"];
  return arms[(arms.indexOf(arm) + turns) % 4];
}

function intakeDefinition(
  id: string,
  placed: PlacedIntake,
  dummy: boolean,
): LevelDefinition["intakes"][number] {
  const direction =
    placed.facing === "left"
      ? { x: -1, y: 0 }
      : placed.facing === "right"
        ? { x: 1, y: 0 }
        : placed.facing === "up"
          ? { x: 0, y: -1 }
          : { x: 0, y: 1 };
  const sensor = {
    x: placed.x + direction.x * 0.9,
    y: placed.y + direction.y * 0.9,
    r: 0.34,
  };
  return {
    id,
    ...clone(placed),
    dummy,
    sealed: dummy,
    ...(dummy
      ? {}
      : {
          sensor,
          pull: {
            x: sensor.x - 1.4,
            y: sensor.y - 1.4,
            w: 2.8,
            h: 2.8,
            targetX: sensor.x,
            targetY: sensor.y,
            strength: 1.05,
            maxSpeed: 10,
          },
        }),
  };
}

function intakeBody(placed: PlacedIntake, dummy: boolean): Rect {
  if (dummy) {
    const vertical = placed.facing === "up" || placed.facing === "down";
    const w = vertical ? 1.1 : 2.15;
    const h = vertical ? 2.15 : 1.1;
    return { x: placed.x - w / 2, y: placed.y - h / 2, w, h };
  }
  const horizontal = placed.facing === "left" || placed.facing === "right";
  const w = horizontal ? 0.7 : 1.35;
  const h = horizontal ? 1.35 : 0.7;
  const offsetX =
    placed.facing === "left" ? -0.15 : placed.facing === "right" ? 0.15 : 0;
  const offsetY =
    placed.facing === "up" ? -0.15 : placed.facing === "down" ? 0.15 : 0;
  return { x: placed.x + offsetX - w / 2, y: placed.y + offsetY - h / 2, w, h };
}

function gridRuns(grid: Uint8Array, value: number): Rect[] {
  const runs: Rect[] = [];
  for (let row = 0; row < ROWS; row++) {
    let col = 0;
    while (col < COLS) {
      if (grid[row * COLS + col] !== value) {
        col++;
        continue;
      }
      const start = col;
      while (col < COLS && grid[row * COLS + col] === value) col++;
      runs.push({
        x: start * CELL_SIZE,
        y: row * CELL_SIZE,
        w: (col - start) * CELL_SIZE,
        h: CELL_SIZE,
      });
    }
  }
  return runs;
}

function materialValue(material: TerrainMaterial): number {
  return material === "empty" ? 0 : material === "dirt" ? 1 : 2;
}
function forEachCell(callback: (point: Point, index: number) => void): void {
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++)
      callback(
        { x: (col + 0.5) * CELL_SIZE, y: (row + 0.5) * CELL_SIZE },
        row * COLS + col,
      );
}
function nearStroke(point: Point, points: Point[], radius: number): boolean {
  if (points.length === 1)
    return distance2(point, points[0]) <= radius * radius;
  for (let index = 1; index < points.length; index++)
    if (
      segmentDistance2(point, points[index - 1], points[index]) <=
      radius * radius
    )
      return true;
  return false;
}
function segmentDistance2(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length2 = dx * dx + dy * dy;
  const t = length2
    ? Math.max(
        0,
        Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2),
      )
    : 0;
  return (point.x - a.x - t * dx) ** 2 + (point.y - a.y - t * dy) ** 2;
}
function distance2(a: Point, b: Point): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}
function inRect(point: Point, area: Rect): boolean {
  return (
    point.x >= area.x &&
    point.x <= area.x + area.w &&
    point.y >= area.y &&
    point.y <= area.y + area.h
  );
}
function inPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (
    let index = 0, last = polygon.length - 1;
    index < polygon.length;
    last = index++
  ) {
    const a = polygon[index],
      b = polygon[last];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
function checkRect(
  area: Rect,
  label: string,
  issues: string[],
  minW = 0.15,
  minH = 0.15,
): void {
  if (
    ![area.x, area.y, area.w, area.h].every(finite) ||
    area.w < minW ||
    area.h < minH ||
    area.x < 0 ||
    area.y < 0 ||
    area.x + area.w > WORLD_WIDTH ||
    area.y + area.h > WORLD_HEIGHT
  )
    issues.push(`${label} must be a positive rectangle inside the playfield.`);
}
function insetRect(area: Rect, amount: number): Rect {
  return {
    x: area.x + amount,
    y: area.y + amount,
    w: Math.max(0, area.w - 2 * amount),
    h: Math.max(0, area.h - 2 * amount),
  };
}
function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
function checkPoint(
  point: Point,
  label: string,
  issues: string[],
  maxX = WORLD_WIDTH,
  maxY = WORLD_HEIGHT,
): void {
  if (
    !finite(point.x) ||
    !finite(point.y) ||
    point.x < 0 ||
    point.y < 0 ||
    point.x > maxX ||
    point.y > maxY
  )
    issues.push(`${label} must be inside the playfield.`);
}
function uniqueIds(
  items: Array<{ id: string }>,
  label: string,
  issues: string[],
): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (!isSafeLevelId(item.id))
      issues.push(`${label} id ${item.id || "(empty)"} is unsafe.`);
    if (ids.has(item.id)) issues.push(`Duplicate ${label} id: ${item.id}.`);
    ids.add(item.id);
  }
}
function nearInteger(value: number): boolean {
  return Math.abs(value - Math.round(value)) < 1e-6;
}
function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function clone<T>(value: T): T {
  return structuredClone(value);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value;
}
function string(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
  return value;
}
function number(value: unknown, label: string): number {
  if (!finite(value)) throw new Error(`${label} must be a finite number.`);
  return value;
}
function oneOf<const T extends readonly unknown[]>(
  value: unknown,
  choices: T,
  label: string,
): T[number] {
  if (!choices.includes(value)) throw new Error(`${label} is invalid.`);
  return value as T[number];
}
function point(value: unknown, label: string): Point {
  const source = record(value, label);
  return {
    x: number(source.x, `${label} x`),
    y: number(source.y, `${label} y`),
  };
}
function points(value: unknown, label: string): Point[] {
  return array(value, label).map((entry, index) =>
    point(entry, `${label} ${index + 1}`),
  );
}
function rect(value: Record<string, unknown>, label: string): Rect {
  return {
    ...point(value, label),
    w: number(value.w, `${label} width`),
    h: number(value.h, `${label} height`),
  };
}
function placedIntake(value: unknown, label: string): PlacedIntake {
  const source = record(value, label);
  return {
    ...point(source, label),
    facing: oneOf(
      source.facing,
      ["left", "right", "up", "down"] as const,
      `${label} facing`,
    ),
  };
}
