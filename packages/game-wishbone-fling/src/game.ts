class LocalActivityClock {
  private lastAction = -Infinity;
  private clock = 0;
  total: number;
  constructor(start = 0) {
    this.total = start;
  }
  interact() {
    this.lastAction = this.clock;
  }
  suspend() {
    this.lastAction = -Infinity;
  }
  step(dt: number, paused: boolean, shot: boolean) {
    const e = Math.max(0, Math.min(0.1, dt));
    this.clock += e;
    if (
      !paused &&
      (this.clock - this.lastAction <= 5 ||
        (shot && this.clock - this.lastAction <= 8))
    )
      this.total += e;
    return this.total;
  }
}
function icon(name: string) {
  return `<span aria-hidden="true">${name === "pause" ? "Ⅱ" : name === "play" ? "▶" : "●"}</span>`;
}
import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { loadWishboneProgress, WISHBONE_REWARD_REQUEST_IDS } from "./progress";
import { PowerYard } from "./powers";
import { registerYards } from "./levels";
import { aim, TUNE } from "./yard";
import { WishboneRenderer, drawItem } from "./renderer";
import {
  WishboneProgression,
  keepsakes,
  type WishboneProgress,
} from "./progression";
import { GameAudio } from "./audio";
import type { AimInput, YardDefinition } from "./types";
import { WishboneCamera, type ViewPoint } from "./camera";

