import assert from "node:assert/strict";
import { test } from "node:test";
import { TownAudio } from "../src/town/audio";

class FakeParam {
  value = 0;
  readonly ramps: number[] = [];
  cancelScheduledValues() {}
  setValueAtTime(value: number) {
    this.value = value;
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
    this.ramps.push(value);
  }
  setTargetAtTime(value: number) {
    this.value = value;
    this.ramps.push(value);
  }
  exponentialRampToValueAtTime(value: number) {
    this.value = value;
    this.ramps.push(value);
  }
}

class FakeNode {
  connect() {
    return this;
  }
  disconnect() {}
}

class FakeSource extends FakeNode {
  onended: (() => void) | null = null;
  stopped = false;
  start() {}
  stop() {
    this.stopped = true;
  }
}

class FakeAudioContext {
  state: AudioContextState = "suspended";
  currentTime = 0;
  sampleRate = 100;
  destination = new FakeNode();
  readonly gains: Array<{ gain: FakeParam } & FakeNode> = [];
  readonly panners: Array<{ pan: FakeParam } & FakeNode> = [];
  readonly buffers: FakeSource[] = [];
  readonly oscillators: Array<
    FakeSource & { type: OscillatorType; frequency: FakeParam }
  > = [];
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
    return Object.assign(source, {
      buffer: null as AudioBuffer | null,
      loop: false,
    });
  }
  createOscillator() {
    const oscillator = Object.assign(new FakeSource(), {
      type: "sine" as OscillatorType,
      frequency: new FakeParam(),
    });
    this.oscillators.push(oscillator);
    return oscillator;
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  suspend() {
    this.suspendCalls++;
    this.state = "suspended";
    return Promise.resolve();
  }
  close() {
    this.closeCalls++;
    this.state = "closed";
    return Promise.resolve();
  }
}

