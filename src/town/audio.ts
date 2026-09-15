type TownAudioContext = AudioContext & { createStereoPanner?: () => StereoPannerNode };

export interface TownAudioStatus {
  muted: boolean;
  active: boolean;
  hidden: boolean;
  unlocked: boolean;
  supported: boolean;
  waterPlaying: boolean;
  scheduledVoices: number;
  visible: boolean;
  distance: number;
  pan: number;
  gain: number;
}

/** Gesture-gated procedural fountain water with a deliberately small audio footprint. */
export class TownAudio {
  private context: TownAudioContext | null = null;
  private waterGain: GainNode | null = null;
  private waterPan: StereoPannerNode | null = null;
  private waterSource: AudioBufferSourceNode | null = null;
  private readonly voices = new Set<AudioScheduledSourceNode>();
  private muted: boolean;
  private active = false;
  private hidden = false;
  private unlocked = false;
  private disposed = false;
  private visible = false;
  private distance = Infinity;
  private pan = 0;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  unlock(): void {
    if (this.disposed) return;
    if (!this.context) {
      const Constructor = this.audioContextConstructor();
      if (!Constructor) return;
      try {
        this.context = new Constructor() as TownAudioContext;
      } catch {
        this.context = null;
        return;
      }
    }
    this.unlocked = true;
    this.reconcile();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.reconcile();
  }

  setActive(active: boolean): void {
    this.active = active;
    this.reconcile();
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.reconcile();
  }

  setView(visible: boolean, distance: number, pan: number): void {
    this.visible = visible;
    this.distance = Math.max(0, Number.isFinite(distance) ? distance : Infinity);
    this.pan = Math.max(-1, Math.min(1, pan));
    this.reconcile();
  }

  coin(): void {
    const context = this.context;
    if (!this.canPlay() || !context) return;
    this.note(784, 0.075, 0.036, "triangle", 0);
    this.note(1175, 0.13, 0.028, "sine", 0.06);
  }

  status(): TownAudioStatus {
    return {
      muted: this.muted,
      active: this.active,
      hidden: this.hidden,
      unlocked: this.unlocked,
      supported: this.context !== null || Boolean(this.audioContextConstructor()),
      waterPlaying: this.waterSource !== null,
      scheduledVoices: this.voices.size,
      visible: this.visible,
      distance: this.distance,
      pan: this.pan,
      gain: this.unlocked && this.active && !this.muted && !this.hidden ? this.targetGain() : 0,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopWater();
    this.stopVoices();
    const context = this.context;
    this.context = null;
    this.waterGain = null;
    this.waterPan = null;
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
  }

  private reconcile(): void {
    const context = this.context;
    if (!context || this.disposed || !this.unlocked) return;
    const shouldRun = this.active && !this.muted && !this.hidden;
    if (!shouldRun) {
      this.setWaterGain(0);
      this.stopVoices();
      if (context.state === "running") void context.suspend().catch(() => undefined);
      return;
    }
    if (context.state === "suspended") void context.resume().catch(() => undefined);
    this.ensureWater();
    this.setWaterGain(this.targetGain());
    if (this.waterPan) this.ramp(this.waterPan.pan, this.pan, 0.16);
  }

  private targetGain(): number {
    if (!this.visible) return 0;
    // Close but quiet, with a quick, smooth falloff past the plaza.
    return 0.027 * Math.max(0, 1 - this.distance / 16) ** 1.35;
  }

  private ensureWater(): void {
    const context = this.context;
    if (!context || this.waterSource) return;
    const gain = context.createGain();
    gain.gain.value = 0;
    let tail: AudioNode = gain;
    if (context.createStereoPanner) {
      const panner = context.createStereoPanner();
      panner.pan.value = this.pan;
      gain.connect(panner);
      tail = panner;
      this.waterPan = panner;
    }
    tail.connect(context.destination);
    const seconds = 2.5;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
    const samples = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < samples.length; i++) {
      const noise = Math.random() * 2 - 1;
      last = last * 0.965 + noise * 0.035;
      samples[i] = last * 1.7 + Math.sin((i / context.sampleRate) * Math.PI * 2 * 71) * 0.035;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start();
    this.waterGain = gain;
    this.waterSource = source;
    source.onended = () => {
      if (this.waterSource === source) {
        this.waterSource = null;
        this.waterGain = null;
        this.waterPan = null;
      }
    };
  }

  private stopWater(): void {
    const source = this.waterSource;
    this.waterSource = null;
    this.waterGain = null;
    this.waterPan = null;
    if (source) {
      source.onended = null;
      try { source.stop(); } catch { /* already ended */ }
      source.disconnect();
    }
  }

  private setWaterGain(value: number): void {
    if (this.waterGain && this.context) this.ramp(this.waterGain.gain, value, 0.22);
  }

  private ramp(param: AudioParam, value: number, duration: number): void {
    const time = this.context?.currentTime ?? 0;
    param.cancelScheduledValues(time);
    param.setValueAtTime(param.value, time);
    param.setTargetAtTime(value, time, duration);
  }

  private stopVoices(): void {
    this.voices.forEach((source) => {
      try { source.stop(); } catch { /* already ended */ }
    });
    this.voices.clear();
  }

  private note(frequency: number, duration: number, volume: number, type: OscillatorType, delay: number): void {
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    // Effects share water's attenuated/panned output, so an off-camera fountain
    // cannot produce a foreground coin sound.
    oscillator.connect(gain).connect(this.waterGain ?? context.destination);
    this.voices.add(oscillator);
    oscillator.onended = () => this.voices.delete(oscillator);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  private canPlay(): boolean {
    return Boolean(this.context && this.unlocked && this.active && this.visible && !this.muted && !this.hidden && this.context.state !== "closed");
  }

  private audioContextConstructor(): (new () => AudioContext) | null {
    const candidate = (globalThis as typeof globalThis & { webkitAudioContext?: new () => AudioContext }).AudioContext ?? (globalThis as typeof globalThis & { webkitAudioContext?: new () => AudioContext }).webkitAudioContext;
    return candidate ?? null;
  }
}
