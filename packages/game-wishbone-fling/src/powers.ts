import M from "matter-js";
import { FloppyYard } from "./floppy-yard";
import type { YardOptions } from "./yard";
import { record, count } from "./validation";
import type {
  PowerId,
  PowerState,
  Checkpoint,
  PieceBody,
  YardDefinition,
  DeviceDefinition,
} from "./types";
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
export interface RuntimeDevice {
  definition: DeviceDefinition;
  body: M.Body;
  open: boolean;
  lift: number;
  polarity: number;
  activatedAt: number;
  gustUntil: number;
}
/** Each device owns its state; controls address stable IDs, never array positions. */
export class PowerYard extends FloppyYard {
  powers: PowerState;
  instances: RuntimeDevice[] = [];
  gadgets: M.Body[] = [];
  private legacyGadgets: Checkpoint["gadgets"];
  private first(kind: DeviceDefinition["kind"]) {
    return this.instances.find((d) => d.definition.kind === kind);
  }
  get lever() {
    return this.first("lever")!.body;
  }
  get button() {
    return this.first("button")!.body;
  }
  get bellows() {
    return this.first("bellows")!.body;
  }
  get gate() {
    return this.first("gate")!.body;
  }
  get field() {
    const d = this.first("field")?.definition;
    return { x: d?.x ?? 970, y: d?.y ?? 415, r: d?.r ?? 165 };
  }
  get gateOpen() {
    return this.first("gate")?.open ?? false;
  }
  set gateOpen(v: boolean) {
    const d = this.first("gate");
    if (d) d.open = v;
  }
  get gateLift() {
    return this.first("gate")?.lift ?? 0;
  }
  get polarity() {
    return this.first("field")?.polarity ?? 0;
  }
  set polarity(v: number) {
    const d = this.first("field");
    if (d) d.polarity = v;
  }
  get bellowsAt() {
    return this.first("bellows")?.activatedAt ?? -10;
  }
  get gustUntil() {
    return this.first("bellows")?.gustUntil ?? 0;
  }
  set gustUntil(v: number) {
    const d = this.first("bellows");
    if (d) d.gustUntil = v;
  }
  hasMechanism(kind: "lever" | "magnet" | "bellows") {
    return this.instances.some(
      (d) => d.definition.kind === (kind === "magnet" ? "field" : kind),
    );
  }
  constructor(
    index: number | YardDefinition = 0,
    checkpoint: Checkpoint | null = null,
    powers = loadPowers(),
    options: YardOptions = {},
  ) {
    super(index, null, { settle: false });
    this.powers = powers;
    this.maxFlightAge =
      this.world.width > 1200 || this.world.height > 720 ? 8.2 : 4.2;
    const validCheckpoint =
      checkpoint &&
      (!this.layout.revision || checkpoint.revision === this.layout.revision)
        ? checkpoint
        : null;
    this.legacyGadgets = checkpoint?.gadgets;
    const legacy = this.layout.devices;
    const has = (kind: "lever" | "magnet" | "bellows") =>
      this.layout.mechanisms?.includes(kind) ?? true;
    const definitions: DeviceDefinition[] = this.layout.deviceInstances ?? [
      ...(has("lever")
        ? [
            {
              id: "lever",
              kind: "lever" as const,
              ...(legacy?.lever ?? { x: 420, y: 485 }),
              targetId: "gate",
            },
            {
              id: "gate",
              kind: "gate" as const,
              ...(legacy?.gate ?? { x: 1100, y: 490 }),
            },
          ]
        : []),
      ...(has("magnet")
        ? [
            {
              id: "button",
              kind: "button" as const,
              ...(legacy?.button ?? { x: 850, y: 566 }),
              targetId: "field",
            },
            {
              id: "field",
              kind: "field" as const,
              ...(legacy?.field ?? { x: 970, y: 415, r: 165 }),
            },
          ]
        : []),
      ...(has("bellows")
        ? [
            {
              id: "bellows",
              kind: "bellows" as const,
              ...(legacy?.bellows ?? { x: 470, y: 580 }),
            },
          ]
        : []),
    ];
    for (const definition of definitions) {
      const size =
        definition.kind === "gate"
          ? [18, 220]
          : definition.kind === "lever"
            ? [36, 74]
            : definition.kind === "button"
              ? [48, 50]
              : definition.kind === "field"
                ? [1, 1]
                : [68, 32];
      const body = M.Bodies.rectangle(
        definition.x,
        definition.y,
        size[0],
        size[1],
        {
          isStatic: true,
          isSensor: definition.kind !== "gate",
          angle: definition.angle ?? 0,
        },
      );
      body.game = { kind: definition.kind };
      const saved = validCheckpoint?.devices?.[definition.id];
      const open =
        saved?.open ??
        (definition.kind === "gate" && !!validCheckpoint?.gadgets?.gateOpen);
      const polarity =
        saved?.polarity ??
        (definition.kind === "field"
          ? (validCheckpoint?.gadgets?.polarity ?? 0)
          : 0);
      const instance = {
        definition,
        body,
        open,
        lift: open ? 1 : 0,
        polarity,
        activatedAt: -10,
        gustUntil: 0,
      };
      this.instances.push(instance);
      if (definition.kind !== "field") this.gadgets.push(body);
      if (open)
        M.Body.setPosition(body, {
          x: definition.x + Math.sin(definition.angle ?? 0) * 250,
          y: definition.y - Math.cos(definition.angle ?? 0) * 250,
        });
    }
    M.Composite.add(this.engine.world, this.gadgets);
    if (options.settle !== false) this.settle();
    this.restore(validCheckpoint);
    M.Events.on(this.engine, "collisionStart", (event) => {
      for (const pair of event.pairs)
        for (const [device, other] of [
          [pair.bodyA, pair.bodyB],
          [pair.bodyB, pair.bodyA],
        ]) {
          if (other.isStatic || other.isSensor || other.speed < 0.7) continue;
          const instance = this.instances.find((d) => d.body === device);
          if (!instance) continue;
          const d = instance.definition,
            target = this.instances.find((i) => i.definition.id === d.targetId);
          if (
            d.kind === "lever" &&
            target?.definition.kind === "gate" &&
            !target.open
          ) {
            target.open = true;
            this.events.push({
              type: "mechanism",
              text: "The gate is open!",
              x: d.x,
              y: d.y - 45,
            });
          }
          if (
            d.kind === "button" &&
            target?.definition.kind === "field" &&
            this.time - instance.activatedAt > 0.8
          ) {
            instance.activatedAt = this.time;
            target.polarity = target.polarity === 1 ? -1 : 1;
            this.events.push({
              type: "mechanism",
              text:
                target.polarity === 1
                  ? "Magnet pulls inward"
                  : "Magnet pushes outward",
              x: d.x,
              y: d.y - 46,
            });
          }
          if (d.kind === "bellows" && this.time - instance.activatedAt > 2) {
            instance.activatedAt = this.time;
            instance.gustUntil = this.time + 0.8;
            this.events.push({
              type: "mechanism",
              text: "Boing!",
              x: d.x,
              y: d.y - 60,
            });
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
    if (!this.instances) return super.tick(dt);
    for (const instance of this.instances) {
      const d = instance.definition;
      if (d.kind === "gate" && instance.open && instance.lift < 1) {
        instance.lift = Math.min(1, instance.lift + dt * 2.5);
        M.Body.setPosition(instance.body, {
          x: d.x + Math.sin(d.angle ?? 0) * instance.lift * 250,
          y: d.y - Math.cos(d.angle ?? 0) * instance.lift * 250,
        });
      }
      if (d.kind === "field" && instance.polarity)
        for (const b of this.pieces) {
          if (
            b.game.kind === "bucket" &&
            !this.removed.has(b.game.id) &&
            Math.hypot(b.position.x - d.x, b.position.y - d.y) < (d.r ?? 165)
          )
            this.pull(b, d.x, d.y, 0.0017 * instance.polarity);
        }
      if (d.kind === "bellows" && this.time < instance.gustUntil) {
        const angle = d.angle ?? 0,
          cos = Math.cos(angle),
          sin = Math.sin(angle);
        for (const b of [
          ...this.pieces.filter(
            (p) => !this.rescued.has(p.game.id) && !this.removed.has(p.game.id),
          ),
          ...(this.mode === "flight" ? this.plush.parts : []),
        ]) {
          const dx = b.position.x - d.x,
            dy = b.position.y - d.y;
          const across = dx * cos + dy * sin,
            along = -dx * sin + dy * cos;
          if (Math.abs(across) < 85 && along > -260 && along < 30)
            M.Body.applyForce(b, b.position, {
              x: (0.00035 * cos + 0.004 * sin) * b.mass,
              y: (0.00035 * sin - 0.004 * cos) * b.mass,
            });
        }
      }
    }
    super.tick(dt);
  }
  checkpoint(): Checkpoint {
    const data = super.checkpoint();
    data.devices = Object.fromEntries(
      this.instances
        .filter(
          (i) => i.definition.kind === "gate" || i.definition.kind === "field",
        )
        .map((i) => [i.definition.id, { open: i.open, polarity: i.polarity }]),
    );
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