let runtimeLevels: YardDefinition[] = [];
let runtimeDiagnostics: string[] = [];
export function configureWishboneLevels(
  levels: YardDefinition[],
  diagnostics: string[] = [],
) {
  runtimeLevels = levels;
  runtimeDiagnostics = diagnostics;
  registerYards(levels);
}
export interface WishboneGameOptions {
  levels?: YardDefinition[];
  playtest?: boolean;
}
const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
/** A disposable game session. Durable state belongs to the shared profile. */
export class WishboneGame implements GameSession {
  private yard!: PowerYard;
  private levels: YardDefinition[];
  private empty = false;
  private renderer!: WishboneRenderer;
  private sound!: GameAudio;
  private canvas!: HTMLCanvasElement;
  private input: AimInput | null = null;
  private camera = new WishboneCamera();
  private pointers = new Map<number, ViewPoint>();
  private gesture: "aim" | "pan" | "pinch" | null = null;
  private pinchDistance = 0;
  private pinchCenter: ViewPoint | null = null;
  private paused = false;
  private abort = new AbortController();
  private observer!: ResizeObserver;
  private raf = 0;
  private disposed = false;
  private last = 0;
  private saveTime = 0;
  private cascade = 0;
  private cascadeTime = 0;
  private impactWait = 0;
  private progress: WishboneProgress;
  private activity: LocalActivityClock;
  private statusKey = "";
  constructor(
    private readonly host: HTMLElement,
    private readonly services: GameHostServices<WishboneProgress>,
    private readonly options: WishboneGameOptions = {},
  ) {
    this.levels = options.levels ?? runtimeLevels;
    const progress = (this.progress = loadWishboneProgress(services.progress));
    this.activity = new LocalActivityClock(services.activePlaySeconds);
    if (!this.levels.length) {
      this.empty = true;
      const panel = document.createElement("section"),
        title = document.createElement("h2"),
        detail = document.createElement("p"),
        back = document.createElement("button");
      panel.className = "wishbone-empty";
      title.textContent = "No playable Wishbone levels";
      detail.textContent = runtimeDiagnostics.length
        ? runtimeDiagnostics.join(" · ")
        : "Add a valid saved level to the level list in the editor.";
      back.textContent = "Back";
      back.addEventListener("click", () => services.exit(), {
        signal: this.abort.signal,
      });
      panel.append(title, detail, back);
      host.replaceChildren(panel);
      return;
    }
    const selected =
      this.levels.find((l) => l.id === progress.selectedLevelId) ??
      this.levels[0];
    this.yard = new PowerYard(
      selected,
      options.playtest ? null : progress.checkpoints[selected.id],
      progress.powers,
    );
    this.yard.index = this.levels.indexOf(selected);
    this.camera.setWorld(this.yard.world, this.yard.origin);
    this.camera.home();
    host.innerHTML = `<section class="wishbone-game game-page">
<div class="yard-wrap">
<canvas aria-label="Wishbone physics yard. Pull from Wishbone in either direction, then release." tabindex="0">
</canvas>
<header class="wishbone-hud">
<button data-action="leave" class="hud-back">← Clubhouse</button>
<div class="hud-title"><span class="eyebrow">WISHBONE FLING</span><b data-ui="title"></b><small data-ui="rescued"></small></div>
<div class="game-wallet" aria-label="Your coins"><span aria-hidden="true">●</span><b data-ui="coins">0</b></div>
<div class="hud-actions">
<button data-action="sound" aria-label="Toggle sound" title="Sound">${icon("sound")}</button>
<button data-action="fullscreen" aria-label="Fullscreen" title="Fullscreen">${icon("fullscreen")}</button>
<button data-action="help" aria-label="Game instructions" title="Help">${icon("help")}</button>
<button data-action="pause" aria-label="Pause" title="Pause">${icon("pause")}</button>
</div>
</header>
<button data-action="levels" class="levels-toggle" aria-expanded="false">Levels</button>
<nav class="yard-switcher" data-ui="yard-list" aria-label="Choose a Wishbone yard" hidden>${this.levels.map((yard, index) => `<button data-action="yard${index}" aria-pressed="false"><span>Yard ${index + 1}</span>${escapeHtml(yard.name)}</button>`).join("")}</nav>
<div class="pause-cover" hidden>
<h2>A little breather</h2>
<button data-action="resume" class="primary">Keep playing</button>
</div>
<div class="stage-tools">
<button data-action="restack" class="stage-tool" aria-label="Restack this yard" title="Restack"><span aria-hidden="true">↺</span></button>
<button data-action="collection" class="stage-tool" aria-label="Open keepsakes" title="Keepsakes"><span aria-hidden="true">♥</span></button>
</div>
<div class="camera-tools" aria-label="Camera controls">
<button data-action="zoom-out" aria-label="Zoom out" title="Zoom out">−</button>
<button data-action="camera-home" aria-label="Show whole yard" title="Show whole yard">⤢</button>
<button data-action="zoom-in" aria-label="Zoom in" title="Zoom in">+</button>
</div>
<button data-action="recall" class="stage-recall" hidden>Recall</button>
<div class="game-status" role="status"><b data-ui="hint">Pull back. Let him fly.</b><small data-ui="milestone">Unlimited tumbles. Everything you earn stays yours.</small></div>
</div>
<dialog class="game-dialog">
<button class="dialog-close" data-action="close-dialog" aria-label="Close">×</button>
<div data-ui="dialog">
</div>
</dialog>
</section>`;
    if (runtimeDiagnostics.length && !options.playtest) {
      const warning = document.createElement("details");
      warning.className = "level-diagnostics";
      const summary = document.createElement("summary");
      summary.textContent = `${runtimeDiagnostics.length} level(s) omitted`;
      const text = document.createElement("p");
      text.textContent = runtimeDiagnostics.join(" · ");
      warning.append(summary, text);
      host.querySelector(".yard-wrap")!.append(warning);
    }
    this.canvas = host.querySelector("canvas")!;
    this.renderer = new WishboneRenderer(this.canvas);
    this.sound = new GameAudio("summer", services.muted);
    host.addEventListener("click", this.click, { signal: this.abort.signal });
    this.canvas.addEventListener("pointerdown", this.down, {
      signal: this.abort.signal,
    });
    this.canvas.addEventListener("pointermove", this.move, {
      signal: this.abort.signal,
    });
    this.canvas.addEventListener("pointerup", this.up, {
      signal: this.abort.signal,
    });
    this.canvas.addEventListener("pointercancel", () => this.cancelAim(), {
      signal: this.abort.signal,
    });
    this.canvas.addEventListener(
      "lostpointercapture",
      (event) => {
        if (this.pointers.has(event.pointerId)) this.cancelAim();
      },
      { signal: this.abort.signal },
    );
    this.canvas.addEventListener("wheel", this.wheel, {
      passive: false,
      signal: this.abort.signal,
    });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.setPaused(true);
      },
      { signal: this.abort.signal },
    );
    window.addEventListener("pagehide", () => this.save(), {
      signal: this.abort.signal,
    });
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && !this.host.querySelector("dialog")!.open) {
          this.setPaused(!this.paused);
          e.preventDefault();
        }
      },
      { signal: this.abort.signal },
    );
    this.host.querySelector("dialog")!.addEventListener(
      "close",
      () => {
        if (!this.dialogWasPaused) this.setPaused(false);
      },
      { signal: this.abort.signal },
    );
    this.observer = new ResizeObserver(() => {
      this.cancelAim();
      this.renderer.resize();
    });
    this.observer.observe(this.canvas);
    this.refresh();
    this.raf = requestAnimationFrame(this.frame);
  }
  private ui<T extends HTMLElement = HTMLElement>(name: string): T {
    return this.host.querySelector(`[data-ui="${name}"]`)!;
  }
  private button(name: string): HTMLButtonElement {
    return this.host.querySelector(`[data-action="${name}"]`)!;
  }
  private click = (event: Event) => {
    const action = (event.target as Element).closest<HTMLElement>(
      "[data-action]",
    )?.dataset.action;
    if (!action) return;
    if (action === "leave") {
      this.services.exit();
      return;
    }
    if (action === "sound") {
      this.setMuted(!this.sound.muted);
      this.refresh();
      return;
    }
    if (action === "fullscreen") {
      void this.host.requestFullscreen?.().catch(() => {});
      return;
    }
    if (action === "pause" || action === "resume") {
      this.setPaused(!this.paused);
      return;
    }
    if (action === "close-dialog") {
      this.host.querySelector("dialog")!.close();
      return;
    }
    if (action === "help" || action === "collection") {
      this.dialog(action);
      return;
    }
    if (action === "levels") {
      const list = this.ui("yard-list");
      list.hidden = !list.hidden;
      this.button("levels").setAttribute("aria-expanded", String(!list.hidden));
      return;
    }
    if (
      action === "zoom-in" ||
      action === "zoom-out" ||
      action === "camera-home"
    ) {
      this.cancelAim();
      if (action === "camera-home") this.camera.home();
      else {
        const anchor =
          this.camera.zoom === 1 && action === "zoom-in"
            ? this.camera.toScreen(this.yard.origin)
            : { x: 600, y: 360 };
        this.camera.zoomAt(
          this.camera.zoom + (action === "zoom-in" ? 0.25 : -0.25),
          anchor,
        );
      }
      return;
    }
    if (this.paused) return;
    this.activity.interact();
    this.sound.start();
    const yardMatch = /^yard(\d+)$/.exec(action);
    if (yardMatch) {
      const index = Number(yardMatch[1]);
      if (!Number.isInteger(index) || index < 0 || index >= this.levels.length)
        return;
      if (index !== this.yard.index) this.switchYard(index);
      this.ui("yard-list").hidden = true;
      this.button("levels").setAttribute("aria-expanded", "false");
    }
    if (action === "restack") this.switchYard(this.yard.index, true);
    if (action === "recall") {
      this.cancelAim();
      this.yard.recall();
    }
    this.refresh();
  };
  private point(event: { clientX: number; clientY: number }) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * TUNE.width) / rect.width,
      y: ((event.clientY - rect.top) * TUNE.height) / rect.height,
    };
  }
  private down = (event: PointerEvent) => {
    if (event.button !== 0 || this.paused) return;
    const p = this.point(event);
    event.preventDefault();
    this.pointers.set(event.pointerId, p);
    this.canvas.setPointerCapture(event.pointerId);
    if (this.pointers.size > 1) {
      this.input = null;
      this.gesture = "pinch";
      this.measurePinch();
      return;
    }
    const world = this.camera.toWorld(p);
    if (
      this.yard.mode === "ready" &&
      Math.hypot(world.x - this.yard.origin.x, world.y - this.yard.origin.y) <=
        150
    ) {
      this.gesture = "aim";
      this.sound.start();
      this.activity.interact();
      this.input = { id: event.pointerId, start: world, velocity: aim(0, 0) };
    } else this.gesture = "pan";
  };
  private measurePinch() {
    const [a, b] = [...this.pointers.values()];
    if (!a || !b) return;
    this.pinchDistance = Math.hypot(b.x - a.x, b.y - a.y);
    this.pinchCenter = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  private wheel = (event: WheelEvent) => {
    if (this.paused || this.input || this.pointers.size) return;
    event.preventDefault();
    this.camera.zoomAt(
      this.camera.zoom * Math.exp(-event.deltaY * 0.001),
      this.point(event),
    );
  };
  private move = (event: PointerEvent) => {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    const p = this.point(event);
    this.pointers.set(event.pointerId, p);
    if (this.gesture === "pinch") {
      const oldDistance = this.pinchDistance,
        oldCenter = this.pinchCenter;
      this.measurePinch();
      if (
        this.pointers.size >= 2 &&
        oldDistance > 0 &&
        oldCenter &&
        this.pinchCenter
      ) {
        this.camera.zoomAt(
          (this.camera.zoom * this.pinchDistance) / oldDistance,
          oldCenter,
        );
        this.camera.pan(
          this.pinchCenter.x - oldCenter.x,
          this.pinchCenter.y - oldCenter.y,
        );
      }
    } else if (this.input?.id === event.pointerId) {
      const world = this.camera.toWorld(p);
      this.input.velocity = aim(
        this.input.start.x - world.x,
        world.y - this.input.start.y,
      );
      this.yard.facing = this.input.velocity.x < 0 ? -1 : 1;
      this.yard.plush.pose(
        this.yard.origin.x,
        this.yard.origin.y,
        0,
        this.yard.facing,
      );
      this.activity.interact();
    } else if (this.gesture === "pan")
      this.camera.pan(p.x - previous.x, p.y - previous.y);
  };
  private up = (event: PointerEvent) => {
    if (this.input?.id !== event.pointerId) {
      this.pointers.delete(event.pointerId);
      if (this.pointers.size >= 2) this.measurePinch();
      if (this.canvas.hasPointerCapture(event.pointerId))
        this.canvas.releasePointerCapture(event.pointerId);
      if (!this.pointers.size) this.gesture = null;
      return;
    }
    const v = this.input.velocity;
    this.cancelAim();
    if (v.power < 0.06) return;
    if (this.yard.throwToy(v)) {
      this.camera.launched();
      this.activity.interact();
      this.progress.throws++;
      this.cascade = 0;
      this.cascadeTime = 0;
      this.sound.note(180, 0.18, 0.08, "triangle");
      this.rewards();
    }
  };
  private cancelAim() {
    const ids = [...this.pointers.keys()];
    this.input = null;
    this.pointers.clear();
    this.gesture = null;
    this.pinchCenter = null;
    for (const id of ids)
      if (this.canvas.hasPointerCapture(id))
        this.canvas.releasePointerCapture(id);
  }
  private save() {
    if (this.empty || this.options.playtest) return;
    this.progress.selectedLevelId = this.yard.layout.id;
    this.progress.checkpoints[this.yard.layout.id] = this.yard.checkpoint();
    this.services.creditActivePlay(this.activity.total);
    this.services.saveProgress(this.progress);
  }
  private rewards() {
    if (this.options.playtest) {
      this.refresh();
      return;
    }
    const earned = WishboneProgression.award(this.progress);
    for (const id of earned)
      this.services.awardReward(
        WISHBONE_REWARD_REQUEST_IDS[
          id as keyof typeof WISHBONE_REWARD_REQUEST_IDS
        ],
      );
    if (earned.length) {
      this.services.notify(
        `${keepsakes.find((k) => k.id === earned[0])!.name} is yours! Find it in Decorate.`,
      );
      this.sound.chime();
    }
    this.save();
    this.refresh();
  }
  private switchYard(index: number, rebuild = false) {
    this.cancelAim();
    this.save();
    this.yard.dispose();
    const layout = this.levels[index];
    this.progress.selectedLevelId = layout.id;
    this.progress.yard = layout.legacyIndex ?? this.progress.yard;
    this.yard = new PowerYard(
      layout,
      rebuild || this.options.playtest
        ? null
        : this.progress.checkpoints[layout.id],
      this.progress.powers,
    );
    this.yard.index = index;
    this.camera.setWorld(this.yard.world, this.yard.origin);
    this.renderer.particles = [];
    this.renderer.labels = [];
    this.camera.home();
    this.cascade = 0;
    this.cascadeTime = 0;
    this.save();
    this.refresh();
  }
  setPaused(value: boolean) {
    if (this.empty) return;
    this.cancelAim();
    this.paused = value;
    this.activity.suspend();
    this.host.querySelector<HTMLElement>(".pause-cover")!.hidden = !value;
    this.button("pause").innerHTML = icon(value ? "play" : "pause");
    this.button("pause").setAttribute("aria-label", value ? "Resume" : "Pause");
    this.button("pause").title = value ? "Resume" : "Pause";
    if (value) {
      this.sound.suspend();
      this.save();
    } else this.sound.start();
    this.refresh();
  }
  setMuted(value: boolean) {
    if (this.empty) return;
    this.sound.muted = value;
    this.progress.muted = value;
    if (value) this.sound.suspend();
    else if (!this.paused) this.sound.start();
  }
  private dialogWasPaused = false;
  private dialog(kind: string) {
    this.dialogWasPaused = this.paused;
    this.setPaused(true);
    if (kind === "help")
      this.ui("dialog").innerHTML =
        `<span class="eyebrow">A LITTLE HELP</span><h2>One happy tumble at a time.</h2><p>Touch near Wishbone. Pull opposite the direction you want him to fly, then release. Aim low to tip the supports, or high to reach the top.</p><p>The lever, spring pad, and magnet switch respond to collisions. The horseshoe pulls or pushes metal blocks.</p><p>Drag away from the launcher to look around. Use a mouse wheel or pinch to zoom. On the Long Walk Home, pan to find distant structures and follow Wishbone across the lawn.</p><p>Wishbone reappears at his launcher after each toss. Recall brings him back sooner. Restack whenever you like. Make fourteen throws to earn a Patchwork dog bed for your clubhouse.</p>`;
    else {
      this.ui("dialog").innerHTML =
        '<span class="eyebrow">YOUR WISHBONE COLLECTION</span><h2>Little stories to keep.</h2><div class="collection-grid"></div>';
      const grid = this.ui("dialog").querySelector(".collection-grid")!;
      for (const k of keepsakes) {
        const owned = this.progress.owned.includes(k.id);
        // Historical power displays remain visible to owners, but are never
        // presented as a discovery path in the current game.
        if (k.metric === "power" && !owned) continue;
        const card = document.createElement("div");
        card.className = "keepsake " + (owned ? "owned" : "");
        const art = document.createElement("canvas");
        art.width = 192;
        art.height = 128;
        drawItem(art, k.id, owned);
        const title = document.createElement("b");
        title.textContent = k.name;
        const detail = document.createElement("small");
        detail.textContent = owned ? "Yours · in Decorate" : k.detail;
        card.append(art, title, detail);
        grid.append(card);
      }
    }
    this.host.querySelector("dialog")!.showModal();
  }
  private refresh() {
    const p = this.progress;
    const key = [
      this.yard.index,
      this.yard.rescued.size,
      this.yard.unstable.size,
      this.yard.mode,
      this.paused,
      p.throws,
      0,
      this.sound.muted,
    ].join();
    if (key !== this.statusKey) {
      this.statusKey = key;
      this.ui("milestone").textContent = this.options.playtest
        ? this.yard.unstable.size
          ? `Unstable layout: ${this.yard.unstable.size} toy(s) fell out before the first throw.`
          : "Editor test · no player progress is saved."
        : p.owned.includes("bed")
          ? `${p.throws} happy tumble${p.throws === 1 ? "" : "s"} · Your dog bed is in Decorate.`
          : `${p.throws} happy tumble${p.throws === 1 ? "" : "s"} · ${Math.max(0, 14 - p.throws)} more to your dog bed.`;
      this.ui("title").textContent = this.yard.layout.name;
      this.ui("rescued").textContent =
        `${this.yard.rescued.size} / ${this.yard.targetCount} toys freed`;
      this.ui("hint").textContent =
        this.yard.mode === "ready"
          ? "Pull back. Let him fly."
          : "Floppy paws. Big tumble.";
      for (let index = 0; index < this.levels.length; index++)
        this.button(`yard${index}`).setAttribute(
          "aria-pressed",
          String(this.yard.index === index),
        );
      this.button("recall").hidden = this.yard.mode === "ready";
      this.button("recall").disabled = this.paused;
      this.button("restack").disabled = this.paused;
      this.ui("coins").textContent = String(0);
      this.button("sound").innerHTML = icon(
        this.sound.muted ? "muted" : "sound",
      );
      this.button("sound").setAttribute(
        "aria-label",
        this.sound.muted ? "Sound off — turn on" : "Sound on — mute",
      );
      this.button("sound").title = this.sound.muted ? "Sound off" : "Sound on";
      this.button("sound").setAttribute(
        "aria-pressed",
        String(!this.sound.muted),
      );
    }
  }
  private frame = (timestamp: number) => {
    const dt = this.last ? Math.min((timestamp - this.last) / 1000, 0.06) : 0;
    this.last = timestamp;
    if (!this.paused && !document.hidden) {
      if (!this.input) this.yard.step(dt);
      this.sound.tick(dt);
      this.impactWait -= dt;
      this.cascadeTime -= dt;
      if (this.cascadeTime <= 0) this.cascade = 0;
      for (const event of this.yard.drainEvents()) {
        if (event.type === "mechanism") {
          this.renderer.label(event.text, event.x, event.y);
          this.sound.note(420, 0.2, 0.04, "triangle");
          this.save();
        }
        if (
          event.type === "impact" &&
          event.kind === "dog-block" &&
          this.impactWait <= 0
        ) {
          this.impactWait = 0.055;
          this.yard.squash = Math.min(1, event.speed / 10);
          this.sound.kshh(event.speed);
          if (!this.services.reducedMotion && event.speed > 5)
            this.renderer.shake = Math.min(3.5, event.speed * 0.18);
        }
        if (event.type === "rescue") {
          const p = this.progress;
          if (!p.rescued.includes(event.id)) p.rescued.push(event.id);
          this.cascade++;
          this.cascadeTime = 2.4;
          p.bestCascade = Math.max(p.bestCascade, this.cascade);
          this.renderer.burst(
            event.x,
            event.y,
            ["#e5af54", "#e18569", "#76b6a8", "#b3a0ce"][event.color],
            this.services.reducedMotion,
          );
          this.renderer.label(
            this.cascade > 1 ? `${this.cascade} in a tumble!` : "Squeak!",
            event.x,
            event.y - 25,
          );
          this.sound.note(620 + event.color * 80, 0.12, 0.06, "triangle");
          this.rewards();
        }
        if (event.type === "fetch")
          this.renderer.label("Good dog!", event.x, event.y - 80);
      }
      const active = this.activity.step(dt, false, this.yard.mode === "flight");
      if (!this.options.playtest) this.services.creditActivePlay(active);
      this.saveTime += dt;
      if (this.saveTime > 2) {
        this.saveTime = 0;
        this.save();
      }
    } else this.activity.step(dt, true, false);
    this.refresh();
    this.camera.update(
      dt,
      this.yard.mode,
      this.yard.dog.position,
      this.paused || document.hidden || this.pointers.size > 0,
      this.services.reducedMotion,
    );
    this.renderer.draw(
      this.yard,
      this.input,
      dt,
      this.services.reducedMotion,
      this.paused || document.hidden,
      this.camera,
    );
    this.raf = requestAnimationFrame(this.frame);
  };
  flushProgress() {
    this.save();
  }
  status() {
    return {
      empty: this.empty,
      diagnostics: this.empty ? runtimeDiagnostics : [],
      unstable: this.empty ? [] : [...this.yard.unstable],
      playtest: this.options.playtest === true,
      yard: this.empty ? null : this.yard.layout.id,
      ready: !this.empty && this.yard.mode === "ready",
      paused: this.paused,
      throws: this.progress.throws,
      rescued: this.empty ? 0 : this.yard.rescued.size,
      powers: this.progress.powers,
      aiming: !!this.input,
      camera: { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom },
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.save();
    if (this.empty) {
      this.abort.abort();
      this.host.replaceChildren();
      return;
    }
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.observer.disconnect();
    this.cancelAim();
    this.yard.dispose();
    this.sound.dispose();
    this.host.replaceChildren();
  }
}
