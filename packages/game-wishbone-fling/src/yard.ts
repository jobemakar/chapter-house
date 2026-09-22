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
  dx = clamp(dx, -TUNE.maxPull, TUNE.maxPull);
  dy = clamp(dy, -25, TUNE.maxPull);
  const length = Math.hypot(dx, dy),
    factor = Math.min(1, TUNE.maxPull / (length || 1));
  return {
    x: dx * factor * TUNE.launchScale,
    y: -dy * factor * TUNE.launchScale,
    power: Math.min(length / TUNE.maxPull, 1),
  };
}
export interface YardOptions {
  settle?: boolean;
}
export class Yard {
  origin: M.Vector;
  terrain: M.Body[];
  removed = new Set<number>();
  unstable = new Set<number>();
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
  world: { width: number; height: number };
  constructor(
    index: number | YardDefinition = 0,
    checkpoint: Checkpoint | null = null,
    options: YardOptions = {},
  ) {
    this.index = typeof index === "number" ? index : -1;
    this.layout = typeof index === "number" ? yards[index] : index;
    if (!this.layout)
      throw new Error(
        "Wishbone requires a resolved level definition or a registered catalog index.",
      );
    this.origin = { ...(this.layout.launcher ?? TUNE.origin) };
    this.world = {
      width: this.layout.world?.width ?? TUNE.width,
      height: this.layout.world?.height ?? TUNE.height,
    };
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
    this.terrain = (
      this.layout.terrain ?? [
        {
          id: "floor",
          x: this.world.width / 2,
          y: 638,
          w: this.world.width + 400,
          h: 76,
          angle: 0,
        },
      ]
    ).map((p) =>
      Bodies.rectangle(p.x, p.y, p.w, p.h, {
        isStatic: true,
        friction: 0.75,
        angle: p.angle,
      }),
    );
    this.bounds = [
      ...this.terrain,
      Bodies.rectangle(this.origin.x + 2, this.origin.y + 79, 128, 34, {
        isStatic: true,
        friction: 0.75,
      }),
      Bodies.rectangle(
        -45,
        this.world.height / 2,
        80,
        this.world.height + 2000,
        { isStatic: true },
      ),
      Bodies.rectangle(
        this.world.width + 45,
        this.world.height / 2,
        80,
        this.world.height + 2000,
        { isStatic: true },
      ),
    ];
    Composite.add(this.engine.world, this.bounds);
    this.pieces = this.layout.pieces.map((p, i) => {
      const options = {
        friction: p.kind === "cushion" ? 0.65 : 0.48,
        frictionStatic: 0.7,
        restitution: p.kind === "cushion" ? 0.25 : 0.07,
        density: p.kind === "bucket" ? 0.00045 : 0.0008,
        sleepThreshold: 90,
        angle: p.angle ?? 0,
      };
      const b = (
        p.r
          ? Bodies.circle(p.x, p.y, p.r, options)
          : Bodies.rectangle(p.x, p.y, p.w, p.h, {
              ...options,
              chamfer: { radius: p.kind === "cushion" ? 10 : 3 },
            })
      ) as PieceBody;
      b.game = { ...p, id: p.id ?? i, home: { x: p.x, y: p.y } };
      return b;
    });
    Composite.add(this.engine.world, this.pieces);
    // Settle authored stacks without awarding anything or playing impact sounds.
    if (options.settle !== false) this.settle();
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
        const plush = a.game?.kind === "plush" || b.game?.kind === "plush";
        const other = a.game?.kind === "plush" ? b : a;
        if (
          plush &&
          speed > 3.6 &&
          !other.isStatic &&
          !other.isSensor &&
          other.game?.kind !== "plush"
        )
          this.events.push({
            type: "impact",
            speed,
            kind: "dog-block",
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
    const b = Bodies.circle(this.origin.x, this.origin.y, 17, {
      density: 0.008,
      friction: 0.6,
      frictionAir: 0.001,
      restitution: 0.26,
    });
    b.game = { kind: "sock" };
    Body.setVelocity(b, {
      x: clamp(velocity.x, -23, 23),
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
      this.dogMode === "chase" && toy
        ? clamp(toy.position.x, 65, this.world.width - 40)
        : 92;
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
    this.removeFallen(this.shots > 0);
    for (const b of this.pieces) {
      if (
        this.shots === 0 ||
        this.removed.has(b.game.id) ||
        b.game.kind !== "target" ||
        this.rescued.has(b.game.id)
      )
        continue;
      const h = b.game.home;
      if (
        Math.hypot(b.position.x - h.x, b.position.y - h.y) > TUNE.rescueDistance
      ) {
        this.rescue(b);
      }
    }
  }
  settle() {
    for (let n = 0; n < 240; n++) {
      Engine.update(this.engine, TUNE.step);
      this.removeFallen(false);
    }
    this.pieces.forEach((b) => {
      b.game.home = { ...b.position };
    });
  }
  private rescue(b: PieceBody) {
    if (this.rescued.has(b.game.id)) return;
    this.rescued.add(b.game.id);
    Composite.remove(this.engine.world, b);
    this.events.push({
      type: "rescue",
      id: `${this.layout.id}:${b.game.id}`,
      x: b.position.x,
      y: Math.min(b.position.y, this.world.height),
      color: b.game.color,
    });
  }
  private removeFallen(active: boolean) {
    for (const b of this.pieces) {
      if (
        this.removed.has(b.game.id) ||
        this.rescued.has(b.game.id) ||
        b.position.y <= this.world.height + 80
      )
        continue;
      if (b.game.kind === "target" && active) this.rescue(b);
      else {
        if (b.game.kind === "target") this.unstable.add(b.game.id);
        this.removed.add(b.game.id);
        Composite.remove(this.engine.world, b);
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
      revision: this.layout.revision,
      removed: [...this.removed],
      rescued: [...this.rescued],
      pieces: this.pieces
        .filter(
          (b) => !this.rescued.has(b.game.id) && !this.removed.has(b.game.id),
        )
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
    if (this.layout.revision && data.revision !== this.layout.revision) return;
    const ids = Array.isArray(data.rescued) ? data.rescued : [];
    for (const b of this.pieces) {
      if (b.game.kind === "target" && ids.includes(b.game.id)) {
        this.rescued.add(b.game.id);
        Composite.remove(this.engine.world, b);
        continue;
      }
      if (data.removed?.includes(b.game.id)) {
        this.removed.add(b.game.id);
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
        p.x < this.world.width &&
        p.y > -1000 &&
        p.y < this.world.height + 80
      ) {
        if (this.removed.delete(b.game.id)) Composite.add(this.engine.world, b);
        this.unstable.delete(b.game.id);
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
