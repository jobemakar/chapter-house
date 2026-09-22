/** Surfaces are deliberately semantic rather than tied to a particular tile asset. */
export type VedaSurface = "stone" | "earth" | "wood";
export type VedaAudioEvent = "footstep" | "push" | "blocked" | "gateLocked" | "switchOn" | "peach" | "gateOpen" | "undo" | "hint" | "levelStart" | "completion";

interface Voice {
  source: AudioScheduledSourceNode;
  nodes: AudioNode[];
  ended: boolean;
}

/**
 * Gesture-gated, synthesized sanctuary sound. The transport owns every source,
 * delayed cue, and ambience timer. A master gain of .30 keeps this in the same
 * useful range as the other Chapter House games without making layered cues hot.
 */
export class VedaAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted: boolean;
  private unlocked = false;
  private lifecycleSuspended = false;
  private disposed = false;
  private desiredRunning = false;
  private transportGeneration = 0;
  private resumeInFlight: Promise<unknown> | null = null;
  private suspendInFlight: Promise<unknown> | null = null;
  private ambienceTimer: number | null = null;
  private delayedCueTimer: number | null = null;
  private ambienceStep = 0;
  private footstepVariant = 0;
  private readonly pendingCues: Array<() => void> = [];
  private readonly voices = new Set<Voice>();
  private readonly eventCounts: Partial<Record<VedaAudioEvent, number>> = {};

  constructor(muted: boolean) { this.muted = muted; }

  /** Unlocks audio from an interaction; no voice or ambience is made before resume succeeds. */
  start(): void {
    if (this.muted || this.disposed || this.lifecycleSuspended) return;
    const context = this.ensureContext();
    if (!context) return;
    this.unlocked = true;
    this.reconcileTransport();
  }

  /** Clears a pause/visibility latch even when audio was muted or never unlocked. */
  resume(): void {
    this.lifecycleSuspended = false;
    this.reconcileTransport();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.pendingCues.length = 0;
      this.clearDelayedCue();
      this.stopVoices();
      this.clearAmbience();
    }
    this.reconcileTransport();
  }

  /** Stops active voices and sparse ambience immediately, retaining unlock state. */
  suspend(): void {
    this.lifecycleSuspended = true;
    this.pendingCues.length = 0;
    this.clearDelayedCue();
    this.stopVoices();
    this.clearAmbience();
    this.reconcileTransport();
  }

  /** A quiet alternating footstep; destination surface changes timbre. */
  footstep(surface: VedaSurface = "earth"): void {
    this.count("footstep");
    const variant = this.footstepVariant++ % 2;
    const base = surface === "wood" ? 235 : surface === "stone" ? 220 : 198;
    this.queueCue(() => this.noteNow(base + variant * 18, 0.085, 0.045, variant ? "triangle" : "sine"));
  }

  /** Wood-on-stone texture with a soft low thump for a successful push. */
  push(): void {
    this.count("push");
    this.queueCue(() => {
      this.noiseNow(0.11, 0.042, 940, 0.7);
      this.noteNow(138, 0.13, 0.055, "triangle", 0.012, -18);
    });
  }

  blocked(): void {
    this.count("blocked");
    this.queueCue(() => this.noteNow(116, 0.09, 0.05, "triangle", 0, -10));
  }

  /** Closed-exit attempts use a recognizably heavier cue than an ordinary wall bump. */
  gateLocked(): void {
    this.count("gateLocked");
    this.queueCue(() => {
      this.noteNow(98, 0.13, 0.055, "triangle", 0, -13);
      this.noteNow(147, 0.16, 0.035, "sine", 0.04, -8);
    });
  }

  /** Two partials give the switch a small brass-like confirmation. */
  switchOn(): void {
    this.count("switchOn");
    this.queueCue(() => {
      this.noteNow(392, 0.18, 0.06, "triangle");
      this.noteNow(587, 0.24, 0.048, "sine", 0.035);
    });
  }

  /** Short pluck followed by a restrained sparkle. */
  peach(): void {
    this.count("peach");
    this.queueCue(() => {
      this.noteNow(659, 0.16, 0.058, "triangle");
      this.noteNow(988, 0.2, 0.036, "sine", 0.075);
    });
  }

  /** Gate confirmation follows the switch cue, avoiding a nine-voice pileup. */
  gateOpen(): void {
    this.count("gateOpen");
    this.start();
    this.clearDelayedCue();
    if (!this.context || !this.unlocked || this.muted || this.lifecycleSuspended || this.disposed) return;
    this.delayedCueTimer = globalThis.setTimeout(() => {
      this.delayedCueTimer = null;
      this.queueCue(() => {
        for (const [index, frequency] of [262, 330, 392, 523].entries()) {
          this.noteNow(frequency, 0.42, 0.05, index % 2 ? "sine" : "triangle", index * 0.075);
        }
        this.noiseNow(0.2, 0.018, 680, 0.45, 0.12);
      });
    }, 230) as unknown as number;
  }

  undo(): void {
    this.count("undo");
    this.queueCue(() => {
      this.noteNow(494, 0.12, 0.045, "sine");
      this.noteNow(330, 0.16, 0.04, "triangle", 0.055);
    });
  }

  hint(): void {
    this.count("hint");
    this.queueCue(() => {
      this.noteNow(523, 0.14, 0.04, "sine");
      this.noteNow(784, 0.2, 0.034, "sine", 0.07);
    });
  }

  levelStart(): void {
    this.count("levelStart");
    this.queueCue(() => {
      this.noteNow(330, 0.14, 0.04, "sine");
      this.noteNow(440, 0.2, 0.034, "triangle", 0.08);
    });
  }

  completion(): void {
    this.count("completion");
    this.queueCue(() => {
      for (const [index, frequency] of [523, 659, 784, 1047].entries()) {
        this.noteNow(frequency, 0.48, 0.055, index === 2 ? "triangle" : "sine", index * 0.085);
      }
    });
  }

  /** Exposed for focused tests without exposing WebAudio internals. */
  snapshot(): {
    unlocked: boolean;
    muted: boolean;
    lifecycleSuspended: boolean;
    desiredRunning: boolean;
    contextState: AudioContextState | "absent";
    resumePending: boolean;
    pendingCues: number;
    activeVoices: number;
    ambienceScheduled: boolean;
    delayedCueScheduled: boolean;
    transportGeneration: number;
    eventCounts: Partial<Record<VedaAudioEvent, number>>;
  } {
    return {
      unlocked: this.unlocked,
      muted: this.muted,
      lifecycleSuspended: this.lifecycleSuspended,
      desiredRunning: this.desiredRunning,
      contextState: this.context?.state ?? "absent",
      resumePending: this.resumeInFlight !== null,
      pendingCues: this.pendingCues.length,
      activeVoices: this.voices.size,
      ambienceScheduled: this.ambienceTimer !== null,
      delayedCueScheduled: this.delayedCueTimer !== null,
      transportGeneration: this.transportGeneration,
      eventCounts: { ...this.eventCounts },
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.transportGeneration += 1;
    this.desiredRunning = false;
    this.resumeInFlight = null;
    this.suspendInFlight = null;
    this.pendingCues.length = 0;
    this.clearDelayedCue();
    this.clearAmbience();
    this.stopVoices();
    const context = this.context;
    this.context = null;
    this.master?.disconnect();
    this.master = null;
    if (context && context.state !== "closed") void Promise.resolve(context.close()).catch(() => {});
  }

  private ensureContext(): AudioContext | null {
    if (this.context || this.disposed || typeof window === "undefined") return this.context;
    try {
      const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      this.context = new AudioCtor();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
      return this.context;
    } catch {
      this.context = null;
      this.master = null;
      return null;
    }
  }

  private shouldRun(): boolean {
    return !this.muted && !this.lifecycleSuspended && !this.disposed && this.unlocked && this.context !== null;
  }

  /** Reconciles desired transport state; generation guards stale async operations. */
  private reconcileTransport(): void {
    const context = this.context;
    const shouldRun = this.shouldRun();
    if (!shouldRun) {
      if (!this.desiredRunning && this.suspendInFlight) return;
      this.desiredRunning = false;
      this.transportGeneration += 1;
      // Detach the current promise so a new resume can be requested immediately;
      // its settlement is identity-checked below and cannot clobber the new one.
      this.resumeInFlight = null;
      this.setMasterGain(0);
      this.clearAmbience();
      if (context && context.state !== "closed") {
        const generation = this.transportGeneration;
        try {
          const operation = Promise.resolve(context.suspend());
          this.suspendInFlight = operation;
          void Promise.resolve(operation).then(() => {
            if (this.suspendInFlight === operation) this.suspendInFlight = null;
            // A stale suspend still needs a reconciliation pass: the browser may
            // settle it after a newer resume request and leave the graph stopped.
            if (this.shouldRun() && (generation === this.transportGeneration || (this.resumeInFlight === null && context.state !== "running"))) this.reconcileTransport();
          }).catch(() => {});
        } catch { /* Optional WebAudio implementation. */ }
      }
      return;
    }
    this.desiredRunning = true;
    if (!context) return;
    if (context.state === "running" && !this.suspendInFlight) {
      this.setMasterGain(0.30);
      this.flushPending();
      this.scheduleAmbience();
      return;
    }
    if (this.resumeInFlight) return;
    const generation = this.transportGeneration += 1;
    try {
      const operation = Promise.resolve(context.resume());
      this.resumeInFlight = operation;
      void operation.then(() => {
        if (this.resumeInFlight === operation) this.resumeInFlight = null;
        if (generation !== this.transportGeneration || !this.shouldRun() || context.state !== "running") {
          if (generation !== this.transportGeneration && this.shouldRun() && this.resumeInFlight === null) this.reconcileTransport();
          return;
        }
        this.setMasterGain(0.30);
        this.flushPending();
        this.scheduleAmbience();
      }).catch(() => {
        if (this.resumeInFlight === operation) this.resumeInFlight = null;
        if (generation !== this.transportGeneration) return;
        this.pendingCues.length = 0;
        this.clearAmbience();
        this.setMasterGain(0);
      });
    } catch {
      this.resumeInFlight = null;
      this.pendingCues.length = 0;
      this.clearAmbience();
      this.setMasterGain(0);
    }
  }

  private setMasterGain(value: number): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state === "closed") return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(value, context.currentTime);
  }

  private queueCue(cue: () => void): void {
    if (this.muted || this.disposed || this.lifecycleSuspended) return;
    const context = this.ensureContext();
    if (!context) return;
    this.unlocked = true;
    this.pendingCues.push(cue);
    this.reconcileTransport();
  }

  private flushPending(): void {
    if (!this.shouldRun() || this.context?.state !== "running") return;
    const pending = this.pendingCues.splice(0);
    for (const cue of pending) {
      if (!this.shouldRun()) break;
      try { cue(); } catch { /* Keep subsequent cues and lifecycle cleanup safe. */ }
    }
  }

  private noteNow(frequency: number, duration: number, volume: number, type: OscillatorType, delay = 0, slide = 0): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state !== "running") return;
    try {
      const at = context.currentTime + Math.max(0, delay);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, frequency + slide), at + duration);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(volume, at + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain);
      gain.connect(master);
      const voice = this.track(oscillator, [gain]);
      try {
        oscillator.start(at);
        oscillator.stop(at + duration + 0.02);
      } catch {
        this.release(voice);
      }
    } catch { /* WebAudio remains an optional enhancement. */ }
  }

  private noiseNow(duration: number, volume: number, filterFrequency: number, filterQ: number, delay = 0): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state !== "running") return;
    try {
      const at = context.currentTime + Math.max(0, delay);
      const source = context.createBufferSource();
      const buffer = context.createBuffer(1, Math.max(1, Math.ceil(context.sampleRate * duration)), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(filterFrequency, at);
      filter.Q.setValueAtTime(filterQ, at);
      const gain = context.createGain();
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      const voice = this.track(source, [filter, gain]);
      try {
        source.start(at);
        source.stop(at + duration + 0.02);
      } catch {
        this.release(voice);
      }
    } catch { /* WebAudio remains an optional enhancement. */ }
  }

  private track(source: AudioScheduledSourceNode, nodes: AudioNode[]): Voice {
    const voice: Voice = { source, nodes, ended: false };
    this.voices.add(voice);
    source.onended = () => this.release(voice);
    return voice;
  }

  private release(voice: Voice): void {
    if (voice.ended) return;
    voice.ended = true;
    this.voices.delete(voice);
    try { voice.source.disconnect(); } catch { /* already disconnected */ }
    for (const node of voice.nodes) { try { node.disconnect(); } catch { /* already disconnected */ } }
  }

  private stopVoices(): void {
    for (const voice of [...this.voices]) {
      try { voice.source.stop(); } catch { /* already ended */ }
      this.release(voice);
    }
  }

  private scheduleAmbience(): void {
    if (this.ambienceTimer !== null || !this.shouldRun() || this.context?.state !== "running") return;
    this.ambienceTimer = globalThis.setTimeout(() => {
      this.ambienceTimer = null;
      if (!this.shouldRun() || this.context?.state !== "running") return;
      const chirps = [392, 440, 494, 330, 370, 440];
      this.noiseNow(0.34, 0.02, 1150, 0.5);
      this.noteNow(chirps[this.ambienceStep++ % chirps.length]!, 0.24, 0.022, "sine", 0.08, 38);
      this.scheduleAmbience();
    }, 5600) as unknown as number;
  }

  private clearAmbience(): void {
    if (this.ambienceTimer === null) return;
    globalThis.clearTimeout(this.ambienceTimer as unknown as ReturnType<typeof setTimeout>);
    this.ambienceTimer = null;
  }

  private clearDelayedCue(): void {
    if (this.delayedCueTimer === null) return;
    globalThis.clearTimeout(this.delayedCueTimer as unknown as ReturnType<typeof setTimeout>);
    this.delayedCueTimer = null;
  }

  private count(event: VedaAudioEvent): void {
    this.eventCounts[event] = (this.eventCounts[event] ?? 0) + 1;
  }
}
