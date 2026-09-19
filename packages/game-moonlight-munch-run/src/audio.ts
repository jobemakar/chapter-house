export class NightAudio {
  private context?: AudioContext;
  private muted = false;
  async unlock(): Promise<void> {
    this.context ??= new AudioContext();
    if (!this.muted) await this.context.resume();
  }
  setEnabled(enabled: boolean): void {
    this.muted = !enabled;
    if (this.context)
      void (enabled ? this.context.resume() : this.context.suspend()).catch(
        () => {},
      );
  }
  note(frequency: number, duration: number, delay = 0, volume = 0.045): void {
    const c = this.context;
    if (!c || this.muted || c.state !== "running") return;
    const oscillator = c.createOscillator(),
      gain = c.createGain(),
      t = c.currentTime + delay;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain);
    gain.connect(c.destination);
    oscillator.start(t);
    oscillator.stop(t + duration);
  }
  toss(): void {
    this.note(390, 0.09);
    this.note(590, 0.09, 0.045);
  }
  feed(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.note(f, 0.2, i * 0.065));
  }
  bump(): void {
    this.note(130, 0.15, 0, 0.025);
  }
  ambience(clock: number): void {
    const melody = [262, 330, 392, 440, 392, 330];
    this.note(melody[Math.floor(clock / 2) % melody.length], 0.65, 0, 0.012);
  }
  /** Releases the WebAudio graph when a hosted game card is closed. */
  dispose(): void {
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== "closed") void context.close().catch(() => {});
  }
}
