import Matter from "matter-js";
import type { CordDefinition, PropDefinition, RoomDefinition, Vec, Viewport } from "./types";
import { GAME_VIEWPORT } from "./rooms";
import { collisionId, tagCollision, WorldElementFactory, type WorldElement, type WorldElementSnapshot } from "./elements";

/**
 * Jobe's current feel baseline. Lower stiffness stretches farther; lower damping
 * bounces longer. Reset the room or reload after editing these captured values.
 */
export const CORD_TUNING = Object.freeze({ stiffness: 0.002, damping: 0.001 });
export const PHYSICS_TUNING = Object.freeze({
  gravityY: 0.82, keyRadius: 21, keyRestitution: 0.44,
  keyFrictionAir: 0.01, keyDensity: 0.002, bumperRestitution: 1.16,
  positionIterations: 6, velocityIterations: 4, constraintIterations: 2,
  cordPointSpacing: 9, cordPointRadius: 2.5, cordMassPerPixel: 0.02,
  cordFragmentLifetimeMs: 950,
});

/** A physical rope with consistent point density and mass per unit length. */
export class ArticulatedCord {
  readonly id: string;
  readonly length: number;
  readonly stiffness = CORD_TUNING.stiffness;
  readonly damping = CORD_TUNING.damping;
  readonly nodes: Matter.Body[] = [];
  readonly constraints: Matter.Constraint[] = [];
  private cutIndex?: number;
  private cutAgeMs = 0;
  private removed = false;

  constructor(readonly anchor: Matter.Body, readonly key: Matter.Body, definition: CordDefinition) {
    this.id = definition.id;
    this.length = Math.max(8, Math.hypot(definition.anchor.x - key.position.x, definition.anchor.y - key.position.y));
    const connectionCount = Math.max(7, Math.round(this.length / PHYSICS_TUNING.cordPointSpacing));
    const connectionLength = this.length / connectionCount;
    const dx = key.position.x - definition.anchor.x, dy = key.position.y - definition.anchor.y;
    for (let index = 1; index < connectionCount; index += 1) {
      const node = tagCollision(Matter.Bodies.circle(
        definition.anchor.x + dx * index / connectionCount,
        definition.anchor.y + dy * index / connectionCount,
        PHYSICS_TUNING.cordPointRadius,
        { frictionAir: 0.012, collisionFilter: { mask: 0 } },
      ), "cord-link");
      Matter.Body.setMass(node, PHYSICS_TUNING.cordMassPerPixel * connectionLength);
      this.nodes.push(node);
    }
    const points = [anchor, ...this.nodes, key];
    // A chain's correction must propagate across N links. N² compensation
    // keeps the whole-rope feel comparable as point count changes, while the
    // point masses and gravity still create the bend emergently.
    const linkStiffness = Math.min(0.98, 1 - Math.exp(-CORD_TUNING.stiffness * connectionCount ** 3));
    for (let index = 0; index < connectionCount; index += 1) {
      this.constraints.push(Matter.Constraint.create({
        bodyA: points[index], bodyB: points[index + 1], length: connectionLength,
        stiffness: linkStiffness, damping: CORD_TUNING.damping,
        label: `cord:${this.id}:${index}`,
      }));
    }
  }

  get intact(): boolean { return this.cutIndex === undefined; }
  get expired(): boolean { return this.removed; }
  get opacity(): number { return this.intact ? 1 : Math.max(0, 1 - this.cutAgeMs / PHYSICS_TUNING.cordFragmentLifetimeMs); }
  get points(): readonly Vec[] { return [this.anchor.position, ...this.nodes.map((node) => node.position), this.key.position]; }
  get paths(): readonly (readonly Vec[])[] {
    const points = this.points;
    if (this.cutIndex === undefined) return [points];
    const ropePoints = points.slice(0, -1);
    return [ropePoints.slice(0, this.cutIndex + 1), ropePoints.slice(this.cutIndex + 1)].filter((path) => path.length > 1);
  }

  addTo(composite: Matter.Composite): void { Matter.Composite.add(composite, [...this.nodes, ...this.constraints]); }
  cut(composite: Matter.Composite, segmentIndex: number): boolean {
    if (!this.intact) return false;
    this.cutIndex = Math.max(0, Math.min(this.constraints.length - 1, segmentIndex));
    Matter.Composite.remove(composite, this.constraints[this.cutIndex]);
    const keyConnection = this.constraints[this.constraints.length - 1];
    if (keyConnection !== this.constraints[this.cutIndex]) Matter.Composite.remove(composite, keyConnection);
    return true;
  }
  update(composite: Matter.Composite, deltaMs: number): void {
    if (this.intact || this.removed) return;
    this.cutAgeMs += Math.max(0, deltaMs);
    if (this.cutAgeMs < PHYSICS_TUNING.cordFragmentLifetimeMs) return;
    for (const constraint of this.constraints) Matter.Composite.remove(composite, constraint);
    for (const node of this.nodes) Matter.Composite.remove(composite, node);
    this.removed = true;
  }
}

export class PhysicsRoom {
  readonly engine: Matter.Engine;
  readonly key: Matter.Body;
  readonly goal: Matter.Body;
  readonly cords = new Map<string, ArticulatedCord>();
  readonly anchors = new Map<string, Matter.Body>();
  readonly tickets = new Map<string, Matter.Body>();
  readonly props = new Map<string, Matter.Body>();
  readonly elements: readonly WorldElement[];
  private readonly collisionHandler: (event: Matter.IEventCollision<Matter.Engine>) => void;
  private readonly hazardReasons: string[] = [];
  private disposed = false;

