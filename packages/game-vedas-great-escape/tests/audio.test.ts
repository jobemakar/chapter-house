import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { VedaAudio } from "../src/audio";

class FakeParam {
  value = 0;
  cancelScheduledValues(): void {}
  setValueAtTime(value: number): void { this.value = value; }
  linearRampToValueAtTime(value: number): void { this.value = value; }
  exponentialRampToValueAtTime(value: number): void { this.value = value; }
}

class FakeNode {
  readonly connections: FakeNode[] = [];
  disconnectCount = 0;
  connect(node: FakeNode): void { this.connections.push(node); }
  disconnect(): void { this.disconnectCount += 1; }
}

class FakeSource extends FakeNode {
  onended: (() => void) | null = null;
  starts = 0;
  stops = 0;
  start(): void { this.starts += 1; }
  stop(): void { this.stops += 1; }
  end(): void { this.onended?.(); }
}

class FakeOscillator extends FakeSource {
  type: OscillatorType = "sine";
  frequency = new FakeParam();
}

class FakeBufferSource extends FakeSource {
  buffer: FakeBuffer | null = null;
}

class FakeBuffer {
  private readonly channel: Float32Array;
  constructor(length: number) { this.channel = new Float32Array(length); }
  getChannelData(): Float32Array { return this.channel; }
}

class FakeContext {
  static instances: FakeContext[] = [];
  state: AudioContextState = "suspended";
  currentTime = 0;
  sampleRate = 1000;
  destination = new FakeNode();
  resumeCalls = 0;
  suspendCalls = 0;
  closeCalls = 0;
  deferSuspend = false;
  private readonly resumes: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
  private readonly suspends: Array<{ resolve: () => void }> = [];
  readonly sources: FakeSource[] = [];
  readonly gains: FakeNode[] = [];

  constructor() { FakeContext.instances.push(this); }
  createGain(): FakeNode & { gain: FakeParam } { const node = Object.assign(new FakeNode(), { gain: new FakeParam() }); this.gains.push(node); return node; }
  createOscillator(): FakeOscillator { const source = new FakeOscillator(); this.sources.push(source); return source; }
  createBufferSource(): FakeBufferSource { const source = new FakeBufferSource(); this.sources.push(source); return source; }
  createBuffer(_channels: number, length: number): FakeBuffer { return new FakeBuffer(length); }
  createBiquadFilter(): FakeNode & { type: BiquadFilterType; frequency: FakeParam; Q: FakeParam } {
    return Object.assign(new FakeNode(), { type: "bandpass" as BiquadFilterType, frequency: new FakeParam(), Q: new FakeParam() });
  }
  resume(): Promise<void> {
    this.resumeCalls += 1;
    return new Promise<void>((resolve, reject) => this.resumes.push({ resolve, reject }));
  }
  resolveResume(index = 0): void {
    const pending = this.resumes[index];
    if (!pending) throw new Error(`missing resume ${index}`);
    this.resumes.splice(index, 1);
    this.state = "running";
    pending.resolve();
  }
  rejectResume(index = 0): void {
    const pending = this.resumes[index];
    if (!pending) throw new Error(`missing resume ${index}`);
    this.resumes.splice(index, 1);
    pending.reject(new Error("resume rejected"));
  }
  suspend(): Promise<void> {
    this.suspendCalls += 1;
    if (!this.deferSuspend) { this.state = "suspended"; return Promise.resolve(); }
    return new Promise<void>((resolve) => this.suspends.push({ resolve }));
  }
  resolveSuspend(): void {
    const pending = this.suspends.shift();
    if (!pending) throw new Error("missing suspend");
    this.state = "suspended";
    pending.resolve();
  }
  close(): Promise<void> { this.closeCalls += 1; this.state = "closed"; return Promise.resolve(); }
  endSources(): void { for (const source of this.sources) source.end(); }
}

type TimerCallback = () => void;
const timers = new Map<number, TimerCallback>();
let nextTimer = 1;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const originalWindow = (globalThis as unknown as { window?: unknown }).window;

