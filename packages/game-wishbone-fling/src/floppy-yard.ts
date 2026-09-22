import M from "matter-js";
import { Yard, type YardOptions } from "./yard";
import { Plush } from "./plush";
import type { Checkpoint, YardDefinition } from "./types";
export class FloppyYard extends Yard {
  plush: Plush;
  mode: "ready" | "flight" | "return";
  age: number;
  restAge: number;
  squash: number;
  maxFlightAge = 4.2;
  constructor(
    index: number | YardDefinition = 0,
    checkpoint: Checkpoint | null = null,
    options: YardOptions = {},
  ) {
    super(index, checkpoint, options);
    M.Composite.remove(this.engine.world, this.dog);
    this.plush = new Plush(this.engine.world, this.origin.x, this.origin.y);
    this.dog = this.plush.body;
    this.mode = "ready";
    this.age = 0;
    this.restAge = 0;
    this.squash = 0;
  }
  throwToy(v: M.Vector) {
    if (this.mode !== "ready" || !Number.isFinite(v.x) || !Number.isFinite(v.y))
      return false;
    this.facing = v.x < 0 ? -1 : 1;
    this.plush.pose(this.origin.x, this.origin.y, 0, this.facing);
    this.plush.launch({
      x: Math.max(-23, Math.min(23, v.x)),
      y: Math.max(-23, Math.min(5, v.y)),
    });
    this.mode = "flight";
    this.age = 0;
    this.restAge = 0;
    this.cooldown = 1;
    this.shots++;
    this.events.push({ type: "throw" });
    return true;
  }
  recall() {
    if (!this.plush || this.mode === "ready") return;
    this.beginReturn();
  }
  beginReturn() {
    this.mode = "ready";
    this.age = 0;
    this.restAge = 0;
    this.cooldown = 0;
    this.plush.pose(this.origin.x, this.origin.y, 0, this.facing);
    for (const b of this.plush.parts) {
      M.Body.setVelocity(b, { x: 0, y: 0 });
      M.Body.setAngularVelocity(b, 0);
    }
    this.events.push({ type: "fetch", x: this.origin.x, y: this.origin.y });
  }

  tick(dt: number) {
    // Reuse the original yard/target solver, but never its pursuit motor.
    this.dogMode = "home";
    super.tick(dt);
    this.age += dt;
    this.squash = Math.max(0, this.squash - dt * 5);
    if (this.mode === "flight") {
      const speed = Math.hypot(this.dog.velocity.x, this.dog.velocity.y);
      if (this.age > 0.7 && speed < 2.2) this.restAge += dt;
      else this.restAge = 0;
      this.cooldown = 1;
      this.dogMode = "tumble";
      for (const b of this.plush.parts) {
        // Prevent rare constraint impulses from producing extreme speeds.
        if (b.speed > 27)
          M.Body.setVelocity(b, {
            x: (b.velocity.x * 27) / b.speed,
            y: (b.velocity.y * 27) / b.speed,
          });
        if (Math.abs(b.angularVelocity) > 0.5)
          M.Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * 0.5);
      }
      if (
        this.dog.position.y > this.world.height + 80 ||
        this.restAge > 0.45 ||
        this.age > (this.maxFlightAge || 4.2)
      )
        this.beginReturn();
    } else {
      this.cooldown = 0;
      this.dogMode = "home";
      this.plush.pose(
        this.origin.x,
        this.origin.y,
        Math.sin(this.time * 3) * 0.22,
        this.facing,
      );
    }
  }
}
