export interface DuetSong { roots: number[]; melody: number[]; }

const hertz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** Synthesized transport. It owns every scheduled source so pause/dispose is silent immediately. */
export class DuetMusic {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private readonly nodes = new Set<AudioScheduledSourceNode>();

  async start(): Promise<boolean> {
    try {
      if (!this.context) {
        const AudioCtor = window.AudioContext;
        if (!AudioCtor) return false;
        this.context = new AudioCtor();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.context.destination);
      }
      await this.context.resume();
      return true;
    } catch {
      this.stop();
      this.context = null;
      this.master = null;
      return false;
    }
  }

  now(): number { return this.context?.currentTime ?? performance.now() / 1000; }
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.context && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.32, this.context.currentTime, 0.025);
  }
  tone(midi: number, at: number, duration = 0.25, volume = 0.15, type: OscillatorType = "sine", slide = 0): void {
    if (!this.context || !this.master) return;
    const time = Math.max(this.context.currentTime, at);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(hertz(midi), time);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(hertz(midi + slide), time + duration);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.start(time); oscillator.stop(time + duration + 0.02);
    this.nodes.add(oscillator);
    oscillator.onended = () => { this.nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  }
  schedule(song: DuetSong, beat: number, at: number, active: number, aurora: boolean): void {
    if (beat < 4) { if (Number.isInteger(beat)) this.tone(beat === 3 ? 84 : 72, at, 0.09, 0.11); return; }
    const barBeat = beat - 4;
    const wholeBeat = Number.isInteger(barBeat);
    const root = song.roots[Math.floor(barBeat / 16) % 4]!;
    if (wholeBeat && barBeat % 2 === 0) this.tone(42, at, 0.16, 0.25, "sine", -22);
    if (wholeBeat && barBeat % 4 === 0) for (const interval of [0, 4, 7]) this.tone(root + interval, at, 2.1, 0.045, "triangle");
    if (wholeBeat) {
      const note = root + 12 + song.melody[Math.floor(barBeat) % 8]!;
      this.tone(note, at, 0.42, 0.055);
      if (aurora) this.tone(note + 12, at, 0.65, 0.1);
    }
    if (active >= 3 && wholeBeat && barBeat % 2 === 0) this.tone(root - 12, at, 0.36, 0.18, "triangle");
  }
  flourish(): void {
    for (const [index, note] of [0, 4, 7, 9, 12, 16, 19, 24].entries()) this.tone(72 + note, this.now() + index * 0.08, 0.6, 0.09);
  }
  stop(): void {
    for (const node of this.nodes) { try { node.stop(); } catch { /* already ended */ } }
    this.nodes.clear();
  }
  dispose(): void {
    this.stop();
    this.master?.disconnect();
    void this.context?.close();
    this.master = null;
    this.context = null;
  }
}
