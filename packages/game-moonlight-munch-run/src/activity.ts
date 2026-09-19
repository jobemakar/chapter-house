/** Monotonic active-play accounting: interaction opens only a short consequence window. */
export class ActivePlayMeter {
  private total: number;
  private remaining = 0;
  constructor(initialSeconds: number) {
    this.total = Number.isFinite(initialSeconds) && initialSeconds > 0 ? initialSeconds : 0;
  }
  interact(windowSeconds = 4): void {
    this.remaining = Math.max(this.remaining, Math.max(0, Math.min(windowSeconds, 8)));
  }
  step(dt: number, blocked: boolean): number {
    if (blocked || !Number.isFinite(dt) || dt <= 0 || this.remaining <= 0) return this.total;
    const earned = Math.min(Math.min(dt, 0.05), this.remaining);
    this.remaining -= earned;
    this.total += earned;
    return this.total;
  }
  suspend(): void { this.remaining = 0; }
  get value(): number { return this.total; }
}
