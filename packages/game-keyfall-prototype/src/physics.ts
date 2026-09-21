import Matter from "matter-js";
import type { PropDefinition, RoomDefinition, Vec } from "./types";

export type KeyfallWorld = { engine: Matter.Engine; key: Matter.Body; goal: Matter.Body; cords: Map<string, Matter.Constraint>; anchors: Map<string, Matter.Body>; tickets: Map<string, Matter.Body>; props: Map<string, Matter.Body> };
export function makeWorld(room: RoomDefinition): KeyfallWorld {
  const engine = Matter.Engine.create({ enableSleeping: false });
  engine.gravity.y = 0.82;
  const key = Matter.Bodies.circle(room.keyStart.x, room.keyStart.y, 21, { label: "key", restitution: 0.44, frictionAir: 0.01, density: 0.002 });
  const goal = Matter.Bodies.circle(room.goal.x, room.goal.y, 34, { isStatic: true, isSensor: true, label: "goal" });
  // Keep only a ceiling; a missed key must be able to leave the playfield.
  const walls = [Matter.Bodies.rectangle(400, -18, 800, 36, { isStatic: true })];
  const cords = new Map<string, Matter.Constraint>(), anchors = new Map<string, Matter.Body>();
  for (const cord of room.cords) {
    const anchor = Matter.Bodies.circle(cord.anchor.x, cord.anchor.y, 5, { isStatic: true, label: `anchor:${cord.id}` });
    // Constraint length is the actual distance between the authored anchor and
    // initial key position; the cord angle/length only describes its artwork.
    const length = Math.max(8, Math.hypot(cord.anchor.x - room.keyStart.x, cord.anchor.y - room.keyStart.y));
    const constraint = Matter.Constraint.create({ bodyA: anchor, bodyB: key, length, stiffness: 1, damping: 0.07, label: `cord:${cord.id}` });
    anchors.set(cord.id, anchor); cords.set(cord.id, constraint);
  }
  const tickets = new Map<string, Matter.Body>();
  for (const ticket of room.tickets) tickets.set(ticket.id, Matter.Bodies.circle(ticket.position.x, ticket.position.y, 15, { isStatic: true, isSensor: true, label: `ticket:${ticket.id}` }));
  const props = new Map<string, Matter.Body>();
  room.props.forEach((prop, index) => props.set(`${prop.kind}-${index}`, prop.kind === "bumper" ? Matter.Bodies.circle(prop.position.x, prop.position.y, prop.radius, { isStatic: true, restitution: 1.16, label: "bumper" }) : Matter.Bodies.rectangle(prop.position.x, prop.position.y, prop.radius * 1.45, prop.radius * 0.75, { isStatic: true, isSensor: true, label: "bellows" })));
  Matter.Composite.add(engine.world, [key, goal, ...walls, ...anchors.values(), ...cords.values(), ...tickets.values(), ...props.values()]);
  return { engine, key, goal, cords, anchors, tickets, props };
}
export function removeCord(world: KeyfallWorld, cordId: string): boolean { const cord = world.cords.get(cordId); if (!cord) return false; Matter.Composite.remove(world.engine.world, cord); world.cords.delete(cordId); return true; }
export function puff(world: KeyfallWorld, direction: Vec = { x: 1, y: -0.2 }): void { Matter.Body.applyForce(world.key, world.key.position, { x: direction.x * 0.09, y: direction.y * 0.09 }); }
export function resetVelocity(world: KeyfallWorld): void { Matter.Body.setVelocity(world.key, { x: 0, y: 0 }); Matter.Body.setAngularVelocity(world.key, 0); }
export function propFor(world: KeyfallWorld, prop: PropDefinition, index: number): Matter.Body | undefined { return world.props.get(`${prop.kind}-${index}`); }
