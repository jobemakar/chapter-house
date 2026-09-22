import Matter from "matter-js";
import { distance } from "./geometry";
import type { AirJetDefinition, Bounds, BubbleDefinition, CollisionId, CounterweightDefinition, ResetHazardDefinition, Vec, WorldElementDefinition } from "./types";

type TaggedPlugin = { keyfallCollisionId?: CollisionId };

export function tagCollision(body: Matter.Body, id: CollisionId): Matter.Body {
  (body.plugin as TaggedPlugin).keyfallCollisionId = id;
  body.label = id;
  return body;
}

export function collisionId(body: Matter.Body): CollisionId | undefined {
  return (body.plugin as TaggedPlugin).keyfallCollisionId;
}

export type BubbleSnapshot = Readonly<{ kind: "bubble"; id: string; position: Readonly<Vec>; radius: number; captured: boolean; popped: boolean }>;
export type AirJetSnapshot = Readonly<{ kind: "air-jet"; id: string; position: Readonly<Vec>; zone: Readonly<Bounds>; direction: Readonly<Vec>; mode: "continuous" | "tap"; active: boolean }>;
export type CounterweightSnapshot = Readonly<{ kind: "counterweight"; id: string; position: Readonly<Vec>; radius: number; angle: number }>;
export type ResetHazardSnapshot = Readonly<{ kind: "reset-hazard"; id: string; bounds: Readonly<Bounds>; reason: string; triggered: boolean }>;
export type WorldElementSnapshot = BubbleSnapshot | AirJetSnapshot | CounterweightSnapshot | ResetHazardSnapshot;

export type WorldElementContext = Readonly<{
  engine: Matter.Engine;
  key: Matter.Body;
  onHazard: (reason: string) => void;
}>;

export interface WorldElement {
  readonly id: string;
  create(context: WorldElementContext): void;
  fixedUpdate(stepMs: number): void;
  snapshot(): WorldElementSnapshot;
  handleCollision(event: Matter.IEventCollision<Matter.Engine>): void;
  handleTap(point: Vec): boolean;
  dispose(): void;
}

abstract class RuntimeElement {
  protected context?: WorldElementContext;
  abstract readonly id: string;
  create(context: WorldElementContext): void { this.context = context; }
  abstract fixedUpdate(stepMs: number): void;
  abstract snapshot(): WorldElementSnapshot;
  handleCollision(_event: Matter.IEventCollision<Matter.Engine>): void {}
  handleTap(_point: Vec): boolean { return false; }
  abstract dispose(): void;
  protected get runtime(): WorldElementContext {
    if (!this.context) throw new Error(`${this.id} has not been created`);
    return this.context;
  }
}

export class BubbleElement extends RuntimeElement implements WorldElement {
  readonly id: string;
  private sensor?: Matter.Body;
  private captured = false;
  private popped = false;

  constructor(private readonly definition: BubbleDefinition) { super(); this.id = definition.id; }

  override create(context: WorldElementContext): void {
    super.create(context);
    this.sensor = tagCollision(Matter.Bodies.circle(this.definition.position.x, this.definition.position.y, this.definition.captureRadius, {
      isStatic: true, isSensor: true, collisionFilter: { mask: 0 },
    }), "bubble");
    Matter.Composite.add(context.engine.world, this.sensor);
  }

  fixedUpdate(_stepMs: number): void {
    if (this.popped) return;
    if (!this.captured && distance(this.runtime.key.position as Vec, this.definition.position) <= this.definition.captureRadius + 21) this.capture();
    if (!this.captured) return;
    Matter.Body.applyForce(this.runtime.key, this.runtime.key.position, { x: 0, y: -this.definition.buoyancy * this.runtime.key.mass });
  }

  handleCollision(event: Matter.IEventCollision<Matter.Engine>): void {
    if (this.popped || !this.sensor) return;
    for (const pair of event.pairs) if ((pair.bodyA === this.sensor && pair.bodyB === this.runtime.key) || (pair.bodyB === this.sensor && pair.bodyA === this.runtime.key)) this.capture();
  }

  handleTap(point: Vec): boolean {
    const target = this.captured ? this.runtime.key.position as Vec : this.definition.position;
    if (this.popped || distance(point, target) > this.definition.popRadius) return false;
    this.popped = true;
    if (this.sensor) Matter.Composite.remove(this.runtime.engine.world, this.sensor);
    this.sensor = undefined;
    return true;
  }

  snapshot(): BubbleSnapshot { return Object.freeze({ kind: "bubble", id: this.id, position: freezeVec(this.captured ? this.runtime.key.position : this.definition.position), radius: this.definition.captureRadius, captured: this.captured, popped: this.popped }); }

  dispose(): void {
    if (!this.context) return;
    if (this.sensor) Matter.Composite.remove(this.context.engine.world, this.sensor);
    this.sensor = undefined; this.captured = false; this.popped = false; this.context = undefined;
  }

  private capture(): void {
    if (this.captured || this.popped) return;
    this.captured = true;
    if (this.sensor) Matter.Composite.remove(this.runtime.engine.world, this.sensor);
    this.sensor = undefined;
  }
}

export class AirJetElement extends RuntimeElement implements WorldElement {
  readonly id: string;
  private zoneBody?: Matter.Body;
  private active = false;
  private tapFeedbackTicks = 0;
  private readonly direction: Vec;

  constructor(private readonly definition: AirJetDefinition) {
    super(); this.id = definition.id;
    const length = Math.hypot(definition.direction.x, definition.direction.y) || 1;
    this.direction = { x: definition.direction.x / length, y: definition.direction.y / length };
  }