test("town audio is gesture-gated: water is spatial, nature is global, and coins remain audible", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  const contexts: FakeAudioContext[] = [];
  let audio: TownAudio | undefined;
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: class extends FakeAudioContext {
      constructor() {
        super();
        contexts.push(this);
      }
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
    assert.equal(audio.status().naturePlaying, true);
    assert.equal(
      contexts[0].buffers.length,
      2,
      "one water loop and one global nature loop",
    );
    assert.equal(
      contexts[0].gains.length,
      2,
      "water and nature each own a gain",
    );
    assert.equal(contexts[0].panners.length, 1, "only water is spatialized");
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
    assert.equal(
      contexts[0].oscillators.length,
      2,
      "an off-camera toss still has a clink and splash",
    );
    assert.equal(contexts[0].oscillators[0].frequency.value, 1760);
    assert.equal(
      contexts[0].oscillators[1].frequency.value,
      120,
      "the splash falls in pitch",
    );
    audio.setView(true, 1, 0);
    audio.coin();
    assert.equal(
      contexts[0].oscillators.length,
      4,
      "each eligible toss uses two short voices",
    );
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
      constructor() {
        super();
        context = this;
      }
    },
  });
  try {
    audio = new TownAudio(false);
    audio.setActive(true);
    audio.setView(true, 2, 0);
    audio.unlock();
    audio.coin();
    assert.equal(audio.status().scheduledVoices, 2);
    assert.equal(audio.status().naturePlaying, true);

    audio.setMuted(true);
    audio.coin();
    assert.equal(
      audio.status().scheduledVoices,
      0,
      "mute stops and blocks effect voices",
    );
    assert.equal(
      context!.gains[0].gain.ramps.at(-1),
      0,
      "mute fades water out",
    );
    assert.equal(
      audio.status().naturePlaying,
      false,
      "mute stops the global nature loop and bird timer",
    );
    audio.setMuted(false);
    assert.ok(context!.gains[0].gain.ramps.at(-1)! > 0);
    assert.equal(
      audio.status().naturePlaying,
      true,
      "unmuting restores nature while active",
    );

    audio.setActive(false);
    audio.coin();
    assert.equal(
      audio.status().naturePlaying,
      false,
      "leaving town stops nature and blocks coin voices",
    );
    assert.equal(audio.status().scheduledVoices, 0);
    audio.setActive(true);
    assert.equal(
      audio.status().naturePlaying,
      true,
      "returning to town restores nature",
    );

    audio.setHidden(true);
    assert.equal(context!.gains[0].gain.ramps.at(-1), 0);
    assert.ok(
      context!.suspendCalls >= 1,
      "inactive audio transport is suspended",
    );
    audio.coin();
    assert.equal(
      audio.status().scheduledVoices,
      0,
      "hidden pages do not schedule effects",
    );
    assert.equal(
      audio.status().naturePlaying,
      false,
      "hidden pages stop nature and clear its bird timer",
    );

    audio.dispose();
    assert.equal(
      context!.buffers.every((source) => source.stopped),
      true,
      "all looping sources stop on dispose",
    );
    assert.equal(
      context!.oscillators.every((voice) => voice.stopped),
      true,
    );
    assert.equal(context!.closeCalls, 1);
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("town activity cues schedule cartoony action and rarity voices", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  let context: FakeAudioContext | undefined;
  let audio: TownAudio | undefined;
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: class extends FakeAudioContext {
      constructor() {
        super();
        context = this;
      }
    },
  });
  try {
    audio = new TownAudio(false);
    audio.setActive(true);
    audio.unlock();
    audio.actionPrompt();
    audio.fishCast();
    audio.fishRipple();
    audio.reel();
    audio.catchFish("rare");
    audio.emptyLine();
    audio.dig();
    audio.discover("uncommon");

    const frequencies = context!.oscillators.map(
      (oscillator) => oscillator.frequency.value,
    );
    assert.deepEqual(
      frequencies,
      [
        1080, 210, 92, 390, 300, 940, 1080, 1220, 110, 440, 523, 659, 784, 1047,
        1319, 1630.72, 205, 150, 105, 78, 160, 440, 587, 740, 880, 1175, 1539.2,
      ],
    );
    assert.equal(
      audio.status().scheduledVoices,
      frequencies.length,
      "every cue is tracked for lifecycle cleanup",
    );
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("town activity cues are no-ops while muted, hidden, inactive, or disposed", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  let context: FakeAudioContext | undefined;
  let audio: TownAudio | undefined;
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: class extends FakeAudioContext {
      constructor() {
        super();
        context = this;
      }
    },
  });
  const playEveryCue = (target: TownAudio) => {
    target.actionPrompt();
    target.fishCast();
    target.fishRipple();
    target.reel();
    target.catchFish("common");
    target.emptyLine();
    target.dig();
    target.discover("rare");
  };
  try {
    audio = new TownAudio(false);
    audio.setActive(true);
    audio.unlock();
    playEveryCue(audio);
    const initial = context!.oscillators.length;
    assert.ok(initial > 0);

    audio.setMuted(true);
    playEveryCue(audio);
    assert.equal(context!.oscillators.length, initial);
    assert.equal(audio.status().scheduledVoices, 0);

    audio.setMuted(false);
    audio.setHidden(true);
    playEveryCue(audio);
    assert.equal(context!.oscillators.length, initial);

    audio.setHidden(false);
    audio.setActive(false);
    playEveryCue(audio);
    assert.equal(context!.oscillators.length, initial);

    audio.dispose();
    playEveryCue(audio);
    assert.equal(context!.oscillators.length, initial);
    assert.equal(
      context!.oscillators.every((oscillator) => oscillator.stopped),
      true,
    );
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
      muted: false,
      active: true,
      hidden: false,
      unlocked: false,
      supported: false,
      waterPlaying: false,
      naturePlaying: false,
      scheduledVoices: 0,
      visible: true,
      distance: 0,
      pan: 0,
      gain: 0,
    });
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
  }
});
