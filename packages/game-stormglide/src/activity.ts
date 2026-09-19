/** Bounded interaction evidence for monotonic account-wide active-play credit. */
export class ActivePlayWindow {
  private deadline = -Infinity;
  private total: number;
  private credited: number;
  public constructor(initialTotal: number, private readonly windowMs = 8000) { this.total = Math.max(0, initialTotal); this.credited = Math.floor(this.total); }
  public activate(now: number): void { this.deadline = Math.max(this.deadline, now + this.windowMs); }
  public advance(now: number, seconds: number): number | null { if (now >= this.deadline || seconds <= 0) return null; this.total += seconds; const whole = Math.floor(this.total); if (whole <= this.credited) return null; this.credited = whole; return whole; }
  public value(): number { return Math.floor(this.total); }
}
