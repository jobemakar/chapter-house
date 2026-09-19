import type {
  Canteen,
  Intake,
  LevelDefinition,
  LevelSnapshot,
  LiquidFun,
  Point,
  Rect,
  Reservoir,
  Rock,
  Sensor,
} from "./types";

export const WORLD_WIDTH = 12;
export const WORLD_HEIGHT = 15;
export const CELL_SIZE = 0.15;
export const COLS = 80;
export const ROWS = 100;

/** Owns LiquidFun objects, terrain rebuilding, scoring and reset-safe simulation state. */
export class WaterSimulation {
  readonly B: LiquidFun;
  readonly config: LevelDefinition;
  world!: any;
  water!: any;
  bodies = new Set<any>();
  rows: Array<any | undefined> = [];
  grid = new Uint8Array(COLS * ROWS);
  colliders: Rect[] = [];
  rocks: Rock[] = [];
  rockColliders: Rect[] = [];
  protected: Rect[] = [];
  canteens: Canteen[] = [];
  collected = 0;
  required = 0;
  initialCount = 0;
  won = false;
  steps = 0;
  dug = 0;
  dirty = true;
  wasted = 0;
  lastDelivery = -999;
  lastWaste = -999;
  lastBlocked = -999;

  constructor(B: LiquidFun, config: LevelDefinition) {
    this.B = B;
    this.config = config;
    this.reset();
  }

