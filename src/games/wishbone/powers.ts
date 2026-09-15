import M from "matter-js";
import { FloppyYard } from "./floppy-yard";
import { record, count } from "../../core/validation";
import type { PowerId, PowerState, Checkpoint, PieceBody } from "./types";
export const definitions: {
  id: PowerId;
  name: string;
  icon: string;
  color: string;
  detail: string;
  size: number[];
}[] = [
  {
    id: "bounce",
    name: "Bounce Biscuit",
    icon: "↗",
    color: "#e6ac64",
    detail: "Three springy bounces on your next toss",
    size: [0.18, 0.18, 0.12],
  },
  {
    id: "magnet",
    name: "Magnet Bandana",
    icon: "⊂",
    color: "#85bdb0",
    detail: "Pull nearby loose toys toward Wishbone",
    size: [0.18, 0.12, 0.25],
  },
  {
    id: "wind",
    name: "Tailwind Pinwheel",
    icon: "✣",
    color: "#b8a3ce",
    detail: "Tap Gust during flight for an upward boost",
    size: [0.16, 0.16, 0.35],
  },
];
export function valid(id: unknown): id is PowerId {
  return id === "bounce" || id === "magnet" || id === "wind";
}
export function loadPowers(raw?: unknown): PowerState {
  const data = record(raw),
    counts = record(data.counts);
  return {
    counts: {
      bounce: count(counts.bounce, 9999),
      magnet: count(counts.magnet, 9999),
      wind: count(counts.wind, 9999),
    },
    clears: count(data.clears, 999999),
    discovered: [
      ...new Set(
        Array.isArray(data.discovered) ? data.discovered.filter(valid) : [],
      ),
    ],
    autoGust: data.autoGust === true,
  };
}
export function grant(state: PowerState, id: PowerId): boolean {
  if (!valid(id)) return false;
  state.counts[id] = Math.min(9999, state.counts[id] + 1);
  if (!state.discovered.includes(id)) state.discovered.push(id);
  return true;
}
export class PowerYard extends FloppyYard {
  powers: PowerState;
  armed: PowerId | null;
  active: PowerId | null;
  bounces: number;
  bounceAt: number;
  pendingBounce: boolean;
  reward: PowerId;
  claimed: Set<PowerId>;
  clearPaid: boolean;
  gateOpen: boolean;
  gateLift: number;
  polarity: number;
  switchAt: number;
  bellowsAt: number;
  gustUntil: number;
  field: { x: number; y: number; r: number };
  pickups: { id: PowerId; x: number; y: number; hit: M.Body }[];
  lever: M.Body;
  button: M.Body;
  bellows: M.Body;
  gate: M.Body;
  gadgets: M.Body[];
  hasMechanism(kind: "lever" | "magnet" | "bellows") {
    return this.layout.mechanisms?.includes(kind) ?? true;
  }
  constructor(
    index = 0,
    checkpoint: Checkpoint | null = null,
    powers = loadPowers(),
  ) {
    super(index, checkpoint);
    this.powers = powers;
    this.armed = null;
    this.active = null;
    this.bounces = 0;
    this.bounceAt = -10;
    this.pendingBounce = false;
    this.maxFlightAge = 4.2;
    const old = checkpoint?.gadgets;
    this.reward = valid(old?.reward)
      ? old?.reward
      : definitions[(powers.clears + index) % 3].id;
    this.claimed = new Set(
      (Array.isArray(old?.claimed) ? old?.claimed : []).filter(valid),
    );
    this.clearPaid =
      !!old?.clearPaid ||
      (!checkpoint?.gadgets && this.rescued.size === this.targetCount);
    this.gateOpen = !!old?.gateOpen;
    this.gateLift = this.gateOpen ? 1 : 0;
    this.polarity =
      old?.polarity === -1 || old?.polarity === 1 ? old.polarity : 0;
    this.switchAt = -10;
    this.bellowsAt = -10;
    this.gustUntil = 0;
    this.field = this.layout.devices?.field ?? { x: 970, y: 415, r: 165 };
    this.pickups = (
      this.layout.pickups ??
      ([
        { id: "bounce", x: 380, y: 410 },
        { id: "magnet", x: 660, y: 225 },
        { id: "wind", x: 1150, y: 490 },
      ] as { id: PowerId; x: number; y: number }[])
    ).map((p) => ({
      ...p,
      hit: M.Bodies.circle(p.x, p.y, 22, { isStatic: true, isSensor: true }),
    }));
    const sensor = (
      kind: string,
      x: number,
      y: number,
      w: number,
      h: number,
    ) => {
      const b = M.Bodies.rectangle(x, y, w, h, {
        isStatic: true,
        isSensor: true,
      });
      b.game = { kind };
      return b;
    };
    const positions = this.layout.devices;
    const lever = positions?.lever ?? { x: 420, y: 485 };
    const button = positions?.button ?? { x: 850, y: 566 };
    const bellows = positions?.bellows ?? { x: 470, y: 580 };
    const gate = positions?.gate ?? { x: 1100, y: 490 };
    this.lever = sensor("lever", lever.x, lever.y, 36, 74);
    this.button = sensor("polarity", button.x, button.y, 48, 50);
    this.bellows = sensor("bellows", bellows.x, bellows.y, 68, 32);
    this.gate = M.Bodies.rectangle(gate.x, gate.y, 18, 220, { isStatic: true });
    this.gate.game = { kind: "gate" };
    if (this.gateOpen)
      M.Body.setPosition(this.gate, { x: gate.x, y: gate.y - 250 });
    this.gadgets = [
      ...(this.hasMechanism("lever") ? [this.lever, this.gate] : []),
      ...(this.hasMechanism("magnet") ? [this.button] : []),
      ...(this.hasMechanism("bellows") ? [this.bellows] : []),
    ];
    M.Composite.add(this.engine.world, this.gadgets);
    M.Events.on(this.engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        for (const [device, other] of [
          [pair.bodyA, pair.bodyB],
          [pair.bodyB, pair.bodyA],
        ]) {
          if (other.isStatic || other.isSensor || other.speed < 0.7) continue;
          if (device === this.lever && !this.gateOpen) {
            this.gateOpen = true;
            this.events.push({
              type: "mechanism",
              text: "The gate is open!",
              x: lever.x,
              y: lever.y - 45,
            });
          }
          if (device === this.button && this.time - this.switchAt > 0.8) {
            this.switchAt = this.time;
            this.polarity = this.polarity === 1 ? -1 : 1;
            this.events.push({
              type: "mechanism",
              text:
                this.polarity === 1
                  ? "Magnet pulls inward"
                  : "Magnet pushes outward",
              x: button.x,
              y: button.y - 46,
            });
          }
          if (device === this.bellows && this.time - this.bellowsAt > 2) {
            this.bellowsAt = this.time;
            this.gustUntil = this.time + 0.8;
            this.events.push({
              type: "mechanism",
              text: "Boing!",
              x: bellows.x,
              y: bellows.y - 60,
            });
          }
        }
        if (
          this.mode === "flight" &&
          this.bounces > 0 &&
          this.time - this.bounceAt > 0.28 &&
          !pair.bodyA.isSensor &&
          !pair.bodyB.isSensor &&
          (this.plush.parts.some((part) => part === pair.bodyA) ||
            this.plush.parts.some((part) => part === pair.bodyB))
        )
          this.pendingBounce = true;
      }
    });
  }
  arm(id: PowerId) {
    if (this.mode !== "ready" || !valid(id) || this.powers.counts[id] < 1)
      return false;
    this.armed = this.armed === id ? null : id;
    return true;
  }
  throwToy(v: M.Vector) {
    if (!super.throwToy(v)) return false;
    this.active =
      this.armed && this.powers.counts[this.armed] > 0 ? this.armed : null;
    this.maxFlightAge =
      this.active === "bounce" || this.active === "wind" ? 6.5 : 4.2;
    this.armed = null;
    this.bounces = this.active === "bounce" ? 3 : 0;
    this.pendingBounce = false;
    if (this.active && this.active !== "wind")
      this.powers.counts[this.active]--;
    this.bounceAt = this.time;
    return true;
  }
  boost(dx: number, dy: number) {
    for (const b of this.plush.parts)
      M.Body.setVelocity(b, {
        x: Math.max(-23, Math.min(23, b.velocity.x + dx)),
        y: Math.max(-20, Math.min(20, b.velocity.y + dy)),
      });
  }
  gust() {
    if (
      this.mode !== "flight" ||
      this.active !== "wind" ||
      this.powers.counts.wind < 1
    )
      return false;
    this.powers.counts.wind--;
    this.active = null;
    this.boost(5, -10);
    this.restAge = 0;
    this.events.push({
      type: "power-used",
      text: "Tailwind!",
      x: this.dog.position.x,
      y: this.dog.position.y - 55,
    });
    return true;
  }
  pull(body: M.Body, x: number, y: number, strength: number) {
    const dx = x - body.position.x,
      dy = y - body.position.y,
      d = Math.hypot(dx, dy);
    if (d < 1) return;
    M.Body.applyForce(body, body.position, {
      x: (dx / d) * strength * body.mass,
      y: (dy / d) * strength * body.mass,
    });
  }
  tick(dt: number) {
    if (!this.gadgets) return super.tick(dt);
    if (this.gateOpen && this.gateLift < 1) {
      this.gateLift = Math.min(1, this.gateLift + dt * 2.5);
      M.Body.setPosition(this.gate, {
        x: this.layout.devices?.gate?.x ?? 1100,
        y: (this.layout.devices?.gate?.y ?? 490) - this.gateLift * 250,
      });
    }
    if (this.mode === "flight") {
      if (
        this.active === "wind" &&
        this.powers.autoGust &&
        this.age > 0.25 &&
        this.dog.velocity.y >= -1
      )
        this.gust();
      if (this.active === "magnet")
        for (const b of this.pieces) {
          if (
            b.game.kind === "target" &&
            !this.rescued.has(b.game.id) &&
            Math.hypot(
              b.position.x - b.game.home.x,
              b.position.y - b.game.home.y,
            ) > 5 &&
            Math.hypot(
              b.position.x - this.dog.position.x,
              b.position.y - this.dog.position.y,
            ) < 170
          )
            this.pull(b, this.dog.position.x, this.dog.position.y, 0.0035);
        }
    }
    if (this.hasMechanism("magnet") && this.polarity)
      for (const b of this.pieces) {
        if (b.game?.kind !== "bucket") continue;
        if (
          Math.hypot(b.position.x - this.field.x, b.position.y - this.field.y) <
          this.field.r
        )
          this.pull(b, this.field.x, this.field.y, 0.0017 * this.polarity);
      }
    if (this.time < this.gustUntil)
      for (const b of [
        ...this.pieces,
        ...(this.mode === "flight" ? this.plush.parts : []),
      ]) {
        if (
          !(
            "id" in (b.game || {}) && this.rescued.has((b as PieceBody).game.id)
          ) &&
          Math.abs(b.position.x - this.bellows.position.x) < 85 &&
          b.position.y > 320 &&
          b.position.y < 610
        )
          M.Body.applyForce(b, b.position, {
            x: 0.00035 * b.mass,
            y: -0.004 * b.mass,
          });
      }
    super.tick(dt);
    if (this.mode === "flight") {
      if (this.pendingBounce && this.bounces > 0) {
        this.pendingBounce = false;
        this.bounceAt = this.time;
        this.bounces--;
        this.boost(1, -Math.max(0, this.dog.velocity.y) - 9);
        this.restAge = 0;
        this.events.push({
          type: "power-used",
          text: "Boing! " + this.bounces + " left",
          x: this.dog.position.x,
          y: this.dog.position.y - 55,
        });
      }
      for (const p of this.pickups)
        if (
          !this.claimed.has(p.id) &&
          M.Query.collides(p.hit, this.plush.parts).length > 0
        ) {
          this.claimed.add(p.id);
          grant(this.powers, p.id);
          this.events.push({ type: "pickup", id: p.id, x: p.x, y: p.y });
        }
    } else {
      this.active = null;
      this.bounces = 0;
      this.pendingBounce = false;
    }
    if (!this.clearPaid && this.rescued.size === this.targetCount) {
      this.clearPaid = true;
      const id = this.clearReward;
      grant(this.powers, id);
      this.powers.clears = Math.min(999999, this.powers.clears + 1);
      this.events.push({ type: "clear-power", id, x: 650, y: 220 });
    }
  }
  get clearReward() {
    return this.reward;
  }
  checkpoint() {
    const data = super.checkpoint();
    if (this.claimed)
      data.gadgets = {
        claimed: [...this.claimed],
        clearPaid: this.clearPaid,
        reward: this.reward,
        gateOpen: this.gateOpen,
        polarity: this.polarity,
      };
    return data;
  }
}