  constructor(readonly room: RoomDefinition, readonly viewport: Viewport = GAME_VIEWPORT, factory = new WorldElementFactory()) {
  const engine = this.engine = Matter.Engine.create({ enableSleeping: false });
  engine.gravity.y = PHYSICS_TUNING.gravityY;
  engine.positionIterations = PHYSICS_TUNING.positionIterations;
  engine.velocityIterations = PHYSICS_TUNING.velocityIterations;
  engine.constraintIterations = PHYSICS_TUNING.constraintIterations;
  const key = this.key = tagCollision(Matter.Bodies.circle(room.keyStart.x, room.keyStart.y, PHYSICS_TUNING.keyRadius, { restitution: PHYSICS_TUNING.keyRestitution, frictionAir: PHYSICS_TUNING.keyFrictionAir, density: PHYSICS_TUNING.keyDensity }), "key");
  const goal = this.goal = tagCollision(Matter.Bodies.circle(room.goal.x, room.goal.y, 34, { isStatic: true, isSensor: true }), "goal");
  const walls = [tagCollision(Matter.Bodies.rectangle(viewport.width / 2, -18, viewport.width, 36, { isStatic: true }), "bumper")];
  for (const definition of room.cords) {
    const anchor = tagCollision(Matter.Bodies.circle(definition.anchor.x, definition.anchor.y, 5, { isStatic: true, collisionFilter: { mask: 0 } }), "cord-link");
    const cord = new ArticulatedCord(anchor, key, definition);
    this.anchors.set(definition.id, anchor); this.cords.set(definition.id, cord);
  }
  for (const ticket of room.tickets) this.tickets.set(ticket.id, tagCollision(Matter.Bodies.circle(ticket.position.x, ticket.position.y, 15, { isStatic: true, isSensor: true }), "ticket"));
  room.props.forEach((prop, index) => this.props.set(`${prop.kind}-${index}`, prop.kind === "bumper" ? tagCollision(Matter.Bodies.circle(prop.position.x, prop.position.y, prop.radius, { isStatic: true, restitution: PHYSICS_TUNING.bumperRestitution }), "bumper") : tagCollision(Matter.Bodies.rectangle(prop.position.x, prop.position.y, prop.radius * 1.45, prop.radius * 0.75, { isStatic: true, isSensor: true }), "air-zone")));
  Matter.Composite.add(engine.world, [key, goal, ...walls, ...this.anchors.values(), ...this.tickets.values(), ...this.props.values()]);
  for (const cord of this.cords.values()) cord.addTo(engine.world);
  this.elements = Object.freeze((room.elements ?? []).map((definition) => factory.create(definition)));
  for (const element of this.elements) element.create({ engine, key, onHazard: (reason) => this.hazardReasons.push(reason) });
  this.collisionHandler = (event) => { for (const element of this.elements) element.handleCollision(event); };
  Matter.Events.on(engine, "collisionStart", this.collisionHandler);
  }

  fixedUpdate(stepMs: number): void {
    if (this.disposed) return;
    for (const element of this.elements) element.fixedUpdate(stepMs);
    Matter.Engine.update(this.engine, stepMs);
    updateCordFragments(this, stepMs);
  }
  handleTap(point: Vec): boolean { for (const element of this.elements) if (element.handleTap(point)) return true; return false; }
  elementSnapshots(): readonly WorldElementSnapshot[] { return Object.freeze(this.elements.map((element) => element.snapshot())); }
  consumeHazardReset(): string | undefined { return this.hazardReasons.shift(); }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    Matter.Events.off(this.engine, "collisionStart", this.collisionHandler);
    for (const element of this.elements) element.dispose();
    Matter.Composite.clear(this.engine.world, false, true);
    Matter.Engine.clear(this.engine);
    this.hazardReasons.length = 0;
  }
}

export type KeyfallWorld = PhysicsRoom;
export function makeWorld(room: RoomDefinition, viewport: Viewport = GAME_VIEWPORT): KeyfallWorld { return new PhysicsRoom(room, viewport); }

export function applyOpeningImpulse(world: KeyfallWorld, reducedMotion: boolean): void { Matter.Body.setVelocity(world.key, { x: reducedMotion ? 0.25 : 0.75, y: 0 }); }
export function removeCord(world: KeyfallWorld, cordId: string, segmentIndex?: number): boolean {
  const cord = world.cords.get(cordId);
  return cord?.cut(world.engine.world, segmentIndex ?? Math.floor(cord.constraints.length / 2)) ?? false;
}
export function updateCordFragments(world: KeyfallWorld, deltaMs: number): void { for (const cord of world.cords.values()) cord.update(world.engine.world, deltaMs); }
export function puff(world: KeyfallWorld, direction: Vec = { x: 1, y: -0.2 }): void { Matter.Body.applyForce(world.key, world.key.position, { x: direction.x * 0.09, y: direction.y * 0.09 }); }
export function resetVelocity(world: KeyfallWorld): void { Matter.Body.setVelocity(world.key, { x: 0, y: 0 }); Matter.Body.setAngularVelocity(world.key, 0); }
export function propFor(world: KeyfallWorld, prop: PropDefinition, index: number): Matter.Body | undefined { return world.props.get(`${prop.kind}-${index}`); }
export { collisionId };
