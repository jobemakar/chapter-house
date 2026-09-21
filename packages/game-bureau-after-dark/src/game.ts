import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import { LEVELS, Navigator, type Level, type Point, type SearchSpot, type Sigil } from "./domain";
import { BUREAU_REWARD_REQUEST_IDS, loadBureauAfterDarkProgress, type BureauAfterDarkProgress } from "./progress";
import { RewardCards } from "./reward-cards";
import { BureauWorldArt } from "./world-art";
import moonUrl from "./assets/moon.png";
import featherUrl from "./assets/feather.png";
import keyUrl from "./assets/key.png";
import starUrl from "./assets/star.png";
import shellUrl from "./assets/shell.png";
import flameUrl from "./assets/flame.png";

const sigilImages: Record<string, string> = { moon: moonUrl, feather: featherUrl, key: keyUrl, star: starUrl, shell: shellUrl, flame: flameUrl };

const req = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Bureau After Dark missing ${selector}`);
  return element;
};

class BureauAudio {
  private context?: AudioContext;
  constructor(private muted: boolean) {}
  setMuted(value: boolean): void { this.muted = value; if (value) void this.context?.suspend().catch(() => undefined); }
  unlock(): void { if (this.muted) return; try { this.context ??= new AudioContext(); void this.context.resume().catch(() => undefined); } catch { /* Audio is optional. */ } }
  chime(reward = false): void {
    if (this.muted || document.hidden) return;
    this.unlock(); const context = this.context; if (!context) return;
    const time = context.currentTime;
    [0, reward ? 7 : 4, reward ? 12 : 7].forEach((step, index) => {
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "sine"; oscillator.frequency.value = 440 * Math.pow(2, step / 12);
      gain.gain.setValueAtTime(0.0001, time + index * 0.11); gain.gain.exponentialRampToValueAtTime(0.09, time + index * 0.11 + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, time + index * 0.11 + 0.42);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(time + index * 0.11); oscillator.stop(time + index * 0.11 + 0.44);
    });
  }
  dispose(): void { void this.context?.close().catch(() => undefined); this.context = undefined; }
}

/** Host-owned persistence wrapper; it deliberately never touches the legacy local-storage key. */
class BureauProgression {
  readonly state: BureauAfterDarkProgress;
  constructor(initial: unknown, private readonly save: (value: BureauAfterDarkProgress) => void) { this.state = loadBureauAfterDarkProgress(initial); }
  found(level: number): string[] { return [...this.state.found[level === 1 ? "1" : "0"]]; }
  completed(level: number): boolean { return this.state.rewards.includes(LEVELS[level]?.reward.id ?? ""); }
  unlocked(level: number): boolean { return level === 0 || this.completed(0); }
  discover(level: number, sigil: string): boolean {
    const key = level === 1 ? "1" : "0"; if (!this.unlocked(level) || !LEVELS[level].order.includes(sigil) || this.state.found[key].includes(sigil)) return false;
    this.state.found[key].push(sigil); this.persist(); return true;
  }
  claim(level: number, sequence: string[]): boolean {
    const record = LEVELS[level]; if (!record || this.completed(level) || this.found(level).length !== record.sigils.length || sequence.join("|") !== record.order.join("|")) return false;
    this.state.rewards.push(record.reward.id); this.persist(); return true;
  }
  select(level: number): void { this.state.selectedLevel = level === 1 && this.unlocked(1) ? 1 : 0; this.persist(); }
  markOwned(id: string): void { if (!this.state.ownedRewardIds.includes(id)) { this.state.ownedRewardIds.push(id); this.persist(); } }
  persist(): void { this.save(loadBureauAfterDarkProgress(this.state)); }
}

class BureauPainter {
  private readonly context: CanvasRenderingContext2D;
  private readonly art: BureauWorldArt;
  constructor(private readonly canvas: HTMLCanvasElement, root: HTMLElement) { this.context = canvas.getContext("2d")!; this.art = new BureauWorldArt(root); }
  draw(level: Level, player: Point, route: Point[], time: number): void {
    const c = this.context; c.clearRect(0, 0, 960, 680);
    const gradient = c.createLinearGradient(0, 0, 960, 680); gradient.addColorStop(0, "#192941"); gradient.addColorStop(1, "#0e192a"); c.fillStyle = gradient; c.fillRect(0, 0, 960, 680); this.art.drawFloor(c);
    c.strokeStyle = "#cfb77740"; c.strokeRect(35, 60, 890, 590);
    level.walls.forEach((wall) => { c.fillStyle = "#03091366"; c.fillRect(wall.x + 7, wall.y + 9, wall.w, wall.h); if (!this.art.draw(c, "bookshelf", wall.x, wall.y - 8, wall.w, wall.h + 16)) { c.fillStyle = "#293c50"; c.fillRect(wall.x, wall.y, wall.w, wall.h); } });
    if (route.length) { c.setLineDash([3, 9]); c.strokeStyle = "#b3e2d144"; c.beginPath(); c.moveTo(player.x, player.y); route.forEach((point) => c.lineTo(point.x, point.y)); c.stroke(); c.setLineDash([]); }
    for (let index = 0; index < 13; index++) { const x = 70 + (index * 137) % 815; const y = 100 + (index * 83) % 470; c.fillStyle = `rgba(211,205,166,${.1 + .1 * Math.sin(time * .001 + index)})`; c.beginPath(); c.arc(x, y + Math.sin(time * .002 + index) * 5, 1.3, 0, Math.PI * 2); c.fill(); }
    c.save(); c.translate(player.x, player.y); c.fillStyle = "#0008"; c.beginPath(); c.ellipse(0, 12, 15, 6, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#9fd9cb"; c.beginPath(); c.arc(0, 0, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = "#284748"; c.beginPath(); c.arc(0, -4, 5, 0, Math.PI * 2); c.fill(); c.fillRect(-5, 3, 10, 6); c.restore();
  }
  sprite(id: string): string { return BureauWorldArt.sprite(id); }
}

/** One canonical two-floor game runtime, usable by both standalone and integrated hosts. */
export class BureauAfterDarkGame implements GameSession {
  private readonly root: HTMLElement; private readonly canvas: HTMLCanvasElement; private readonly painter: BureauPainter; private readonly controller = new AbortController();
  private readonly progress: BureauProgression; private readonly audio: BureauAudio; private levelId: 0 | 1; private navigator: Navigator; private player: Point = { x: 480, y: 610 }; private route: Point[] = [];
  private arrived?: () => void; private modalDismiss?: () => void; private entering = true; private paused = false; private disposed = false; private modalOpen = false; private last = 0; private frameId = 0; private activeSeconds: number; private creditedSeconds: number; private activityUntil = 0;
  constructor(target: HTMLElement, private readonly services: GameHostServices<BureauAfterDarkProgress>) {
    this.root = document.createElement("section"); this.root.className = "bureau-after-dark"; this.root.innerHTML = this.markup(); target.replaceChildren(this.root);
    this.canvas = req(this.root, "[data-bureau=world]"); this.painter = new BureauPainter(this.canvas, this.root); this.progress = new BureauProgression(services.progress, (value) => services.saveProgress(value)); this.audio = new BureauAudio(services.muted); this.activeSeconds = services.activePlaySeconds; this.creditedSeconds = Math.floor(services.activePlaySeconds);
    this.levelId = this.progress.state.selectedLevel; this.navigator = new Navigator(this.level.walls);
    this.bind(); this.syncLegacyRewards(); this.start(this.levelId); this.frameId = requestAnimationFrame((time) => this.frame(time));
  }
  private get level(): Level { return LEVELS[this.levelId]; }
  setPaused(value: boolean): void { this.paused = value; this.last = 0; if (value) this.route = []; }
  setMuted(value: boolean): void { this.audio.setMuted(value); }
  flushProgress(): void { this.credit(); this.progress.persist(); }
  status(): unknown { return { level: this.levelId, paused: this.paused, progress: loadBureauAfterDarkProgress(this.progress.state) }; }
  dispose(): void { if (this.disposed) return; this.disposed = true; cancelAnimationFrame(this.frameId); this.controller.abort(); this.audio.dispose(); this.flushProgress(); this.root.remove(); }
  private bind(): void {
    const signal = this.controller.signal;
    document.addEventListener("visibilitychange", () => { this.last = 0; if (document.hidden) this.route = []; }, { signal });
    this.root.addEventListener("pointerdown", () => { this.audio.unlock(); this.noteActivity(); }, { signal, passive: true });
    this.root.addEventListener("keydown", (event) => { if (event.key === "Escape") this.closeModal(); this.audio.unlock(); }, { signal });
    this.canvas.addEventListener("click", (event) => { if (this.entering || this.modalOpen || this.paused) return; const rect = this.canvas.getBoundingClientRect(); this.walk({ x: (event.clientX - rect.left) * 960 / rect.width, y: (event.clientY - rect.top) * 680 / rect.height }); }, { signal });
    req<HTMLButtonElement>(this.root, "[data-bureau=journal]").addEventListener("click", () => this.journal(), { signal });
    req<HTMLButtonElement>(this.root, "[data-bureau=collection]").addEventListener("click", () => this.collection(), { signal });
    req<HTMLButtonElement>(this.root, "[data-bureau=hint]").addEventListener("click", () => this.hint(), { signal });
    this.root.querySelectorAll<HTMLButtonElement>("[data-bureau-level]").forEach((button) => button.addEventListener("click", () => {
      const level = Number(button.dataset.bureauLevel);
      if (level === 0 || level === 1) this.start(level);
    }, { signal }));
  }
  private syncLegacyRewards(): void { for (const legacy of this.progress.state.rewards) { const request = BUREAU_REWARD_REQUEST_IDS[legacy as keyof typeof BUREAU_REWARD_REQUEST_IDS]; if (request && this.services.awardReward(request)) this.progress.markOwned(request); } }
  private start(level: number): void { if (!this.progress.unlocked(level)) return; this.levelId = level === 1 ? 1 : 0; this.progress.select(this.levelId); this.navigator = new Navigator(this.level.walls); this.player = { x: 480, y: 610 }; this.route = [{ x: 480, y: 560 }]; this.entering = true; this.arrived = () => { this.entering = false; this.renderHud(); this.say("The elevator opens. Choose a search spot to investigate."); }; this.renderHud(); }
  private walk(target: Point, done?: () => void): void { if (this.modalOpen || this.paused) return; const route = this.navigator.path(this.player, target); if (!route.length) { this.say("Choose an open aisle or a search spot."); return; } this.route = route; this.arrived = done; this.noteActivity(); }
  private frame(time: number): void {
    const seconds = this.last ? Math.min((time - this.last) / 1000, .05) : 0; this.last = time;
    if (!this.disposed && !this.paused && !document.hidden) {
      if (!this.modalOpen && this.route.length) { let remaining = seconds * (this.entering ? 95 : 260); while (this.route.length && remaining > 0) { const target = this.route[0]; const distance = Math.hypot(target.x - this.player.x, target.y - this.player.y); if (distance <= remaining) { this.player = { ...target }; this.route.shift(); remaining -= distance; } else { this.player.x += (target.x - this.player.x) / distance * remaining; this.player.y += (target.y - this.player.y) / distance * remaining; remaining = 0; } } if (!this.route.length) { const done = this.arrived; this.arrived = undefined; done?.(); } }
      if (!this.modalOpen && time < this.activityUntil && !this.entering && !this.progress.completed(this.levelId)) this.activeSeconds += seconds;
      this.credit(); this.painter.draw(this.level, this.player, this.route, this.services.reducedMotion ? 0 : time);
    }
    if (!this.disposed) this.frameId = requestAnimationFrame((next) => this.frame(next));
  }
  private credit(): void { const whole = Math.floor(this.activeSeconds); if (whole > this.creditedSeconds) { this.creditedSeconds = whole; this.services.creditActivePlay(whole); } }
  private noteActivity(): void { this.activityUntil = performance.now() + 8000; }
  private renderHud(): void {
    req(this.root, "[data-bureau=floor]").textContent = `FLOOR ${this.levelId + 1} / ${this.level.title.toUpperCase()}`; const found = this.progress.found(this.levelId); req(this.root, "[data-bureau=count]").textContent = `${found.length} / 3 discovered`;
    req(this.root, "[data-bureau=status]").textContent = this.entering ? "STEPPING OUT OF THE ELEVATOR" : this.progress.completed(this.levelId) ? "DISCOVERY KEPT" : "THE BUREAU IS QUIET";
    this.root.querySelectorAll<HTMLButtonElement>("[data-bureau-level]").forEach((button) => {
      const id = Number(button.dataset.bureauLevel); const unlocked = this.progress.unlocked(id);
      button.disabled = !unlocked; button.classList.toggle("is-active", id === this.levelId);
      button.textContent = `0${id + 1} · ${id === 0 ? "Midnight Archive" : "Cabinet of Wonders"}${unlocked ? "" : " · Locked"}`;
    });
    const mini = req(this.root, "[data-bureau=mini-journal]");
    mini.innerHTML = this.level.sigils.map((sigil) => found.includes(sigil.id) ? `<span><img src="${sigilImages[sigil.id]}" alt="${sigil.name}"></span>` : "<span>?</span>").join("");
    req(this.root, "[data-bureau=objective-find]").classList.toggle("is-done", found.length === 3);
    req(this.root, "[data-bureau=objective-seal]").classList.toggle("is-done", this.progress.completed(this.levelId));
    req(this.root, "[data-bureau=objective-keep]").classList.toggle("is-done", this.progress.completed(this.levelId));
    req(this.root, "[data-bureau=reward-count]").textContent = `${this.progress.state.rewards.length} / 2 records collected`;
    const spots = req(this.root, "[data-bureau=spots]"); spots.replaceChildren();
    for (const spot of this.level.spots) { const button = document.createElement("button"); const got = !!spot.sigilId && found.includes(spot.sigilId); button.className = `bureau-after-dark__spot ${got ? "is-found" : ""}`; button.style.left = `${spot.x / 9.6}%`; button.style.top = `${spot.y / 6.8}%`; button.innerHTML = `${this.painter.sprite(spot.id)}<span>${spot.label}</span>`; button.disabled = this.entering; button.addEventListener("click", () => this.walk(spot, () => this.search(spot)), { signal: this.controller.signal }); spots.append(button); }
    const archive = req<HTMLButtonElement>(this.root, "[data-bureau=archive]"); archive.innerHTML = `${this.progress.completed(this.levelId) ? "✓" : "▤"}<span>Archive</span>`; archive.disabled = this.entering;
    archive.onclick = () => this.walk({ x: 740, y: 100 }, () => this.archive());
  }
  private search(spot: SearchSpot): void { if (!spot.sigilId) { this.say("A quiet corner, a little dust… no hidden sigil here."); return; } if (this.progress.found(this.levelId).includes(spot.sigilId)) { this.journal(); return; } const sigil = this.level.sigils.find((item) => item.id === spot.sigilId)!; this.audio.chime(); this.parchment(sigil); }
  private show(title: string, content: string, kind = "", onDismiss?: () => void): HTMLElement { this.modalOpen = true; this.modalDismiss = onDismiss; this.route = []; const overlay = req<HTMLElement>(this.root, "[data-bureau=overlay]"); overlay.hidden = false; const modal = req<HTMLElement>(overlay, "[data-bureau=modal]"); modal.className = kind; modal.innerHTML = `<button type="button" data-bureau=close aria-label="Close">×</button><p class="bureau-after-dark__eyebrow">Bureau after dark</p><h2>${title}</h2>${content}`; req<HTMLButtonElement>(modal, "[data-bureau=close]").onclick = () => this.closeModal(); modal.focus(); return modal; }
  private closeModal(): void { if (!this.modalOpen) return; const overlay = req<HTMLElement>(this.root, "[data-bureau=overlay]"); overlay.hidden = true; this.modalOpen = false; const dismiss = this.modalDismiss; this.modalDismiss = undefined; dismiss?.(); }
  private parchment(sigil: Sigil): void { const modal = this.show("An enchanted message", `<p>Silver letters shimmer just beneath the surface. A little magic might bring them into focus.</p><button class="bureau-after-dark__writing" data-bureau=reveal aria-label="Tap to reveal the silver writing"><span class="bureau-after-dark__riddle">${sigil.riddle}</span><span class="bureau-after-dark__veil" aria-hidden="true">✧ &nbsp; ✦ &nbsp; ✧</span></button><p class="bureau-after-dark__rub-hint" data-bureau=rub-hint>Tap the parchment, or rub its shimmer away.</p><div class="bureau-after-dark__rub-meter"><i data-bureau=rub-progress></i></div><div data-bureau=choices hidden></div><p data-bureau=feedback aria-live=polite></p>`, "is-parchment"); const reveal = () => { const choices = req<HTMLElement>(modal, "[data-bureau=choices]"); choices.hidden = false; req<HTMLButtonElement>(modal, "[data-bureau=reveal]").classList.add("is-revealed"); req(modal, "[data-bureau=rub-hint]").textContent = "The silver words settle into ink. What is the answer?"; req<HTMLElement>(modal, "[data-bureau=rub-progress]").style.width = "100%"; choices.replaceChildren(...sigil.choices.map((choice, index) => { const button = document.createElement("button"); button.textContent = choice; button.onclick = () => { if (index !== sigil.answer) { req(modal, "[data-bureau=feedback]").textContent = "The silver letters twinkle. Try another answer."; return; } this.progress.discover(this.levelId, sigil.id); this.audio.chime(true); this.renderHud(); this.sigilReveal(sigil); }; return button; })); }; req<HTMLButtonElement>(modal, "[data-bureau=reveal]").onclick = reveal; }
  private sigilReveal(sigil: Sigil): void { const stars = Array.from({ length: 22 }, (_, index) => `<i style="--x:${7 + index * 29 % 87}%;--y:${5 + index * 43 % 90}%;--size:${7 + index % 4 * 3}px;--delay:${index % 7 * -.23}s">✦</i>`).join(""); const modal = this.show("A sigil awakens", `<button data-bureau=keep class="bureau-after-dark__sigil"><span class="bureau-after-dark__sigil-stage"><img src="${sigilImages[sigil.id]}" alt="${sigil.name} sigil"><span class="bureau-after-dark__stardust" aria-hidden="true">${stars}</span></span><strong>${sigil.name}</strong><span>Tap to keep it in your clue journal</span></button>`, "is-reveal", () => this.journal(sigil.id)); req<HTMLButtonElement>(modal, "[data-bureau=keep]").onclick = () => this.closeModal(); }
  private journal(newId?: string): void { const found = this.progress.found(this.levelId); const rows = this.level.sigils.map((sigil) => found.includes(sigil.id) ? `<li class="${sigil.id === newId ? "is-new" : ""}"><img src="${sigilImages[sigil.id]}" alt=""><div><strong>${sigil.name}</strong><span>${sigil.clue}</span></div></li>` : "<li><div class=\"bureau-after-dark__unknown\">?</div><div><strong>Undiscovered</strong><span>A search spot is keeping this secret.</span></div></li>").join(""); const modal = this.show("Your clue journal", `<p>${found.length} of 3 sigils discovered</p><ol class="bureau-after-dark__journal">${rows}</ol>${found.length === 3 && !this.progress.completed(this.levelId) ? '<button data-bureau=visit class="bureau-after-dark__primary">Go to the archive</button>' : ""}`); modal.querySelector<HTMLButtonElement>("[data-bureau=visit]")?.addEventListener("click", () => { this.closeModal(); this.walk({ x: 740, y: 100 }, () => this.archive()); }); }
  private archive(): void {
    if (this.progress.completed(this.levelId)) { this.reward(false); return; }
    if (this.progress.found(this.levelId).length < 3) { this.show("The archive is waiting", "<p>Find three sigils, then follow their journal clues to unseal this record.</p>"); return; }
    let sequence: string[] = [];
    const modal = this.show("The archive seal", `<p>Choose the three sigils in the order described in your journal.</p><div class="bureau-after-dark__sequence" data-bureau=sequence></div><div class="bureau-after-dark__seal-options" data-bureau=options></div><p class="bureau-after-dark__clue-lines">${this.level.sigils.map((sigil) => sigil.clue).join("<br>")}</p><p class="bureau-after-dark__feedback" data-bureau=feedback aria-live=polite></p><div class="bureau-after-dark__seal-actions"><button data-bureau=reset type="button">Start the order again</button></div>`, "is-seal");
    const render = () => {
      req(modal, "[data-bureau=sequence]").innerHTML = [0, 1, 2].map((index) => { const selected = this.level.sigils.find((sigil) => sigil.id === sequence[index]); return `<span class="bureau-after-dark__slot">${selected ? `<img src="${sigilImages[selected.id]}" alt="${selected.name}">` : index + 1}</span>`; }).join("");
      const options = req(modal, "[data-bureau=options]");
      options.replaceChildren(...[...this.level.sigils].sort((a, b) => a.name.localeCompare(b.name)).map((sigil) => { const button = document.createElement("button"); button.innerHTML = `<img src="${sigilImages[sigil.id]}" alt=""><span>${sigil.name}</span>`; button.disabled = sequence.includes(sigil.id); button.onclick = () => { sequence.push(sigil.id); if (sequence.length === 3) { if (this.progress.claim(this.levelId, sequence)) { this.renderHud(); this.audio.chime(true); this.reward(true); } else { sequence = []; req(modal, "[data-bureau=feedback]").textContent = "The seal stays closed. Read the clues and try again."; render(); } } else render(); }; return button; }));
    };
    req<HTMLButtonElement>(modal, "[data-bureau=reset]").onclick = () => { sequence = []; req(modal, "[data-bureau=feedback]").textContent = ""; render(); };
    render();
  }
  private reward(fresh: boolean): void { const record = this.level.reward; const request = BUREAU_REWARD_REQUEST_IDS[record.id as keyof typeof BUREAU_REWARD_REQUEST_IDS]; if (fresh && request) { this.services.awardReward(request); this.progress.markOwned(request); } const modal = this.show(fresh ? "A secret, safely kept" : "Your Bureau discovery", `${RewardCards.render(this.level)}<p>${fresh ? "The archive opens. This record is now in your permanent collection." : "You already collected this record."}</p>${this.levelId === 0 ? '<button data-bureau=next class="bureau-after-dark__primary">Enter level 2</button>' : ""}`); modal.querySelector<HTMLButtonElement>("[data-bureau=next]")?.addEventListener("click", () => { this.closeModal(); this.start(1); }); }
  private collection(): void { const records = LEVELS.filter((level) => this.progress.completed(level.id)).map((level) => RewardCards.render(level)).join("") || "<p>No records yet. Unseal an archive to start your collection.</p>"; this.show("Your Bureau collection", records); }
  private hint(): void { const spot = this.level.spots.find((item) => item.sigilId && !this.progress.found(this.levelId).includes(item.sigilId)); this.say(spot ? `Try the ${spot.label.toLowerCase()}.` : "All three sigils are found. Visit the archive."); }
  private say(message: string): void { req(this.root, "[data-bureau=message]").textContent = message; }
  private markup(): string { return `<div class="bureau-after-dark__shell"><header class="bureau-after-dark__brand"><span class="bureau-after-dark__brand-mark">✧</span><span>Bureau of Supernatural Affairs</span></header><section class="bureau-after-dark__heading"><div><p class="bureau-after-dark__eyebrow">Amari and the Night Brothers · A fan-made mystery</p><h1>Bureau After Dark</h1><p class="bureau-after-dark__subtitle">Some secrets only come out after midnight.</p></div><nav class="bureau-after-dark__levels" aria-label="Bureau floors"><button data-bureau-level="0" type="button">01 · Midnight Archive</button><button data-bureau-level="1" type="button">02 · Cabinet of Wonders · Locked</button></nav></section><main><section><div class="bureau-after-dark__board"><canvas data-bureau=world width="960" height="680" tabindex="0" aria-label="Bureau map. Tap an open aisle to walk."></canvas><div class="bureau-after-dark__topbar"><span data-bureau=floor></span><span data-bureau=status></span></div><div data-bureau=spots></div><button data-bureau=archive class="bureau-after-dark__archive" type="button"><span>Archive</span></button></div><div class="bureau-after-dark__actions"><button data-bureau=journal type="button">▤ &nbsp; Clue journal</button><button data-bureau=collection type="button">◇ &nbsp; My collection</button><button data-bureau=hint type="button">✧ &nbsp; A little hint</button></div><p class="bureau-after-dark__message" data-bureau=message role="status" aria-live="polite">Amari is stepping out of the elevator…</p></section><aside class="bureau-after-dark__sidebar"><section class="bureau-after-dark__card bureau-after-dark__dossier"><h2>AGENT DOSSIER</h2><div class="bureau-after-dark__agent"><span>A</span><div><strong>Amari Peters</strong><p>Junior agent · Magician</p></div></div><p>Silver words. Hidden sigils.<br>A little magic goes a long way.</p></section><section class="bureau-after-dark__card"><h2>TONIGHT'S MYSTERY</h2><div class="bureau-after-dark__mini-journal" data-bureau=mini-journal></div><p class="bureau-after-dark__mission" data-bureau=objective-find>◇ <span>Find three enchanted sigils<br><small data-bureau=count>0 / 3 discovered</small></span></p><p class="bureau-after-dark__mission" data-bureau=objective-seal>◇ <span>Unseal the archive<br><small>Your journal holds the order</small></span></p><p class="bureau-after-dark__mission" data-bureau=objective-keep>◇ <span>Keep a Bureau discovery<br><small data-bureau=reward-count>0 / 2 records collected</small></span></p></section><section class="bureau-after-dark__card bureau-after-dark__instructions"><h2>THE MAGIC OF DISCOVERY</h2><p>Tap a search spot to investigate.<br><br>Touch the parchment or rub away its silver shimmer to reveal a riddle.<br><br>Three sigils. One secret order. Take all the time you need.</p></section></aside></main></div><div data-bureau=overlay hidden><section data-bureau=modal role="dialog" aria-modal="true" tabindex="-1"></section></div>`; }
}
