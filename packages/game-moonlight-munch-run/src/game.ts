import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { NightAudio } from "./audio";
import { ActivePlayMeter } from "./activity";
import { PointerCoordinator } from "./input";
import { KEEPSAKES, RunModel, type Save } from "./model";
import { MOONLIGHT_REWARD_REQUEST_IDS, progressToSave, rewardIdsForFeeds, loadMoonlightMunchRunProgress, type MoonlightMunchRunProgress } from "./progress";
import { NightRenderer } from "./renderer";

const markup = `<section class="moonlight-munch-run" aria-label="Moonlight Munch Run">
<header><h1>MOONLIGHT MUNCH RUN<small>THE NIGHT MARKET NEEDS A SNACK HERO</small></h1><button data-action="help" aria-label="Open instructions">?</button><button data-action="mute" aria-label="Mute sound">🔊</button><button data-action="pause" aria-label="Pause game">▶</button><button data-action="full" aria-label="Toggle fullscreen">⛶</button></header>
<section class="hud" aria-label="Run status"><div class="chip supplies"><b data-ui="supplies">100 / 100</b><span>supplies</span></div><div class="chip"><b data-ui="stage">STAGE 1</b><span data-ui="wave">WAVE 1 / 3</span></div><div class="chip"><b data-ui="weapon">STRAIGHT</b><span data-ui="rapid">RAPID ×0</span></div><div class="chip"><b data-ui="feeds">0 feeds</b><span>kindness score</span></div><div class="chip boss"><b data-ui="boss">NO BOSS SIGNAL</b><span>moon guardian</span></div><button data-action="burst" class="burst"><strong>✦ SPECIAL SERVE</strong><span data-ui="burst">CHARGING 0%</span></button></section>
<main><canvas tabindex="0" aria-label="Moonlit road. Steer with pointer or WASD; special serve with Space or F."></canvas>
<div class="overlay start show"><section class="card"><h2>Ready the snack truck?</h2><p>Three waves of hungry night guests are rolling in. Guide the truck, let the kitchen fire forward, and serve a special burst when the star meter is full.</p><button data-action="start" class="primary">START RUN</button><p><small>Landscape is roomiest · portrait uses a letterbox</small></p></section></div>
<div class="overlay paused"><section class="card"><h2>Run paused</h2><p>Your stage, supplies, and wave are waiting exactly where you left them.</p><button data-action="resume" class="primary">RESUME RUN</button></section></div>
<div class="overlay restock"><section class="card"><h2>Kitchen restock</h2><p data-ui="restock">The pantry is empty. Take a free restock and continue this wave with your run progress safe.</p><button data-action="restock" class="primary">RESTOCK &amp; CONTINUE</button></section></div>
<div class="overlay help"><section class="card"><button data-action="close-help" class="close" aria-label="Close instructions">×</button><h2>Feed the moonlit road</h2><p><strong>Steer:</strong> drag on the left half with a thumb, or move the mouse anywhere over the road. WASD and arrows steer in two dimensions.</p><p><strong>Kitchen:</strong> snacks fire automatically. Catch baskets to switch and strengthen shots; rapid fire stacks separately. Special Serve, Space, F, or a tap on the right half triggers the rechargeable burst.</p><p><strong>Supplies:</strong> bumps, escapes, and moon shots spend supplies. Restock is free and saves your upgrades, stage, and boss hunger.</p><p data-ui="keepsakes"></p><p><strong>Road hazards:</strong> guests drop potholes and sticky pods. Food cannot remove them; touching one jams all firing for one second.</p><label><input data-ui="motion" type="checkbox" /> Reduce sprite animation and effects</label></section></div></main><footer>GUIDE · SERVE · KEEP THE NIGHT KIND</footer></section>`;

