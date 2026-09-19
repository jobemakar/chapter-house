import M from "matter-js";
import { FloppyYard } from "./floppy-yard";
import { record, count } from "./validation";
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
export class PowerYard extends FloppyYard {
  powers: PowerState;
  gateOpen: boolean;
  gateLift: number;
  polarity: number;
  switchAt: number;
  bellowsAt: number;
  gustUntil: number;
  field: { x: number; y: number; r: number };
  lever: M.Body;
  button: M.Body;
  bellows: M.Body;
  gate: M.Body;
  gadgets: M.Body[];
  private legacyGadgets: Checkpoint["gadgets"];
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
    this.maxFlightAge = this.world.width > 1200 ? 8.2 : 4.2;
    const old = checkpoint?.gadgets;
    this.legacyGadgets = old;
    this.gateOpen = !!old?.gateOpen;
    this.gateLift = this.gateOpen ? 1 : 0;
    this.polarity =
      old?.polarity === -1 || old?.polarity === 1 ? old.polarity : 0;
    this.switchAt = -10;
    this.bellowsAt = -10;
    this.gustUntil = 0;
    this.field = this.layout.devices?.field ?? { x: 970, y: 415, r: 165 };
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
      }
    });
  }
  boost(dx: number, dy: number) {
    for (const b of this.plush.parts)
      M.Body.setVelocity(b, {
        x: Math.max(-23, Math.min(23, b.velocity.x + dx)),
        y: Math.max(-20, Math.min(20, b.velocity.y + dy)),
      });
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
  }
  checkpoint() {
    const data = super.checkpoint();
    // Preserve old gadget fields exactly enough for archival saves. They have no
    // active pickup/reward meaning in the current game.
    data.gadgets = {
      claimed: this.legacyGadgets?.claimed ?? [],
      clearPaid: this.legacyGadgets?.clearPaid ?? false,
      reward: this.legacyGadgets?.reward ?? "bounce",
      gateOpen: this.gateOpen,
      polarity: this.polarity,
    };
    return data;
  }
}

