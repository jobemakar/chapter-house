import type { Point } from "../core/profile";

/** Consume route points without ever deriving a heading from a zero vector. */
export class RouteMotion {
  static step(
    point: Point,
    route: Point[],
    facing: number,
    speed: number,
    dt: number,
  ) {
    let budget = Math.max(0, speed * dt);
    let moved = false;
    while (route.length) {
      const next = route[0];
      const dx = next.x - point.x,
        dz = next.z - point.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.00001) {
        route.shift();
        continue;
      }
      if (budget <= 0) break;
      const target = Math.atan2(dx, dz);
      const change = Math.atan2(
        Math.sin(target - facing),
        Math.cos(target - facing),
      );
      facing += change * Math.min(1, dt * 14);
      const travel = Math.min(distance, budget);
      point.x += (dx / distance) * travel;
      point.z += (dz / distance) * travel;
      moved = true;
      budget -= travel;
      if (travel === distance) route.shift();
      else break;
    }
    return { facing, moved };
  }
}
