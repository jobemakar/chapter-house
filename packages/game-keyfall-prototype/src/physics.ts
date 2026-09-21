import Matter from "matter-js";
import type { CordDefinition, PropDefinition, RoomDefinition, Vec } from "./types";

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
      const node = Matter.Bodies.circle(
        definition.anchor.x + dx * index / connectionCount,
        definition.anchor.y + dy * index / connectionCount,
        PHYSICS_TUNING.cordPointRadius,
        { label: `cord-node:${this.id}:${index}`, frictionAir: 0.012, collisionFilter: { mask: 0 } },
      );
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

export type KeyfallWorld = {
  engine: Matter.Engine; key: Matter.Body; goal: Matter.Body;
  cords: Map<string, ArticulatedCord>; anchors: Map<string, Matter.Body>;
  tickets: Map<string, Matter.Body>; props: Map<string, Matter.Body>;
};

export function makeWorld(room: RoomDefinition): KeyfallWorld {
  const engine = Matter.Engine.create({ enableSleeping: false });
  engine.gravity.y = PHYSICS_TUNING.gravityY;
  engine.positionIterations = PHYSICS_TUNING.positionIterations;
  engine.velocityIterations = PHYSICS_TUNING.velocityIterations;
  engine.constraintIterations = PHYSICS_TUNING.constraintIterations;
  const key = Matter.Bodies.circle(room.keyStart.x, room.keyStart.y, PHYSICS_TUNING.keyRadius, { label: "key", restitution: PHYSICS_TUNING.keyRestitution, frictionAir: PHYSICS_TUNING.keyFrictionAir, density: PHYSICS_TUNING.keyDensity });
  const goal = Matter.Bodies.circle(room.goal.x, room.goal.y, 34, { isStatic: true, isSensor: true, label: "goal" });
  const walls = [Matter.Bodies.rectangle(400, -18, 800, 36, { isStatic: true })];
  const cords = new Map<string, ArticulatedCord>(), anchors = new Map<string, Matter.Body>();
  for (const definition of room.cords) {
    const anchor = Matter.Bodies.circle(definition.anchor.x, definition.anchor.y, 5, { isStatic: true, label: `anchor:${definition.id}` });
    const cord = new ArticulatedCord(anchor, key, definition);
    anchors.set(definition.id, anchor); cords.set(definition.id, cord);
  }
  const tickets = new Map<string, Matter.Body>();
  for (const ticket of room.tickets) tickets.set(ticket.id, Matter.Bodies.circle(ticket.position.x, ticket.position.y, 15, { isStatic: true, isSensor: true, label: `ticket:${ticket.id}` }));
  const props = new Map<string, Matter.Body>();
  room.props.forEach((prop, index) => props.set(`${prop.kind}-${index}`, prop.kind === "bumper" ? Matter.Bodies.circle(prop.position.x, prop.position.y, prop.radius, { isStatic: true, restitution: PHYSICS_TUNING.bumperRestitution, label: "bumper" }) : Matter.Bodies.rectangle(prop.position.x, prop.position.y, prop.radius * 1.45, prop.radius * 0.75, { isStatic: true, isSensor: true, label: "bellows" })));
  Matter.Composite.add(engine.world, [key, goal, ...walls, ...anchors.values(), ...tickets.values(), ...props.values()]);
  for (const cord of cords.values()) cord.addTo(engine.world);
  return { engine, key, goal, cords, anchors, tickets, props };
}

export function applyOpeningImpulse(world: KeyfallWorld, reducedMotion: boolean): void { Matter.Body.setVelocity(world.key, { x: reducedMotion ? 0.25 : 0.75, y: 0 }); }
export function removeCord(world: KeyfallWorld, cordId: string, segmentIndex?: number): boolean {
  const cord = world.cords.get(cordId);
  return cord?.cut(world.engine.world, segmentIndex ?? Math.floor(cord.constraints.length / 2)) ?? false;
}
export function updateCordFragments(world: KeyfallWorld, deltaMs: number): void { for (const cord of world.cords.values()) cord.update(world.engine.world, deltaMs); }
export function puff(world: KeyfallWorld, direction: Vec = { x: 1, y: -0.2 }): void { Matter.Body.applyForce(world.key, world.key.position, { x: direction.x * 0.09, y: direction.y * 0.09 }); }
export function resetVelocity(world: KeyfallWorld): void { Matter.Body.setVelocity(world.key, { x: 0, y: 0 }); Matter.Body.setAngularVelocity(world.key, 0); }
export function propFor(world: KeyfallWorld, prop: PropDefinition, index: number): Matter.Body | undefined { return world.props.get(`${prop.kind}-${index}`); }
