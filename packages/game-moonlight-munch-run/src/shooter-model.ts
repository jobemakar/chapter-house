import { FireSteps, ServingPattern, incWeaponLevel } from "./arcade";
export const clamp = (n: number, low = 0.16, high = 0.88): number =>
  Math.max(low, Math.min(high, n));
export const KEEPSAKES = [
  {
    id: "lantern-token",
    name: "Lantern wall plaque",
    feeds: 8,
    display: "wall",
  },
  {
    id: "moon-menu",
    name: "Moon Menu framed print",
    feeds: 25,
    display: "wall",
  },
  {
    id: "tiny-truck",
    name: "Tiny Truck floor display",
    feeds: 60,
    display: "floor",
  },
] as const;
export type WeaponType = "straight" | "spread" | "pierce";
export type PickupType = WeaponType | "rapid" | "supplies";
export interface Creature {
  id: number;
  x: number;
  y: number;
  kind: number;
  fed: boolean;
  age: number;
  departure: number;
  bumped: boolean;
  hp: number;
  maxHp: number;
  boss: boolean;
  baseY: number;
  pattern: number;
  vy: number;
  hazardDropped?: boolean;
}
export interface Hazard {
  id: number;
  x: number;
  y: number;
  kind: 0 | 1;
  age: number;
  contact: boolean;
}
export interface Shot {
  x: number;
  y: number;
  kind: number;
  vx: number;
  vy: number;
  hitsLeft: number;
  hitIds: number[];
}
export interface EnemyShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}
export interface Pickup {
  x: number;
  y: number;
  type: PickupType;
  age: number;
}
export interface Spark {
  x: number;
  y: number;
  age: number;
  hue: number;
}
export interface Save {
  version: 2;
  fed: number;
  keeps: string[];
  muted: boolean;
  reducedMotion: boolean;
  supplies: number;
  stage: number;
  wave: number;
  phase: "waves" | "boss";
  bossHp: number | null;
  activeWeapon: WeaponType;
  weaponLevels: Record<WeaponType, number>;
  rapidLevel: number;
}
const integer = (v: unknown, fallback: number, min: number, max: number) =>
  Number.isSafeInteger(v) ? clamp(v as number, min, max) : fallback;
