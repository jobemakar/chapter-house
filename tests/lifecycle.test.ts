import { test } from "node:test";
import assert from "node:assert/strict";
import { WishboneGame } from "../packages/game-wishbone-fling/src/game";
import { loadWishboneProgress } from "@chapter-house/game-wishbone-fling/progress";
import { ProfileRepository, type StoragePort } from "../src/core/profile";
/** Headless DOM contract harness: actual controller/physics, inert canvas and audio. */
class ElementStub extends EventTarget {
  textContent = "";
  hidden = false;
  disabled = false;
  checked = false;
  open = false;
  width = 600;
  height = 360;
  dataset: Record<string, string> = {};
  className = "";
  attributes = new Map<string, string>();
  children: ElementStub[] = [];
  capture = new Set<number>();
  classList = { add() {}, remove() {} };
  private elements = new Map<string, ElementStub>();
  set innerHTML(html: string) {
    for (const match of html.matchAll(/data-(action|ui)="([^"]+)"/g)) {
      const el = new ElementStub();
      el.dataset[match[1]] = match[2];
      this.elements.set(`[data-${match[1]}="${match[2]}"]`, el);
    }
    for (const selector of [
      "canvas",
      "dialog",
      ".pause-cover",
      ".collection-grid",
    ])
      this.elements.set(selector, new ElementStub());
  }
  querySelector(selector: string) {
    return this.elements.get(selector) ?? null;
  }
  closest() {
    return this.dataset.action ? this : null;
  }
  setAttribute(k: string, v: string) {
    this.attributes.set(k, v);
  }
  replaceChildren() {
    this.elements.clear();
  }
  append(...children: ElementStub[]) {
    this.children.push(...children);
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 600, height: 360 };
  }
  setPointerCapture(id: number) {
    this.capture.add(id);
  }
  hasPointerCapture(id: number) {
    return this.capture.has(id);
  }
  releasePointerCapture(id: number) {
    this.capture.delete(id);
  }
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  }
  getContext() {
    return new Proxy(
      {
        measureText: () => ({ width: 30 }),
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
      },
      {
        get(o, k) {
          return k in o ? o[k as keyof typeof o] : () => {};
        },
        set() {
          return true;
        },
      },
    );
  }
}
class Store implements StoragePort {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
}
class Harness {
  host = new ElementStub();
  window = new EventTarget();
  document = Object.assign(new EventTarget(), {
    hidden: false,
    createElement: () => new ElementStub(),
  });
  frames = new Map<number, FrameRequestCallback>();
  observers = new Set<{ disconnect(): void }>();
  time = 0;
  id = 0;
  previous = new Map<string, PropertyDescriptor | undefined>();
  store = new Store();
  profile = new ProfileRepository(this.store);
  game: WishboneGame;
  constructor() {
    const self = this;
    const globals: Record<string, unknown> = {
      window: this.window,
      document: this.document,
      Image: class {
        src = "";
        complete = false;
        naturalWidth = 0;
      },
      requestAnimationFrame: (fn: FrameRequestCallback) => {
        self.frames.set(++self.id, fn);
        return self.id;
      },
      cancelAnimationFrame: (id: number) => self.frames.delete(id),
      ResizeObserver: class {
        constructor(public callback: () => void) {
          self.observers.add(this);
        }
        observe() {}
        disconnect() {
          self.observers.delete(this);
        }
      },
    };
    for (const [key, value] of Object.entries(globals)) {
      this.previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, {
        value,
        writable: true,
        configurable: true,
      });
    }
    this.profile.state.muted = true;
    this.game = this.mount();
  }
  mount() {
    return new WishboneGame(this.host as unknown as HTMLElement, {
      progress: loadWishboneProgress(
        this.profile.gameProgress("wishbone-fling"),
      ),
      muted: this.profile.state.muted,
      reducedMotion: this.profile.state.reduced,
      activePlaySeconds: this.profile.state.activeSeconds,
      exit: () => {},
      notify: () => {},
      saveProgress: (progress) =>
        this.profile.saveGameProgress("wishbone-fling", progress),
      creditActivePlay: (total) => this.profile.creditActivity(total),
      awardReward: (rewardId) =>
        this.profile.awardGameReward("wishbone-fling", rewardId),
    });
  }
  advance(count: number) {
    for (let i = 0; i < count; i++) {
      this.time += 1000 / 60;
      const current = [...this.frames.values()];
      this.frames.clear();
      current.forEach((fn) => fn(this.time));
    }
  }
  click(action: string) {
    const event = new Event("click");
    Object.defineProperty(event, "target", {
      value: this.host.querySelector(`[data-action="${action}"]`),
    });
    this.host.dispatchEvent(event);
  }
  pointer(type: string, x: number, y: number, id = 1) {
    const event = new Event(type, { cancelable: true });
    for (const [key, value] of Object.entries({
      clientX: x,
      clientY: y,
      pointerId: id,
      button: 0,
    }))
      Object.defineProperty(event, key, { value });
    this.host.querySelector("canvas")!.dispatchEvent(event);
  }
  startAim() {
    this.pointer("pointerdown", 81, 239);
    this.pointer("pointermove", 16, 257);
  }
  launch() {
    this.startAim();
    this.pointer("pointerup", 16, 257);
  }
  finish() {
    this.game.dispose();
    for (const [key, descriptor] of this.previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}
test("aim cancel and pause resume retain transient board without awarding a throw", () => {
  const h = new Harness();
  try {
    h.advance(2);
    h.startAim();
    assert.equal(h.game.status().aiming, true);
    h.game.setPaused(true);
    h.pointer("pointerup", 16, 257);
    h.advance(200);
    assert.equal(h.game.status().throws, 0);
    assert.equal(h.game.status().aiming, false);
    h.game.setPaused(false);
    h.startAim();
    h.pointer("pointercancel", 16, 257);
    h.pointer("pointerup", 16, 257);
    assert.equal(h.game.status().throws, 0);
    h.launch();
    h.game.setPaused(true);
    h.advance(400);
    assert.equal(h.game.status().rescued, 0);
    h.game.setPaused(false);
    h.advance(400);
    assert.ok(h.game.status().rescued > 0);
  } finally {
    h.finish();
  }
});
test("actual session saves rewards and disposes its frames, observers, and input listeners", () => {
  const h = new Harness();
  try {
    h.advance(2);
    h.launch();
    h.advance(360);
    assert.equal(h.game.status().throws, 1);
    assert.ok(h.game.status().rescued > 0);
    const saved = loadWishboneProgress(
      h.profile.gameProgress("wishbone-fling"),
    ).throws;
    const canvas = h.host.querySelector("canvas")!;
    h.game.dispose();
    assert.equal(h.frames.size, 0);
    assert.equal(h.observers.size, 0);
    canvas.dispatchEvent(new Event("pointerdown"));
    assert.equal(
      loadWishboneProgress(h.profile.gameProgress("wishbone-fling")).throws,
      saved,
    );
    for (let i = 0; i < 3; i++) {
      h.game = h.mount();
      h.advance(2);
      h.launch();
      h.advance(60);
      h.game.dispose();
      assert.equal(h.frames.size, 0);
      assert.equal(h.observers.size, 0);
    }
    assert.equal(
      loadWishboneProgress(h.profile.gameProgress("wishbone-fling")).throws,
      4,
    );
  } finally {
    h.finish();
  }
});
test("hidden games freeze progress and credits until resumed", () => {
  const h = new Harness();
  try {
    h.advance(2);
    h.launch();
    h.advance(10);
    h.document.hidden = true;
    h.document.dispatchEvent(new Event("visibilitychange"));
    const before = h.profile.state.activeSeconds;
    h.advance(1200);
    assert.equal(h.profile.state.activeSeconds, before);
    assert.equal(h.game.status().paused, true);
    h.document.hidden = false;
    h.game.setPaused(false);
    h.advance(400);
    assert.equal(h.game.status().ready, true);
  } finally {
    h.finish();
  }
});

test("camera gestures never launch or earn idle currency and pinch cancels aiming", () => {
  const h = new Harness();
  try {
    h.advance(2);
    const money = h.profile.state.currency;
    h.startAim();
    h.pointer("pointerdown", 210, 170, 2);
    assert.equal(h.game.status().aiming, false);
    h.pointer("pointermove", 310, 170, 2);
    assert.ok(h.game.status().camera.zoom > 1);
    h.pointer("pointerup", 310, 170, 2);
    h.pointer("pointermove", 10, 270, 1);
    h.pointer("pointerup", 10, 270, 1);
    assert.equal(h.game.status().throws, 0);
    h.click("camera-home");
    h.click("zoom-in");
    const start = h.game.status().camera.x;
    h.pointer("pointerdown", 450, 180);
    h.pointer("pointermove", 300, 180);
    h.pointer("pointerup", 300, 180);
    assert.ok(h.game.status().camera.x > start);
    h.advance(1200);
    assert.equal(h.game.status().throws, 0);
    // Initial aim may count a small activity window, but camera-only input cannot extend it.
    const after = h.profile.state.currency;
    for (let i = 0; i < 8; i++) {
      h.click("zoom-in");
      h.click("zoom-out");
      h.advance(120);
    }
    assert.equal(h.profile.state.currency, after);
    assert.ok(after >= money);
  } finally {
    h.finish();
  }
});

test("zoomed launcher input uses inverse camera coordinates and wheel stays presentation-only", () => {
  const h = new Harness();
  try {
    h.click("zoom-in");
    const c = h.game.status().camera;
    const screen = (x: number, y: number) => ({
      x: ((x - c.x) * c.zoom + 600) / 2,
      y: ((y - c.y) * c.zoom + 360) / 2,
    });
    const start = screen(162, 478),
      end = screen(32, 514);
    h.pointer("pointerdown", start.x, start.y);
    assert.equal(h.game.status().aiming, true);
    h.pointer("pointermove", end.x, end.y);
    const frozen = h.game.status().camera;
    h.advance(30);
    assert.deepEqual(h.game.status().camera, frozen);
    h.pointer("pointerup", end.x, end.y);
    assert.equal(h.game.status().throws, 1);
    h.advance(400);
    assert.ok(h.game.status().rescued > 0);
    const wheel = new Event("wheel", { cancelable: true });
    Object.defineProperties(wheel, {
      clientX: { value: 300 },
      clientY: { value: 180 },
      deltaY: { value: -250 },
    });
    h.host.querySelector("canvas")!.dispatchEvent(wheel);
    assert.equal(wheel.defaultPrevented, true);
    assert.ok(h.game.status().camera.zoom > c.zoom);
    assert.equal(h.game.status().throws, 1);
  } finally {
    h.finish();
  }
});
