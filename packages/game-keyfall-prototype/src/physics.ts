import Matter from "matter-js";
import type { PropDefinition, RoomDefinition, Vec } from "./types";

export type KeyfallWorld = { engine: Matter.Engine; key: Matter.Body; goal: Matter.Body; cords: Map<string, Matter.Constraint>; anchors: Map<string, Matter.Body>; tickets: Map<string, Matter.Body>; props: Map<string, Matter.Body> };
/**
 * Central Matter tuning for the exploratory elasticity trial. Matter's
 * constraint stiffness is normalized from 0 to 1: 0.001 deliberately allows a
 * visible 25–35% spring extension while damping 0.05 keeps the rebound lively
 * and finite. Lower stiffness stretches farther; lower damping bounces longer.
 * Rest lengths are still authored anchor-to-key distances. Reset the room or
 * reload the page after editing: each constraint copies these values at creation.
 */
export const CORD_TUNING = Object.freeze({ stiffness: 0.001, damping: 0.05 });
/** Other physics knobs live here so changes to the cord trial stay legible. */
export const PHYSICS_TUNING = Object.freeze({ gravityY: 0.82, keyRadius: 21, keyRestitution: 0.44, keyFrictionAir: 0.01, keyDensity: 0.002, bumperRestitution: 1.16, positionIterations: 6, velocityIterations: 4, constraintIterations: 2 });
export function makeWorld(room: RoomDefinition): KeyfallWorld {
  const engine = Matter.Engine.create({ enableSleeping: false });
  engine.gravity.y = PHYSICS_TUNING.gravityY;
  engine.positionIterations = PHYSICS_TUNING.positionIterations;
  engine.velocityIterations = PHYSICS_TUNING.velocityIterations;
  engine.constraintIterations = PHYSICS_TUNING.constraintIterations;
  const key = Matter.Bodies.circle(room.keyStart.x, room.keyStart.y, PHYSICS_TUNING.keyRadius, { label: "key", restitution: PHYSICS_TUNING.keyRestitution, frictionAir: PHYSICS_TUNING.keyFrictionAir, density: PHYSICS_TUNING.keyDensity });
  const goal = Matter.Bodies.circle(room.goal.x, room.goal.y, 34, { isStatic: true, isSensor: true, label: "goal" });
  // Keep only a ceiling; a missed key must be able to leave the playfield.
  const walls = [Matter.Bodies.rectangle(400, -18, 800, 36, { isStatic: true })];
  const cords = new Map<string, Matter.Constraint>(), anchors = new Map<string, Matter.Body>();
  for (const cord of room.cords) {
    const anchor = Matter.Bodies.circle(cord.anchor.x, cord.anchor.y, 5, { isStatic: true, label: `anchor:${cord.id}` });
    // Constraint length is the actual distance between the authored anchor and
    // initial key position; the cord angle/length only describes its artwork.
    const length = Math.max(8, Math.hypot(cord.anchor.x - room.keyStart.x, cord.anchor.y - room.keyStart.y));
    const constraint = Matter.Constraint.create({ bodyA: anchor, bodyB: key, length, stiffness: CORD_TUNING.stiffness, damping: CORD_TUNING.damping, label: `cord:${cord.id}` });
    anchors.set(cord.id, anchor); cords.set(cord.id, constraint);
  }
  const tickets = new Map<string, Matter.Body>();
  for (const ticket of room.tickets) tickets.set(ticket.id, Matter.Bodies.circle(ticket.position.x, ticket.position.y, 15, { isStatic: true, isSensor: true, label: `ticket:${ticket.id}` }));
  const props = new Map<string, Matter.Body>();
  room.props.forEach((prop, index) => props.set(`${prop.kind}-${index}`, prop.kind === "bumper" ? Matter.Bodies.circle(prop.position.x, prop.position.y, prop.radius, { isStatic: true, restitution: PHYSICS_TUNING.bumperRestitution, label: "bumper" }) : Matter.Bodies.rectangle(prop.position.x, prop.position.y, prop.radius * 1.45, prop.radius * 0.75, { isStatic: true, isSensor: true, label: "bellows" })));
  Matter.Composite.add(engine.world, [key, goal, ...walls, ...anchors.values(), ...cords.values(), ...tickets.values(), ...props.values()]);
  return { engine, key, goal, cords, anchors, tickets, props };
}
export function applyOpeningImpulse(world: KeyfallWorld, reducedMotion: boolean): void { Matter.Body.setVelocity(world.key, { x: reducedMotion ? 0.25 : 0.75, y: 0 }); }
export function removeCord(world: KeyfallWorld, cordId: string): boolean { const cord = world.cords.get(cordId); if (!cord) return false; Matter.Composite.remove(world.engine.world, cord); world.cords.delete(cordId); return true; }
export function puff(world: KeyfallWorld, direction: Vec = { x: 1, y: -0.2 }): void { Matter.Body.applyForce(world.key, world.key.position, { x: direction.x * 0.09, y: direction.y * 0.09 }); }
export function resetVelocity(world: KeyfallWorld): void { Matter.Body.setVelocity(world.key, { x: 0, y: 0 }); Matter.Body.setAngularVelocity(world.key, 0); }
export function propFor(world: KeyfallWorld, prop: PropDefinition, index: number): Matter.Body | undefined { return world.props.get(`${prop.kind}-${index}`); }
