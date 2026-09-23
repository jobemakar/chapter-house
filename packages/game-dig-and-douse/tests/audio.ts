import assert from "node:assert/strict";
import { test } from "node:test";
import { DigAndDouseAudio } from "../src/audio";

class Voice {
  type = "sine"; frequency = { value: 0 };
  started = 0; stopped = 0; onended: (() => void) | null = null;
  connect(node: unknown): unknown { return node; }
  start(): void { this.started++; }
  stop(): void { this.stopped++; this.onended?.(); }
}
class Context {
  currentTime = 0; destination = {}; voices: Voice[] = []; closed = 0;
  createOscillator(): Voice { const voice = new Voice(); this.voices.push(voice); return voice; }
  createGain() { return { gain: { value: 0, setValueAtTime: (_v: number, _t: number) => {}, linearRampToValueAtTime: (_v: number, _t: number) => {}, exponentialRampToValueAtTime: (_v: number, _t: number) => {} }, connect: () => this.destination }; }
  resume(): Promise<void> { return Promise.resolve(); }
  close(): Promise<void> { this.closed++; return Promise.resolve(); }
}

test("Dig & Douse audio waits for a gesture, offers cues, and stops deterministically", () => {
  const context = new Context();
  const audio = new DigAndDouseAudio(() => false, () => context);
  audio.digging(); assert.equal(context.voices.length, 0);
  audio.unlock(); assert.equal(context.voices.length, 2);
  audio.waterFlow(); audio.splash(); audio.collectible(); audio.complete();
  assert.equal(context.voices.length, 2 + 3 + 3 + 2 + 4);
  audio.setPaused(true); assert.ok(context.voices.every((voice) => voice.stopped > 0));
  const count = context.voices.length; audio.digging(); assert.equal(context.voices.length, count);
  audio.setPaused(false); assert.equal(context.voices.length, count + 2);
  audio.setMuted(true); assert.ok(context.voices.every((voice) => voice.stopped > 0));
  audio.dispose(); assert.equal(context.closed, 1);
});

test("callback mute and unavailable Web Audio are safe", () => {
  let muted = true;
  const context = new Context();
  const audio = new DigAndDouseAudio(() => muted, () => context);
  audio.unlock(); assert.equal(context.voices.length, 0);
  muted = false; audio.unlock(); assert.equal(context.voices.length, 2); audio.dispose();
  const unavailable = new DigAndDouseAudio(() => false, () => undefined);
  unavailable.unlock(); unavailable.complete(); unavailable.dispose();
});
