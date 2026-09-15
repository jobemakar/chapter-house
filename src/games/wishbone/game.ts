import type { GameSession } from "../../core/game-session";
import { ProfileRepository, ActivityClock } from "../../core/profile";
import { PowerYard, definitions } from "./powers";
import { yards } from "./levels";
import { aim, TUNE } from "./yard";
import { WishboneRenderer, drawItem } from "./renderer";
import { WishboneProgression, keepsakes } from "./progression";
import { GameAudio } from "./audio";
import type { AimInput } from "./types";

export type WishboneShellCallbacks = {
  toggleSound: () => void;
  fullscreen: () => void;
};

/** A disposable game session. Durable state belongs to the shared profile. */
export class WishboneGame implements GameSession {
  private yard: PowerYard;
  private renderer: WishboneRenderer;
  private sound: GameAudio;
  private canvas: HTMLCanvasElement;
  private input: AimInput | null = null;
  private paused = false;
  private abort = new AbortController();
  private observer: ResizeObserver;
  private raf = 0;
  private disposed = false;
  private last = 0;
  private saveTime = 0;
  private cascade = 0;
  private cascadeTime = 0;
  private impactWait = 0;
  private powersOpen = false;
  private activity: ActivityClock;
  private powerKey = "";
  private statusKey = "";
  constructor(
    private host: HTMLElement,
    private profile: ProfileRepository,
    private leave: () => void,
    private notify: (text: string) => void,
    private shell?: WishboneShellCallbacks,
  ) {
    const progress = profile.state.wishbone;
    this.activity = new ActivityClock(profile.state.activeSeconds);
    this.yard = new PowerYard(
      progress.yard,
      progress.checkpoints[yards[progress.yard].id],
      progress.powers,
    );
    host.innerHTML = `<section class="wishbone-game game-page">
<div class="yard-wrap">
<canvas aria-label="Wishbone physics yard. Pull left and down from Wishbone, then release." tabindex="0">
</canvas>
<header class="wishbone-hud">
<button data-action="leave" class="hud-back">← Clubhouse</button>
<div class="hud-title"><span class="eyebrow">WISHBONE FLING</span><b data-ui="title"></b><small data-ui="rescued"></small></div>
<div class="game-wallet" aria-label="Your coins"><span aria-hidden="true">●</span><b data-ui="coins">0</b></div>
<div class="hud-actions">
<button data-action="sound" aria-label="Toggle sound">Sound</button>
<button data-action="fullscreen" aria-label="Fullscreen">Full screen</button>
<button data-action="help" aria-label="Game instructions">Help</button>
<button data-action="pause">Pause</button>
</div>
</header>
<button data-action="levels" class="levels-toggle" aria-expanded="false">Levels</button>
<nav class="yard-switcher" data-ui="yard-list" aria-label="Choose a Wishbone yard" hidden>${[...yards.slice(2), ...yards.slice(0, 2)]
      .map(
        (yard, index) =>
          `<button data-action="yard${yards.indexOf(yard)}" aria-pressed="false"><span>${yards.indexOf(yard) < 2 ? "Classic" : `Yard ${yards.indexOf(yard) - 1}`}</span>${yard.name}</button>`,
      )
      .join("")}</nav>
<div class="pause-cover" hidden>
<h2>A little breather</h2>
<button data-action="resume" class="primary">Keep playing</button>
</div>
<button data-action="gust" class="stage-gust" hidden>Gust ↑</button>
<div class="stage-tools">
<button data-action="restack" class="stage-tool" aria-label="Restack this yard"><span aria-hidden="true">↺</span>Restack</button>
<button data-action="collection" class="stage-tool" aria-label="Open keepsakes"><span aria-hidden="true">♥</span>Keepsakes</button>
</div>
<button data-action="recall" class="stage-recall" hidden>Recall</button>
<div class="game-status" role="status"><b data-ui="hint">Pull back. Let him fly.</b><small data-ui="milestone">Unlimited tumbles. Everything you earn stays yours.</small></div>
<section class="power-tray-wrap">
<button data-action="powers" class="power-toggle" aria-expanded="false">Pocket powers <span data-ui="power-count"></span></button>
<div class="power-shelf" data-ui="power-tray" hidden>
<div class="power-buttons">${definitions
      .map(
        (p) => `<button data-action="${p.id}" title="${p.detail}">
</button>`,
      )
      .join("")}<label>
<input type="checkbox" data-ui="auto"> Auto gust</label>
</div>
<small data-ui="power-hint">
</small>
</div>
</section>
</div>
<dialog class="game-dialog">
<button class="dialog-close" data-action="close-dialog" aria-label="Close">×</button>
<div data-ui="dialog">
</div>
</dialog>
</section>`;
    this.canvas = host.querySelector("canvas")!;
    this.renderer = new WishboneRenderer(this.canvas);
    this.sound = new GameAudio("summer", profile.state.muted);
    host.addEventListener("click", this.click, { signal: this.abort.signal });
    host.querySelector<HTMLInputElement>('[data-ui="auto"]')!.addEventListener(
      "change",
      (e) => {
        progress.powers.autoGust = (e.target as HTMLInputElement).checked;
        this.save();
      },
      { signal: this.abort.signal },
    );
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
      () => {
        this.input = null;
      },
      { signal: this.abort.signal },
    );
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
      this.leave();
      return;
    }
    if (action === "sound") {
      this.shell?.toggleSound();
      this.setMuted(this.profile.state.muted);
      this.refresh();
      return;
    }
    if (action === "fullscreen") {
      this.shell?.fullscreen();
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
    if (action === "powers") {
      this.powersOpen = !this.powersOpen;
      this.ui("power-tray").hidden = !this.powersOpen;
      this.button("powers").setAttribute("aria-expanded", String(this.powersOpen));
      return;
    }
    if (action === "levels") {
      const list = this.ui("yard-list");
      list.hidden = !list.hidden;
      this.button("levels").setAttribute("aria-expanded", String(!list.hidden));
      return;
    }
    if (this.paused) return;
    this.activity.interact();
    this.sound.start();
    const yardMatch = /^yard(\d+)$/.exec(action);
    if (yardMatch) {
      const index = Number(yardMatch[1]);
      if (!Number.isInteger(index) || index < 0 || index >= yards.length) return;
      if (index !== this.yard.index) this.switchYard(index);
      this.ui("yard-list").hidden = true;
      this.button("levels").setAttribute("aria-expanded", "false");
    }
    if (action === "restack") this.switchYard(this.yard.index, true);
    if (action === "recall") {
      this.cancelAim();
      this.yard.recall();
    }
    if (action === "gust") {
      this.yard.gust();
      this.save();
    }
    if (action === "bounce" || action === "magnet" || action === "wind")
      this.yard.arm(action);
    this.refresh();
  };
  private point(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * TUNE.width) / rect.width,
      y: ((event.clientY - rect.top) * TUNE.height) / rect.height,
    };
  }
  private down = (event: PointerEvent) => {
    if (
      event.button !== 0 ||
      this.input ||
      this.paused ||
      this.yard.cooldown > 0
    )
      return;
    const p = this.point(event);
    if (p.x > 350 || p.y < 270) return;
    event.preventDefault();
    this.sound.start();
    this.activity.interact();
    this.canvas.setPointerCapture(event.pointerId);
    this.input = { id: event.pointerId, start: p, velocity: aim(0, 0) };
  };
  private move = (event: PointerEvent) => {
    if (this.input?.id !== event.pointerId) return;
    const p = this.point(event);
    this.input.velocity = aim(
      this.input.start.x - p.x,
      p.y - this.input.start.y,
    );
    this.activity.interact();
  };
  private up = (event: PointerEvent) => {
    if (this.input?.id !== event.pointerId) return;
    const v = this.input.velocity;
    this.cancelAim();
    if (v.power < 0.06) return;
    if (this.yard.throwToy(v)) {
      this.activity.interact();
      this.profile.state.wishbone.throws++;
      this.cascade = 0;
      this.cascadeTime = 0;
      this.sound.note(180, 0.18, 0.08, "triangle");
      this.rewards();
    }
  };
  private cancelAim() {
    const old = this.input;
    this.input = null;
    if (old && this.canvas.hasPointerCapture(old.id))
      this.canvas.releasePointerCapture(old.id);
  }
  private save() {
    this.profile.state.wishbone.checkpoints[this.yard.layout.id] =
      this.yard.checkpoint();
    this.profile.creditActivity(this.activity.total);
    this.profile.save();
  }
  private rewards() {
    const earned = WishboneProgression.award(this.profile.state.wishbone);
    this.profile.syncKeepsakes(false);
    if (earned.length) {
      this.notify(
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
    this.profile.state.wishbone.yard = index;
    this.yard = new PowerYard(
      index,
      rebuild ? null : this.profile.state.wishbone.checkpoints[yards[index].id],
      this.profile.state.wishbone.powers,
    );
    this.renderer.particles = [];
    this.renderer.labels = [];
    this.cascade = 0;
    this.cascadeTime = 0;
    this.save();
    this.refresh();
  }
  setPaused(value: boolean) {
    this.cancelAim();
    this.paused = value;
    this.activity.suspend();
    this.host.querySelector<HTMLElement>(".pause-cover")!.hidden = !value;
    this.button("pause").textContent = value ? "Resume" : "Pause";
    if (value) {
      this.sound.suspend();
      this.save();
    } else this.sound.start();
    this.refresh();
  }
  setMuted(value: boolean) {
    this.sound.muted = value;
    this.powerKey = "";
    if (value) this.sound.suspend();
    else if (!this.paused) this.sound.start();
  }
  private dialogWasPaused = false;
  private dialog(kind: string) {
    this.dialogWasPaused = this.paused;
    this.setPaused(true);
    if (kind === "help")
      this.ui("dialog").innerHTML =
        `<span class="eyebrow">A LITTLE HELP</span><h2>One happy tumble at a time.</h2><p>Touch the left side of the yard, near Wishbone. Pull left and down, then release. Aim low to tip the supports, or high to reach the top.</p><p>Hit floating powerups to keep them. Choose one before a throw; the pinwheel gives you a Gust button during flight. The lever, bellows, and magnet switch respond to collisions.</p><p>Wishbone comes back automatically after each toss. Recall brings him back sooner. Restack whenever you like. Make fourteen throws to earn a Patchwork dog bed for your clubhouse.</p>`;
    else {
      this.ui("dialog").innerHTML =
        '<span class="eyebrow">YOUR WISHBONE COLLECTION</span><h2>Little stories to keep.</h2><div class="collection-grid"></div>';
      const grid = this.ui("dialog").querySelector(".collection-grid")!;
      for (const k of keepsakes) {
        const owned = this.profile.state.wishbone.owned.includes(k.id);
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
    const p = this.profile.state.wishbone;
    const key = [
      this.yard.index,
      this.yard.rescued.size,
      this.yard.mode,
      this.paused,
      p.throws,
      this.profile.state.currency,
    ].join();
    if (key !== this.statusKey) {
      this.statusKey = key;
      this.ui("milestone").textContent = p.owned.includes("bed")
        ? `${p.throws} happy tumble${p.throws === 1 ? "" : "s"} · Your dog bed is in Decorate.`
        : `${p.throws} happy tumble${p.throws === 1 ? "" : "s"} · ${Math.max(0, 14 - p.throws)} more to your dog bed.`;
      this.ui("title").textContent = this.yard.layout.name;
      this.ui("rescued").textContent =
        `${this.yard.rescued.size} / ${this.yard.targetCount} toys freed`;
      this.ui("hint").textContent =
        this.yard.mode === "ready"
          ? "Pull back. Let him fly."
          : "Floppy paws. Big tumble.";
      for (let index = 0; index < yards.length; index++)
        this.button(`yard${index}`).setAttribute(
          "aria-pressed",
          String(this.yard.index === index),
        );
      this.button("recall").hidden = this.yard.mode === "ready";
      this.button("recall").disabled = this.paused;
      this.button("restack").disabled = this.paused;
      this.ui("coins").textContent = String(this.profile.state.currency);
    }
    const powerKey = JSON.stringify([
      p.powers,
      this.yard.armed,
      this.yard.active,
      this.yard.mode,
      this.paused,
    ]);
    if (powerKey === this.powerKey) return;
    this.powerKey = powerKey;
    for (const d of definitions) {
      const b = this.button(d.id);
      b.textContent = `${d.icon} ${d.name} · ${p.powers.counts[d.id]}`;
      b.disabled =
        this.paused || this.yard.mode !== "ready" || p.powers.counts[d.id] < 1;
      b.setAttribute("aria-pressed", String(this.yard.armed === d.id));
    }
    this.button("sound").textContent = this.profile.state.muted
      ? "Sound off"
      : "Sound on";
    this.button("sound").setAttribute(
      "aria-pressed",
      String(!this.profile.state.muted),
    );
    this.ui("power-count").textContent = String(
      definitions.reduce((total, d) => total + p.powers.counts[d.id], 0),
    );
    this.button("gust").hidden =
      this.paused || this.yard.mode !== "flight" || this.yard.active !== "wind";
    this.ui<HTMLInputElement>("auto").checked = p.powers.autoGust;
    const selected = definitions.find(
      (d) => d.id === (this.yard.armed || this.yard.active),
    );
    this.ui("power-hint").textContent =
      selected?.detail ??
      "Hit a floating pickup or clear a yard. Save powerups for any yard.";
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
        if (event.type === "pickup" || event.type === "clear-power") {
          const p = definitions.find((p) => p.id === event.id)!;
          this.renderer.burst(
            event.x,
            event.y,
            p.color,
            this.profile.state.reduced,
          );
          this.renderer.label("+1 " + p.name, event.x, event.y - 30);
          this.rewards();
        }
        if (event.type === "mechanism" || event.type === "power-used") {
          this.renderer.label(event.text, event.x, event.y);
          this.sound.note(420, 0.2, 0.04, "triangle");
          this.save();
        }
        if (event.type === "impact" && this.impactWait <= 0) {
          this.impactWait = 0.055;
          this.yard.squash = Math.min(1, event.speed / 10);
          this.sound.note(
            event.kind === "bucket" ? 430 : 90,
            0.1,
            Math.min(0.07, event.speed * 0.004),
            "sine",
          );
          if (!this.profile.state.reduced && event.speed > 5)
            this.renderer.shake = Math.min(3.5, event.speed * 0.18);
        }
        if (event.type === "rescue") {
          const p = this.profile.state.wishbone;
          if (!p.rescued.includes(event.id)) p.rescued.push(event.id);
          this.cascade++;
          this.cascadeTime = 2.4;
          p.bestCascade = Math.max(p.bestCascade, this.cascade);
          this.renderer.burst(
            event.x,
            event.y,
            ["#e5af54", "#e18569", "#76b6a8", "#b3a0ce"][event.color],
            this.profile.state.reduced,
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
      this.profile.creditActivity(
        this.activity.step(dt, false, this.yard.mode === "flight"),
      );
      this.saveTime += dt;
      if (this.saveTime > 2) {
        this.saveTime = 0;
        this.save();
      }
    } else this.activity.step(dt, true, false);
    this.refresh();
    this.renderer.draw(
      this.yard,
      this.input,
      dt,
      this.profile.state.reduced,
      this.paused || document.hidden,
    );
    this.raf = requestAnimationFrame(this.frame);
  };
  flushProgress() {
    this.save();
  }
  status() {
    return {
      yard: this.yard.layout.id,
      ready: this.yard.mode === "ready",
      paused: this.paused,
      throws: this.profile.state.wishbone.throws,
      rescued: this.yard.rescued.size,
      powers: this.profile.state.wishbone.powers,
      aiming: !!this.input,
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.save();
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.observer.disconnect();
    this.cancelAim();
    this.yard.dispose();
    this.sound.dispose();
    this.host.replaceChildren();
  }
}
