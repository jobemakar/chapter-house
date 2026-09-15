import assert from "node:assert/strict";
import { test } from "node:test";
import { TownAudio } from "../src/town/audio";

class FakeParam {
  value = 0;
  readonly ramps: number[] = [];
  cancelScheduledValues() {}
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; this.ramps.push(value); }
  setTargetAtTime(value: number) { this.value = value; this.ramps.push(value); }
  exponentialRampToValueAtTime(value: number) { this.value = value; this.ramps.push(value); }
}

class FakeNode {
  connect() { return this; }
  disconnect() {}
}

class FakeSource extends FakeNode {
  onended: (() => void) | null = null;
  stopped = false;
  start() {}
  stop() { this.stopped = true; }
}

class FakeAudioContext {
  state: AudioContextState = "suspended";
  currentTime = 0;
  sampleRate = 100;
  destination = new FakeNode();
  readonly gains: Array<{ gain: FakeParam } & FakeNode> = [];
  readonly panners: Array<{ pan: FakeParam } & FakeNode> = [];
  readonly buffers: FakeSource[] = [];
  readonly oscillators: FakeSource[] = [];
  suspendCalls = 0;
  closeCalls = 0;
  createGain() {
    const gain = Object.assign(new FakeNode(), { gain: new FakeParam() });
    this.gains.push(gain);
    return gain;
  }
  createStereoPanner() {
    const panner = Object.assign(new FakeNode(), { pan: new FakeParam() });
    this.panners.push(panner);
    return panner;
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(250) };
  }
  createBufferSource() {
    const source = new FakeSource();
    this.buffers.push(source);
    return Object.assign(source, { buffer: null as AudioBuffer | null, loop: false });
  }
  createOscillator() {
    const oscillator = new FakeSource();
    this.oscillators.push(oscillator);
    return Object.assign(oscillator, { type: "sine" as OscillatorType, frequency: new FakeParam() });
  }
  resume() { this.state = "running"; return Promise.resolve(); }
  suspend() { this.suspendCalls++; this.state = "suspended"; return Promise.resolve(); }
  close() { this.closeCalls++; this.state = "closed"; return Promise.resolve(); }
}

test("town water is gesture-gated and responds to view attenuation and stereo pan", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  const contexts: FakeAudioContext[] = [];
  let audio: TownAudio | undefined;
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: class extends FakeAudioContext {
      constructor() { super(); contexts.push(this); }
    },
  });
  try {
    audio = new TownAudio(false);
    audio.setActive(true);
    audio.setView(true, 1, -0.6);
    audio.coin();
    assert.equal(contexts.length, 0, "no context before a user gesture");

    audio.unlock();
    assert.equal(contexts.length, 1);
    assert.equal(audio.status().waterPlaying, true);
    assert.equal(contexts[0].buffers.length, 1, "one looping water source");
    assert.equal(contexts[0].panners[0].pan.value, -0.6);
    const waterGain = contexts[0].gains[0].gain;
    const nearGain = waterGain.ramps.at(-1)!;
    assert.ok(nearGain > 0);

    audio.setView(true, 15, 0.8);
    assert.ok(waterGain.ramps.at(-1)! < nearGain, "distance lowers gain");
    assert.equal(contexts[0].panners[0].pan.value, 0.8);
    audio.setView(false, 1, 0);
    assert.equal(waterGain.ramps.at(-1), 0, "off-camera water fades fully out");
    audio.coin();
    assert.equal(contexts[0].oscillators.length, 0, "off-camera fountain effects are silent");
    audio.setView(true, 1, 0);
    audio.coin();
    assert.equal(contexts[0].oscillators.length, 2, "an eligible coin toss uses two short notes");
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("town audio mutes, suspends in a hidden page, and tears down all voices", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  let context: FakeAudioContext | undefined;
  let audio: TownAudio | undefined;
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: class extends FakeAudioContext {
      constructor() { super(); context = this; }
    },
  });
  try {
    audio = new TownAudio(false);
    audio.setActive(true);
    audio.setView(true, 2, 0);
    audio.unlock();
    audio.coin();
    assert.equal(audio.status().scheduledVoices, 2);

    audio.setMuted(true);
    audio.coin();
    assert.equal(audio.status().scheduledVoices, 0, "mute stops and blocks effect voices");
    assert.equal(context!.gains[0].gain.ramps.at(-1), 0, "mute fades water out");
    audio.setMuted(false);
    assert.ok(context!.gains[0].gain.ramps.at(-1)! > 0);

    audio.setHidden(true);
    assert.equal(context!.gains[0].gain.ramps.at(-1), 0);
    assert.ok(context!.suspendCalls >= 1, "inactive audio transport is suspended");
    audio.coin();
    assert.equal(audio.status().scheduledVoices, 0, "hidden pages do not schedule effects");

    audio.dispose();
    assert.equal(context!.buffers[0].stopped, true);
    assert.equal(context!.oscillators.every((voice) => voice.stopped), true);
    assert.equal(context!.closeCalls, 1);
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("town audio remains a safe no-op where Web Audio is unavailable", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  Reflect.deleteProperty(globalThis, "AudioContext");
  let audio: TownAudio | undefined;
  try {
    audio = new TownAudio(false);
    audio.unlock();
    audio.setActive(true);
    audio.setView(true, 0, 0);
    audio.coin();
    assert.deepEqual(audio.status(), {
      muted: false, active: true, hidden: false, unlocked: false,
      supported: false, waterPlaying: false, scheduledVoices: 0,
      visible: true, distance: 0, pan: 0,
      gain: 0,
    });
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
  }
});
