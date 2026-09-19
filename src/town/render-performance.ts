export interface TownRenderFrame {
  zoom: number;
  zoomChanged: boolean;
  refreshShadows: boolean;
}

/** Keeps expensive renderer work bounded while preserving the full town scene. */
export class TownRenderPerformance {
  private targetZoom: number;
  private shadowAge: number;

  constructor(
    private currentZoom = 0.8,
    private readonly minZoom = 0.65,
    private readonly maxZoom = 1.7,
    private readonly shadowInterval = 1 / 30,
  ) {
    this.targetZoom = currentZoom;
    this.shadowAge = shadowInterval;
  }

  get zoom() {
    return this.currentZoom;
  }

  nudgeZoom(delta: number) {
    this.targetZoom = this.clamp(this.targetZoom + delta);
  }

  setZoomImmediate(value: number) {
    this.currentZoom = this.clamp(value);
    this.targetZoom = this.currentZoom;
  }

  update(dt: number): TownRenderFrame {
    const safeDt = Math.max(0, Math.min(dt, 0.05));
    const difference = this.targetZoom - this.currentZoom;
    let zoomChanged = false;
    if (Math.abs(difference) > 0.0005) {
      const mix = 1 - Math.exp(-safeDt * 14);
      this.currentZoom += difference * mix;
      if (Math.abs(this.targetZoom - this.currentZoom) <= 0.0005)
        this.currentZoom = this.targetZoom;
      zoomChanged = true;
    }

    this.shadowAge += safeDt;
    const refreshShadows = this.shadowAge >= this.shadowInterval;
    if (refreshShadows) this.shadowAge %= this.shadowInterval;
    return { zoom: this.currentZoom, zoomChanged, refreshShadows };
  }

  private clamp(value: number) {
    return Math.max(this.minZoom, Math.min(this.maxZoom, value));
  }
}