before(() => {
  (globalThis as unknown as { window: unknown }).window = { AudioContext: FakeContext };
  globalThis.setTimeout = ((callback: TimerCallback) => {
    const id = nextTimer++;
    timers.set(id, callback);
    return id as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout;
  globalThis.clearTimeout = ((id: ReturnType<typeof setTimeout>) => { timers.delete(Number(id)); }) as typeof clearTimeout;
});

beforeEach(() => {
  timers.clear();
  nextTimer = 1;
  FakeContext.instances.length = 0;
});

after(() => {
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  if (originalWindow === undefined) delete (globalThis as unknown as { window?: unknown }).window;
  else (globalThis as unknown as { window: unknown }).window = originalWindow;
  timers.clear();
  FakeContext.instances.length = 0;
});

const flush = async (): Promise<void> => { await Promise.resolve(); await Promise.resolve(); };
const current = (): FakeContext => FakeContext.instances.at(-1)!;
const runOneTimer = (): void => {
  const id = timers.keys().next().value as number | undefined;
  if (id === undefined) throw new Error("expected a timer");
  const callback = timers.get(id)!;
  timers.delete(id);
  callback();
};

test("suspend before unlock clears its latch and a later gesture resumes before cue creation", async () => {
  const audio = new VedaAudio(false);
  audio.suspend();
  assert.equal(audio.snapshot().lifecycleSuspended, true);
  audio.resume();
  assert.equal(audio.snapshot().lifecycleSuspended, false);
  audio.footstep();
  const context = current();
  assert.equal(audio.snapshot().activeVoices, 0);
  context.resolveResume();
  await flush();
  assert.equal(audio.snapshot().activeVoices, 1);
  audio.dispose();
});

test("mute, suspend, resume, and unmute reconcile without losing the latch", async () => {
  const audio = new VedaAudio(false);
  audio.start();
  const context = current();
  context.resolveResume();
  await flush();
  audio.suspend();
  audio.resume();
  audio.setMuted(true);
  assert.equal(audio.snapshot().lifecycleSuspended, false);
  audio.setMuted(false);
  assert.equal(audio.snapshot().resumePending, true);
  context.resolveResume();
  await flush();
  assert.equal(audio.snapshot().contextState, "running");
  audio.dispose();
});

test("stale async resume cannot win a rapid pause/resume race", async () => {
  const audio = new VedaAudio(false);
  audio.footstep();
  const context = current();
  audio.suspend();
  audio.resume();
  audio.footstep();
  assert.equal(context.resumeCalls, 2);
  context.resolveResume(0);
  await flush();
  assert.equal(audio.snapshot().activeVoices, 0);
  context.resolveResume(0);
  await flush();
  assert.equal(audio.snapshot().activeVoices, 1);
  audio.dispose();
});

test("a deferred stale suspend cannot beat a newer resume", async () => {
  const audio = new VedaAudio(false);
  audio.start();
  const context = current();
  context.resolveResume();
  await flush();
  context.deferSuspend = true;
  audio.suspend();
  audio.resume();
  audio.footstep();
  assert.equal(context.resumeCalls, 2);
  context.resolveResume();
  await flush();
  assert.equal(audio.snapshot().activeVoices, 1);
  context.resolveSuspend();
  await flush();
  assert.equal(context.resumeCalls, 3);
  context.resolveResume();
  await flush();
  assert.equal(audio.snapshot().contextState, "running");
  audio.dispose();
});

test("a rejected resume leaves no timer or voice and can be retried", async () => {
  const audio = new VedaAudio(false);
  audio.footstep();
  const context = current();
  context.rejectResume();
  await flush();
  assert.equal(audio.snapshot().activeVoices, 0);
  assert.equal(audio.snapshot().ambienceScheduled, false);
  audio.footstep();
  assert.equal(context.resumeCalls, 2);
  context.resolveResume();
  await flush();
  assert.equal(audio.snapshot().activeVoices, 1);
  audio.dispose();
});

test("ambience is sparse and singular, voices naturally release, and semantic layers stay distinct", async () => {
  const audio = new VedaAudio(false);
  audio.start();
  const context = current();
  context.resolveResume();
  await flush();
  assert.equal(audio.snapshot().ambienceScheduled, true);
  audio.footstep("earth");
  audio.switchOn();
  audio.gateOpen();
  assert.equal(timers.size, 2); // one ambience timer and one delayed gate cue
  assert.equal(audio.snapshot().eventCounts.switchOn, 1);
  assert.equal(audio.snapshot().eventCounts.gateOpen, 1);
  runOneTimer(); // ambience or gate ordering is intentionally not observable here
  assert.ok(audio.snapshot().activeVoices >= 1);
  context.endSources();
  assert.equal(audio.snapshot().activeVoices, 0);
  audio.blocked();
  audio.gateLocked();
  assert.equal(audio.snapshot().eventCounts.blocked, 1);
  assert.equal(audio.snapshot().eventCounts.gateLocked, 1);
  audio.dispose();
});

test("dispose clears delayed work, disconnects the graph, and closes context", async () => {
  const audio = new VedaAudio(false);
  audio.start();
  const context = current();
  context.resolveResume();
  await flush();
  audio.gateOpen();
  assert.equal(audio.snapshot().delayedCueScheduled, true);
  audio.dispose();
  assert.equal(context.closeCalls, 1);
  assert.equal(audio.snapshot().activeVoices, 0);
  assert.equal(audio.snapshot().ambienceScheduled, false);
  assert.equal(audio.snapshot().delayedCueScheduled, false);
  assert.equal(timers.size, 0);
});

test("unsupported WebAudio is a safe no-op", () => {
  (globalThis as unknown as { window: unknown }).window = {};
  const audio = new VedaAudio(false);
  audio.completion();
  assert.equal(audio.snapshot().contextState, "absent");
  audio.dispose();
  (globalThis as unknown as { window: unknown }).window = { AudioContext: FakeContext };
});
