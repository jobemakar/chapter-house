const MIN_X = 0.08;
const MAX_X = 0.68;
const MIN_Y = 0.16;
const MAX_Y = 0.88;

const bound = (value: number, low: number, high: number): number =>
  Math.max(
    low,
    Math.min(high, Number.isFinite(value) ? value : (low + high) / 2),
  );

export interface AimPoint {
  x: number;
  y: number;
}

/** Converts browser pointers and keyboard state into normalized 2D steering. */
export class PointerCoordinator {
  readonly steering = new Map<number, AimPoint>();
  readonly firing = new Set<number>();
  readonly keys = new Set<string>();
  mouse?: AimPoint;

  get mouseY(): number | undefined {
    return this.mouse?.y;
  }

  set mouseY(value: number | undefined) {
    if (value === undefined) this.mouse = undefined;
    else this.mouse = this.point(this.mouse?.x ?? 0.18, value);
  }

  private point(x: number, y: number): AimPoint {
    return { x: bound(x, MIN_X, MAX_X), y: bound(y, MIN_Y, MAX_Y) };
  }

  down(id: number, type: string, x: number, y: number): boolean {
    const point = this.point(x, y);
    if (type === "mouse") {
      this.mouse = point;
      // Mouse movement steers; serving is deliberately explicit via the button or Space/F.
      return false;
    }
    if (x < 0.5) {
      this.steering.set(id, point);
      return false;
    }
    this.firing.add(id);
    return true;
  }

  move(id: number, type: string, x: number, y?: number): void {
    // The optional fourth argument keeps the small vertical-only integration API usable.
    const point = this.point(
      y === undefined ? (this.steering.get(id)?.x ?? this.mouse?.x ?? 0.18) : x,
      y === undefined ? x : y,
    );
    if (type === "mouse") this.mouse = point;
    else if (this.steering.has(id)) this.steering.set(id, point);
  }

  up(id: number, type = "touch"): void {
    this.steering.delete(id);
    this.firing.delete(id);
    if (type === "mouse") this.mouse = undefined;
  }

  clear(): void {
    this.steering.clear();
    this.firing.clear();
    this.keys.clear();
    this.mouse = undefined;
  }

  target(currentX: number, currentY: number, dt?: number): AimPoint {
    // target(y, dt) was the pre-shooter API; preserve it for old embeds.
    if (dt === undefined) {
      dt = currentY;
      currentY = currentX;
      currentX = 0.18;
    }
    const directionX =
      Number(this.keys.has("d") || this.keys.has("arrowright")) -
      Number(this.keys.has("a") || this.keys.has("arrowleft"));
    const directionY =
      Number(this.keys.has("s") || this.keys.has("arrowdown")) -
      Number(this.keys.has("w") || this.keys.has("arrowup"));
    if (directionX || directionY) {
      return this.point(
        currentX + directionX * dt * 0.7,
        currentY + directionY * dt * 0.7,
      );
    }
    return (
      this.steering.values().next().value ??
      this.mouse ??
      this.point(currentX, currentY)
    );
  }

  targetY(current: number, dt: number): number {
    return this.target(0.18, current, dt).y;
  }

  get heldFire(): boolean {
    return this.firing.size > 0 || this.keys.has(" ") || this.keys.has("f");
  }
}

export const POINTER_BOUNDS = Object.freeze({ MIN_X, MAX_X, MIN_Y, MAX_Y });