/** The same canvas simulation powers standalone and integrated sessions. */
export class MoonlightMunchRunGame implements GameSession {
  private readonly abort = new AbortController();
  private readonly root: HTMLElement;
  private readonly shell: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: NightRenderer;
  private readonly audio = new NightAudio();
  private readonly input = new PointerCoordinator();
  private readonly activity: ActivePlayMeter;
  private readonly captured = new Set<number>();
  private readonly resizeObserver: ResizeObserver;
  private model: RunModel;
  private progress: MoonlightMunchRunProgress;
  private started = false;
  private paused = false;
  private help = false;
  private pausedBeforeHelp = false;
  private muted: boolean;
  private reducedMotion: boolean;
  private last = performance.now();
  private lastSaveClock = 0;
  private lastPhase = "";
  private raf = 0;
  private disposed = false;

  constructor(root: HTMLElement, private readonly services: GameHostServices<MoonlightMunchRunProgress>) {
    this.root = root;
    root.replaceChildren(); root.innerHTML = markup;
    this.shell = root.querySelector<HTMLElement>(".moonlight-munch-run")!;
    this.canvas = root.querySelector("canvas")!;
    this.progress = loadMoonlightMunchRunProgress(services.progress);
    this.muted = services.muted || this.progress.muted;
    this.reducedMotion = services.reducedMotion || this.progress.reducedMotion;
    this.model = new RunModel(7, progressToSave(this.progress));
    this.lastPhase = this.model.phase;
    this.activity = new ActivePlayMeter(services.activePlaySeconds);
    this.renderer = new NightRenderer(this.canvas);
    this.resizeObserver = new ResizeObserver(() => this.renderer.resize());
    this.resizeObserver.observe(this.canvas);
    this.bind(); this.renderer.resize(); this.refresh();
    this.raf = requestAnimationFrame(this.frame);
  }
  private ui<T extends HTMLElement = HTMLElement>(name: string): T { return this.root.querySelector(`[data-ui="${name}"]`)!; }
  private action(name: string): HTMLButtonElement { return this.root.querySelector(`[data-action="${name}"]`)!; }
  private get restocking(): boolean { return this.model.phase === "restock"; }
  private get active(): boolean { return this.started && !this.paused && !this.help && !document.hidden && !this.restocking && !this.disposed; }
  private setAudio(): void { try { this.audio.setEnabled(this.active && !this.muted); } catch {} }
  private async unlockAudio(): Promise<void> { try { await this.audio.unlock(); } catch {} }
  private sound(name: "toss" | "feed" | "bump" | "ambience", ...values: number[]): void {
    try {
      if (name === "ambience") this.audio.ambience(values[0] ?? 0);
      else this.audio[name]();
    } catch {}
  }
  private point(event: PointerEvent) { const r = this.canvas.getBoundingClientRect(); return { x: r.width ? (event.clientX - r.left) / r.width : .16, y: r.height ? (event.clientY - r.top) / r.height : .52 }; }
  private clearInput(): void { this.input.clear(); for (const id of this.captured) try { if (this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id); } catch {} this.captured.clear(); }
  private bind(): void {
    const signal = this.abort.signal;
    this.root.addEventListener("click", this.click, { signal });
    this.canvas.addEventListener("contextmenu", e => e.preventDefault(), { signal });
    this.canvas.addEventListener("pointerdown", e => { if (!this.active) return; e.preventDefault(); this.activity.interact(); void this.unlockAudio(); const p = this.point(e); const burst = this.input.down(e.pointerId, e.pointerType, p.x, p.y); try { this.canvas.setPointerCapture(e.pointerId); this.captured.add(e.pointerId); } catch {} if (burst) this.requestBurst(); this.refresh(); }, { signal });
    this.canvas.addEventListener("pointermove", e => { if (this.active) { const p = this.point(e); this.input.move(e.pointerId, e.pointerType, p.x, p.y); this.activity.interact(); } }, { signal });
    const up = (e: PointerEvent) => { this.input.up(e.pointerId, e.pointerType); this.captured.delete(e.pointerId); try { if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId); } catch {} };
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) this.canvas.addEventListener(name, up as EventListener, { signal });
    window.addEventListener("blur", () => this.setPaused(true), { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.setPaused(true); }, { signal });
    window.addEventListener("pagehide", () => this.flushProgress(), { signal });
    window.addEventListener("keydown", e => this.keydown(e), { signal });
    window.addEventListener("keyup", e => this.input.keys.delete(e.key.toLowerCase()), { signal });
  }
  private click = (event: Event) => {
    const name = (event.target as Element).closest<HTMLElement>("[data-action]")?.dataset.action;
    if (!name) return;
    if (name === "start") this.start(); else if (name === "pause") this.started ? this.setPaused(!this.paused) : this.start(); else if (name === "resume") this.setPaused(false); else if (name === "restock" && this.restocking && !this.help) { this.model.restock(); this.activity.interact(); this.persist(); this.setAudio(); } else if (name === "burst") this.requestBurst(); else if (name === "help") { this.pausedBeforeHelp = this.paused; this.help = true; this.setPaused(true); } else if (name === "close-help") { this.help = false; this.setPaused(this.pausedBeforeHelp); } else if (name === "mute") this.setMuted(!this.muted); else if (name === "full") void this.fullscreen();
    this.refresh();
  };
  private keydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === "escape") { if (this.help) { this.help = false; this.setPaused(this.pausedBeforeHelp); } else if (this.started) this.setPaused(!this.paused); return; }
    if (event.target instanceof HTMLElement && ["BUTTON", "INPUT"].includes(event.target.tagName)) return;
    if (key === "enter" && !this.started && !this.help) { event.preventDefault(); this.start(); return; }
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key) && this.active) { event.preventDefault(); this.input.keys.add(key); this.activity.interact(); }
    if ((key === " " || key === "f") && this.active) { event.preventDefault(); const held = this.input.keys.has(key); this.input.keys.add(key); this.activity.interact(); if (!held) this.requestBurst(); }
  }
  private start(): void { if (this.help) return; this.started = true; this.paused = false; this.activity.interact(); this.last = performance.now(); void this.unlockAudio(); this.setAudio(); this.canvas.focus(); this.refresh(); }
  private requestBurst(): void { if (!this.active) return; this.activity.interact(); void this.unlockAudio(); if (this.model.burst()) this.sound("toss"); this.refresh(); }
  private async fullscreen(): Promise<void> { try { if (document.fullscreenElement) await document.exitFullscreen(); else await this.shell.requestFullscreen?.(); } catch {} this.renderer.resize(); }
  setPaused(value: boolean): void { if (this.disposed) return; this.paused = value; this.clearInput(); if (value) { this.activity.suspend(); this.persist(); } this.setAudio(); this.refresh(); }
  setMuted(value: boolean): void { this.muted = value; this.progress.muted = value; if (!value) void this.unlockAudio(); this.setAudio(); this.persist(); this.refresh(); }
  private syncRewards(): void { for (const id of rewardIdsForFeeds(this.model.fed)) if (!this.progress.ownedRewardIds.includes(id)) { this.services.awardReward(id); this.progress.ownedRewardIds.push(id); const legacy = Object.entries(MOONLIGHT_REWARD_REQUEST_IDS).find(([, request]) => request === id)?.[0]; if (legacy) this.services.notify(`${KEEPSAKES.find(k => k.id === legacy)?.name ?? "Keepsake"} is yours! Find it in Decorate.`); } }
  private persist(): void {
    const saved: Save = this.model.saveState({ muted: this.muted, reducedMotion: this.reducedMotion });
    this.progress = { ...this.progress, ...saved, version: 1, ownedRewardIds: this.progress.ownedRewardIds };
    this.services.creditActivePlay(this.activity.value); this.services.saveProgress(this.progress); this.lastSaveClock = this.model.clock;
  }
  private refresh(): void {
    const m = this.model; this.ui("supplies").textContent = `${Math.max(0, m.supplies)} / 100`; this.ui("stage").textContent = `STAGE ${m.stage}`; this.ui("wave").textContent = m.phase === "boss" || (this.restocking && m.bossHp > 0) ? "BOSS ENCOUNTER" : `WAVE ${m.wave} / 3`; this.ui("weapon").textContent = m.fireLock > 0 ? "KITCHEN JAMMED" : m.activeWeapon.toUpperCase(); this.ui("rapid").textContent = m.fireLock > 0 ? `FIRE RETURNS IN ${m.fireLock.toFixed(1)}s` : `RAPID ×${m.rapidLevel}`; this.ui("feeds").textContent = `${m.fed} feeds`; this.ui("boss").textContent = m.phase === "boss" || (this.restocking && m.bossHp > 0) ? `BOSS HUNGER ${m.bossHp}` : "NO BOSS SIGNAL"; this.ui("burst").textContent = m.fireLock > 0 ? `JAMMED ${m.fireLock.toFixed(1)}s` : m.burstCharge >= 1 ? "SPECIAL READY" : `CHARGING ${Math.round(m.burstCharge * 100)}%`; this.action("burst").disabled = !this.active || m.fireLock > 0 || m.burstCharge < 1; this.action("mute").textContent = this.muted ? "🔇" : "🔊"; this.action("pause").textContent = this.started && !this.paused ? "Ⅱ" : "▶"; this.root.querySelector(".start")!.classList.toggle("show", !this.started); this.root.querySelector(".paused")!.classList.toggle("show", this.started && this.paused && !this.help && !this.restocking); this.root.querySelector(".restock")!.classList.toggle("show", this.started && this.restocking && !this.help); this.root.querySelector(".help")!.classList.toggle("show", this.help); this.ui<HTMLInputElement>("motion").checked = this.reducedMotion; this.ui("motion").onchange = e => { this.reducedMotion = (e.target as HTMLInputElement).checked; this.progress.reducedMotion = this.reducedMotion; this.persist(); }; this.ui("keepsakes").textContent = KEEPSAKES.map(item => `${this.progress.ownedRewardIds.includes(MOONLIGHT_REWARD_REQUEST_IDS[item.id]) ? "✓" : "◇"} ${item.name} · ${item.feeds}`).join("  •  "); this.ui("restock").textContent = m.bossHp > 0 ? "The pantry is empty. Take a free restock and continue the boss encounter with its hunger and your run progress safe." : "The pantry is empty. Take a free restock and continue this wave with your run progress safe.";
  }
  private frame = (time: number): void => { const dt = Math.min(.05, Math.max(0, (time - this.last) / 1000)); this.last = time; if (this.active) { const target = this.input.target(this.model.truckX, this.model.truckY, dt); this.model.steer2d(target.x, target.y, dt); const fed = this.model.fed, wobble = this.model.wobble, shots = this.model.shots.length; this.model.tick(dt); if (this.model.shots.length > shots) this.sound("toss"); if (this.model.fed > fed) { this.sound("feed"); this.syncRewards(); this.persist(); } if (!wobble && this.model.wobble > 0) this.sound("bump"); if (this.model.phase !== this.lastPhase) { this.lastPhase = this.model.phase; this.persist(); } this.services.creditActivePlay(this.activity.step(dt, false)); if (this.model.clock - this.lastSaveClock > 4) this.persist(); } else this.activity.step(dt, true); this.refresh(); this.renderer.draw(this.model, this.reducedMotion); this.raf = requestAnimationFrame(this.frame); };
  flushProgress(): void { this.syncRewards(); this.persist(); }
  status() { return { phase: this.model.phase, stage: this.model.stage, wave: this.model.wave, fed: this.model.fed, supplies: this.model.supplies, paused: this.paused, hazardCount: this.model.hazards.length, activePlaySeconds: this.activity.value }; }
  dispose(): void { if (this.disposed) return; this.flushProgress(); this.disposed = true; cancelAnimationFrame(this.raf); this.abort.abort(); this.resizeObserver.disconnect(); this.clearInput(); this.audio.dispose(); this.root.replaceChildren(); }
}
