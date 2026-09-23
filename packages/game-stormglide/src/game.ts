import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import templateHtml from "./template.html?raw";
import skyUrl from "./assets/sky.png";
import { ActivePlayWindow } from "./activity";
import { loadStormglideProgress, type StormglideProgress } from "./progress";
import { thumbOffset, thumbVector } from "./touch-input";

/*
 * Stormglide's browser entry point.  The focused classes below deliberately
 * own persistence, input, audio, rendering, and flight orchestration; keeping
 * their collaboration here preserves the single-file, zero-runtime-dependency
 * hosted build while making the authored game strict TypeScript.
 */
type Dog = { name: string; color: string; ears: string };
type Region = { name: string; label: string; hue: number; tint: string };
type Point = { x: number; y: number };
type Player = Point & { vx: number; vy: number; tilt: number };
type EntityType = "spark" | "ring" | "dog" | "storm" | "wind" | "magnet" | "super";
type EventType = "" | "stars" | "breeze" | "parade";
type Entity = Point & { type: EntityType; r: number; hit: boolean; phase: number; dog: number; vy: number };
type RuntimeEntity = Point & { type: EntityType; baseY: number; age: number; phase: number; hit: boolean; r: number; dog: number; sway: number; golden: boolean };
type EntityOptions = Partial<Pick<RuntimeEntity, "r" | "dog" | "sway" | "golden">>;
type Particle = Point & { vx: number; vy: number; life: number; max: number; r: number; color: string };
type FloatText = Point & { text: string; color: string; life: number };
type Follower = Point & { dog: number };
type StormPreferences = { muted: boolean; music: boolean; gentle: boolean; trail: number; total: number; found: number[]; best: number };
type StormSave = Partial<StormPreferences>;
type AudioKind = "spark" | "ring" | "dog" | "power" | "bump" | "dash";
type Canvas = HTMLCanvasElement;

function requiredCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Stormglide requires a 2D canvas context.");
  return context;
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext }
  interface Document { modelContext?: { registerTool: (tool: { name: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => object }) => unknown } }
}

class ProgressStore {
  public constructor(private readonly key: string) {}

  public load(): StormPreferences {
    const fallback: StormPreferences = { muted: false, music: true, gentle: matchMedia("(prefers-reduced-motion: reduce)").matches, trail: 0, total: 0, found: [], best: 0 };
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return fallback;
      const candidate: unknown = JSON.parse(raw);
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return fallback;
      const value = candidate as StormSave;
      return {
        muted: typeof value.muted === "boolean" ? value.muted : fallback.muted,
        music: typeof value.music === "boolean" ? value.music : fallback.music,
        gentle: typeof value.gentle === "boolean" ? value.gentle : fallback.gentle,
        trail: typeof value.trail === "number" && Number.isInteger(value.trail) ? Math.max(0, Math.min(4, value.trail)) : fallback.trail,
        total: typeof value.total === "number" && Number.isFinite(value.total) ? Math.max(0, Math.floor(value.total)) : fallback.total,
        found: Array.isArray(value.found) ? [...new Set(value.found.filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id >= 0 && id < 12))] : fallback.found,
        best: typeof value.best === "number" && Number.isFinite(value.best) ? Math.max(0, Math.floor(value.best)) : fallback.best,
      };
    } catch {
      return fallback;
    }
  }

  public save(preferences: StormPreferences): void {
    try { localStorage.setItem(this.key, JSON.stringify(preferences)); } catch { /* Storage is optional. */ }
  }
}

class StormModel {
  public readonly player: Player = { x: 0, y: 0, vx: 0, vy: 0, tilt: 0 };
  public entities: RuntimeEntity[] = [];
  public particles: Particle[] = [];
  public followers: Follower[] = [];
  public floats: FloatText[] = [];
  public history: Point[] = [];
  public frame = 0;
  public simulationAccumulator = 0;
  public constructor(public preferences: StormPreferences) {}
}

class InputController {
  public activePointer: number | null = null;
  public origin: Point | null = null;
  public vector: Point = { x: 0, y: 0 };
  public pointer: Point | null = null;
  public surface: (HTMLCanvasElement & HTMLElement) | null = null;
  public reset(): void { this.activePointer = null; this.origin = null; this.vector = { x: 0, y: 0 }; this.pointer = null; this.surface = null; }
}

class StormAudio {
  public ctx: AudioContext | null = null;
  public master: GainNode | null = null;
  public musicGain: GainNode | null = null;
  public sfxGain: GainNode | null = null;
  public next = 0;
  public step = 0;
}

class StormRenderer {
  public readonly context: CanvasRenderingContext2D;
  public readonly backdrop: Canvas;
  public readonly backdropContext: CanvasRenderingContext2D;
  public backdropKey = "";
  public constructor(canvas: Canvas) {
    this.context = requiredCanvasContext(canvas);
    this.backdrop = document.createElement("canvas");
    this.backdropContext = requiredCanvasContext(this.backdrop);
  }
}

class StormGame {
  public readonly model: StormModel;
  public readonly input = new InputController();
  public readonly audio = new StormAudio();
  public readonly renderer: StormRenderer;
  private lastFrame = performance.now();
  public constructor(canvas: Canvas, preferences: StormPreferences) { this.model = new StormModel(preferences); this.renderer = new StormRenderer(canvas); }
  public nextFrameDelta(now: number): number {
    const delta = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    return delta;
  }
}

// The production bundle exposes its typed construction boundary for deterministic
// VM verification.  It is not a debug control surface and does not alter play.
(globalThis as typeof globalThis & {
  StormglideProduction?: { ProgressStore: typeof ProgressStore; StormModel: typeof StormModel; InputController: typeof InputController; StormGame: typeof StormGame };
}).StormglideProduction = { ProgressStore, StormModel, InputController, StormGame };

/** One strict TypeScript runtime, mounted by either the standalone or Chapter House adapter. */
export class StormglideGame implements GameSession {
  private readonly api: { pause(value: boolean): void; muted(value: boolean): void; flush(): void; dispose(): void; status(): unknown };
  public constructor(target: HTMLElement, services: GameHostServices<StormglideProgress>) {
    const documentTemplate = new DOMParser().parseFromString(templateHtml, "text/html");
    documentTemplate.querySelectorAll("script, link[rel='stylesheet']").forEach((node) => node.remove());
    const root = document.createElement("section"); root.className = "stormglide"; root.append(...documentTemplate.body.childNodes);
    target.replaceChildren(root); this.api = mountStormglide(root, services);
  }
  public setPaused(paused: boolean): void { this.api.pause(paused); }
  public setMuted(muted: boolean): void { this.api.muted(muted); }
  public flushProgress(): void { this.api.flush(); }
  public dispose(): void { this.api.dispose(); }
  public status(): unknown { return this.api.status(); }
}

