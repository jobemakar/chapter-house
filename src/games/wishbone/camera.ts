export interface ViewPoint {
  x: number;
  y: number;
}
/** Presentation-only camera. Physics and saved checkpoints stay in world coordinates. */
export class WishboneCamera {
  readonly width = 1200;
  readonly height = 720;
  worldWidth = 1200;
  worldHeight = 720;
  x = 600;
  y = 360;
  zoom = 1;
  private manual = false;
  private lastMode = "ready";
  private get minZoom() {
    return Math.min(1, this.width / this.worldWidth);
  }
  toWorld(p: ViewPoint): ViewPoint {
    return {
      x: this.x + (p.x - this.width / 2) / this.zoom,
      y: this.y + (p.y - this.height / 2) / this.zoom,
    };
  }
  toScreen(p: ViewPoint): ViewPoint {
    return {
      x: (p.x - this.x) * this.zoom + this.width / 2,
      y: (p.y - this.y) * this.zoom + this.height / 2,
    };
  }
  setWorld(world: { width: number; height: number }) {
    this.worldWidth = world.width;
    this.worldHeight = world.height;
    this.clamp();
  }
  private clamp() {
    const halfW = this.width / (2 * this.zoom),
      halfH = this.height / (2 * this.zoom);
    this.x =
      halfW * 2 >= this.worldWidth
        ? this.worldWidth / 2
        : Math.max(halfW, Math.min(this.worldWidth - halfW, this.x));
    this.y =
      halfH * 2 >= this.worldHeight
        ? this.worldHeight / 2
        : Math.max(halfH, Math.min(this.worldHeight - halfH, this.y));
  }
  zoomAt(value: number, screen: ViewPoint = { x: 600, y: 360 }) {
    const anchor = this.toWorld(screen);
    this.zoom = Math.max(this.minZoom, Math.min(1.8, value));
    this.x = anchor.x - (screen.x - 600) / this.zoom;
    this.y = anchor.y - (screen.y - 360) / this.zoom;
    this.manual = true;
    this.clamp();
  }
  pan(dx: number, dy: number) {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
    this.manual = true;
    this.clamp();
  }
  home(detail = false) {
    this.zoom = detail ? Math.min(1.5, 1.8) : this.minZoom;
    this.x = detail ? 162 : this.worldWidth / 2;
    this.y = 390;
    this.manual = false;
    this.clamp();
  }
  launched() {
    if (this.worldWidth > this.width && this.zoom < 1) {
      this.zoom = 1;
      this.x = 162;
      this.y = 390;
      this.clamp();
    }
    this.manual = false;
    this.lastMode = "flight";
  }
  update(
    dt: number,
    mode: string,
    dog: ViewPoint,
    frozen: boolean,
    reduced: boolean,
  ) {
    if (frozen) return;
    // Returning always restores launch visibility; a manual look around lasts for this throw.
    if (mode !== this.lastMode && mode !== "flight") this.manual = false;
    this.lastMode = mode;
    if (this.manual || (this.zoom === 1 && this.worldWidth <= this.width)) return;
    const target =
      mode === "flight"
        ? { x: dog.x + 120 / this.zoom, y: dog.y }
        : { x: 162, y: 390 };
    // Reduced motion keeps a steady overview rather than following a flying body.
    if (reduced && mode === "flight") {
      this.home();
      return;
    }
    const blend = reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.06) * 5);
    this.x += (target.x - this.x) * blend;
    this.y += (target.y - this.y) * blend;
    this.clamp();
  }
}
