import M from "matter-js";
import { yards } from "./levels";
import type { Checkpoint, PieceBody, YardDefinition, GameEvent } from "./types";
const { Engine, Bodies, Body, Composite, Events } = M;
export const TUNE = {
  width: 1200,
  height: 720,
  floor: 600,
  step: 1000 / 120,
  gravity: 1.05,
  origin: { x: 162, y: 478 },
  maxPull: 160,
  launchScale: 0.137,
  refill: 1.05,
  dogSpeed: 9.8,
  chaseSeconds: 7,
  rescueDistance: 50,
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export function aim(dx: number, dy: number) {
  dx = clamp(dx, 0, TUNE.maxPull);
  dy = clamp(dy, -25, TUNE.maxPull);
  const length = Math.hypot(dx, dy),
    factor = Math.min(1, TUNE.maxPull / (length || 1));
  return {
    x: dx * factor * TUNE.launchScale,
    y: -dy * factor * TUNE.launchScale,
    power: Math.min(length / TUNE.maxPull, 1),
  };
}
export class Yard {
  index: number;
  layout: YardDefinition;
  events: GameEvent[];
  time: number;
  accumulator: number;
  cooldown: number;
  shots: number;
  rescued: Set<number>;
  engine: M.Engine;
  bounds: M.Body[];
  pieces: PieceBody[];
  dog: M.Body;
  dogMode: string;
  dogAge: number;
  hopWait: number;
  stuck: number;
  lastDogX: number;
  projectiles: M.Body[];
  activeToy: M.Body | null;
  facing: number;
  constructor(index = 0, checkpoint: Checkpoint | null = null) {
    this.index = index;
    this.layout = yards[index];
    this.events = [];
    this.time = 0;
    this.accumulator = 0;
    this.cooldown = 0;
    this.shots = 0;
    this.rescued = new Set<number>();
    // With only ~20 bodies, keep contacts awake so a sliding support never
    // leaves a sleeping toy hanging in midair.
    this.engine = Engine.create({
      enableSleeping: false,
      positionIterations: 8,
      velocityIterations: 8,
    });
    this.engine.gravity.y = TUNE.gravity;
    this.bounds = [
      Bodies.rectangle(600, 638, 1600, 76, {
        isStatic: true,
        friction: 0.75,
      }),
      Bodies.rectangle(-45, 250, 80, 900, { isStatic: true }),
      Bodies.rectangle(1245, 250, 80, 900, { isStatic: true }),
    ];
    Composite.add(this.engine.world, this.bounds);
    this.pieces = this.layout.pieces.map((p, i) => {
      const options = {
        friction: p.kind === "cushion" ? 0.65 : 0.48,
        frictionStatic: 0.7,
        restitution: p.kind === "cushion" ? 0.25 : 0.07,
        density: p.kind === "bucket" ? 0.00045 : 0.0008,
        sleepThreshold: 90,
      };
      const b = (
        p.r
          ? Bodies.circle(p.x, p.y, p.r, options)
          : Bodies.rectangle(p.x, p.y, p.w, p.h, {
              ...options,
              chamfer: { radius: p.kind === "cushion" ? 10 : 3 },
            })
      ) as PieceBody;
      b.game = { ...p, id: i, home: { x: p.x, y: p.y } };
      return b;
    });
    Composite.add(this.engine.world, this.pieces);
    // Settle authored stacks without awarding anything or playing impact sounds.
    for (let n = 0; n < 240; n++) Engine.update(this.engine, TUNE.step);
    this.pieces.forEach((b) => {
      b.game.home = { ...b.position };
    });
    this.dog = Bodies.rectangle(92, 575, 78, 46, {
      density: 0.008,
      friction: 0.12,
      frictionAir: 0.025,
      inertia: Infinity,
      restitution: 0,
      chamfer: { radius: 15 },
    });
    this.dog.game = { kind: "dog" };
    Composite.add(this.engine.world, this.dog);
    this.dogMode = "home";
    this.dogAge = 0;
    this.hopWait = 0;
    this.stuck = 0;
    this.lastDogX = 92;
    this.projectiles = [];
    this.activeToy = null;
    this.facing = 1;
    this.restore(checkpoint);
    Events.on(this.engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA,
          b = pair.bodyB;
        const speed = Math.hypot(
          a.velocity.x - b.velocity.x,
          a.velocity.y - b.velocity.y,
        );
        if (speed > 2.2 && (a.game || b.game))
          this.events.push({
            type: "impact",
            speed,
            kind:
              a.game?.kind === "bucket" || b.game?.kind === "bucket"
                ? "bucket"
                : "wood",
            x: (a.position.x + b.position.x) / 2,
            y: (a.position.y + b.position.y) / 2,
          });
      }
    });
  }
  throwToy(velocity: M.Vector) {
    if (
      this.cooldown > 0 ||
      !Number.isFinite(velocity.x) ||
      !Number.isFinite(velocity.y)
    )
      return false;
    const b = Bodies.circle(TUNE.origin.x, TUNE.origin.y, 17, {
      density: 0.008,
      friction: 0.6,
      frictionAir: 0.001,
      restitution: 0.26,
    });
    b.game = { kind: "sock" };
    Body.setVelocity(b, {
      x: clamp(velocity.x, 0, 23),
      y: clamp(velocity.y, -23, 5),
    });
    Body.setAngularVelocity(b, 0.15);
    Composite.add(this.engine.world, b);
    this.projectiles.push(b);
    this.activeToy = b;
    this.cooldown = TUNE.refill;
    this.shots++;
    this.dogAge = 0;
    this.dogMode = "chase";
    this.events.push({ type: "throw" });
    while (this.projectiles.length > 5)
      Composite.remove(this.engine.world, this.projectiles.shift()!);
    return true;
  }
  recall() {
    this.dogMode = "return";
    this.activeToy = null;
    this.cooldown = 0;
  }
  step(seconds: number) {
    this.accumulator += Math.min(0.1, Math.max(0, seconds));
    while (this.accumulator + 1e-9 >= TUNE.step / 1000) {
      this.tick(TUNE.step / 1000);
      this.accumulator -= TUNE.step / 1000;
    }
  }
  tick(dt: number) {
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.dogAge += dt;
    this.hopWait -= dt;
    if (this.dogMode === "chase" && this.dogAge > TUNE.chaseSeconds)
      this.recall();
    const dog = this.dog,
      toy = this.activeToy;
    let target =
      this.dogMode === "chase" && toy ? clamp(toy.position.x, 65, 1160) : 92;
    if (
      this.dogMode === "chase" &&
      toy &&
      this.dogAge > 0.6 &&
      Math.hypot(
        dog.position.x - toy.position.x,
        dog.position.y - toy.position.y,
      ) < 62
    ) {
      this.events.push({
        type: "fetch",
        x: dog.position.x,
        y: dog.position.y,
      });
      Composite.remove(this.engine.world, toy);
      this.projectiles = this.projectiles.filter((p) => p !== toy);
      this.recall();
      target = 92;
    }
    if (this.dogMode !== "home" && this.dogAge > 0.24) {
      const distance = target - dog.position.x;
      if (Math.abs(distance) > 25) {
        this.facing = Math.sign(distance);
        const desired = this.facing * TUNE.dogSpeed;
        Body.applyForce(dog, dog.position, {
          x:
            clamp((desired - dog.velocity.x) * 0.00045, -0.0032, 0.0032) *
            dog.mass,
          y: 0,
        });
        if (Math.abs(dog.position.x - this.lastDogX) < 0.28) this.stuck += dt;
        else this.stuck = Math.max(0, this.stuck - dt * 0.5);
        if (
          this.stuck > 0.3 &&
          this.hopWait <= 0 &&
          Math.abs(dog.velocity.y) < 1.5
        ) {
          Body.setVelocity(dog, { x: this.facing * 4, y: -10.5 });
          this.hopWait = 0.65;
          this.stuck = 0;
          this.events.push({ type: "hop" });
        }
      } else if (this.dogMode === "return") {
        this.dogMode = "home";
        this.facing = 1;
        Body.setVelocity(dog, { x: dog.velocity.x * 0.2, y: dog.velocity.y });
      }
    }
    this.lastDogX = dog.position.x;
    Engine.update(this.engine, TUNE.step);
    for (const b of this.pieces) {
      if (b.game.kind !== "target" || this.rescued.has(b.game.id)) continue;
      const h = b.game.home;
      if (
        Math.hypot(b.position.x - h.x, b.position.y - h.y) > TUNE.rescueDistance
      ) {
        this.rescued.add(b.game.id);
        Composite.remove(this.engine.world, b);
        this.events.push({
          type: "rescue",
          id: `${this.layout.id}:${b.game.id}`,
          x: b.position.x,
          y: b.position.y,
          color: b.game.color,
        });
      }
    }
  }
  drainEvents() {
    return this.events.splice(0);
  }
  get targetCount() {
    return this.pieces.filter((b) => b.game.kind === "target").length;
  }
  checkpoint(): Checkpoint {
    return {
      rescued: [...this.rescued],
      pieces: this.pieces
        .filter((b) => !this.rescued.has(b.game.id))
        .map((b) => ({
          id: b.game.id,
          x: b.position.x,
          y: b.position.y,
          angle: b.angle,
        })),
    };
  }
  restore(data: Checkpoint | null) {
    if (!data || !Array.isArray(data.pieces)) return;
    const ids = Array.isArray(data.rescued) ? data.rescued : [];
    for (const b of this.pieces) {
      if (b.game.kind === "target" && ids.includes(b.game.id)) {
        this.rescued.add(b.game.id);
        Composite.remove(this.engine.world, b);
        continue;
      }
      const p = data.pieces.find((p) => p.id === b.game.id);
      if (
        p &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        Number.isFinite(p.angle) &&
        p.x > 0 &&
        p.x < 1200 &&
        p.y > -1000 &&
        p.y < 650
      ) {
        Body.setPosition(b, { x: p.x, y: p.y });
        Body.setAngle(b, p.angle);
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
      }
    }
  }
  dispose() {
    Events.off(this.engine, "collisionStart");
    Composite.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }
}
