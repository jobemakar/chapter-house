export type RoomSound = "ui" | "jump" | "wave" | "pet" | "call" | "lamp";

type RoomAudioContext = AudioContext & {
  createStereoPanner?: AudioContext["createStereoPanner"];
};

export interface RoomAudioStatus {
  muted: boolean;
  roomActive: boolean;
  hidden: boolean;
  unlocked: boolean;
  supported: boolean;
  ambientPlaying: boolean;
  scheduledVoices: number;
}

/** Small, gesture-gated soundscape for the shared clubhouse. */
export class RoomAudio {
  private context: RoomAudioContext | null = null;
  private readonly voices = new Set<AudioScheduledSourceNode>();
  private ambientTimer: ReturnType<typeof setTimeout> | null = null;
  private ambientPlaying = false;
  private ambientStep = 0;
  private disposed = false;
  private suspendPromise: Promise<void> | null = null;
  private roomActive = true;
  private hidden = false;
  private unlocked = false;

  constructor(private muted: boolean) {}

  unlock(): void {
    if (this.disposed || this.unlocked) {
      this.reconcileTransport();
      return;
    }
    const AudioContextConstructor = this.audioContextConstructor();
    if (!AudioContextConstructor) return;
    try {
      this.context = new AudioContextConstructor() as RoomAudioContext;
      this.unlocked = true;
      this.reconcileTransport();
    } catch {
      this.context = null;
      this.unlocked = false;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.reconcileTransport();
  }

  setRoomActive(active: boolean): void {
    this.roomActive = active;
    this.reconcileTransport();
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.reconcileTransport();
  }

  play(sound: RoomSound): void {
    if (!this.canPlay()) return;
    const patterns: Record<
      RoomSound,
      Array<[number, number, number, OscillatorType]>
    > = {
      ui: [[392, 0.09, 0.028, "sine"]],
      jump: [
        [330, 0.11, 0.04, "triangle"],
        [494, 0.14, 0.032, "triangle"],
      ],
      wave: [
        [523, 0.12, 0.032, "sine"],
        [659, 0.17, 0.026, "sine"],
      ],
      pet: [
        [262, 0.16, 0.034, "sine"],
        [330, 0.2, 0.028, "sine"],
      ],
      call: [
        [440, 0.12, 0.034, "triangle"],
        [554, 0.16, 0.028, "triangle"],
        [659, 0.19, 0.022, "triangle"],
      ],
      lamp: [
        [196, 0.2, 0.026, "sine"],
        [294, 0.25, 0.022, "sine"],
      ],
    };
    const notes = patterns[sound];
    notes.forEach(([frequency, duration, volume, type], index) =>
      this.note(frequency, duration, volume, type, index * 0.055),
    );
  }

  status(): RoomAudioStatus {
    return {
      muted: this.muted,
      roomActive: this.roomActive,
      hidden: this.hidden,
      unlocked: this.unlocked,
      supported:
        this.context !== null || Boolean(this.audioContextConstructor()),
      ambientPlaying: this.ambientPlaying,
      scheduledVoices: this.voices.size,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopSoundscape();
    const context = this.context;
    this.context = null;
    this.unlocked = false;
    if (context) this.safelyClose(context);
  }

  private canPlay(): boolean {
    return Boolean(
      !this.disposed &&
      !this.muted &&
      this.roomActive &&
      !this.hidden &&
      this.unlocked &&
      !this.suspendPromise &&
      this.context &&
      this.context.state === "running",
    );
  }

  private audioContextConstructor(): typeof AudioContext | undefined {
    const scope = globalThis as typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
    return scope.AudioContext ?? scope.webkitAudioContext;
  }

  private resumeIfNeeded(): void {
    const context = this.context;
    if (!context || !this.shouldRun()) return;
    if (this.suspendPromise) {
      void this.suspendPromise.then(() => {
        if (this.shouldRun()) this.resumeIfNeeded();
      });
      return;
    }
    if (context.state !== "suspended" && context.state !== "interrupted")
      return;
    try {
      const result = context.resume();
      void result
        .then(() => {
          if (this.shouldRun()) this.refreshAmbient();
          else this.stopSoundscape();
        })
        .catch(() => undefined);
    } catch {
      /* Browsers may reject resume outside a valid user activation. */
    }
  }

  private shouldRun(): boolean {
    return (
      !this.disposed &&
      !this.muted &&
      this.roomActive &&
      !this.hidden &&
      this.unlocked
    );
  }

  private reconcileTransport(): void {
    if (this.shouldRun()) {
      this.resumeIfNeeded();
      this.refreshAmbient();
    } else {
      this.stopSoundscape();
    }
  }

  private refreshAmbient(): void {
    if (!this.canPlay() || this.ambientPlaying) return;
    this.ambientPlaying = true;
    this.ambientStep = 0;
    this.scheduleAmbient();
  }

  private scheduleAmbient(): void {
    if (!this.ambientPlaying || !this.canPlay()) return;
    const chords = [
      [261.63, 329.63, 392],
      [220, 261.63, 329.63],
      [293.66, 349.23, 440],
      [246.94, 293.66, 369.99],
    ];
    const chord = chords[this.ambientStep % chords.length];
    chord.forEach((frequency) => this.note(frequency, 2.55, 0.009, "sine"));
    const melody = [523.25, 0, 587.33, 659.25, 0, 587.33, 493.88, 0];
    const melodyNote = melody[this.ambientStep % melody.length];
    if (melodyNote) this.note(melodyNote, 0.42, 0.012, "triangle", 0.42);
    this.ambientStep++;
    this.ambientTimer = setTimeout(() => {
      this.ambientTimer = null;
      this.scheduleAmbient();
    }, 2400);
  }

  private stopSoundscape(): void {
    this.ambientPlaying = false;
    if (this.ambientTimer !== null) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {
        /* Already-ended sources are harmless. */
      }
      try {
        voice.disconnect();
      } catch {
        /* Some test and browser implementations disconnect automatically. */
      }
    }
    this.voices.clear();
    if (this.context?.state === "running" && !this.suspendPromise) {
      try {
        const result = this.context.suspend();
        this.suspendPromise = result
          .then(() => undefined)
          .catch(() => undefined)
          .finally(() => {
            this.suspendPromise = null;
            if (this.shouldRun()) this.resumeIfNeeded();
          });
      } catch {
        /* Suspension is best effort. */
      }
    }
  }

  private note(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    delay = 0,
  ): void {
    const context = this.context;
    if (!this.canPlay() || !context) return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = context.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(volume, at + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      this.voices.add(oscillator);
      oscillator.onended = () => {
        this.voices.delete(oscillator);
        try {
          oscillator.disconnect();
          gain.disconnect();
        } catch {
          /* Cleanup is best effort. */
        }
      };
      oscillator.start(at);
      oscillator.stop(at + duration + 0.04);
    } catch {
      /* A missing or partially implemented Web Audio API stays silent. */
    }
  }

  private safelyClose(context: AudioContext): void {
    try {
      const result = context.close();
      void result.catch(() => undefined);
    } catch {
      /* Closing is best effort, especially for lightweight test doubles. */
    }
  }
}
