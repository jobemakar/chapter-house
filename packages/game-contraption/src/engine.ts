import { clamp, H, kit, STEP, W } from "./levels";
import type { Effect, GameEvent, Kernel, Part, Point, Level } from "./types";
const local = (p: Part, x: number, y: number): Point => {
  const c = Math.cos(p.angle),
    s = Math.sin(p.angle);
  return {
    x: (x - p.x) * c + (y - p.y) * s,
    y: -(x - p.x) * s + (y - p.y) * c,
  };
};
const world = (p: Part, x: number, y: number): Point => {
  const c = Math.cos(p.angle),
    s = Math.sin(p.angle);
  return { x: p.x + x * c - y * s, y: p.y + x * s + y * c };
};
export function hit(p: Part, x: number, y: number, pad = 16) {
  const q = local(p, x, y),
    s = kit[p.type];
  return Math.abs(q.x) < s.w / 2 + pad && Math.abs(q.y) < s.h / 2 + pad;
}
/** Fixed-step kernel simulation. Part state is editable; particles and switches are deliberately transient. */
export class ContraptionEngine {
  time = 0;
  spawnClock = 0;
  particles: Kernel[] = [];
  effects: Effect[] = [];
  events: GameEvent[] = [];
  delivered = 0;
  returned = 0;
  best = 0;
  counter = 0;
  directions: Record<string, number> = {};
  fanStates: Record<string, boolean> = {};
  latched = new Set<string>();
  controlStates: Record<string, boolean> = {};
  private contacts = new Set<string>();
  board = 0;
  cleared = false;
  proofId = 0;
  proof = { id: 0, sent: 0, resolved: 0, good: 0, spilled: 0 };
  roundWait = 0;
  lastSpill = -1e9;
  seed: number;
  constructor(
    public level: Level,
    public parts: Part[] = level.initial.map((p) => ({ ...p })),
    seed = 42,
  ) {
    this.seed = seed;
    this.invalidate();
  }
  invalidate() {
    this.proofId++;
    this.proof = {
      id: this.proofId,
      sent: 0,
      resolved: 0,
      good: 0,
      spilled: 0,
    };
    this.spawnClock = 0;
    this.roundWait = 0;
  }
  random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  direction(p: Part) {
    return this.directions[p.id] ?? p.flip;
  }
  fanEnabled(p: Part): boolean {
    return this.fanStates[p.id] ?? p.enabled !== false;
  }
  press(p: Part, source: "human" | "corn" = "human"): boolean {
    if (p.type === "switch") {
      for (const id of p.targets ?? []) this.directions[id] = p.direction || 1;
    } else {
      if (
        (p.type === "button" && source !== "corn") ||
        (p.type === "lever" && source !== "human") ||
        !["button", "lever"].includes(p.type)
      )
        return false;
      if (p.mode === "latch" && this.latched.has(p.id)) return false;
      const target = this.parts.find((q) => q.id === p.targetId);
      if (!target) return false;
      if (target.type === "belt")
        this.directions[target.id] = -this.direction(target);
      else if (target.type === "fan")
        this.fanStates[target.id] = !this.fanEnabled(target);
      else return false;
      if (p.mode === "latch") this.latched.add(p.id);
    }
    this.controlStates[p.id] = !this.controlStates[p.id];
    this.effects.push({ x: p.x, y: p.y, type: p.type, life: 0.6 });
    this.events.push({ type: "switch" });
    return true;
  }
  spawn() {
    const l = this.level,
      inlet = this.proof.sent % l.sources.length,
      s = l.sources[inlet],
      k: Kernel = {
        id: ++this.counter,
        proof: this.proof.id,
        inlet,
        x: s.x + (this.random() - 0.5) * 10,
        y: s.y,
        vx: s.vx + (this.random() - 0.5) * 14,
        vy: 15,
        r: 7 + this.random() * 2,
        spin: this.random() * 6,
        age: 0,
        delay: 0,
        visits: [],
        types: [],
        cool: {},
        trail: [],
      };
    this.proof.sent++;
    this.particles.push(k);
  }
  touch(k: Kernel, p: Part) {
    if (!k.visits.includes(p.id)) {
      k.visits.push(p.id);
      k.types.push(p.type);
    }
    if ((k.cool[p.id] || 0) < this.time) {
      this.effects.push({ x: k.x, y: k.y, type: p.type, life: 0.4 });
      k.cool[p.id] = this.time + 0.18;
      this.events.push({ type: "touch", part: p.type });
    }
  }
  recycle(k: Kernel, good = false) {
    if (k.proof === this.proof.id) {
      this.proof.resolved++;
      good ? this.proof.good++ : this.proof.spilled++;
    }
    if (good) {
      this.delivered++;
      this.best = Math.max(this.best, k.visits.length);
      this.effects.push({ x: k.x, y: k.y, type: "delivery", life: 0.7 });
      this.events.push({ type: "delivery", chain: k.visits.length });
      k.dead = true;
      return;
    }
    this.returned++;
    this.lastSpill = this.time;
    this.events.push({ type: "return" });
    k.delay = 0.65 + this.random() * 0.45;
    k.returnX = clamp(k.x, 30, W - 30);
    k.x = k.returnX;
    k.y = H - 25;
    k.trail = [];
    k.visits = [];
    k.types = [];
    k.cool = {};
  }
  step(dt = STEP) {
    this.time += dt;
    this.spawnClock += dt;
    this.events = [];
    this.effects.forEach((effect) => (effect.life -= dt));
    this.effects = this.effects.filter((effect) => effect.life > 0).slice(-80);
    const l = this.level;
    if (this.roundWait > 0) {
      if ((this.roundWait -= dt) <= 0) this.invalidate();
    } else if (
      this.spawnClock > l.period &&
      this.particles.length < 42 &&
      this.proof.sent < 12
    ) {
      this.spawnClock = 0;
      this.spawn();
    }
    const contacts = new Set<string>();
    for (const k of this.particles) {
      if (k.delay > 0) {
        k.delay -= dt;
        k.x += (65 - k.x) * Math.min(1, dt * 6);
        if (k.delay <= 0) k.dead = true;
        continue;
      }
      k.age += dt;
      const ox = k.x,
        oy = k.y;
      k.vy += 700 * dt;
      for (const p of this.parts)
        if (p.type === "fan" && this.fanEnabled(p)) {
          const q = local(p, k.x, k.y);
          if (q.x > 0 && q.x < 250 && Math.abs(q.y) < 42 + q.x * 0.12) {
            const f = 1600 * p.power * (1 - q.x / 320);
            k.vx += Math.cos(p.angle) * f * dt;
            k.vy += Math.sin(p.angle) * f * dt;
            this.touch(k, p);
          }
        }
      k.vx = clamp(k.vx, -950, 950);
      k.vy = clamp(k.vy, -1100, 1100);
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.spin += (k.vx * 0.012 + 1) * dt;
      for (const p of this.parts) {
        const q = local(p, k.x, k.y),
          old = local(p, ox, oy),
          c = Math.cos(p.angle),
          s = Math.sin(p.angle),
          tx = c,
          ty = s,
          nx = s,
          ny = -c;
        if (p.type === "fan" || p.type === "lever") continue;
        if (p.type === "button") {
          const key = k.id + ":" + p.id;
          if (Math.abs(q.x) < 28 + k.r && Math.abs(q.y) < 22 + k.r) {
            contacts.add(key);
            if (!this.contacts.has(key)) {
              this.press(p, "corn");
              this.touch(k, p);
            }
          }
          continue;
        }
        if (p.type === "switch") {
          if (
            Math.abs(q.x) < 28 + k.r &&
            Math.abs(q.y) < 22 + k.r &&
            (k.cool[p.id] || 0) < this.time
          ) {
            this.press(p, "corn");
            this.touch(k, p);
            k.cool[p.id] = this.time + 0.8;
          }
          continue;
        }
        if (p.type === "wall") {
          if (Math.abs(q.x) < 110 + k.r && Math.abs(q.y) < 14 + k.r) {
            const sign = old.y < 0 ? -1 : 1,
              at = world(p, q.x, sign * (15 + k.r));
            k.x = at.x;
            k.y = at.y;
            const v = -k.vx * s + k.vy * c;
            if (v * sign < 0) {
              k.vx -= 1.15 * v * -s;
              k.vy -= 1.15 * v * c;
            }
            this.touch(k, p);
          }
          continue;
        }
        if (p.type === "funnel") {
          if (
            q.y > -40 &&
            q.y < 55 &&
            Math.abs(q.x) < Math.max(17, 70 - (q.y + 40) * 0.62)
          ) {
            this.touch(k, p);
            const inward = -q.x * 9,
              down = 135 + q.y * 0.4;
            k.vx = inward * c - down * s;
            k.vy = inward * s + down * c;
            if (q.y > 42) {
              const out = world(p, 0, 58);
              k.x = out.x;
              k.y = out.y;
              k.vx = -s * 160;
              k.vy = c * 160;
            }
          }
          continue;
        }
        if (p.type === "bumper") {
          const d = Math.hypot(q.x, q.y),
            r = 34 + k.r;
          if (d < r && (k.cool[p.id] || 0) < this.time) {
            const dx = (k.x - p.x) / (d || 1),
              dy = (k.y - p.y) / (d || 1);
            k.x = p.x + dx * (r + 1);
            k.y = p.y + dy * (r + 1);
            k.vx = dx * 560 * p.power;
            k.vy = dy * 560 * p.power;
            this.touch(k, p);
          }
          continue;
        }
        const len = kit[p.type].w / 2;
        if (
          Math.abs(q.x) <= len &&
          q.y >= -k.r - 4 &&
          q.y < 14 &&
          old.y < q.y + 1
        ) {
          const normal = k.vx * nx + k.vy * ny;
          if (normal < 1) {
            const at = world(p, clamp(q.x, -len, len), -k.r - 1);
            k.x = at.x;
            k.y = at.y;
            if (p.type === "spring") {
              if ((k.cool[p.id] || 0) < this.time) {
                k.vx = nx * 640 * p.power;
                k.vy = ny * 640 * p.power;
                this.touch(k, p);
              }
            } else if (p.type === "belt") {
              const speed = 215 * p.power * this.direction(p);
              k.vx = tx * speed + nx * 6;
              k.vy = ty * speed + ny * 6;
              this.touch(k, p);
            } else {
              const t = k.vx * tx + k.vy * ty;
              k.vx = tx * t * 0.997 + nx * Math.max(0, -normal * 0.1);
              k.vy = ty * t * 0.997 + ny * Math.max(0, -normal * 0.1);
              this.touch(k, p);
            }
          }
        }
      }
      if (
        oy <= l.bowl.y &&
        k.y >= l.bowl.y &&
        k.vy > 0 &&
        Math.abs(k.x - l.bowl.x) < 61
      ) {
        this.recycle(k, true);
        continue;
      }
      if (
        k.x < -45 ||
        k.x > W + 45 ||
        k.y > H - 45 ||
        k.y < -220 ||
        k.age > 17
      ) {
        this.recycle(k);
        continue;
      }
      k.trail.push({ x: k.x, y: k.y });
      if (k.trail.length > 16) k.trail.shift();
    }
    this.contacts = contacts;
    this.particles = this.particles.filter((k) => !k.dead);
    if (
      this.proof.sent === 12 &&
      this.proof.resolved === 12 &&
      this.roundWait <= 0
    ) {
      if (
        !this.cleared &&
        this.proof.spilled === 0 &&
        (this.time - this.lastSpill < 2 ||
          this.particles.some((k) => k.delay <= 0 && k.proof !== this.proof.id))
      )
        return;
      if (this.proof.spilled === 0 && !this.cleared) {
        this.cleared = true;
        this.events.push({ type: "clear" });
      }
      this.roundWait = 0.8;
    }
  }
}