export class SaveStore {
  static key = "moonlight-munch-run-v1";
  static sanitize(value: unknown): Save {
    const raw =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Partial<Save>)
        : {};
    const levels =
      raw.weaponLevels && typeof raw.weaponLevels === "object"
        ? raw.weaponLevels
        : ({} as Record<WeaponType, number>);
    const weaponLevels = {
      straight: integer(levels.straight, 1, 1, 3),
      spread: integer(levels.spread, 0, 0, 3),
      pierce: integer(levels.pierce, 0, 0, 3),
    };
    const activeWeapon: WeaponType =
      raw.activeWeapon === "spread" || raw.activeWeapon === "pierce"
        ? raw.activeWeapon
        : "straight";
    weaponLevels[activeWeapon] = Math.max(1, weaponLevels[activeWeapon]);
    const fed = integer(raw.fed, 0, 0, 1000000000),
      stage = integer(raw.stage, 1, 1, 9999);
    return {
      version: 2,
      fed,
      keeps: KEEPSAKES.filter((item) => fed >= item.feeds).map(
        (item) => item.id,
      ),
      muted: raw.muted === true,
      reducedMotion: raw.reducedMotion === true,
      supplies: integer(raw.supplies, 100, 0, 100),
      stage,
      wave: integer(raw.wave, 1, 1, 3),
      phase: raw.phase === "boss" ? "boss" : "waves",
      bossHp:
        raw.phase === "boss"
          ? integer(
              raw.bossHp,
              RunModel.bossHealth(stage),
              1,
              RunModel.bossHealth(stage),
            )
          : null,
      activeWeapon,
      weaponLevels,
      rapidLevel: integer(raw.rapidLevel, 0, 0, 3),
    };
  }
  static load(): Save {
    try {
      return this.sanitize(
        JSON.parse(localStorage.getItem(this.key) || "null"),
      );
    } catch {
      return this.sanitize(null);
    }
  }
  static write(save: Save): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.sanitize(save)));
    } catch {
      /* denied storage */
    }
  }
}
/** Normalized simulation: no DOM, renderer or wall-clock timers. */
export class RunModel {
  truckX = 0.16;
  truckY = 0.52;
  clock = 0;
  roadOffset = 0;
  fed = 0;
  wobble = 0;
  supplies = 100;
  stage = 1;
  wave = 1;
  phase: "waves" | "boss" | "restock" = "waves";
  creatures: Creature[] = [];
  shots: Shot[] = [];
  sparks: Spark[] = [];
  enemyShots: EnemyShot[] = [];
  pickups: Pickup[] = [];
  hazards: Hazard[] = [];
  fireLock = 0;
  activeWeapon: WeaponType = "straight";
  weaponLevels: Record<WeaponType, number> = {
    straight: 1,
    spread: 0,
    pierce: 0,
  };
  rapidLevel = 0;
  burstCharge = 1;
  bossHp = 0;
  bossMaxHp = 0;
  private serial = 0;
  private emitted = 0;
  private spawnAt = 0.8;
  private nextFire = 0;
  private nextPickup = 5;
  private pickupIndex = 0;
  private resumePhase: "waves" | "boss" = "waves";
  private invincible = 1.5;
  private bossFire = new FireSteps([1.9, 1.5, 2.2]);
  private summonAt = 0;
  private bossAttackAt = 0;
  private bossHazardAt = 0;
  static bossHealth(stage: number): number {
    return 50 + Math.min(stage - 1, 10) * 18;
  }
  constructor(
    private seed = 7,
    save?: Save,
  ) {
    const s = SaveStore.sanitize(save);
    this.fed = s.fed;
    this.supplies = s.supplies;
    this.stage = s.stage;
    this.wave = s.wave;
    this.activeWeapon = s.activeWeapon;
    this.weaponLevels = { ...s.weaponLevels };
    this.rapidLevel = s.rapidLevel;
    this.resumePhase = s.phase;
    if (s.phase === "boss")
      this.beginBoss(s.bossHp ?? RunModel.bossHealth(s.stage));
    if (!s.supplies) this.phase = "restock";
  }
  random(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }
  steer2d(x: number, y: number, dt: number): void {
    if (
      this.phase === "restock" ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(dt) ||
      dt <= 0
    )
      return;
    const step = Math.min(dt, 0.05) * 0.65;
    this.truckX = clamp(
      this.truckX + clamp(x - this.truckX, -step, step),
      0.08,
      0.68,
    );
    this.truckY = clamp(this.truckY + clamp(y - this.truckY, -step, step));
  }
  steer(y: number, dt: number): void {
    this.steer2d(this.truckX, y, dt);
  }
  toss(): void {
    if (this.phase === "restock" || this.fireLock > 0) return;
    const pattern =
      this.activeWeapon === "spread"
        ? ServingPattern.spread(this.weaponLevels.spread)
        : new ServingPattern(
            this.activeWeapon === "straight" && this.weaponLevels.straight >= 2
              ? Array(this.weaponLevels.straight).fill(0)
              : [0],
          );
    for (let i = 0; i < pattern.count; i++) {
      const a = (pattern.angle(i) * Math.PI) / 180;
      this.shots.push({
        x: this.truckX + 0.065,
        y:
          this.truckY +
          (this.activeWeapon === "straight"
            ? (i - (pattern.count - 1) / 2) * 0.032
            : 0),
        kind: this.activeWeapon === "pierce" ? 1 : 0,
        vx: Math.cos(a) * 0.92,
        vy: Math.sin(a) * 0.92,
        hitsLeft:
          this.activeWeapon === "pierce" ? 1 + this.weaponLevels.pierce : 1,
        hitIds: [],
      });
    }
  }
  collect(type: PickupType): void {
    if (this.phase === "restock") return;
    if (type === "rapid") this.rapidLevel = Math.min(3, this.rapidLevel + 1);
    else if (type === "supplies")
      this.supplies = Math.min(100, this.supplies + 25);
    else {
      this.weaponLevels[type] = incWeaponLevel(this.weaponLevels[type], 3);
      this.activeWeapon = type;
    }
  }
  burst(): boolean {
    if (this.phase === "restock" || this.fireLock > 0 || this.burstCharge < 1)
      return false;
    this.burstCharge = 0;
    for (let i = -5; i <= 5; i++) {
      const a = (i * 7 * Math.PI) / 180;
      this.shots.push({
        x: this.truckX + 0.07,
        y: this.truckY,
        kind: 2,
        vx: Math.cos(a) * 1.2,
        vy: Math.sin(a) * 1.2,
        hitsLeft: 3,
        hitIds: [],
      });
    }
    this.invincible = Math.max(this.invincible, 0.6);
    return true;
  }
  restock(): void {
    if (this.phase !== "restock") return;
    this.supplies = 100;
    this.invincible = 2.5;
    this.wobble = 0;
    this.shots = [];
    this.enemyShots = [];
    this.pickups = [];
    this.hazards = [];
    this.fireLock = 0;
    this.creatures = [];
    this.truckX = 0.16;
    this.truckY = 0.52;
    this.burstCharge = 1;
    if (this.resumePhase === "boss") this.beginBoss(this.bossHp);
    else {
      this.phase = "waves";
      this.emitted = 0;
      this.spawnAt = this.clock + 1.5;
    }
    this.nextFire = this.clock;
    this.nextPickup = this.clock + 4;
  }
  saveState(settings: { muted: boolean; reducedMotion: boolean }): Save {
    return SaveStore.sanitize({
      ...settings,
      version: 2,
      fed: this.fed,
      supplies: this.supplies,
      stage: this.stage,
      wave: this.wave,
      phase: this.phase === "restock" ? this.resumePhase : this.phase,
      bossHp: this.bossHp,
      activeWeapon: this.activeWeapon,
      weaponLevels: this.weaponLevels,
      rapidLevel: this.rapidLevel,
    });
  }
  private guest(
    x: number,
    y: number,
    kind: number,
    pattern = 0,
    vy = 0,
  ): Creature {
    const hp =
      kind === 1 ? 2 + Math.min(2, this.stage - 1) : this.stage >= 3 ? 2 : 1;
    return {
      id: ++this.serial,
      x,
      y,
      kind,
      fed: false,
      age: 0,
      departure: 0,
      bumped: false,
      hp,
      maxHp: hp,
      boss: false,
      baseY: y,
      pattern,
      vy,
    };
  }
  private beginBoss(hp = RunModel.bossHealth(this.stage)): void {
    this.phase = "boss";
    this.resumePhase = "boss";
    this.bossMaxHp = RunModel.bossHealth(this.stage);
    this.bossHp = Math.max(1, hp);
    this.creatures = [
      {
        ...this.guest(0.86, 0.52, 2),
        hp: this.bossHp,
        maxHp: this.bossMaxHp,
        boss: true,
      },
    ];
    this.enemyShots = [];
    this.hazards = [];
    this.bossFire = new FireSteps([1.9, 1.5, 2.2]);
    this.summonAt = this.clock + 7;
    this.bossAttackAt = this.clock + 2.4;
    this.bossHazardAt = this.clock + 3.5;
  }
  private dropHazard(x: number, y: number, kind: 0 | 1): void {
    const cap = this.phase === "boss" ? 4 : 8;
    if (
      this.hazards.length >= cap ||
      this.hazards.some(
        (h) => Math.abs(h.x - x) < 0.1 && Math.abs(h.y - y) < 0.14,
      )
    )
      return;
    this.hazards.push({
      id: ++this.serial,
      x,
      y: this.phase === "boss" ? clamp(y, 0.16, 0.88) : clamp(y, 0.22, 0.8),
      kind,
      age: 0,
      contact: false,
    });
  }
  private tickHazards(dt: number): void {
    this.hazards = this.hazards.filter((h) => h.age + dt < 8 && h.x > -0.1);
    for (const h of this.hazards) {
      h.age += dt;
      if (this.phase === "waves")
        h.x -= dt * (0.17 + Math.min(this.stage - 1, 10) * 0.009);
      const contact =
        h.age >= 0.65 &&
        Math.abs(h.x - this.truckX) < 0.058 &&
        Math.abs(h.y - this.truckY) < 0.078;
      if (contact && !h.contact) {
        this.fireLock = 1;
        this.wobble = Math.max(this.wobble, 0.35);
      }
      h.contact = contact;
    }
  }
  private damage(amount: number, escape = false): void {
    if (this.phase === "restock" || (!escape && this.invincible > 0)) return;
    this.supplies = Math.max(0, this.supplies - amount);
    this.wobble = 0.35;
    if (!escape) this.invincible = 1;
    if (!this.supplies) {
      this.resumePhase = this.phase;
      this.phase = "restock";
    }
  }
  private feed(c: Creature, amount = 1): void {
    if (c.fed) return;
    c.hp = Math.max(0, c.hp - amount);
    if (c.boss) this.bossHp = c.hp;
    if (c.hp) return;
    c.fed = true;
    this.fed++;
    for (let i = 0; i < 8; i++)
      this.sparks.push({ x: c.x, y: c.y, age: -i * 0.025, hue: i * 37 });
    if (c.boss) {
      this.stage++;
      this.wave = 1;
      this.phase = "waves";
      this.resumePhase = "waves";
      this.emitted = 0;
      this.spawnAt = this.clock + 3;
      this.enemyShots = [];
      this.supplies = Math.min(100, this.supplies + 20);
      this.bossHp = 0;
      for (const other of this.creatures)
        if (!other.boss) {
          other.fed = true;
          other.hp = 0;
        }
    }
  }
  tick(delta: number): void {
    if (this.phase === "restock" || !Number.isFinite(delta) || delta <= 0)
      return;
    const dt = Math.min(delta, 0.05);
    this.clock += dt;
    this.wobble = Math.max(0, this.wobble - dt);
    this.invincible = Math.max(0, this.invincible - dt);
    this.fireLock = Math.max(0, this.fireLock - dt);
    this.tickHazards(dt);
    this.burstCharge = Math.min(1, this.burstCharge + dt / 10);
    if (this.phase === "waves") this.roadOffset += dt * 0.035;
    if (this.fireLock === 0 && this.clock >= this.nextFire) {
      this.toss();
      this.nextFire =
        this.clock + Math.max(0.12, 0.3 - this.rapidLevel * 0.045);
    }
    if (this.clock >= this.nextPickup) {
      const types: PickupType[] = [
        "spread",
        "rapid",
        "pierce",
        "spread",
        "supplies",
        "rapid",
        "straight",
      ];
      this.pickups.push({
        x: 0.97,
        y: clamp(
          this.truckY + (this.pickupIndex % 2 ? -0.13 : 0.13),
          0.24,
          0.8,
        ),
        type: types[this.pickupIndex++ % types.length],
        age: 0,
      });
      this.nextPickup = this.clock + 9;
    }
    if (this.phase === "waves") {
      const count = 5 + this.wave + Math.min(3, this.stage - 1);
      if (
        this.emitted < count &&
        this.clock >= this.spawnAt &&
        this.creatures.filter((c) => !c.fed).length < 7
      ) {
        const lane = 0.24 + (this.emitted % 4) * 0.17,
          side = this.stage >= 3 && this.wave >= 2 && this.emitted % 3 === 1;
        this.creatures.push(
          this.guest(
            side ? 0.82 : 1.06,
            side ? (this.emitted % 2 ? 0.1 : 0.94) : lane,
            this.emitted % 3 === 2 ? 1 : 0,
            this.wave >= 2 ? this.wave - 1 : 0,
            side ? (this.emitted % 2 ? 0.18 : -0.18) : 0,
          ),
        );
        this.emitted++;
        this.spawnAt =
          this.clock +
          Math.max(0.75, 1.25 - Math.min(0.5, (this.stage - 1) * 0.07));
      }
      if (this.emitted >= count && !this.creatures.some((c) => !c.fed)) {
        if (this.wave >= 3) this.beginBoss();
        else {
          this.wave++;
          this.emitted = 0;
          this.spawnAt = this.clock + 2.5;
        }
      }
    }
    for (const c of this.creatures) {
      c.age += dt;
      if (c.fed) {
        c.departure += dt;
        c.x += dt * 0.25;
        c.y += (c.y < 0.5 ? -1 : 1) * dt * 0.12;
        continue;
      }
      if (c.boss) {
        c.y = 0.52 + Math.sin(c.age * 0.7) * 0.2;
        if (
          this.clock >= this.bossAttackAt &&
          this.bossFire.ready(this.clock)
        ) {
          const aim = Math.atan2(this.truckY - c.y, this.truckX - c.x);
          for (const offset of [-0.18, 0, 0.18])
            this.enemyShots.push({
              x: c.x - 0.04,
              y: c.y,
              vx: Math.cos(aim + offset) * 0.28,
              vy: Math.sin(aim + offset) * 0.28,
              age: 0,
            });
        }
        if (
          this.clock >= this.summonAt &&
          this.creatures.filter((c) => !c.fed).length < 5
        ) {
          this.creatures.push(
            this.guest(1.05, 0.3, 0, 1),
            this.guest(1.05, 0.76, 1, 1),
          );
          this.summonAt = this.clock + 8;
        }
        if (this.clock >= this.bossHazardAt) {
          this.dropHazard(this.truckX, this.truckY, 1);
          this.bossHazardAt =
            this.clock +
            Math.max(3.5, 5.5 - Math.min(this.stage - 1, 10) * 0.2);
        }
      } else {
        c.x -= dt * (0.17 + Math.min(this.stage - 1, 10) * 0.009);
        if (c.vy) {
          c.baseY += c.vy * dt;
          if (c.baseY >= 0.23 && c.baseY <= 0.8) c.vy = 0;
        }
        c.y = clamp(
          c.baseY +
            (c.pattern
              ? Math.sin(c.age * (c.pattern === 2 ? 1.8 : 1.1)) *
                (c.pattern === 2 ? 0.1 : 0.045)
              : 0),
          c.vy ? 0.1 : 0.17,
          c.vy ? 0.94 : 0.87,
        );
        if (
          !c.hazardDropped &&
          c.age >= 0.4 + (c.id % 3) * 0.1 &&
          (c.kind === 1 || c.id % 2 === 0)
        ) {
          this.dropHazard(c.x - 0.035, c.y, c.kind === 1 ? 1 : 0);
          c.hazardDropped = true;
        }
        if (
          !c.bumped &&
          Math.abs(c.x - this.truckX) < 0.07 &&
          Math.abs(c.y - this.truckY) < 0.075
        ) {
          c.bumped = true;
          this.damage(12);
        }
        if (c.x < -0.06 && !c.bumped) {
          c.bumped = true;
          this.damage(c.kind === 1 ? 10 : 7, true);
        }
      }
      if (this.isRestocking()) return;
    }
    for (const s of this.shots) {
      const previous = s.x;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      for (const c of this.creatures) {
        const radius = c.boss ? 0.065 : 0.034;
        if (
          !c.fed &&
          c.x <= 1 &&
          !s.hitIds.includes(c.id) &&
          s.x >= c.x - radius &&
          previous <= c.x + radius &&
          Math.abs(s.y - c.y) < (c.boss ? 0.11 : 0.045)
        ) {
          this.feed(c, s.kind === 2 ? 2 : 1);
          s.hitIds.push(c.id);
          s.hitsLeft--;
          if (!s.hitsLeft) break;
        }
      }
    }
    this.shots = this.shots.filter(
      (s) => s.hitsLeft > 0 && s.x < 1.16 && s.y > -0.1 && s.y < 1.1,
    );
    for (const s of this.enemyShots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.age += dt;
      if (
        Math.abs(s.x - this.truckX) < 0.055 &&
        Math.abs(s.y - this.truckY) < 0.06
      ) {
        this.damage(8);
        s.age = 99;
      }
    }
    this.enemyShots = this.enemyShots.filter(
      (s) => s.age < 8 && s.x > -0.1 && s.y > 0.08 && s.y < 0.98,
    );
    if (this.isRestocking()) return;
    for (const p of this.pickups) {
      p.x -= dt * 0.1;
      p.age += dt;
      if (
        Math.abs(p.x - this.truckX) < 0.065 &&
        Math.abs(p.y - this.truckY) < 0.08
      ) {
        this.collect(p.type);
        p.x = -1;
      }
    }
    this.pickups = this.pickups.filter((p) => p.x > -0.1);
    this.creatures = this.creatures.filter(
      (c) => c.x > -0.12 && c.departure < 1.8 && c.y > -0.1 && c.y < 1.1,
    );
    for (const p of this.sparks) {
      p.age += dt;
      p.y -= dt * 0.08;
      p.x += Math.sin(p.hue) * dt * 0.05;
    }
    this.sparks = this.sparks.filter((p) => p.age < 0.7);
  }
  private isRestocking(): boolean {
    return this.phase === "restock";
  }
}