  reset(): void {
    const B = this.B;
    if (this.world) this.disposeWorld();
    this.bodies = new Set();
    this.rows = [];
    this.collected = 0;
    this.won = false;
    this.steps = 0;
    this.dug = 0;
    this.dirty = true;
    this.wasted = 0;
    this.lastDelivery = -999;
    this.lastWaste = -999;
    this.lastBlocked = -999;
    this.canteens = this.config.canteens.map((canteen) => ({
      ...canteen,
      filled: false,
      filledAt: -1,
    }));
    this.rocks = this.config.rocks;
    this.rockColliders = this.rocks.map((rock) => {
      const inset = rock.inset ?? 0;
      return {
        x: rock.x + inset,
        y: rock.y + inset,
        w: rock.w - 2 * inset,
        h: rock.h - 2 * inset,
      };
    });
    this.protected = this.config.protected;
    const reservoir = this.config.reservoir;
    this.colliders = [
      { x: -0.3, y: -0.3, w: 0.3, h: WORLD_HEIGHT + 0.3 },
      { x: WORLD_WIDTH, y: -0.3, w: 0.3, h: WORLD_HEIGHT + 0.3 },
      { x: -0.3, y: -0.3, w: WORLD_WIDTH + 0.6, h: 0.3 },
      { x: 0, y: this.config.floor, w: WORLD_WIDTH, h: 0.3 },
      { x: reservoir.left, y: 0, w: 0.2, h: reservoir.height },
      { x: reservoir.right, y: 0, w: 0.2, h: reservoir.height },
      ...this.rockColliders,
      ...this.protected,
      ...this.config.fixtures,
    ];
    const gravity = new B.b2Vec2(0, 10);
    this.world = new B.b2World(gravity);
    B.destroy(gravity);
    this.grid = new Uint8Array(COLS * ROWS);
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++) {
        const point = {
          x: (col + 0.5) * CELL_SIZE,
          y: (row + 0.5) * CELL_SIZE,
        };
        this.grid[row * COLS + col] =
          this.config.soil.some((polygon) =>
            WaterSimulation.inPolygon(point, polygon),
          ) &&
          !this.config.pockets.some((pocket) =>
            WaterSimulation.inRect(point, pocket),
          )
            ? 1
            : 0;
      }
    this.colliders.forEach((collider) => this.rect(collider));
    for (let row = 0; row < ROWS; row++) this.rebuildRow(row);
    const definition = new B.b2ParticleSystemDef();
    definition.set_radius(0.073);
    definition.set_dampingStrength(0.7);
    definition.set_gravityScale(1);
    definition.set_strictContactCheck(true);
    this.water = this.world.CreateParticleSystem(definition);
    B.destroy(definition);
    this.createReservoir(reservoir);
    this.initialCount = this.water.GetParticleCount();
    this.required = this.config.required;
  }

  /** Releases LiquidFun allocations when an embedded game is unmounted. */
  dispose(): void {
    if (!this.world) return;
    this.disposeWorld();
    this.world = undefined;
    this.water = undefined;
    this.bodies.clear();
    this.rows = [];
  }

  private disposeWorld(): void {
    const B = this.B;
    for (const body of this.bodies)
      delete B.getCache(B.b2Body)[B.getPointer(body)];
    delete B.getCache(B.b2ParticleSystem)[B.getPointer(this.water)];
    B.destroy(this.world);
  }

  private createReservoir(reservoir: Reservoir): void {
    const B = this.B;
    const shape = new B.b2PolygonShape();
    const center = new B.b2Vec2(reservoir.centerX, reservoir.centerY);
    shape.SetAsBox(reservoir.halfW, reservoir.halfH, center, 0);
    const group = new B.b2ParticleGroupDef();
    group.set_shape(shape);
    group.set_flags(B.b2_waterParticle);
    const created = this.water.CreateParticleGroup(group);
    delete B.getCache(B.b2ParticleGroup)[B.getPointer(created)];
    B.destroy(group);
    B.destroy(shape);
    B.destroy(center);
  }

  private rect(rect: Rect, body?: any): any {
    const B = this.B;
    if (!body) {
      const definition = new B.b2BodyDef();
      body = this.world.CreateBody(definition);
      B.destroy(definition);
      this.bodies.add(body);
    }
    const shape = new B.b2PolygonShape();
    const center = new B.b2Vec2(rect.x + rect.w / 2, rect.y + rect.h / 2);
    shape.SetAsBox(rect.w / 2, rect.h / 2, center, 0);
    const fixture = body.CreateFixture(shape, 0);
    delete B.getCache(B.b2Fixture)[B.getPointer(fixture)];
    B.destroy(shape);
    B.destroy(center);
    return body;
  }

  private rebuildRow(row: number): void {
    const old = this.rows[row];
    if (old) {
      this.world.DestroyBody(old);
      this.bodies.delete(old);
      delete this.B.getCache(this.B.b2Body)[this.B.getPointer(old)];
    }
    let body: any | undefined;
    for (let col = 0; col < COLS;) {
      if (!this.grid[row * COLS + col]) {
        col++;
        continue;
      }
      const start = col;
      while (col < COLS && this.grid[row * COLS + col]) col++;
      body = this.rect(
        {
          x: start * CELL_SIZE,
          y: row * CELL_SIZE,
          w: (col - start) * CELL_SIZE,
          h: CELL_SIZE,
        },
        body,
      );
    }
    this.rows[row] = body;
  }

  digLine(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    radius = 0.46,
  ): number {
    if (this.won) return 0;
    const changed = new Set<number>();
    const dx = bx - ax;
    const dy = by - ay;
    const length2 = dx * dx + dy * dy;
    const row0 = Math.max(
      0,
      Math.floor((Math.min(ay, by) - radius) / CELL_SIZE),
    );
    const row1 = Math.min(
      ROWS - 1,
      Math.ceil((Math.max(ay, by) + radius) / CELL_SIZE),
    );
    const col0 = Math.max(
      0,
      Math.floor((Math.min(ax, bx) - radius) / CELL_SIZE),
    );
    const col1 = Math.min(
      COLS - 1,
      Math.ceil((Math.max(ax, bx) + radius) / CELL_SIZE),
    );
    let removed = 0;
    for (let row = row0; row <= row1; row++)
      for (let col = col0; col <= col1; col++) {
        const point = {
          x: (col + 0.5) * CELL_SIZE,
          y: (row + 0.5) * CELL_SIZE,
        };
        if (
          this.rockColliders.some((rock) =>
            WaterSimulation.inRect(point, rock),
          ) ||
          this.protected.some((strip) => WaterSimulation.inRect(point, strip))
        )
          continue;
        const progress = length2
          ? Math.max(
              0,
              Math.min(
                1,
                ((point.x - ax) * dx + (point.y - ay) * dy) / length2,
              ),
            )
          : 0;
        const distance2 =
          (point.x - ax - progress * dx) ** 2 +
          (point.y - ay - progress * dy) ** 2;
        if (distance2 <= radius * radius && this.grid[row * COLS + col]) {
          this.grid[row * COLS + col] = 0;
          changed.add(row);
          removed++;
        }
      }
    changed.forEach((row) => this.rebuildRow(row));
    if (removed) {
      this.dug += removed;
      this.dirty = true;
    }
    return removed;
  }

  positions(): Float32Array {
    return this.buffer(this.water.GetPositionBuffer());
  }
  private velocities(): Float32Array {
    return this.buffer(this.water.GetVelocityBuffer());
  }
  private buffer(pointer: any): Float32Array {
    const offset = this.B.getPointer(pointer) >>> 2;
    delete this.B.getCache(this.B.b2Vec2)[this.B.getPointer(pointer)];
    return this.B.HEAPF32.subarray(
      offset,
      offset + 2 * this.water.GetParticleCount(),
    );
  }
  solidAt(x: number, y: number): boolean {
    const row = Math.floor(y / CELL_SIZE);
    const col = Math.floor(x / CELL_SIZE);
    return Boolean(
      (row >= 0 &&
        row < ROWS &&
        col >= 0 &&
        col < COLS &&
        this.grid[row * COLS + col]) ||
      this.colliders.some((collider) =>
        WaterSimulation.inRect({ x, y }, collider),
      ),
    );
  }

  step(): void {
    this.world.Step(1 / 60, 6, 3, 3);
    this.steps++;
    const positions = this.positions();
    const velocities = this.velocities();
    for (let index = 0; index < positions.length / 2; index++) {
      const point = { x: positions[2 * index], y: positions[2 * index + 1] };
      for (const canteen of this.canteens)
        if (
          !canteen.filled &&
          (point.x - canteen.x) ** 2 + (point.y - canteen.y) ** 2 < 0.44 ** 2
        ) {
          canteen.filled = true;
          canteen.filledAt = this.steps;
        }
      if (
        this.config.intakes.some(
          (intake) =>
            intake.sealed &&
            Math.abs(point.x - intake.x) < 0.75 &&
            Math.abs(point.y - intake.y) < 1.35,
        )
      )
        this.lastBlocked = this.steps;
      const pull = this.config.intakes.find(
        (intake) => intake.pull && WaterSimulation.inRect(point, intake.pull),
      )?.pull;
      if (pull) {
        const dx = pull.targetX - point.x;
        const dy = pull.targetY - point.y;
        const strength = pull.strength ?? 0.12;
        const max = pull.maxSpeed ?? 3;
        velocities[2 * index] = Math.max(
          -max,
          Math.min(max, velocities[2 * index] + dx * strength),
        );
        velocities[2 * index + 1] = Math.max(
          -max,
          Math.min(max, velocities[2 * index + 1] + dy * strength),
        );
      }
      const intake = this.config.intakes.find(
        (candidate) =>
          candidate.sensor && WaterSimulation.inSensor(point, candidate.sensor),
      );
      if (intake) {
        if (intake.dummy) {
          this.wasted++;
          this.lastWaste = this.steps;
        } else {
          this.collected++;
          this.lastDelivery = this.steps;
        }
        this.water.DestroyParticle(index);
      }
    }
    if (this.collected >= this.required) this.won = true;
  }

  snapshot(): LevelSnapshot {
    return {
      water: this.water.GetParticleCount(),
      initialWater: this.initialCount,
      collected: this.collected,
      required: this.required,
      won: this.won,
      dug: this.dug,
      steps: this.steps,
      wasted: this.wasted,
      canteens: this.canteens.map((canteen) => canteen.filled),
      canteenFillSteps: this.canteens.map((canteen) => canteen.filledAt),
      lastDelivery: this.lastDelivery,
      lastWaste: this.lastWaste,
      lastBlocked: this.lastBlocked,
      level: this.config.id,
    };
  }
  static inRect(point: Point, rect: Rect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h
    );
  }
  static inSensor(point: Point, sensor: Sensor): boolean {
    return sensor.r === undefined
      ? WaterSimulation.inRect(point, sensor as Rect)
      : (point.x - sensor.x) ** 2 + (point.y - sensor.y) ** 2 <= sensor.r ** 2;
  }
  static inPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (
      let index = 0, last = polygon.length - 1;
      index < polygon.length;
      last = index++
    ) {
      const a = polygon[index];
      const b = polygon[last];
      if (
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      )
        inside = !inside;
    }
    return inside;
  }
}
