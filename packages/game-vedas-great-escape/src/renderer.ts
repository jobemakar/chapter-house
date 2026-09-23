import {
  VEDA_ASSET_CATALOG,
  type AtlasCrop,
  type AtlasDefinition,
  type VedaDirection,
  type VedaMotionState,
  type VedaObjectId,
  type VedaEnvironmentId,
} from "./assets";

export interface VedaMotionSnapshot {
  readonly direction: VedaDirection;
  readonly state: VedaMotionState;
  readonly frame: number;
}

/** Returns the largest board width that fits a measured slot at its authored ratio. */
export function fitVedaBoardWidth(
  availableWidth: number,
  availableHeight: number,
  boardWidth: number,
  boardHeight: number,
): number {
  if (![availableWidth, availableHeight, boardWidth, boardHeight].every(Number.isFinite)) return 0;
  if (availableWidth <= 0 || availableHeight <= 0 || boardWidth <= 0 || boardHeight <= 0) return 0;
  return Math.floor(Math.min(availableWidth, availableHeight * boardWidth / boardHeight));
}

/** Deterministic, restrained diorama terrain assignment for a grid cell. */
export function vedaTerrainEnvironment(
  cell: number,
  column: number,
  row: number,
  wall: boolean,
): VedaEnvironmentId {
  if (wall) return "terrainQuietStone";
  let seed = Math.imul(cell + 1, 0x9e3779b1);
  seed ^= Math.imul(column + 11, 0x85ebca6b);
  seed ^= Math.imul(row + 17, 0xc2b2ae35);
  seed ^= seed >>> 16;
  seed = Math.imul(seed, 0x27d4eb2d);
  seed ^= seed >>> 15;
  const bucket = (seed >>> 0) % 100;
  if (bucket < 65) return "terrainBase";
  if (bucket < 79) return "terrainQuietMoss";
  if (bucket < 93) return "terrainQuietRoot";
  return "terrainBase";
}

/**
 * Owns the authored source-frame choice for the elephant. The clock is
 * deterministic: the same timestamp and motion state always select the same
 * atlas cell, while reduced motion pins the stable idle frame.
 */
export class VedaMotionController {
  private direction: VedaDirection = "down";
  private state: VedaMotionState = "idle";
  private frame = 0;
  private baseFrame = 0;
  private startedAt = 0;
  private until = 0;
  private reducedMotion: boolean;

  constructor(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    if (value) this.frame = 0;
  }

  reset(direction: VedaDirection = "down"): void {
    this.direction = direction;
    this.state = "idle";
    this.frame = 0;
    this.baseFrame = 0;
    this.startedAt = 0;
    this.until = 0;
  }

  play(direction: VedaDirection, pushed: boolean, now = 0): void {
    this.direction = direction;
    const nextState: VedaMotionState = this.reducedMotion ? "idle" : pushed ? "push" : "walk";
    const previousState = this.state;
    const frameCount = nextState === "push" ? 2 : nextState === "walk" ? 4 : 1;
    // A fresh move starts at authored frame 0; only overlapping rapid input
    // preserves phase so the complete walk cycle remains observable.
    const continuing = previousState === nextState && now < this.until;
    this.state = nextState;
    this.baseFrame = continuing ? (this.frame + 1) % frameCount : 0;
    this.frame = this.baseFrame;
    this.startedAt = now;
    this.until = now + (pushed ? 400 : 430);
  }

  tick(now: number): VedaMotionSnapshot {
    if (this.state !== "idle" && now >= this.until) {
      this.state = "idle";
      this.frame = 0;
    } else if (!this.reducedMotion && this.state !== "idle") {
      const elapsed = Math.max(0, now - this.startedAt);
      const interval = this.state === "push" ? 145 : 108;
      const count = this.state === "push" ? 2 : 4;
      this.frame = (this.baseFrame + Math.floor(elapsed / interval)) % count;
    } else {
      this.frame = 0;
    }
    return this.snapshot();
  }

  /** True only while a non-reduced-motion move still has frames to animate. */
  isActive(now: number): boolean {
    return !this.reducedMotion && this.state !== "idle" && now < this.until;
  }

  /** Remaining animation time lets the host stop its RAF loop when idle. */
  remaining(now: number): number {
    return this.isActive(now) ? Math.max(0, this.until - now) : 0;
  }