function mountStormglide(root: HTMLElement, services: GameHostServices<StormglideProgress>) {
  "use strict";
  const $ = (id: string): HTMLCanvasElement & HTMLElement => {
      const node = root.querySelector(`#${id}`); if (!node) throw new Error(`Stormglide element ${id} is missing.`); return node as HTMLCanvasElement & HTMLElement;
    }, canvas = $("game");
  const storm = new StormGame(canvas, loadStormglideProgress(services.progress)),
    ctx = storm.renderer.context;
  const TAU = Math.PI * 2,
    clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n)),
    rand = (a: number, b: number) => a + Math.random() * (b - a),
    lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const COLORS: string[] = ["#adefdc", "#ffc6e3", "#ffe1a0", "#bfc1ff", "#98e9ff"];
  const DOGS: Dog[] = [
    { name: "Pi", color: "#e5bb82", ears: "#925b45" },
    { name: "Biscuit", color: "#f3d8a7", ears: "#bd874f" },
    { name: "Mochi", color: "#e8e4ec", ears: "#b6acbe" },
    { name: "Pepper", color: "#778398", ears: "#38465b" },
    { name: "Clover", color: "#dcae87", ears: "#84543d" },
    { name: "Waffles", color: "#d78b55", ears: "#8a4733" },
    { name: "Nimbus", color: "#edf4ed", ears: "#b8cad1" },
    { name: "Fig", color: "#aa8069", ears: "#5c4350" },
    { name: "Cricket", color: "#afbcc0", ears: "#657479" },
    { name: "Maple", color: "#cc8757", ears: "#745044" },
    { name: "Pip", color: "#f1e7cb", ears: "#bda780" },
    { name: "Comet", color: "#c7b5e8", ears: "#76639b" },
  ];
  const REGIONS: Region[] = [
    { name: "Lantern Town", label: "Twilight", hue: 0, tint: "#506392" },
    { name: "Cloudberry Gardens", label: "Bloom", hue: 23, tint: "#53668c" },
    { name: "The Moonlit Sea", label: "Moonrise", hue: -20, tint: "#244b82" },
    { name: "Apricot Skies", label: "Golden hour", hue: -45, tint: "#86567c" },
    { name: "Starfall Valley", label: "Starlight", hue: 38, tint: "#65519a" },
    { name: "Aurora Way", label: "Northern lights", hue: 75, tint: "#316c77" },
  ];
  const region = (): Region => {
    const selected = REGIONS[regionIndex];
    if (!selected) throw new Error("Stormglide region index is invalid.");
    return selected;
  };
  const eventLabels: Record<Exclude<EventType, "">, string> = {
    stars: "✦ Star shower",
    breeze: "≈ Tailwind",
    parade: "♥ Pup parade",
  };
  const dog = (id: number): Dog => {
    const selected = DOGS[id % DOGS.length];
    if (!selected) throw new Error("Stormglide dog index is invalid.");
    return selected;
  };
  const prefs = storm.model.preferences;
  const activePlay = new ActivePlayWindow(services.activePlaySeconds);
  const ownedRewardIds = (): string[] => {
    const ids = prefs.found.map((id) => `stormglide:pup-${id}`);
    for (let index = 0; index <= 4; index++) if (prefs.total >= index * 5) ids.push(`stormglide:trail-${index}`);
    return [...new Set(ids)];
  };
  const noteActivity = () => { activePlay.activate(performance.now()); };
  function save() { services.saveProgress({ ...prefs, version: 1, ownedRewardIds: ownedRewardIds() }); }
  let W = innerWidth,
    H = innerHeight,
    dpr = 1,
    started = false,
    paused = false,
    t = 0,
    visualT = 0,
    score = 0,
    rescues = 0,
    distance = 0,
    flow = 0,
    flowTimer = 0,
    charge = 100,
    boost = 0,
    invuln = 0,
    wobble = 0,
    superTime = 0,
    power = 0,
    regionIndex = 0,
    eventIndex = -1,
    eventTime = 0,
    eventType: EventType = "",
    nextPattern = 0,
    nextHazard = 4,
    nextPup = 7,
    nextRing = 5,
    nextPower = 16,
    toastTime = 0,
    shake = 0;
  let entities = storm.model.entities,
    particles = storm.model.particles,
    floats = storm.model.floats,
    history = storm.model.history,
    keys: Record<string, boolean> = {};
  // Touch steering belongs to the always-visible thumb pad.  Earlier builds
  // also interpreted any touch on the sky as a relative steering gesture;
  // that made a casual tap feel like a fling and hid the control's purpose.
  let touchMode = matchMedia("(any-pointer: coarse)").matches;
  const input = storm.input;
  let lastDashTouch = -Infinity;
  root.classList.toggle("touch", touchMode);
  const player = storm.model.player,
    followers = storm.model.followers;
  const sky = new Image();
  sky.src = skyUrl;
  function resize() {
    // Once a run starts, W/H are the stable logical flight world.  The canvas
    // can rotate and scale it, but never rescales actors, pickup spacing or
    // movement physics into a different world.
    resetSteering();
    if (!started) {
      W = innerWidth;
      H = innerHeight;
    }
    dpr = Math.min(devicePixelRatio || 1, touchMode ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    // Preserve the world's aspect ratio on rotation.  Letterboxing is safer
    // than stretching circles/flight vectors into ovals or clipping pickups.
    const scale = Math.min(innerWidth / W, innerHeight / H);
    canvas.style.width = `${Math.round(W * scale)}px`;
    canvas.style.height = `${Math.round(H * scale)}px`;
    canvas.style.left = `${Math.round((innerWidth - W * scale) / 2)}px`;
    canvas.style.top = `${Math.round((innerHeight - H * scale) / 2)}px`;
    canvas.style.right = "auto";
    canvas.style.bottom = "auto";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    player.x = clamp(player.x || W * 0.26, 55, W - 55);
    player.y = clamp(player.y || H * 0.5, topBound(), bottomBound());
  }
  function worldPoint(e: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * W) / rect.width, y: ((e.clientY - rect.top) * H) / rect.height };
  }
  const topBound = () => (W < 700 && H > 550 ? 175 : 100),
    bottomBound = () => Math.max(topBound() + 60, H - (touchMode ? 200 : 112));
  const abort = new AbortController(); let disposed = false; let frameId = 0; let saveTimer = 0;
  window.addEventListener("resize", resize, { signal: abort.signal });
  window.visualViewport?.addEventListener("resize", resize, { signal: abort.signal });
  resize();
  // Original procedural score: soft plucked arpeggios, warm chords, bass, and quiet percussion.
  const audio = storm.audio;
  function audioInit() {
    try {
      if (!audio.ctx) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const master = context.createGain();
        const musicGain = context.createGain();
        const sfxGain = context.createGain();
        master.connect(context.destination);
        musicGain.connect(master);
        sfxGain.gain.value = 0.6;
        sfxGain.connect(master);
        audio.ctx = context;
        audio.master = master;
        audio.musicGain = musicGain;
        audio.sfxGain = sfxGain;
      }
      if (!audio.ctx || !audio.master || !audio.musicGain) return;
      audio.master.gain.value = prefs.muted ? 0 : 0.65;
      audio.musicGain.gain.value = prefs.music ? 0.55 : 0;
      if (audio.ctx.state === "suspended") audio.ctx.resume().catch(() => {});
      audio.next = Math.max(audio.next, audio.ctx.currentTime + 0.04);
    } catch {}
  }
  function note(freq: number, when: number, dur: number, vol: number, type: OscillatorType = "sine", dest: AudioNode | null = audio.musicGain) {
    if (!audio.ctx || !dest) return;
    const o = audio.ctx.createOscillator(),
      g = audio.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(dest);
    o.start(when);
    o.stop(when + dur + 0.03);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  function musicTick() {
    if (!audio.ctx || !started || paused || audio.ctx.state !== "running")
      return;
    const chords = [
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [48, 52, 55, 60],
      [55, 59, 62, 65],
    ];
    const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
    let count = 0;
    while (audio.next < audio.ctx.currentTime + 0.14 && count++ < 4) {
      const s = audio.step,
        c = chords[Math.floor(s / 16) % 4],
        at = audio.next;
      if (s % 2 === 0)
        note(
          hz(c[[0, 2, 1, 3, 2, 1, 3, 2][Math.floor(s / 2) % 8]] + 12),
          at,
          0.64,
          0.12,
          "sine",
        );
      if (s % 8 === 0) {
        note(hz(c[0] - 12), at, 1.2, 0.2, "triangle");
        c.forEach((n) => note(hz(n), at, 2.1, 0.038, "sine"));
      }
      if (s % 4 === 2) {
        note(90, at, 0.09, 0.045, "triangle");
        note(2400, at, 0.035, 0.016, "triangle");
      }
      audio.step++;
      audio.next += 0.185;
    }
    if (audio.next < audio.ctx.currentTime - 0.5)
      audio.next = audio.ctx.currentTime + 0.03;
  }
  function sound(kind: AudioKind) {
    if (!audio.ctx || prefs.muted) return;
    const a = audio.ctx.currentTime;
    const play = (f: number, d = 0.18, v = 0.13, off = 0, type: OscillatorType = "sine") =>
      note(f, a + off, d, v, type, audio.sfxGain);
    if (kind === "spark") {
      play(660 + (flow % 7) * 73, 0.14, 0.065);
      play(1320 + (flow % 7) * 73, 0.09, 0.025, 0.035);
    }
    if (kind === "ring") {
      [523, 659, 784].forEach((f, i) => play(f, 0.36, 0.13, i * 0.06));
    }
    if (kind === "dog") {
      [392, 523, 659, 784].forEach((f, i) => play(f, 0.4, 0.16, i * 0.09));
    }
    if (kind === "bump") {
      play(140, 0.24, 0.12, 0, "triangle");
      play(105, 0.22, 0.06, 0.04, "sine");
    }
    if (kind === "dash") {
      [330, 660, 990].forEach((f, i) =>
        play(f, 0.3, 0.1, i * 0.035, "triangle"),
      );
    }
    if (kind === "power") {
      [523, 659, 784, 1047, 1318].forEach((f, i) =>
        play(f, 0.5, 0.14, i * 0.06),
      );
    }
  }
  function uiPrefs() {
    $("sound").setAttribute(
      "aria-label",
      prefs.muted ? "Unmute audio" : "Mute audio",
    );
    $("sound").setAttribute("aria-pressed", String(!prefs.muted));
    $("soundWaves").setAttribute(
      "d",
      prefs.muted ? "M16 9l6 6M22 9l-6 6" : "M15 8q5 4 0 8M18 5q8 7 0 14",
    );
    $("music").textContent = "Music " + (prefs.music ? "on" : "off");
    $("motion").textContent = "Gentle motion " + (prefs.gentle ? "on" : "off");
    const name = ["Mint", "Rose", "Honey", "Lilac", "Ice"][prefs.trail];
    $("trail").textContent = "✧ " + name + " trail";
    $("pauseTrail").textContent = name + " trail";
    $("packCount").textContent = prefs.found.length + "/12";
  }
  uiPrefs();
  function notify(text: string, seconds = 3.8): void {
    $("toast").textContent = text;
    $("toast").classList.add("show");
    toastTime = seconds;
  }
  function burst(x: number, y: number, color: string, n = 12, speed = 140): void {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU),
        v = rand(25, speed);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.35, 0.9),
        max: 0.9,
        r: rand(1.5, 4),
        color,
      });
    }
    if (particles.length > 400) particles.splice(0, particles.length - 400);
  }
  function floatText(x: number, y: number, text: string, color = "#ffe6ab"): void {
    floats.push({ x, y, text, color, life: 1.4 });
  }
  function start() {
    if (started) return;
    started = true;
    root.classList.add("playing"); noteActivity();
    ["start", "demoLabel", "credit"].forEach((id) => ($(id).hidden = true));
    ["stats", "pause", "flightUI"].forEach((id) => ($(id).hidden = false));
    player.x = W * 0.25;
    player.y = (topBound() + bottomBound()) / 2;
    audioInit();
    canvas.focus();
    history.length = 0;
    nextPattern = 0;
    notify("The sky is yours. Follow a spark trail!", 4);
  }
  function setPause(value: boolean): void {
    if (disposed) return;
    if (!started) return;
    paused = value;
    keys = {};
    resetSteering();
    $("paused").hidden = !value;
    if (value) {
      save();
      $("pauseStats").textContent =
        Math.floor(score).toLocaleString() +
        " sparks  ·  " +
        rescues +
        " pup pals  ·  " +
        (distance / 1000).toFixed(1) +
        " sky miles";
      renderPack();
      if (audio.ctx) audio.ctx.suspend().catch(() => {});
      $("resume").focus();
    } else {
      audioInit();
      canvas.focus();
    }
  }
  function dash() {
    if (!started || paused || charge < 100) return;
    noteActivity();
    charge = 0;
    boost = 0.85;
    invuln = Math.max(invuln, 1.2);
    sound("dash");
    burst(player.x, player.y, COLORS[prefs.trail], 22, 240);
  }
  function changeTrail() {
    const unlocked = Math.min(5, 1 + Math.floor(prefs.total / 5));
    prefs.trail = (prefs.trail + 1) % unlocked;
    uiPrefs();
    save();
    if (!paused)
      notify(
        unlocked === 1
          ? "Find 5 pup pals to unlock a rose trail."
          : ["Mint", "Rose", "Honey", "Lilac", "Ice"][prefs.trail] +
              " trail equipped",
        2.5,
      );
  }
  $("play").onclick = start;
  $("resume").onclick = () => setPause(false);
  $("pause").onclick = () => setPause(true);
  $("packButton").onclick = () => setPause(true);
  // Activate immediately with the second thumb; ignore its compatibility click.
  $("dash").addEventListener("pointerdown", (event) => {
    const e = event as PointerEvent;
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    lastDashTouch = performance.now();
    dash();
  });
  ["pointerup", "pointercancel"].forEach((type) =>
    $("dash").addEventListener(type, (event) => {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse") lastDashTouch = performance.now();
    }),
  );
  $("dash").onclick = (e) => {
    if (e.detail === 0 || performance.now() - lastDashTouch > 800) dash();
  };
  $("trail").onclick = changeTrail;
  $("pauseTrail").onclick = changeTrail;
  $("sound").onclick = () => {
    prefs.muted = !prefs.muted;
    audioInit();
    if (paused && audio.ctx) audio.ctx.suspend().catch(() => {});
    uiPrefs();
    save();
  };
  $("music").onclick = () => {
    prefs.music = !prefs.music;
    if (audio.musicGain) audio.musicGain.gain.value = prefs.music ? 0.55 : 0;
    uiPrefs();
    save();
  };
  $("motion").onclick = () => {
    prefs.gentle = !prefs.gentle;
    uiPrefs();
    save();
  };
  window.addEventListener("keydown", (e) => {
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
        e.code,
      ) &&
      !((e.target as HTMLElement | null)?.tagName === "BUTTON" && e.code === "Space")
    )
      e.preventDefault();
    if (e.code === "Escape" || e.code === "KeyP") {
      if (!e.repeat) setPause(!paused);
      return;
    }
    if (e.code === "Space" && (e.target as HTMLElement | null)?.tagName !== "BUTTON") {
      if (!started) start();
      else dash();
    }
    keys[e.code] = true;
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.code)
    )
      resetSteering();
  }, { signal: abort.signal });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  }, { signal: abort.signal });
  window.addEventListener("blur", () => {
    keys = {};
    if (started && !paused) setPause(true);
  }, { signal: abort.signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started && !paused) setPause(true);
  }, { signal: abort.signal });
  function resetSteering() {
    const owner = input.activePointer,
      surface = input.surface;
    input.reset();
    player.vx = 0;
    player.vy = 0;
    $("touchKnob").style.transform = "translate(0px, 0px)";
    $("touchPad").classList.remove("held");
    if (owner !== null && surface?.hasPointerCapture?.(owner)) {
      try {
        surface.releasePointerCapture(owner);
      } catch {}
    }
  }
  function beginSteering(e: PointerEvent): void {
    if (!started || paused || input.activePointer !== null) return;
    noteActivity();
    if (e.pointerType === "mouse") {
      input.pointer = worldPoint(e);
      return;
    }
    e.preventDefault();
    if (!touchMode) {
      touchMode = true;
    root.classList.add("touch");
      resize();
    }
    input.activePointer = e.pointerId;
    input.surface = e.currentTarget as HTMLCanvasElement & HTMLElement;
    input.origin = { x: e.clientX, y: e.clientY };
    input.vector = { x: 0, y: 0 };
    input.pointer = null;
    $("touchPad").classList.add("held");
    try {
      input.surface.setPointerCapture(e.pointerId);
    } catch {}
  }
  function moveSteering(e: PointerEvent): void {
    if (!started || paused) return;
    noteActivity();
    if (e.pointerType === "mouse") {
      if (input.activePointer === null) input.pointer = worldPoint(e);
      return;
    }
    if (e.pointerId !== input.activePointer || !input.origin) return;
    e.preventDefault();
    const pad = $("touchPad");
    const knob = $("touchKnob");
    const radius = Math.max(30, pad.clientWidth * 0.42);
    input.vector = thumbVector(
      e.clientX - input.origin.x,
      e.clientY - input.origin.y,
      radius,
    );
    const travel = Math.max(0, (pad.clientWidth - knob.clientWidth) / 2 - 4);
    const offset = thumbOffset(input.vector, travel);
    knob.style.transform = "translate(" + offset.x + "px, " + offset.y + "px)";
  }
  function endSteering(e: PointerEvent): void {
    if (e.pointerId !== input.activePointer) return;
    resetSteering();
  }
  // Mouse retains its direct point-to-fly interaction on the sky.  Touch
  // input intentionally starts only on the visible pad, so touch movement is
  // never an invisible, accidental second control scheme.
  canvas.addEventListener("pointerdown", (event) => {
    if ((event as PointerEvent).pointerType === "mouse") beginSteering(event as PointerEvent);
  });
  canvas.addEventListener("pointermove", (event) => {
    if ((event as PointerEvent).pointerType === "mouse") moveSteering(event as PointerEvent);
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  const touchPad = $("touchPad");
  touchPad.addEventListener("pointerdown", beginSteering);
  touchPad.addEventListener("pointermove", moveSteering);
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
    touchPad.addEventListener(type, (event) => endSteering(event as PointerEvent)),
  );
  touchPad.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointerleave", (e: PointerEvent) => {
    if (e.pointerType === "mouse" && input.activePointer === null) input.pointer = null;
  });
  function renderPack() {
    const pack = $("pack");
    pack.replaceChildren();
    DOGS.forEach((d, i) => {
      const found = prefs.found.includes(i),
        el = document.createElement("div");
      el.className = "pupCard" + (found ? "" : " locked");
      const c = document.createElement("canvas");
      c.width = 112;
      c.height = 90;
      const g = requiredCanvasContext(c);
      g.scale(2, 2);
      drawDog(g, 28, 22, 1, i, 0, false);
      const b = document.createElement("b");
      b.textContent = found ? d.name : "Undiscovered";
      el.append(c, b);
      pack.append(el);
    });
    $("packHint").textContent =
      prefs.found.length === 12
        ? "The whole pack is here! Keep flying for more friends and new trails."
        : prefs.found.length +
          " of 12 discovered · Every pup stays in your collection on this device.";
  }
  function add(type: EntityType, x: number, y: number, extra: EntityOptions = {}): void {
    entities.push({
      type,
      x,
      y,
      baseY: y,
      age: 0,
      phase: rand(0, TAU),
      hit: false,
      r: 0,
      dog: 0,
      sway: 0,
      golden: false,
      ...extra,
    });
  }
  function spawnPattern() {
    const low = topBound() + 35,
      high = bottomBound() - 30,
      mid = rand(low + 20, Math.max(low + 21, high - 20)),
      amp = Math.min((high - low) * 0.3, rand(45, 100)),
      pattern = Math.floor(rand(0, 4));
    for (let i = 0; i < 10; i++) {
      const y = clamp(
        mid +
          (pattern === 0
            ? Math.sin(i * 0.5) * amp
            : pattern === 1
              ? (i - 4.5) * amp * 0.2
              : pattern === 2
                ? Math.sin(i * 0.8) * amp * 0.6
                : 0),
        low,
        high,
      );
      add("spark", W + 60 + i * 45, y, { r: 9 });
    }
    nextPattern = t + rand(2.8, 4.3);
  }
  function update(dt: number): void {
    t += dt;
    const chapter = Math.floor(t / 65),
      nextRegion = chapter % REGIONS.length;
    if (nextRegion !== regionIndex) {
      regionIndex = nextRegion;
      notify(region().name + " · a new sky to explore", 4);
      sound("ring");
    }
    const speed =
      (165 + Math.min(70, t * 0.12)) *
      (W < 700 ? 0.78 : 1) *
      (boost > 0 ? 1.75 : 1) *
      (wobble > 0 ? 0.73 : 1) *
      (eventType === "breeze" ? 1.18 : 1);
    distance += speed * dt * 0.16;
    boost = Math.max(0, boost - dt);
    invuln = Math.max(0, invuln - dt);
    wobble = Math.max(0, wobble - dt);
    superTime = Math.max(0, superTime - dt);
    power = Math.max(0, power - dt);
    charge = Math.min(100, charge + dt * (superTime > 0 ? 80 : 25));
    flowTimer -= dt;
    if (flowTimer < 0) flow = Math.max(0, flow - dt * 2);
    toastTime -= dt;
    if (toastTime <= 0) $("toast").classList.remove("show");
    const ev = Math.floor((t - 22) / 27);
    if (ev > eventIndex && t >= 22) {
      eventIndex = ev;
      const event = ["stars", "breeze", "parade"] as const;
      eventType = event[ev % event.length] ?? "stars";
      eventTime = 11;
      notify(
        eventType === "stars" ? "Star shower! Follow the falling gold." : eventType === "breeze" ? "Tailwind! Let the sky carry you." : "Pup parade! A few friends are dropping by.",
        3.5,
      );
      if (eventType === "parade") {
        for (let i = 0; i < 3; i++)
          add(
            "dog",
            W + 100 + i * 250,
            lerp(topBound() + 45, bottomBound() - 40, (i + 0.5) / 3),
            { dog: (prefs.total + i) % 12 },
          );
      }
    }
    eventTime -= dt;
    if (eventTime < 0) eventType = "";
    if (eventType === "stars" && Math.random() < dt * 6)
      add("spark", W + 30, rand(topBound() + 15, bottomBound()), {
        r: 9,
        golden: true,
      });
    if (t >= nextPattern) spawnPattern();
    if (t >= nextHazard) {
      const high = bottomBound() - 30,
        low = topBound() + 35;
      add(
        Math.random() < 0.72 ? "storm" : "wind",
        W + 100,
        rand(low, Math.max(low + 1, high)),
        { r: rand(30, 43), sway: rand(15, 40) },
      );
      nextHazard = t + rand(2.4, 4.2) - Math.min(0.7, t / 500);
    }
    if (t >= nextPup) {
      add("dog", W + 110, rand(topBound() + 40, bottomBound() - 35), {
        dog: prefs.total % 12,
      });
      nextPup = t + rand(10, 14);
    }
    if (t >= nextRing) {
      add("ring", W + 90, rand(topBound() + 40, bottomBound() - 35), { r: 39 });
      nextRing = t + rand(6, 9);
    }
    if (t >= nextPower) {
      add(
        Math.random() < 0.55 ? "magnet" : "super",
        W + 100,
        rand(topBound() + 40, bottomBound() - 35),
        { r: 20 },
      );
      nextPower = t + rand(19, 27);
    }
    let dx =
        (keys.ArrowRight || keys.KeyD ? 1 : 0) -
        (keys.ArrowLeft || keys.KeyA ? 1 : 0),
      dy =
        (keys.ArrowDown || keys.KeyS ? 1 : 0) -
        (keys.ArrowUp || keys.KeyW ? 1 : 0);
    if (dx && dy) {
      dx *= 0.707;
      dy *= 0.707;
    }
    if (input.activePointer !== null) {
      dx = input.vector.x;
      dy = input.vector.y;
    }
    let vx = dx * 390,
      vy = dy * 390;
    if (input.pointer) {
      vx = clamp((input.pointer.x - player.x) * 6, -650, 650);
      vy = clamp((input.pointer.y - player.y) * 6, -650, 650);
    }
    if (wobble > 0) {
      vx *= 0.8;
      vy *= 0.8;
    }
    // The pad should feel like a joystick rather than a loose suggestion.
    // Its response intentionally settles faster than keyboard movement while
    // retaining a trace of softness for the game's forgiving cloud flight.
    const steeringResponse = input.activePointer !== null ? 22 : 10;
    player.vx = lerp(player.vx, vx, 1 - Math.exp(-dt * steeringResponse));
    player.vy = lerp(player.vy, vy, 1 - Math.exp(-dt * steeringResponse));
    player.x = clamp(player.x + player.vx * dt, 42, W - 48);
    player.y = clamp(player.y + player.vy * dt, topBound(), bottomBound());
    player.tilt = lerp(
      player.tilt,
      clamp(player.vy / 1500, -0.24, 0.24),
      dt * 8,
    );
    history.unshift({ x: player.x, y: player.y });
    if (history.length > 150) history.pop();
    followers.forEach((f, i) => {
      const h = history[Math.min(history.length - 1, 12 + i * 12)] || player;
      f.x = lerp(f.x, h.x - 50 - i * 33, dt * 6);
      f.y = lerp(f.y, h.y + 10 + Math.sin(t * 3 + i) * 7, dt * 6);
    });
    const magnet = power > 0 || superTime > 0;
    for (const e of entities) {
      e.age += dt;
      e.x -= speed * dt;
      if (["storm", "wind", "dog"].includes(e.type))
        e.y = e.baseY + Math.sin(e.age * 1.5 + e.phase) * (e.sway || 12);
      let dist = Math.hypot(player.x - e.x, player.y - e.y);
      if (e.type === "spark" && magnet && dist < 200) {
        e.x = lerp(e.x, player.x, dt * 8);
        e.y = lerp(e.y, player.y, dt * 8);
        dist = Math.hypot(player.x - e.x, player.y - e.y);
      }
      if (e.hit) continue;
      if (e.type === "spark" && dist < 30) {
        e.hit = true;
        flow++;
        flowTimer = 3;
        const mult = superTime > 0 ? 4 : 1 + Math.min(3, Math.floor(flow / 15));
        score += 10 * mult;
        sound("spark");
        burst(e.x, e.y, "#ffdf8b", 5, 75);
      }
      if (
        e.type === "ring" &&
        Math.abs(e.x - player.x) < 24 &&
        Math.abs(e.y - player.y) < e.r - 8
      ) {
        e.hit = true;
        score += 100;
        charge = Math.min(100, charge + 35);
        flow += 4;
        flowTimer = 4;
        sound("ring");
        burst(e.x, e.y, "#afffe6", 20, 170);
        floatText(e.x, e.y - 35, "+100 · beautiful!", "#b0ffe1");
      }
      if (e.type === "dog" && dist < 48) {
        e.hit = true;
        rescues++;
        prefs.total++;
        const isNew = !prefs.found.includes(e.dog);
        if (isNew) prefs.found.push(e.dog);
        if (isNew) services.awardReward(`stormglide:pup-${e.dog}`);
        for (let index = 0; index <= 4; index++) if (prefs.total >= index * 5) services.awardReward(`stormglide:trail-${index}`);
        score += 200;
        sound("dog");
        burst(e.x, e.y, "#ffc0d7", 25, 160);
        floatText(
          e.x,
          e.y - 40,
          dog(e.dog).name + " joins the ride!",
          "#ffd0e3",
        );
        followers.unshift({ x: e.x, y: e.y, dog: e.dog });
        while (followers.length > 5) followers.pop();
        if (isNew)
          notify(
            "Meet " +
              dog(e.dog).name +
              "!  " +
              prefs.found.length +
              " of 12 pup pals discovered.",
            3.8,
          );
        if (prefs.total % 5 === 0 && prefs.total <= 20) {
          prefs.trail = prefs.total / 5;
          notify(
            ["", "Rose", "Honey", "Lilac", "Ice"][prefs.trail] +
              " trail unlocked! Your cloud has a new glow.",
            4,
          );
        }
        uiPrefs();
        save();
      }
      if ((e.type === "magnet" || e.type === "super") && dist < 40) {
        e.hit = true;
        if (e.type === "magnet") {
          power = 11;
          notify("Spark magnet! Nearby starlight comes to you.", 3.5);
        } else {
          superTime = 9;
          notify("SUPERCHARGED! Glide through everything. 4× sparks!", 4);
        }
        sound("power");
        burst(e.x, e.y, "#d1c0ff", 30, 200);
      }
      if (
        (e.type === "storm" || e.type === "wind") &&
        dist < e.r + 18 &&
        invuln <= 0
      ) {
        if (boost > 0 || superTime > 0) {
          e.hit = true;
          score += 50;
          burst(e.x, e.y, "#c7d9ff", 18, 170);
          floatText(e.x, e.y - 35, "poof! +50");
          sound("ring");
        } else {
          invuln = 2.2;
          wobble = 0.9;
          shake = prefs.gentle ? 0 : 4;
          flow = Math.max(0, flow - 3);
          burst(player.x, player.y, "#c7d9ff", 10, 80);
          floatText(
            player.x,
            player.y - 50,
            e.type === "wind" ? "whoooosh!" : "just a wobble!",
            "#d5e2ff",
          );
          sound("bump");
        }
      } else if (
        (e.type === "storm" || e.type === "wind") &&
        dist < e.r + 18 &&
        (boost > 0 || superTime > 0)
      ) {
        e.hit = true;
        score += 50;
        burst(e.x, e.y, "#c7d9ff", 18, 170);
        floatText(e.x, e.y - 35, "poof! +50");
      }
    }
    entities = entities.filter((e) => e.x > -150 && !e.hit);
    storm.model.entities = entities;
    if (Math.random() < dt * (boost > 0 ? 90 : 35)) {
      particles.push({
        x: player.x - 24,
        y: player.y + 22 + rand(-9, 9),
        vx: rand(-100, -30),
        vy: rand(-12, 12),
        life: 0.7,
        max: 0.7,
        r: rand(1, boost > 0 ? 6 : 3),
        color:
          superTime > 0 ? COLORS[Math.floor(rand(0, 5))] : COLORS[prefs.trail],
      });
    }
    prefs.best = Math.max(prefs.best, Math.floor(score));
    if (storm.model.frame % 6 === 0) {
      $("score").textContent = Math.floor(score).toLocaleString();
      $("rescues").textContent = String(rescues);
      $("distance").textContent = (distance / 1000).toFixed(1);
      $("chapter").textContent =
        "Chapter " +
        String(chapter + 1).padStart(2, "0") +
        " · " +
        region().label;
      $("region").textContent = region().name;
      $("regionFill").style.width = ((t % 65) / 65) * 100 + "%";
      $("dashCharge").style.transform = "scaleX(" + charge / 100 + ")";
      $("dashLabel").textContent = charge >= 100 ? "ϟ Dash" : "ϟ Recharging";
      $("dashHelp").textContent =
        charge >= 100
          ? touchMode
            ? "TAP TO DASH"
            : "SPACE / TAP"
          : Math.ceil((100 - charge) / (superTime > 0 ? 80 : 25)) + "s";
      $("dash").setAttribute("aria-disabled", String(charge < 100));
      $("flow").hidden = flow < 15 && superTime <= 0;
      $("flowValue").textContent =
        (superTime > 0 ? 4 : 1 + Math.min(3, Math.floor(flow / 15))) + "×";
      $("event").textContent =
        superTime > 0
          ? "✦ Supercharged · " + Math.ceil(superTime) + "s"
          : power > 0
            ? "✧ Spark magnet · " + Math.ceil(power) + "s"
            : eventType
              ? eventLabels[eventType]
              : "";
      $("firstHint").hidden = t > 14;
    }
  }
  function ellipse(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
    g.fill();
  }
  function path(g: CanvasRenderingContext2D, points: Array<readonly [number, number]>, color: string): void {
    g.fillStyle = color;
    g.beginPath();
    points.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
    g.fill();
  }
  function line(g: CanvasRenderingContext2D, points: Array<readonly [number, number]>, color: string, width = 2): void {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    points.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.stroke();
  }
  function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot = 0): void {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    path(
      g,
      [
        [0, -r],
        [r * 0.24, -r * 0.24],
        [r, 0],
        [r * 0.24, r * 0.24],
        [0, r],
        [-r * 0.24, r * 0.24],
        [-r, 0],
        [-r * 0.24, -r * 0.24],
      ],
      color,
    );
    g.restore();
  }
  function cloud(g: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, shade?: string): void {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    ellipse(g, 0, 9, 42, 16, shade || "#9cbbdb");
    ellipse(g, -24, 0, 21, 17, color);
    ellipse(g, 0, -7, 25, 23, color);
    ellipse(g, 27, 2, 19, 15, color);
    ellipse(g, 0, 4, 39, 18, color);
    g.restore();
  }
  function drawDog(g: CanvasRenderingContext2D, x: number, y: number, s: number, id: number, time: number, flying = true): void {
    const d = dog(id);
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    if (flying) cloud(g, 0, 17, 0.52, "#e6eff6", "#a2bacc");
    line(
      g,
      [
        [-13, 5],
        [-24, -1],
        [-25, -8 + Math.sin(time * 9) * 5],
      ],
      d.ears,
      5,
    );
    ellipse(g, -1, 4, 17, 11, d.color);
    ellipse(g, -8, 12, 4, 6, d.ears);
    ellipse(g, 9, 12, 4, 5, d.color);
    ellipse(g, 10, -7, 12, 12, d.color);
    ellipse(g, 2, -9, 5, 10, d.ears);
    ellipse(g, 19, -6, 5, 8, d.ears);
    ellipse(g, 14, -3, 7, 5, "#f9ead8");
    ellipse(g, 9, -10, 1.6, 2, "#2b3143");
    ellipse(g, 17, -10, 1.6, 2, "#2b3143");
    ellipse(g, 15, -5, 2.1, 1.5, "#2b3143");
    line(
      g,
      [
        [14, -2],
        [14, 1],
        [17, 1],
      ],
      "#795b57",
      1.1,
    );
    ellipse(g, 17, 1, 1.5, 2.4, "#ed9bb2");
    line(
      g,
      [
        [2, 3],
        [14, 5],
      ],
      id % 2 ? "#a9eadd" : "#f3adc6",
      3,
    );
    if (id === 0)
      path(
        g,
        [
          [-8, -3],
          [-3, -1],
          [-7, 3],
          [-2, 4],
          [-8, 9],
          [-6, 3],
          [-11, 1],
        ],
        "#fff0c5",
      );
    g.restore();
  }
  function drawPlayer(g: CanvasRenderingContext2D, x: number, y: number, s: number, time: number): void {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.rotate(started ? player.tilt : Math.sin(time) * 0.025);
    if (boost > 0 || superTime > 0) {
      g.globalAlpha = 0.18 + 0.03 * Math.sin(time * 10);
      ellipse(g, 0, 0, 73, 68, "#b3ffe8");
      g.globalAlpha = 1;
    }
    if (invuln > 0 && boost <= 0 && superTime <= 0)
      g.globalAlpha = 0.75 + 0.25 * Math.sin(time * 16) ** 2;
    // A tiny rider in an oversized yellow raincoat, balanced on her cloud.
    const flutter = prefs.gentle ? 0 : Math.sin(time * 6) * 4;
    path(
      g,
      [
        [-8, -38],
        [-44, -30 + flutter],
        [-58, -35 + flutter],
        [-43, -20 + flutter],
        [-6, -27],
      ],
      "#eea6bf",
    );
    line(
      g,
      [
        [-6, -5],
        [-16, 15],
        [-24, 15],
      ],
      "#263957",
      7,
    );
    line(
      g,
      [
        [10, -5],
        [16, 13],
        [26, 14],
      ],
      "#263957",
      7,
    );
    cloud(g, 0, 24, 1, "#e4f6f0", "#94c6d7");
    ellipse(g, -12, 20, 24, 8, "#f4fff7");
    path(
      g,
      [
        [-12, -35],
        [10, -35],
        [22, -7],
        [-22, -7],
      ],
      "#ffda81",
    );
    path(
      g,
      [
        [1, -33],
        [10, -33],
        [22, -7],
        [10, -7],
      ],
      "#e6ac64",
    );
    line(
      g,
      [
        [-12, -27],
        [-25, -12],
        [-34, -15],
      ],
      "#ffda81",
      8,
    );
    ellipse(g, -35, -15, 4, 4, "#eec1a0");
    line(
      g,
      [
        [11, -27],
        [23, -20],
        [31, -26],
      ],
      "#ffda81",
      8,
    );
    ellipse(g, 32, -27, 4, 4, "#eec1a0");
    ellipse(g, 0, -49, 18, 21, "#634c5c");
    ellipse(g, 2, -47, 14, 16, "#f2caaa");
    ellipse(g, -2, -44, 2.8, 2.8, "#f3b29e");
    ellipse(g, 10, -44, 2.7, 2.6, "#f3b29e");
    ellipse(g, 1, -50, 1.7, 2.2, "#343951");
    ellipse(g, 11, -50, 1.7, 2.2, "#343951");
    g.strokeStyle = "#a56d68";
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(7, -44, 3, 0, Math.PI);
    g.stroke();
    path(
      g,
      [
        [-15, -49],
        [-10, -66],
        [8, -68],
        [18, -55],
        [8, -57],
        [1, -61],
        [-2, -54],
      ],
      "#634c5c",
    );
    ellipse(g, -16, -53, 6, 11, "#634c5c");
    line(
      g,
      [
        [-13, -64],
        [0, -69],
        [12, -64],
      ],
      "#e8b6cc",
      3,
    );
    path(
      g,
      [
        [1, -29],
        [-5, -20],
        [1, -20],
        [-2, -12],
        [8, -23],
        [2, -23],
      ],
      "#fff5c3",
    );
    g.restore();
  }
  function background() {
    const g = ctx;
    g.fillStyle = "#24375d";
    g.fillRect(0, 0, W, H);
    if (sky.complete && sky.naturalWidth) {
      const key = W + "x" + H + ":" + regionIndex;
      if (key !== storm.renderer.backdropKey) {
        storm.renderer.backdrop.width = W;
        storm.renderer.backdrop.height = H;
        const scale = Math.max(W / sky.width, H / sky.height),
          iw = sky.width * scale,
          ih = sky.height * scale;
        storm.renderer.backdropContext.filter = regionIndex
          ? "hue-rotate(" + region().hue + "deg)"
          : "none";
        storm.renderer.backdropContext.drawImage(sky, (W - iw) / 2, (H - ih) / 2, iw, ih);
        storm.renderer.backdropKey = key;
      }
      g.drawImage(storm.renderer.backdrop, 0, 0, W, H);
    }
    const shade = g.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "#111e3c45");
    shade.addColorStop(0.55, "#17274912");
    shade.addColorStop(1, "#1724455a");
    g.fillStyle = shade;
    g.fillRect(0, 0, W, H);
    const tt = prefs.gentle ? 0 : visualT;
    for (let i = 0; i < 36; i++) {
      const x =
          ((((i * 157.3 - tt * (2 + (i % 3))) % (W + 40)) + W + 40) %
            (W + 40)) -
          20,
        y = 40 + ((i * 83.7) % (H * 0.7));
      g.globalAlpha = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(tt * 0.6 + i));
      star(g, x, y, i % 7 === 0 ? 4 : 1.6, "#fff3d5");
    }
    g.globalAlpha = 1;
    if (started) {
      g.save();
      g.globalAlpha = 0.07;
      for (let i = 0; i < 5; i++) {
        const x =
          ((((i * 335 - t * 25) % (W + 330)) + W + 330) % (W + 330)) - 150;
        cloud(g, x, H - 65 + Math.sin(i) * 35, 2.7, "#d2e8ff");
      }
      g.restore();
    }
  }
  function drawEntity(e: RuntimeEntity): void {
    const g = ctx,
      x = e.x,
      y = e.y;
    g.save();
    if (e.type === "spark") {
      g.shadowColor = "#ffcd6e";
      g.shadowBlur = prefs.gentle ? 8 : 15;
      star(g, x, y, 8 + Math.sin(visualT * 4 + e.phase) * 1.5, "#ffe4a0", 0.15);
      g.shadowBlur = 0;
      star(g, x - 2, y - 2, 3, "#fff8d6");
    }
    if (e.type === "ring") {
      g.strokeStyle = "#c4ffe4";
      g.shadowColor = "#b0f1dc";
      g.shadowBlur = 13;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(x, y, 13, e.r, 0, 0, TAU);
      g.stroke();
      g.shadowBlur = 0;
      g.globalAlpha = 0.15;
      g.fillStyle = "#b7ffe1";
      g.fill();
      g.globalAlpha = 1;
      star(g, x, y - e.r, 6, "#f5ffc6");
      star(g, x, y + e.r, 4, "#f5ffc6");
    }
    if (e.type === "storm") {
      const s = e.r / 36;
      cloud(g, x, y, s, "#687796", "#414f76");
      ellipse(g, x - 11 * s, y, 2.7 * s, 3 * s, "#263655");
      ellipse(g, x + 12 * s, y, 2.7 * s, 3 * s, "#263655");
      line(
        g,
        [
          [x - 16 * s, y - 8 * s],
          [x - 7 * s, y - 5 * s],
        ],
        "#354260",
        2.5 * s,
      );
      line(
        g,
        [
          [x + 7 * s, y - 5 * s],
          [x + 16 * s, y - 8 * s],
        ],
        "#354260",
        2.5 * s,
      );
      line(
        g,
        [
          [x - 4 * s, y + 10 * s],
          [x + 4 * s, y + 10 * s],
        ],
        "#354260",
        2 * s,
      );
      for (let i = 0; i < 3; i++) {
        const yy = y + 30 * s + ((visualT * 30 + i * 9) % 17);
        line(
          g,
          [
            [x + (i - 1) * 18, yy],
            [x + (i - 1) * 18 - 3, yy + 7],
          ],
          "#a5c7e8",
          2,
        );
      }
    }
    if (e.type === "wind") {
      g.strokeStyle = "#a2cee9";
      g.lineWidth = 2;
      g.globalAlpha = 0.65;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.ellipse(
          x + (i - 1) * 5,
          y + (i - 1) * 15,
          35 - i * 7,
          9,
          Math.sin(visualT) * 0.1,
          0.4,
          TAU - 0.4,
        );
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    if (e.type === "dog") {
      g.globalAlpha = 0.4;
      ellipse(g, x, y + 2, 40, 40, "#624771");
      g.globalAlpha = 1;
      drawDog(g, x, y, 1.2, e.dog, visualT);
      star(g, x + 27, y - 30, 5, "#ffd1e3");
      g.font = '500 11px "DM Sans",sans-serif';
      g.textAlign = "center";
      g.fillStyle = "#ffe4ef";
      g.fillText(dog(e.dog).name, x, y + 47);
    }
    if (e.type === "magnet" || e.type === "super") {
      g.save();
      g.translate(x, y);
      g.rotate(Math.sin(visualT * 2) * 0.15);
      g.shadowColor = e.type === "super" ? "#ffe1a0" : "#d3bdff";
      g.shadowBlur = 22;
      g.fillStyle = e.type === "super" ? "#ffe1a0" : "#cdb7fa";
      g.beginPath();
      g.roundRect(-20, -20, 40, 40, 12);
      g.fill();
      g.shadowBlur = 0;
      if (e.type === "super")
        path(
          g,
          [
            [3, -13],
            [-8, 2],
            [0, 2],
            [-4, 14],
            [10, -4],
            [2, -4],
          ],
          "#605079",
        );
      else {
        g.strokeStyle = "#605079";
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(-7, -8);
        g.lineTo(-7, 3);
        g.arc(0, 3, 7, Math.PI, 0, true);
        g.lineTo(7, -8);
        g.stroke();
      }
      g.restore();
    }
    g.restore();
  }
  function draw(dt: number): void {
    background();
    ctx.save();
    if (shake > 0.1 && !prefs.gentle) {
      ctx.translate(rand(-shake, shake), rand(-shake, shake));
      shake *= 0.87;
    }
    if (!started) {
      const x = W < 700 ? W * 0.8 : W * 0.73,
        y = W < 700 ? H * 0.7 : H * 0.51,
        scale = W < 700 ? 1.3 : 2;
      for (let i = 0; i < 9; i++) {
        const sx = x - 120 - i * 32,
          sy = y + 75 + Math.sin(visualT * 1.5 + i * 0.7) * 22;
        ctx.globalAlpha = (1 - i / 10) * 0.7;
        star(ctx, sx, sy, 3 + (i % 3), "#aef3df");
      }
      ctx.globalAlpha = 1;
      drawPlayer(ctx, x, y + Math.sin(visualT * 1.5) * 8, scale, visualT);
      drawDog(
        ctx,
        x - 105,
        y + 118 + Math.sin(visualT * 1.8) * 5,
        1.1,
        0,
        visualT,
      );
      drawDog(
        ctx,
        x - 180,
        y + 138 + Math.sin(visualT * 1.8 + 1) * 6,
        0.85,
        1,
        visualT,
      );
    } else {
      entities.forEach(drawEntity);
      followers
        .slice()
        .reverse()
        .forEach((f) => drawDog(ctx, f.x, f.y, 0.68, f.dog, visualT));
      if (power > 0) {
        ctx.save();
        ctx.strokeStyle = "#d4c2ff50";
        ctx.setLineDash([4, 13]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 110 + Math.sin(visualT * 2) * 8, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      drawPlayer(
        ctx,
        player.x,
        player.y + (prefs.gentle ? 0 : Math.sin(visualT * 3) * 2),
        0.88,
        visualT,
      );
    }
    for (const p of particles) {
      if (!paused) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      star(ctx, p.x, p.y, p.r, p.color);
    }
    ctx.globalAlpha = 1;
    particles = particles.filter((p) => p.life > 0);
    storm.model.particles = particles;
    for (const f of floats) {
      if (!paused) {
        f.life -= dt;
        f.y -= dt * 26;
      }
      ctx.globalAlpha = clamp(f.life, 0, 1);
      ctx.font = '600 13px "DM Sans",sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = f.color;
      ctx.shadowColor = "#15243e";
      ctx.shadowBlur = 9;
      ctx.fillText(f.text, f.x, f.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    floats = floats.filter((f) => f.life > 0);
    storm.model.floats = floats;
    ctx.restore();
  }
  function loop(now: number): void {
    if (disposed) return;
    const dt = storm.nextFrameDelta(now);
    storm.model.frame++;
    if (!paused) visualT += prefs.gentle ? dt * 0.3 : dt;
    if (started && !paused) {
      const whole = activePlay.advance(performance.now(), dt);
      if (whole !== null) services.creditActivePlay(whole);
      storm.model.simulationAccumulator += dt;
      while (storm.model.simulationAccumulator >= 1 / 60) {
        update(1 / 60);
        storm.model.simulationAccumulator -= 1 / 60;
      }
      musicTick();
    }
    draw(dt);
    frameId = requestAnimationFrame(loop);
  }
  frameId = requestAnimationFrame(loop);
  saveTimer = window.setInterval(() => {
    if (started) save();
  }, 10000);
  window.addEventListener("pagehide", save, { signal: abort.signal });
  // The same pause control is available to supporting browsers' page tools.
  if (document.modelContext?.registerTool) {
    try {
      Promise.resolve(
        document.modelContext.registerTool({
          name: "pause_stormglide",
          description:
            "Pause the current flight and display the collected pups. Does not reset progress.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute(input) {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw new Error("Expected an empty object.");
            if (!started) throw new Error("Start the game before pausing.");
            setPause(true);
            return {
              paused,
              score: Math.floor(score),
              rescues,
              discovered: prefs.found.length,
            };
          },
        }),
      ).catch(() => {});
    } catch {}
  }
  return {
    pause: setPause,
    muted: (value: boolean) => { prefs.muted = value; audioInit(); if (paused && audio.ctx) void audio.ctx.suspend(); uiPrefs(); save(); },
    flush: save,
    status: () => ({ started, paused, score: Math.floor(score), rescues, discovered: prefs.found.length, activePlaySeconds: activePlay.value() }),
    dispose: () => { if (disposed) return; save(); disposed = true; abort.abort(); cancelAnimationFrame(frameId); clearInterval(saveTimer); resetSteering(); if (audio.ctx) void audio.ctx.close().catch(() => undefined); root.replaceChildren(); },
  };
}
