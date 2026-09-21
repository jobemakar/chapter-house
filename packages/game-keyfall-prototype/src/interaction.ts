import type { Vec } from "./types";

export type SlashTrailPoint = { position: Vec; ageMs: number };
export type RemnantSegment = { from: Vec; to: Vec; opacity: number };

/** A short-lived path, intentionally requiring travel before it draws. */
export class SlashTrail {
  readonly lifetimeMs = 360;
  private path: SlashTrailPoint[] = [];
  private dragging = false;
  private releasedAgeMs = 0;

  begin(position: Vec): void { this.path = [{ position: { ...position }, ageMs: 0 }]; this.dragging = true; this.releasedAgeMs = 0; }
  append(position: Vec): void { if (!this.dragging) return; const last = this.path[this.path.length - 1]; if (last && Math.hypot(position.x - last.position.x, position.y - last.position.y) < 2) return; this.path.push({ position: { ...position }, ageMs: 0 }); }
  release(): void { this.dragging = false; this.releasedAgeMs = 0; }
  cancel(): void { this.path = []; this.dragging = false; this.releasedAgeMs = 0; }
  update(deltaMs: number): void { if (this.dragging || this.path.length === 0) return; this.releasedAgeMs += Math.max(0, deltaMs); if (this.releasedAgeMs >= this.lifetimeMs) this.path = []; }
  get points(): readonly Vec[] { return this.path.map((point) => point.position); }
  get isDragging(): boolean { return this.dragging; }
  get isSlash(): boolean { return this.points.length > 1 && this.travelDistance() >= 16; }
  get opacity(): number { return this.dragging ? 1 : Math.max(0, 1 - this.releasedAgeMs / this.lifetimeMs); }
  private travelDistance(): number { let total = 0; const points = this.points; for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y); return total; }
}

export class CordRemnant {
  readonly lifetimeMs = 950;
  private ageMs = 0;
  private loose: Vec;
  private velocity: Vec;
  constructor(readonly side: "anchor" | "key", readonly fixed: Vec, cutPoint: Vec, initialVelocity: Vec) { this.loose = { ...cutPoint }; this.velocity = { ...initialVelocity }; }
  update(deltaMs: number, keyPosition: Vec, keyVelocity: Vec): void { this.ageMs += Math.max(0, deltaMs); const dt = Math.min(50, Math.max(0, deltaMs)) / 1000; if (this.side === "key") this.velocity.x += keyVelocity.x * 0.06; this.velocity.y += 420 * dt; this.velocity.x *= 0.992; this.velocity.y *= 0.992; this.loose.x += this.velocity.x * dt; this.loose.y += this.velocity.y * dt; this.keyPosition = { ...keyPosition }; }
  private keyPosition: Vec = { x: 0, y: 0 };
  get expired(): boolean { return this.ageMs >= this.lifetimeMs; }
  get segment(): RemnantSegment { return { from: this.side === "anchor" ? this.fixed : this.keyPosition, to: this.loose, opacity: Math.max(0, 1 - this.ageMs / this.lifetimeMs) }; }
}

export class CordRemnants {
  private remnants: CordRemnant[] = [];
  spawn(anchor: Vec, cutPoint: Vec, keyPosition: Vec, keyVelocity: Vec): void {
    const ropeX = keyPosition.x - anchor.x, ropeY = keyPosition.y - anchor.y;
    const ropeLength = Math.max(1, Math.hypot(ropeX, ropeY));
    const tangent = { x: -ropeY / ropeLength, y: ropeX / ropeLength };
    const separationSpeed = 70;
    this.remnants.push(
      new CordRemnant("anchor", anchor, cutPoint, { x: keyVelocity.x * 0.1 + tangent.x * separationSpeed, y: keyVelocity.y * 0.1 + tangent.y * separationSpeed + 20 }),
      new CordRemnant("key", keyPosition, cutPoint, { x: keyVelocity.x * 0.2 - tangent.x * separationSpeed, y: keyVelocity.y * 0.2 - tangent.y * separationSpeed + 16 }),
    );
  }
  update(deltaMs: number, keyPosition: Vec, keyVelocity: Vec): void { for (const remnant of this.remnants) remnant.update(deltaMs, keyPosition, keyVelocity); this.remnants = this.remnants.filter((remnant) => !remnant.expired); }
  clear(): void { this.remnants = []; }
  get segments(): readonly RemnantSegment[] { return this.remnants.map((remnant) => remnant.segment); }
}

export class KeyfallEffects {
  readonly trail = new SlashTrail();
  readonly remnants = new CordRemnants();
  update(deltaMs: number, keyPosition: Vec, keyVelocity: Vec): void { this.trail.update(deltaMs); this.remnants.update(deltaMs, keyPosition, keyVelocity); }
  clear(): void { this.trail.cancel(); this.remnants.clear(); }
}
