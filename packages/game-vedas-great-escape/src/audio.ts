export class VedaAudio {
  private context: AudioContext | null = null;
  constructor(private muted: boolean) {}
  setMuted(muted: boolean): void { this.muted = muted; if (muted) void this.context?.suspend(); }
  start(): void { if (this.muted) return; this.context ??= new AudioContext(); void this.context.resume(); }
  tone(frequency = 300, duration = 0.08): void {
    if (this.muted) return;
    try {
      this.start();
      if (!this.context) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.08, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    } catch { /* Audio remains an optional enhancement. */ }
  }
  suspend(): void { void this.context?.suspend(); }
  dispose(): void { void this.context?.close(); this.context = null; }
}
