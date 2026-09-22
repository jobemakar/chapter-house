type AudioParamLike = { value: number; setValueAtTime?: (value: number, when: number) => void; linearRampToValueAtTime?: (value: number, when: number) => void; exponentialRampToValueAtTime?: (value: number, when: number) => void };
type OscillatorLike = { type: OscillatorType | string; frequency: AudioParamLike; connect: (node: unknown) => unknown; start: (when?: number) => void; stop: (when?: number) => void; onended: (() => void) | null };
type GainLike = { gain: AudioParamLike; connect: (node: unknown) => unknown };
type ContextLike = { currentTime: number; destination: unknown; createOscillator: () => OscillatorLike; createGain: () => GainLike; resume?: () => Promise<void>; close?: () => Promise<void> };
type ContextFactory = () => ContextLike;

/** Asset-free Keyfall soundscape, safe when Web Audio is unavailable. */
export class KeyfallAudio {
  private context?: ContextLike;
  private unlocked = false;
  private paused = false;
  private explicitMuted = false;
  private disposed = false;
  private readonly voices = new Set<OscillatorLike>();
  private musicVoices: OscillatorLike[] = [];

  constructor(private readonly muted: () => boolean, private readonly contextFactory?: ContextFactory) {}

  unlock(): void {
    if (this.unlocked || this.disposed || this.isMuted()) return;
    const factory = this.contextFactory ?? (() => {
      const Ctor = (globalThis as typeof globalThis & { AudioContext?: new () => AudioContext }).AudioContext;
      return Ctor ? new Ctor() as unknown as ContextLike : undefined;
    });
    try { this.context = factory(); } catch { this.context = undefined; }
    if (!this.context) return;
    this.unlocked = true;
    void this.context.resume?.();
    this.startMusic();
  }

  setMuted(muted: boolean): void {
    this.explicitMuted = muted;
    if (this.isMuted()) this.stopAll();
    else if (this.unlocked && !this.paused) { void this.context?.resume?.(); this.startMusic(); }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.stopMusic();
    else if (this.unlocked && !this.isMuted()) { void this.context?.resume?.(); this.startMusic(); }
  }

  cordCut(): void { this.playCue([220, 330], 0.12, 0.06, "triangle"); }
  fanActivate(): void { this.playCue([180, 270, 360], 0.2, 0.045, "sine"); }
  ticketCollect(): void { this.playCue([660, 880], 0.18, 0.075, "sine"); }
  gentleReset(): void { this.playCue([300, 220], 0.22, 0.045, "sine"); }
  levelComplete(): void { this.playCue([523.25, 659.25, 783.99, 1046.5], 0.42, 0.085, "sine"); }
  /** Existing integration compatibility. */
  chime(frequency = 440, duration = 0.16): void { this.playCue([frequency], duration, 0.09, "sine"); }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAll();
    void this.context?.close?.();
    this.context = undefined;
    this.unlocked = false;
  }

  private isMuted(): boolean { return this.explicitMuted || this.muted(); }

  private startMusic(): void {
    if (!this.context || this.paused || this.isMuted() || this.musicVoices.length > 0) return;
    const now = this.context.currentTime;
    this.musicVoices = [146.83, 174.61].map((frequency, index) => {
      const oscillator = this.context!.createOscillator(), gain = this.context!.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime?.(0.0001, now);
      gain.gain.linearRampToValueAtTime?.(index === 0 ? 0.018 : 0.009, now + 1.5);
      (oscillator.connect(gain) as GainLike).connect(this.context!.destination);
      this.voices.add(oscillator);
      oscillator.onended = () => this.voices.delete(oscillator);
      oscillator.start(now);
      return oscillator;
    });
  }

  private stopMusic(): void { for (const voice of this.musicVoices) this.stopVoice(voice); this.musicVoices = []; }
  private stopAll(): void { this.stopMusic(); for (const voice of [...this.voices]) this.stopVoice(voice); }
  private stopVoice(voice: OscillatorLike): void { try { voice.stop?.(); } catch { /* already stopped */ } this.voices.delete(voice); }

  private playCue(frequencies: number[], duration: number, peak: number, type: OscillatorType | string): void {
    if (!this.context || !this.unlocked || this.paused || this.isMuted() || this.disposed) return;
    const now = this.context.currentTime;
    frequencies.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator(), gain = this.context!.createGain();
      const start = now + index * Math.min(0.045, duration / 3);
      oscillator.type = type; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime?.(0.0001, start);
      gain.gain.exponentialRampToValueAtTime?.(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime?.(0.0001, start + duration);
      (oscillator.connect(gain) as GainLike).connect(this.context!.destination);
      this.voices.add(oscillator); oscillator.onended = () => this.voices.delete(oscillator);
      oscillator.start(start); oscillator.stop(start + duration + 0.025);
    });
  }
}
