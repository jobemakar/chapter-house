export class KeyfallAudio {
  private context?: AudioContext;
  private unlocked = false;
  constructor(private muted: () => boolean) {}
  unlock(): void { if (this.unlocked || this.muted()) return; this.context = new AudioContext(); this.unlocked = true; }
  chime(frequency = 440, duration = 0.16): void { if (!this.unlocked || this.muted() || !this.context) return; const oscillator = this.context.createOscillator(), gain = this.context.createGain(); oscillator.frequency.value = frequency; oscillator.type = "sine"; gain.gain.setValueAtTime(0.0001, this.context.currentTime); gain.gain.exponentialRampToValueAtTime(0.09, this.context.currentTime + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration); oscillator.connect(gain).connect(this.context.destination); oscillator.start(); oscillator.stop(this.context.currentTime + duration + 0.02); }
}
