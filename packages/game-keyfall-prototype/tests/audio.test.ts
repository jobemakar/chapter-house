import assert from "node:assert/strict";
import { test } from "node:test";
import { KeyfallAudio } from "../src/audio";

class FakeOscillator {
  type = "sine"; frequency = { value: 0 };
  started = 0; stopped = 0; onended: (() => void) | null = null;
  connect(node: unknown): unknown { return node; }
  start(): void { this.started += 1; }
  stop(): void { this.stopped += 1; this.onended?.(); }
}
class FakeContext {
  currentTime = 0; destination = {};
  oscillators: FakeOscillator[] = []; resumed = 0; closed = 0;
  createOscillator(): FakeOscillator { const oscillator = new FakeOscillator(); this.oscillators.push(oscillator); return oscillator; }
  createGain(): { gain: { value: number; setValueAtTime: (value: number, when: number) => void; linearRampToValueAtTime: (value: number, when: number) => void; exponentialRampToValueAtTime: (value: number, when: number) => void }; connect: () => unknown } {
    return { gain: { value: 0, setValueAtTime: (_value: number, _when: number) => {}, linearRampToValueAtTime: (_value: number, _when: number) => {}, exponentialRampToValueAtTime: (_value: number, _when: number) => {} }, connect: () => this.destination };
  }
  resume(): Promise<void> { this.resumed += 1; return Promise.resolve(); }
  close(): Promise<void> { this.closed += 1; return Promise.resolve(); }
}

test("Keyfall audio unlocks into a quiet bed and named cues", () => {
  const context = new FakeContext();
  const audio = new KeyfallAudio(() => false, () => context);
  audio.ticketCollect();
  assert.equal(context.oscillators.length, 0, "audio must wait for unlock");
  audio.unlock();
  assert.equal(context.oscillators.length, 2);
  audio.cordCut(); audio.fanActivate(); audio.levelComplete();
  assert.equal(context.oscillators.length, 2 + 2 + 3 + 4);
  audio.setPaused(true);
  assert.ok(context.oscillators.every((voice) => voice.stopped > 0));
  const count = context.oscillators.length;
  audio.gentleReset();
  assert.equal(context.oscillators.length, count);
  audio.setPaused(false); assert.equal(context.oscillators.length, count + 2);
  audio.setMuted(true); assert.ok(context.oscillators.every((voice) => voice.stopped > 0));
  audio.dispose(); assert.equal(context.closed, 1);
});

test("callback mute and missing AudioContext are safe no-ops", () => {
  let muted = true;
  const context = new FakeContext();
  const audio = new KeyfallAudio(() => muted, () => context);
  audio.unlock(); assert.equal(context.oscillators.length, 0);
  muted = false; audio.unlock(); assert.equal(context.oscillators.length, 2);
  audio.dispose();
  const unavailable = new KeyfallAudio(() => false, () => undefined as never);
  unavailable.unlock(); unavailable.chime(); unavailable.dispose();
});