  override create(context: WorldElementContext): void {
    super.create(context);
    const z = this.definition.zone;
    this.zoneBody = tagCollision(Matter.Bodies.rectangle(z.x + z.width / 2, z.y + z.height / 2, z.width, z.height, { isStatic: true, isSensor: true, collisionFilter: { mask: 0 } }), "air-zone");
    Matter.Composite.add(context.engine.world, this.zoneBody);
  }

  fixedUpdate(_stepMs: number): void {
    if (this.definition.mode === "continuous") {
      this.active = inBounds(this.runtime.key.position as Vec, this.definition.zone);
      if (this.active) this.applyForce();
      return;
    }
    if (this.tapFeedbackTicks > 0) this.tapFeedbackTicks -= 1;
    this.active = this.tapFeedbackTicks > 0;
  }

  handleTap(point: Vec): boolean {
    if (this.definition.mode !== "tap" || distance(point, this.definition.position) > this.definition.tapRadius) return false;
    this.active = true;
    this.tapFeedbackTicks = AIR_JET_TAP_FEEDBACK_TICKS;
    if (inBounds(this.runtime.key.position as Vec, this.definition.zone)) this.applyForce();
    return true;
  }

  snapshot(): AirJetSnapshot { return Object.freeze({ kind: "air-jet" as const, id: this.id, position: freezeVec(this.definition.position), zone: freezeBounds(this.definition.zone), direction: freezeVec(this.direction), mode: this.definition.mode, active: this.active }); }
  dispose(): void { if (this.context && this.zoneBody) Matter.Composite.remove(this.context.engine.world, this.zoneBody); this.zoneBody = undefined; this.active = false; this.tapFeedbackTicks = 0; this.context = undefined; }
  private applyForce(): void { Matter.Body.applyForce(this.runtime.key, this.runtime.key.position, { x: this.direction.x * this.definition.strength, y: this.direction.y * this.definition.strength }); }
}

export class CounterweightElement extends RuntimeElement implements WorldElement {
  readonly id: string;
  private body?: Matter.Body;
  constructor(private readonly definition: CounterweightDefinition) { super(); this.id = definition.id; }
  override create(context: WorldElementContext): void {
    super.create(context);
    this.body = tagCollision(Matter.Bodies.circle(this.definition.position.x, this.definition.position.y, this.definition.radius, { restitution: this.definition.restitution, frictionAir: 0.006 }), "counterweight");
    Matter.Body.setMass(this.body, this.definition.mass);
    Matter.Composite.add(context.engine.world, this.body);
  }
  fixedUpdate(_stepMs: number): void {}
  snapshot(): CounterweightSnapshot { const body = this.body; return Object.freeze({ kind: "counterweight", id: this.id, position: freezeVec(body?.position ?? this.definition.position), radius: this.definition.radius, angle: body?.angle ?? 0 }); }
  dispose(): void { if (this.context && this.body) Matter.Composite.remove(this.context.engine.world, this.body); this.body = undefined; this.context = undefined; }
  get runtimeBody(): Matter.Body | undefined { return this.body; }
}

export class ResetHazardElement extends RuntimeElement implements WorldElement {
  readonly id: string;
  private sensor?: Matter.Body;
  private triggered = false;
  constructor(private readonly definition: ResetHazardDefinition) { super(); this.id = definition.id; }
  override create(context: WorldElementContext): void {
    super.create(context); const b = definitionCenter(this.definition.bounds);
    this.sensor = tagCollision(Matter.Bodies.rectangle(b.x, b.y, this.definition.bounds.width, this.definition.bounds.height, { isStatic: true, isSensor: true }), "hazard");
    Matter.Composite.add(context.engine.world, this.sensor);
  }
  fixedUpdate(_stepMs: number): void { if (!this.triggered && inBounds(this.runtime.key.position as Vec, this.definition.bounds)) this.trigger(); }
  handleCollision(event: Matter.IEventCollision<Matter.Engine>): void { if (!this.sensor || this.triggered) return; for (const pair of event.pairs) if ((pair.bodyA === this.sensor && pair.bodyB === this.runtime.key) || (pair.bodyB === this.sensor && pair.bodyA === this.runtime.key)) this.trigger(); }
  snapshot(): ResetHazardSnapshot { return Object.freeze({ kind: "reset-hazard", id: this.id, bounds: freezeBounds(this.definition.bounds), reason: this.definition.reason, triggered: this.triggered }); }
  dispose(): void { if (this.context && this.sensor) Matter.Composite.remove(this.context.engine.world, this.sensor); this.sensor = undefined; this.triggered = false; this.context = undefined; }
  private trigger(): void { if (this.triggered) return; this.triggered = true; this.runtime.onHazard(this.definition.reason); }
}

export class WorldElementFactory {
  create(definition: WorldElementDefinition): WorldElement {
    switch (definition.kind) {
      case "bubble": return new BubbleElement(definition);
      case "air-jet": return new AirJetElement(definition);
      case "counterweight": return new CounterweightElement(definition);
      case "reset-hazard": return new ResetHazardElement(definition);
    }
  }
}

function inBounds(point: Vec, bounds: Bounds): boolean { return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height; }
function definitionCenter(bounds: Bounds): Vec { return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }; }
function freezeVec(value: Vec): Readonly<Vec> { return Object.freeze({ x: value.x, y: value.y }); }
function freezeBounds(value: Bounds): Readonly<Bounds> { return Object.freeze({ x: value.x, y: value.y, width: value.width, height: value.height }); }

export const AIR_JET_TAP_FEEDBACK_TICKS = 6;
