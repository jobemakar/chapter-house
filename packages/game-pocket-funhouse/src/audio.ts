/** Gesture-unlocked synthesized music; all nodes/context are released on disposal. */
export class FunhouseAudio {
  private context: AudioContext | null = null;
  private elapsed = 0;
  private step = 0;
  private readonly nodes = new Set<OscillatorNode>();
  constructor(private muted: boolean) {}
  setMuted(muted: boolean): void { this.muted = muted; if (muted) this.suspend(); else this.start(); }
  start(): void { try { if (!this.context) this.context = new AudioContext(); if (!this.muted && this.context.state === "suspended") void this.context.resume().catch(() => undefined); } catch { /* audio is optional */ } }
  suspend(): void { void this.context?.suspend().catch(() => undefined); }
  note(frequency: number, duration = .16, volume = .04, delay = 0): void { const context = this.context; if (!context || context.state !== "running" || this.muted) return; const oscillator = context.createOscillator(); const gain = context.createGain(); const at = context.currentTime + delay; oscillator.type = "sine"; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .012); gain.gain.exponentialRampToValueAtTime(.0001, at + duration); oscillator.connect(gain).connect(context.destination); this.nodes.add(oscillator); oscillator.onended = () => { this.nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); }; oscillator.start(at); oscillator.stop(at + duration + .03); }
  chime(): void { [1, 1.25, 1.5, 2].forEach((factor, index) => this.note(392 * factor, .45, .055, index * .09)); }
  tick(dt: number): void { if (this.muted || this.context?.state !== "running") return; this.elapsed += dt; if (this.elapsed < .48) return; this.elapsed = 0; const tune = [0,7,12,4,9,7,4,-99,2,9,12,7,4,2,0,-99]; const note = tune[this.step++ % tune.length]!; if (note > -90) this.note(261.63 * 2 ** (note / 12), .5, .023); }
  dispose(): void { for (const node of this.nodes) { try { node.stop(); node.disconnect(); } catch { /* stopped node */ } } this.nodes.clear(); void this.context?.close().catch(() => undefined); this.context = null; }
}
