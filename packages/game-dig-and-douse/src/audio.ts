type Param = { value: number; setValueAtTime?: (value: number, time: number) => void; linearRampToValueAtTime?: (value: number, time: number) => void; exponentialRampToValueAtTime?: (value: number, time: number) => void };
type Voice = { frequency: Param; type: OscillatorType | string; connect: (node: unknown) => unknown; start: (time?: number) => void; stop: (time?: number) => void; onended: (() => void) | null };
type Gain = { gain: Param; connect: (node: unknown) => unknown };
type Context = { currentTime: number; destination: unknown; createOscillator: () => Voice; createGain: () => Gain; resume?: () => Promise<void>; close?: () => Promise<void> };
type ContextFactory = () => Context | undefined;

/** Original, gesture-gated soundscape for Dig & Douse; safe on Web Audio-less devices. */
export class DigAndDouseAudio {
  private context?: Context;
  private unlocked = false;
  private paused = false;
  private disposed = false;
  private mutedOverride = false;
  private readonly voices = new Set<Voice>();
  private bed: Voice[] = [];
  constructor(private readonly muted: () => boolean, private readonly makeContext?: ContextFactory) {}

  unlock(): void {
    if (this.unlocked || this.disposed || this.isMuted()) return;
    const factory = this.makeContext ?? (() => {
      const Ctor = (globalThis as typeof globalThis & { AudioContext?: new () => AudioContext }).AudioContext;
      return Ctor ? new Ctor() as unknown as Context : undefined;
    });
    try { this.context = factory(); } catch { this.context = undefined; }
    if (!this.context) return;
    this.unlocked = true;
    void this.context.resume?.();
    this.startBed();
  }
  setMuted(value: boolean): void {
    this.mutedOverride = value;
    if (this.isMuted()) this.stopAll();
    else if (this.unlocked && !this.paused) { void this.context?.resume?.(); this.startBed(); }
  }
  setPaused(value: boolean): void {
    this.paused = value;
    if (value) this.stopBed();
    else if (this.unlocked && !this.isMuted()) { void this.context?.resume?.(); this.startBed(); }
  }
  digging(): void { this.cue([115, 172], 0.1, 0.045, "triangle"); }
  waterFlow(): void { this.cue([220, 277, 330], 0.24, 0.04, "sine"); }
  splash(): void { this.cue([330, 440, 550], 0.18, 0.06, "sine"); }
  collectible(): void { this.cue([660, 880], 0.2, 0.075, "sine"); }
  complete(): void { this.cue([523.25, 659.25, 783.99, 1046.5], 0.42, 0.085, "sine"); }
  reset(): void { this.cue([260, 190], 0.16, 0.04, "sine"); }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.stopAll(); void this.context?.close?.(); this.context = undefined; this.unlocked = false;
  }
  private isMuted(): boolean { return this.mutedOverride || this.muted(); }
  private startBed(): void {
    if (!this.context || this.paused || this.isMuted() || this.bed.length) return;
    const now = this.context.currentTime;
    this.bed = [130.81, 196].map((frequency, index) => {
      const voice = this.context!.createOscillator(), gain = this.context!.createGain();
      voice.type = index ? "triangle" : "sine"; voice.frequency.value = frequency;
      gain.gain.setValueAtTime?.(0.0001, now); gain.gain.linearRampToValueAtTime?.(index ? 0.008 : 0.014, now + 1.25);
      (voice.connect(gain) as Gain).connect(this.context!.destination);
      this.voices.add(voice); voice.onended = () => this.voices.delete(voice); voice.start(now); return voice;
    });
  }
  private stopBed(): void { for (const voice of this.bed) this.stopVoice(voice); this.bed = []; }
  private stopAll(): void { this.stopBed(); for (const voice of [...this.voices]) this.stopVoice(voice); }
  private stopVoice(voice: Voice): void { try { voice.stop?.(); } catch { /* already stopped */ } this.voices.delete(voice); }
  private cue(frequencies: number[], duration: number, peak: number, type: OscillatorType | string): void {
    if (!this.context || !this.unlocked || this.paused || this.isMuted() || this.disposed) return;
    const now = this.context.currentTime;
    frequencies.forEach((frequency, index) => {
      const voice = this.context!.createOscillator(), gain = this.context!.createGain();
      const start = now + index * Math.min(0.045, duration / 3);
      voice.type = type; voice.frequency.value = frequency;
      gain.gain.setValueAtTime?.(0.0001, start); gain.gain.exponentialRampToValueAtTime?.(peak, start + 0.012); gain.gain.exponentialRampToValueAtTime?.(0.0001, start + duration);
      (voice.connect(gain) as Gain).connect(this.context!.destination);
      this.voices.add(voice); voice.onended = () => this.voices.delete(voice); voice.start(start); voice.stop(start + duration + 0.02);
    });
  }
}