  snapshot(): VedaMotionSnapshot {
    return { direction: this.direction, state: this.state, frame: this.frame };
  }
}

function backgroundPosition(crop: AtlasCrop): string {
  const x = crop.width === 1 ? 0 : (crop.x / (1 - crop.width)) * 100;
  const y = crop.height === 1 ? 0 : (crop.y / (1 - crop.height)) * 100;
  return `${x}% ${y}%`;
}

/** Applies normalized atlas crops to transparent DOM art layers. */
export class VedaSpriteRenderer {
  constructor(private readonly catalog = VEDA_ASSET_CATALOG) {}

  setAtlas(
    element: HTMLElement,
    atlas: AtlasDefinition,
    crop: AtlasCrop,
    label?: string,
  ): void {
    element.style.backgroundImage = `url("${atlas.src}")`;
    element.style.backgroundSize = `${100 / crop.width}% ${100 / crop.height}%`;
    element.style.backgroundPosition = backgroundPosition(crop);
    element.style.backgroundRepeat = "no-repeat";
    if (label) element.setAttribute("aria-label", label);
    element.dataset.asset = atlas.src.split("/").pop() ?? "veda-art";
  }

  environment(element: HTMLElement, id: VedaEnvironmentId): void {
    this.setAtlas(element, this.catalog.environmentAtlas, this.catalog.environment[id]);
    element.dataset.environment = id;
  }

  object(element: HTMLElement, id: VedaObjectId, label?: string): void {
    this.setAtlas(element, this.catalog.objectsAtlas, this.catalog.objects[id], label);
    element.dataset.object = id;
  }

  motion(element: HTMLElement, snapshot: VedaMotionSnapshot): void {
    const frames = this.catalog.motion[snapshot.direction];
    const crop = snapshot.state === "idle"
      ? frames.idle
      : frames[snapshot.state][snapshot.frame] ?? frames.idle;
    const atlas = snapshot.state === "idle"
      ? this.catalog.idle
      : snapshot.state === "walk"
        ? this.catalog.walk
        : this.catalog.push;
    this.setAtlas(element, atlas, crop, "Veda the elephant");
    element.dataset.direction = snapshot.direction;
    element.dataset.motionState = snapshot.state;
    element.dataset.frame = String(snapshot.frame);
  }
}

export type VedaEffectKind =
  | "walk"
  | "push"
  | "switch"
  | "peach"
  | "blocked"
  | "gate-locked"
  | "gate-open"
  | "hint"
  | "completion";

interface ActiveEffect {
  readonly element: HTMLElement;
  readonly timer: number;
}

/** Finite board-local effects with a hard cap and one cleanup owner. */
export class VedaEffects {
  private readonly active = new Set<ActiveEffect>();
  private readonly reducedMotion: boolean;
  private readonly maxEffects = 24;

  constructor(
    private readonly board: HTMLElement,
    private readonly width: number,
    private readonly height: number,
    reducedMotion: boolean,
  ) {
    this.reducedMotion = reducedMotion;
  }

  trigger(kind: VedaEffectKind, cell: number): void {
    while (this.active.size >= this.maxEffects) this.remove(this.active.values().next().value);
    const element = document.createElement("span");
    element.className = `veda-vfx veda-vfx--${kind}`;
    element.dataset.effect = kind;
    element.style.left = `${(cell % this.width) * (100 / this.width)}%`;
    element.style.top = `${Math.floor(cell / this.width) * (100 / this.height)}%`;
    element.style.width = `${100 / this.width}%`;
    element.style.height = `${100 / this.height}%`;
    element.setAttribute("aria-hidden", "true");
    this.board.append(element);
    const duration = this.reducedMotion ? 260 : kind === "completion" ? 900 : 540;
    let entry!: ActiveEffect;
    const timer = window.setTimeout(() => this.remove(entry), duration);
    entry = { element, timer };
    this.active.add(entry);
  }

  clear(): void {
    for (const effect of [...this.active]) this.remove(effect);
    this.board.querySelectorAll<HTMLElement>(".veda-vfx").forEach((node) => node.remove());
  }

  dispose(): void { this.clear(); }

  private remove(effect: ActiveEffect | undefined): void {
    if (!effect) return;
    window.clearTimeout(effect.timer);
    effect.element.remove();
    this.active.delete(effect);
  }
}
