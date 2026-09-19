import M from "matter-js";
import { Yard, TUNE } from "./yard";
import { Plush } from "./plush";
import type { Checkpoint } from "./types";
export class FloppyYard extends Yard {
  plush: Plush;
  mode: "ready" | "flight" | "return";
  age: number;
  restAge: number;
  squash: number;
  quick = false;
  returnFrom: M.Vector = { x: 0, y: 0 };
  returnAngle = 0;
  returnPose: { position: M.Vector; angle: number }[] = [];
  maxFlightAge = 4.2;
  constructor(index = 0, checkpoint: Checkpoint | null = null) {
    super(index, checkpoint);
    M.Composite.remove(this.engine.world, this.dog);
    this.plush = new Plush(this.engine.world, TUNE.origin.x, TUNE.origin.y);
    this.dog = this.plush.body;
    this.mode = "ready";
    this.age = 0;
    this.restAge = 0;
    this.squash = 0;
  }
  throwToy(v: M.Vector) {
    if (this.mode !== "ready" || !Number.isFinite(v.x) || !Number.isFinite(v.y))
      return false;
    this.plush.launch({
      x: Math.max(0, Math.min(23, v.x)),
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
    this.beginReturn(true);
  }
  beginReturn(quick = false) {
    if (this.mode === "return" && !quick) return;
    this.mode = "return";
    this.age = 0;
    this.quick = quick;
    this.returnFrom = { ...this.dog.position };
    this.returnAngle = this.dog.angle;
    this.returnPose = this.plush.parts.map((b) => ({
      position: { ...b.position },
      angle: b.angle,
    }));
    this.cooldown = 1;
    // Return in front of the yard. Solid contact is only for the launch/tumble.
    this.plush.parts.forEach((b) => {
      M.Body.setStatic(b, true);
      b.collisionFilter.mask = 0;
    });
    this.events.push({
      type: "fetch",
      x: this.dog.position.x,
      y: this.dog.position.y,
    });
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
      if (this.restAge > 0.45 || this.age > (this.maxFlightAge || 4.2))
        this.beginReturn();
    } else if (this.mode === "return") {
      const duration = this.quick ? 0.62 : 1.2,
        u = Math.min(1, this.age / duration),
        p = this.returnFrom;
      let x,
        y,
        phase = 0;
      // Spring upright onto the front lawn, trot home, then hop onto the pad.
      if (u < 0.22) {
        const t = u / 0.22;
        x = p.x;
        y = p.y + (636 - p.y) * t - 28 * Math.sin(t * Math.PI);
      } else if (u < 0.82) {
        const t = (u - 0.22) / 0.6;
        x = p.x + (TUNE.origin.x - p.x) * t;
        y = 636 - Math.abs(Math.sin(t * Math.PI * 7)) * 6;
        phase = t * 30;
      } else {
        const t = (u - 0.82) / 0.18;
        x = TUNE.origin.x;
        y = 636 + (TUNE.origin.y - 636) * t - 35 * Math.sin(t * Math.PI);
        phase = t * 10;
      }
      this.plush.pose(x, y, phase, -1);
      if (u < 0.22) {
        const blend = 1 - (1 - u / 0.22) ** 2;
        this.plush.parts.forEach((b, i) => {
          const from = this.returnPose[i],
            to = { ...b.position };
          M.Body.setPosition(b, {
            x: from.position.x + (to.x - from.position.x) * blend,
            y: from.position.y + (to.y - from.position.y) * blend,
          });
          const turn = Math.atan2(
            Math.sin(b.angle - from.angle),
            Math.cos(b.angle - from.angle),
          );
          M.Body.setAngle(b, from.angle + turn * blend);
        });
      }
      this.dogMode = "return";
      this.cooldown = 1;
      if (u >= 1) {
        this.mode = "ready";
        this.cooldown = 0;
        this.age = 0;
        this.plush.pose(TUNE.origin.x, TUNE.origin.y);
      }
    } else {
      this.cooldown = 0;
      this.dogMode = "home";
      this.plush.pose(
        TUNE.origin.x,
        TUNE.origin.y,
        Math.sin(this.time * 3) * 0.22,
        1,
      );
    }
  }
}

