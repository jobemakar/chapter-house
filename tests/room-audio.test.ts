import { test } from "node:test";
import assert from "node:assert/strict";
import { RoomAudio } from "../src/room/audio";

const settleAudio = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

class FakeSource {
  onended: (() => void) | null = null;
  stopped = false;
  connect() {
    return this;
  }
  disconnect() {}
  start() {}
  stop() {
    this.stopped = true;
  }
}

class FakeAudioContext {
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {};
  oscillators: FakeSource[] = [];
  resumeCalls = 0;
  suspendCalls = 0;
  closeCalls = 0;
  createOscillator() {
    const source = new FakeSource();
    this.oscillators.push(source);
    return Object.assign(source, {
      type: "sine" as OscillatorType,
      frequency: { setValueAtTime() {} },
    });
  }
  createGain() {
    return {
      gain: {
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {
        return this;
      },
      disconnect() {},
    };
  }
  resume() {
    this.resumeCalls++;
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

test("room audio stays gesture gated and controls ambient lifecycle", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  const contexts: FakeAudioContext[] = [];
  let audio: RoomAudio | undefined;
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
    audio = new RoomAudio(false);
    audio.play("ui");
    assert.equal(contexts.length, 0);
    assert.equal(audio.status().unlocked, false);

    audio.unlock();
    await settleAudio();
    assert.equal(contexts.length, 1);
    assert.equal(audio.status().unlocked, true);
    assert.equal(audio.status().ambientPlaying, true);
    const before = audio.status().scheduledVoices;
    audio.play("pet");
    assert.ok(audio.status().scheduledVoices > before);

    audio.setHidden(true);
    assert.equal(audio.status().ambientPlaying, false);
    assert.equal(audio.status().scheduledVoices, 0);
    assert.ok(contexts[0].suspendCalls > 0);
    audio.setHidden(false);
    await settleAudio();
    assert.equal(audio.status().ambientPlaying, true);
    audio.setMuted(true);
    assert.equal(audio.status().scheduledVoices, 0);
    audio.setMuted(false);
    await settleAudio();
    assert.equal(audio.status().ambientPlaying, true);
    audio.dispose();
    assert.equal(audio.status().unlocked, false);
    assert.equal(contexts[0].closeCalls, 1);
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("unsupported audio remains a safe no-op", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  let audio: RoomAudio | undefined;
  Reflect.deleteProperty(globalThis, "AudioContext");
  try {
    audio = new RoomAudio(false);
    audio.unlock();
    audio.play("call");
    audio.setRoomActive(false);
    audio.setHidden(true);
    assert.deepEqual(audio.status(), {
      muted: false,
      roomActive: false,
      hidden: true,
      unlocked: false,
      supported: false,
      ambientPlaying: false,
      scheduledVoices: 0,
    });
    audio.dispose();
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
  }
});

test("a deferred suspend cannot strand audio after a quick unmute", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  let resolveSuspend = () => {};
  let context: FakeAudioContext;
  let audio: RoomAudio | undefined;
  class DeferredContext extends FakeAudioContext {
    override suspend() {
      this.suspendCalls++;
      return new Promise<void>((resolve) => {
        resolveSuspend = () => {
          this.state = "suspended";
          resolve();
        };
      });
    }
  }
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: class extends DeferredContext {
      constructor() {
        super();
        context = this;
      }
    },
  });
  try {
    audio = new RoomAudio(false);
    audio.unlock();
    await settleAudio();
    audio.setMuted(true);
    assert.equal(context!.state, "running");
    audio.setMuted(false);
    resolveSuspend();
    await settleAudio();
    assert.equal(context!.state, "running");
    assert.equal(audio.status().ambientPlaying, true);
    assert.equal(context!.resumeCalls, 2);
    audio.dispose();
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("room inactivity suspends the soundscape and resumes it without overlap", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  let context: FakeAudioContext;
  let audio: RoomAudio | undefined;
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
    audio = new RoomAudio(false);
    audio.unlock();
    await settleAudio();
    audio.play("pet");
    assert.ok(audio.status().scheduledVoices > 0);
    audio.setRoomActive(false);
    await settleAudio();
    assert.equal(audio.status().scheduledVoices, 0);
    assert.equal(audio.status().ambientPlaying, false);
    audio.setRoomActive(true);
    await settleAudio();
    assert.equal(audio.status().ambientPlaying, true);
    assert.equal(context!.state, "running");
    audio.dispose();
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});

test("a rejected resume is contained and leaves ambient stopped", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  let audio: RoomAudio | undefined;
  class RejectingContext extends FakeAudioContext {
    override resume() {
      this.resumeCalls++;
      return Promise.reject(new Error("activation expired"));
    }
  }
  let context: RejectingContext;
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: class extends RejectingContext {
      constructor() {
        super();
        context = this;
      }
    },
  });
  try {
    audio = new RoomAudio(false);
    audio.unlock();
    await settleAudio();
    assert.equal(context!.resumeCalls, 1);
    assert.equal(audio.status().ambientPlaying, false);
    audio.play("ui");
    assert.equal(audio.status().scheduledVoices, 0);
    audio.dispose();
  } finally {
    audio?.dispose();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  }
});
