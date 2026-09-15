export class GameAudio {
  context: AudioContext | null;
  step: number;
  elapsed: number;
  dispose() {
    void this.context?.close();
    this.context = null;
  }
  constructor(
    public style: string,
    public muted: boolean,
  ) {
    this.style = style;
    this.muted = muted;
    this.context = null;
    this.step = 0;
    this.elapsed = 0;
  }
  start() {
    try {
      if (!this.context)
        this.context = new (
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext!
        )();
      if (!this.muted && this.context.state === "suspended")
        this.context.resume().catch(() => {});
    } catch {
      /* Silent play is fully supported. */
    }
  }
  note(
    frequency: number,
    duration = 0.18,
    volume = 0.045,
    type: OscillatorType = "sine",
    delay = 0,
  ) {
    if (!this.context || this.context.state !== "running" || this.muted) return;
    const at = this.context.currentTime + delay,
      oscillator = this.context.createOscillator(),
      gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  chime() {
    [1, 1.25, 1.5, 2].forEach((f, i) =>
      this.note(392 * f, 0.45, 0.055, "sine", i * 0.09),
    );
  }
  tick(dt: number) {
    if (this.muted || !this.context || this.context.state !== "running") return;
    this.elapsed += dt;
    const interval = this.style === "musicbox" ? 0.48 : 0.38;
    if (this.elapsed < interval) return;
    this.elapsed = 0;
    const tune =
      this.style === "musicbox"
        ? [0, 7, 12, 4, 9, 7, 4, -99, 2, 9, 12, 7, 4, 2, 0, -99]
        : [0, -99, 4, 7, 9, 7, 4, -99, 2, -99, 7, 9, 12, 9, 7, -99];
    const note = tune[this.step++ % tune.length];
    if (note > -90)
      this.note(
        (this.style === "musicbox" ? 261.63 : 196) * 2 ** (note / 12),
        0.5,
        0.023,
        this.style === "musicbox" ? "sine" : "triangle",
      );
  }
  suspend() {
    this.context?.suspend().catch(() => {});
  }
  toggle() {
    this.muted = !this.muted;
    if (this.muted) this.suspend();
    else this.start();
  }
}
