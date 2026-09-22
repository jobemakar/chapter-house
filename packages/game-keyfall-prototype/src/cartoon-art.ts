import type { WorldElementSnapshot } from "./elements";
import type { Bounds, Vec, Viewport } from "./types";

const BACKDROP_URL = new URL("./assets/cartoon-funhouse.png", import.meta.url).href;

const INK = "#3b2035";
const DEEP_INK = "#24182d";
const RASPBERRY = "#a92362";
const RASPBERRY_DARK = "#681b48";
const RASPBERRY_LIGHT = "#d34b84";
const GOLD = "#f5b83f";
const GOLD_LIGHT = "#ffe07a";
const GOLD_DARK = "#a85b24";
const TEAL = "#16758a";
const TEAL_LIGHT = "#77d3d4";

/** Draws the live, collider-aligned cartoon pieces over a cached quiet backdrop. */
export class KeyfallCartoonArt {
  private readonly backdropImage?: HTMLImageElement;
  private backdropCache?: HTMLCanvasElement;
  private cacheKey = "";

  constructor() {
    if (typeof Image === "undefined") return;
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => this.invalidateBackdrop());
    image.addEventListener("error", () => this.invalidateBackdrop());
    image.src = BACKDROP_URL;
    this.backdropImage = image;
  }

  invalidateBackdrop(): void {
    this.backdropCache = undefined;
    this.cacheKey = "";
  }

  drawBackdrop(c: CanvasRenderingContext2D, viewport: Viewport): void {
    const loaded = this.backdropImage?.complete && this.backdropImage.naturalWidth > 0;
    const key = `${viewport.width}x${viewport.height}:${loaded ? "image" : "fallback"}`;
    if (!this.backdropCache || this.cacheKey !== key) {
      this.backdropCache = this.makeBackdrop(viewport);
      this.cacheKey = key;
    }
    c.drawImage(this.backdropCache, 0, 0, viewport.width, viewport.height);
  }

  drawCord(c: CanvasRenderingContext2D, points: readonly Vec[], opacity: number): void {
    if (points.length < 2) return;
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    this.traceCord(c, points); c.strokeStyle = `rgba(61,24,54,${opacity})`; c.lineWidth = 8; c.stroke();
    this.traceCord(c, points); c.strokeStyle = `rgba(164,31,91,${opacity})`; c.lineWidth = 5; c.stroke();
    this.traceCord(c, points); c.strokeStyle = `rgba(231,89,139,${opacity * 0.72})`; c.lineWidth = 1.4; c.stroke();
    c.restore();
  }

  drawAnchor(c: CanvasRenderingContext2D, p: Vec, opacity: number): void {
    c.save();
    c.globalAlpha = opacity;
    c.translate(p.x, p.y);
    c.fillStyle = INK;
    c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fill();
    const metal = c.createRadialGradient(-4, -5, 2, 0, 0, 12);
    metal.addColorStop(0, GOLD_LIGHT); metal.addColorStop(0.48, GOLD); metal.addColorStop(1, GOLD_DARK);
    c.fillStyle = metal;
    c.beginPath(); c.arc(0, 0, 10.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = RASPBERRY_DARK;
    c.beginPath(); c.arc(0, 0, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(255,241,157,.8)";
    c.beginPath(); c.arc(-4, -4, 1.8, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  drawKey(c: CanvasRenderingContext2D, p: Vec, angle: number, reducedMotion: boolean): void {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(angle);
    if (!reducedMotion) { c.shadowColor = "rgba(255,192,62,.55)"; c.shadowBlur = 4; }
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = INK; c.lineWidth = 10;
    c.beginPath(); c.arc(-7.5, 0, 9, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = GOLD_DARK; c.lineWidth = 7.5; c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 5.5; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 8;
    c.beginPath(); c.moveTo(1.5, 0); c.lineTo(18, 0); c.lineTo(18, 7.5); c.moveTo(11, 0); c.lineTo(11, -7); c.stroke();
    c.strokeStyle = GOLD_DARK; c.lineWidth = 6; c.stroke();
    c.strokeStyle = GOLD_LIGHT; c.lineWidth = 4; c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = "rgba(255,240,146,.9)"; c.lineWidth = 1.3;
    c.beginPath(); c.arc(-9, -1.5, 6.5, Math.PI * 1.05, Math.PI * 1.75); c.stroke();
    c.beginPath(); c.moveTo(2, -1.6); c.lineTo(14, -1.6); c.stroke();
    c.restore();
  }

  drawGoal(c: CanvasRenderingContext2D, p: Vec, reducedMotion: boolean): void {
    c.save();
    c.translate(p.x, p.y);
    if (!reducedMotion) { c.shadowColor = "rgba(255,187,56,.55)"; c.shadowBlur = 14; }
    c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.fill();
    const metal = c.createRadialGradient(-10, -12, 4, 0, 0, 31);
    metal.addColorStop(0, GOLD_LIGHT); metal.addColorStop(0.55, GOLD); metal.addColorStop(1, GOLD_DARK);
    c.fillStyle = metal; c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = "rgba(255,233,125,.75)"; c.lineWidth = 2;
    c.beginPath(); c.arc(-2, -2, 24, Math.PI * 1.05, Math.PI * 1.78); c.stroke();
    for (const a of [-Math.PI / 2, 0, Math.PI / 2, Math.PI]) {
      c.fillStyle = GOLD_DARK; c.beginPath(); c.arc(Math.cos(a) * 23, Math.sin(a) * 23, 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_LIGHT; c.beginPath(); c.arc(Math.cos(a) * 23 - 0.7, Math.sin(a) * 23 - 0.7, 1, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = DEEP_INK;
    c.beginPath(); c.arc(0, -7, 8, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-3.5, -1); c.lineTo(3.5, -1); c.lineTo(4, 5); c.lineTo(9, 15); c.lineTo(-9, 15); c.lineTo(-4, 5); c.closePath(); c.fill();
    c.restore();
  }

  drawTicket(c: CanvasRenderingContext2D, p: Vec, time = 0, reducedMotion = false): void {
    c.save();
    const phase = time * .0014 + p.x * .013 + p.y * .009;
    c.translate(p.x, p.y + (reducedMotion ? 0 : Math.sin(phase) * 1.6));
    c.rotate(-0.12 + (reducedMotion ? 0 : Math.sin(phase * .85) * .055));
    c.fillStyle = INK; this.ticketPath(c, 16, 12); c.fill();
    c.fillStyle = GOLD_DARK; this.ticketPath(c, 14, 10); c.fill();
    c.fillStyle = "#ffd467"; this.ticketPath(c, 12.5, 8.5); c.fill();
    c.strokeStyle = "rgba(255,243,167,.8)"; c.lineWidth = 1.2; this.ticketPath(c, 9.5, 6); c.stroke();
    c.fillStyle = GOLD_DARK; this.starPath(c, 0, 0, 5.5, 2.5, 5); c.fill();
    c.restore();
  }

  drawBumper(c: CanvasRenderingContext2D, p: Vec, radius: number): void {
    c.save();
    c.translate(p.x, p.y);
    c.fillStyle = INK; c.beginPath(); c.arc(0, 0, radius, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD_DARK; c.beginPath(); c.arc(0, 0, radius - 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; c.beginPath(); c.arc(0, 0, Math.max(2, radius - 7), 0, Math.PI * 2); c.fill();
    c.fillStyle = RASPBERRY_DARK; c.beginPath(); c.arc(0, 0, Math.max(2, radius - 12), 0, Math.PI * 2); c.fill();
    const velvet = c.createRadialGradient(-radius * .25, -radius * .3, 1, 0, 0, Math.max(2, radius - 12));
    velvet.addColorStop(0, RASPBERRY_LIGHT); velvet.addColorStop(.55, RASPBERRY); velvet.addColorStop(1, RASPBERRY_DARK);
    c.fillStyle = velvet; c.beginPath(); c.arc(0, 0, Math.max(2, radius - 15), 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,158,193,.5)"; c.lineWidth = 2;
    c.beginPath(); c.arc(-radius * .16, -radius * .2, Math.max(2, radius * .45), Math.PI * 1.05, Math.PI * 1.72); c.stroke();
    c.fillStyle = GOLD_LIGHT;
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { c.beginPath(); c.arc(Math.cos(a) * (radius - 7), Math.sin(a) * (radius - 7), 2.2, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }

  /** Side-facing cartoon blower: rotating impeller, fixed cage and directional outlet. */
  drawFan(c: CanvasRenderingContext2D, p: Vec, radius: number, heading: number, time: number): void {
    c.save();
    c.translate(p.x, p.y); c.rotate(heading);
    const r = radius * .78;
    // The outlet and animated chevrons agree with the exact physics direction.
    c.fillStyle = INK;
    this.roundedRect(c, r * .45, -r * .42, r * .8, r * .84, 5); c.fill();
    c.fillStyle = GOLD;
    this.roundedRect(c, r * .55, -r * .3, r * .6, r * .6, 3); c.fill();
    c.fillStyle = TEAL_LIGHT; c.fillRect(r * 1.02, -r * .23, r * .13, r * .46);
    c.fillStyle = INK; c.beginPath(); c.arc(0, 0, r + 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#123f51"; c.beginPath(); c.arc(0, 0, r - 4, 0, Math.PI * 2); c.fill();
    c.save(); c.rotate(time * .004);
    for (let i = 0; i < 4; i += 1) {
      c.rotate(Math.PI / 2);
      c.fillStyle = i % 2 ? TEAL_LIGHT : "#b9f1df";
      c.beginPath(); c.moveTo(0, 0);
      c.bezierCurveTo(r * .15, -r * .72, r * .85, -r * .7, r * .68, -r * .15);
      c.quadraticCurveTo(r * .45, r * .16, 0, 0); c.fill();
    }
    c.restore();
    c.strokeStyle = "rgba(14,52,66,.65)"; c.lineWidth = 1.5;
    for (const a of [0, Math.PI / 3, Math.PI * 2 / 3]) {
      c.beginPath(); c.moveTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
      c.lineTo(-Math.cos(a) * (r - 3), -Math.sin(a) * (r - 3)); c.stroke();
    }
    c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD_LIGHT; c.beginPath(); c.arc(-1, -1, 4, 0, Math.PI * 2); c.fill();
    c.lineWidth = 2; c.lineCap = "round";
    for (let i = 0; i < 2; i += 1) {
      const phase = (time / 1000 + i * .5) % 1;
      const x = r * 1.4 + phase * 19;
      c.strokeStyle = `rgba(185,241,223,${.65 * (1 - phase)})`;
      c.beginPath(); c.moveTo(x - 4, -5); c.lineTo(x + 2, 0); c.lineTo(x - 4, 5); c.stroke();
    }
    c.restore();
  }
  drawWall(c: CanvasRenderingContext2D, p: Vec, angle = 0, length = 104): void {
    c.save(); c.translate(p.x, p.y); c.rotate(angle);
    c.fillStyle = INK; this.roundedRect(c, -length / 2, -10, length, 20, 3); c.fill();
    c.fillStyle = "#b77d4d"; this.roundedRect(c, -length / 2 + 2, -8, length - 4, 16, 2); c.fill();
    c.strokeStyle = "#e2b980"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-length / 2 + 7, -5); c.lineTo(length / 2 - 7, -5); c.stroke();
    c.strokeStyle = "#875031"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-length / 2 + 9, 3); c.lineTo(length / 2 - 9, 3); c.stroke();
    c.fillStyle = "#354e55";
    for (const x of [-length / 2 + 7, length / 2 - 7]) { c.beginPath(); c.arc(x, 0, 2.3, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }

  drawPlatform(c: CanvasRenderingContext2D, p: Vec, angle = 0, length = 104): void {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(angle);
    const half = length / 2;
    c.fillStyle = INK;
    this.roundedRect(c, -half, -10, length, 20, 10); c.fill();
    c.fillStyle = GOLD_DARK;
    this.roundedRect(c, -half + 3, -7, length - 6, 14, 7); c.fill();
    const velvet = c.createLinearGradient(0, -6, 0, 6);
    velvet.addColorStop(0, RASPBERRY_LIGHT); velvet.addColorStop(.45, RASPBERRY); velvet.addColorStop(1, RASPBERRY_DARK);
    c.fillStyle = velvet;
    this.roundedRect(c, -half + 9, -5, length - 18, 10, 5); c.fill();
    c.strokeStyle = "rgba(255,169,202,.48)"; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(-half + 17, -2.5); c.lineTo(half - 17, -2.5); c.stroke();
    c.fillStyle = GOLD_LIGHT;
    for (const x of [-half + 7, half - 7]) { c.beginPath(); c.arc(x, 0, 2, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }

  drawElement(c: CanvasRenderingContext2D, element: WorldElementSnapshot, reducedMotion: boolean, animationTime = 0): void {
    switch (element.kind) {
      case "bubble": this.drawBubble(c, element, reducedMotion); break;
      case "air-jet": this.drawAirJet(c, element, reducedMotion, animationTime); break;
      case "counterweight": this.drawCounterweight(c, element); break;
      case "reset-hazard": this.drawHazard(c, element.bounds, element.triggered); break;
    }
  }

  drawSlash(c: CanvasRenderingContext2D, points: readonly Vec[], opacity: number, reducedMotion: boolean): void {
    if (points.length < 2) return;
    c.save();
    c.strokeStyle = `rgba(255,239,151,${opacity})`;
    c.lineWidth = reducedMotion ? 4 : 7;
    c.lineCap = "round"; c.lineJoin = "round";
    if (!reducedMotion) { c.shadowColor = "#ffe36e"; c.shadowBlur = 12; }
    c.beginPath(); points.forEach((point, index) => index === 0 ? c.moveTo(point.x, point.y) : c.lineTo(point.x, point.y)); c.stroke();
    c.restore();
  }

  private makeBackdrop(viewport: Viewport): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    const c = canvas.getContext("2d");
    if (!c) return canvas;
    const image = this.backdropImage;
    if (image?.complete && image.naturalWidth > 0) { this.drawCover(c, image, viewport); return canvas; }
    this.drawFallbackBackdrop(c, viewport);
    return canvas;
  }

  private drawCover(c: CanvasRenderingContext2D, image: HTMLImageElement, viewport: Viewport): void {
    const scale = Math.max(viewport.width / image.naturalWidth, viewport.height / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    c.drawImage(image, (viewport.width - width) / 2, (viewport.height - height) / 2, width, height);
  }

  private drawFallbackBackdrop(c: CanvasRenderingContext2D, viewport: Viewport): void {
    const { width, height } = viewport;
    const sky = c.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#1d7d91"); sky.addColorStop(.55, "#176d82"); sky.addColorStop(1, "#10576f");
    c.fillStyle = sky; c.fillRect(0, 0, width, height);
    c.fillStyle = "rgba(13,67,83,.38)";
    c.beginPath(); c.moveTo(0, height * .72); c.quadraticCurveTo(width * .17, height * .58, width * .32, height * .77); c.quadraticCurveTo(width * .48, height * .9, width * .62, height * .7); c.quadraticCurveTo(width * .78, height * .52, width, height * .71); c.lineTo(width, height); c.lineTo(0, height); c.closePath(); c.fill();
    c.strokeStyle = "rgba(8,57,73,.33)"; c.lineWidth = 7;
    c.beginPath(); c.arc(width * .79, height * .43, width * .15, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 8; i += 1) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(width * .79, height * .43); c.lineTo(width * .79 + Math.cos(a) * width * .15, height * .43 + Math.sin(a) * width * .15); c.stroke(); }
    this.drawFallbackFrame(c, viewport);
  }

  private drawFallbackFrame(c: CanvasRenderingContext2D, viewport: Viewport): void {
    const edge = 18;
    c.fillStyle = INK; c.fillRect(0, 0, edge + 3, viewport.height); c.fillRect(viewport.width - edge - 3, 0, edge + 3, viewport.height);
    const wood = c.createLinearGradient(0, 0, edge, 0); wood.addColorStop(0, "#824329"); wood.addColorStop(.5, "#b76534"); wood.addColorStop(1, "#743623");
    c.fillStyle = wood; c.fillRect(3, 0, edge - 3, viewport.height); c.fillRect(viewport.width - edge, 0, edge - 3, viewport.height);
    c.fillStyle = RASPBERRY_DARK;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(52, 0); c.quadraticCurveTo(35, 105, 0, 165); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(viewport.width, 0); c.lineTo(viewport.width - 52, 0); c.quadraticCurveTo(viewport.width - 35, 105, viewport.width, 165); c.closePath(); c.fill();
  }

  private drawBubble(c: CanvasRenderingContext2D, bubble: Extract<WorldElementSnapshot, { kind: "bubble" }>, reducedMotion: boolean): void {
    if (bubble.popped) return;
    c.save(); c.translate(bubble.position.x, bubble.position.y);
    if (!reducedMotion) { c.shadowColor = "rgba(154,243,246,.7)"; c.shadowBlur = bubble.captured ? 13 : 8; }
    const fill = c.createRadialGradient(-bubble.radius * .32, -bubble.radius * .35, 2, 0, 0, bubble.radius);
    fill.addColorStop(0, "rgba(255,255,255,.32)"); fill.addColorStop(.55, "rgba(83,198,218,.13)"); fill.addColorStop(1, "rgba(180,102,214,.22)");
    c.fillStyle = fill; c.beginPath(); c.arc(0, 0, bubble.radius, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0; c.strokeStyle = bubble.captured ? "#e8fbff" : "#9de7e9"; c.lineWidth = 3; c.stroke();
    c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.ellipse(-bubble.radius * .32, -bubble.radius * .34, bubble.radius * .16, bubble.radius * .1, -0.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(155,255,240,.62)"; c.beginPath(); c.arc(bubble.radius * .37, bubble.radius * .31, Math.max(3, bubble.radius * .1), 0, Math.PI * 2); c.fill();
    c.restore();
  }

  private drawAirJet(c: CanvasRenderingContext2D, jet: Extract<WorldElementSnapshot, { kind: "air-jet" }>, reducedMotion: boolean, animationTime: number): void {
    const angle = Math.atan2(jet.direction.y, jet.direction.x);
    this.drawAirCurrent(c, jet.zone, angle, jet.mode, jet.active);
    c.save(); c.translate(jet.position.x, jet.position.y); c.rotate(angle);
    if (jet.active && !reducedMotion) { c.shadowColor = jet.mode === "tap" ? "#ffd36d" : "#85ecea"; c.shadowBlur = 13; }
    if (jet.mode === "tap") this.drawFan(c, { x: 0, y: 0 }, 32, 0, reducedMotion ? 0 : animationTime); else this.drawDraftVent(c, jet.active);
    c.restore();
  }

  private drawAirCurrent(c: CanvasRenderingContext2D, zone: Bounds, angle: number, mode: "continuous" | "tap", active: boolean): void {
    c.save();
    c.beginPath(); c.rect(zone.x, zone.y, zone.width, zone.height); c.clip();
    c.translate(zone.x + zone.width / 2, zone.y + zone.height / 2); c.rotate(angle);
    const span = Math.hypot(zone.width, zone.height);
    c.strokeStyle = mode === "continuous" ? `rgba(144,237,231,${active ? .34 : .16})` : `rgba(255,220,130,${active ? .4 : .11})`;
    c.lineWidth = active ? 3 : 2; c.lineCap = "round";
    for (const y of [-34, 0, 34]) {
      c.beginPath(); c.moveTo(-span * .36, y); c.bezierCurveTo(-span * .12, y - 9, span * .08, y + 9, span * .27, y); c.stroke();
      c.beginPath(); c.moveTo(span * .22, y - 6); c.lineTo(span * .3, y); c.lineTo(span * .22, y + 6); c.stroke();
    }
    c.restore();
  }

  private drawDraftVent(c: CanvasRenderingContext2D, active: boolean): void {
    c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 23, 0, Math.PI * 2); c.fill();
    c.fillStyle = active ? "#76d6d2" : TEAL; c.beginPath(); c.arc(0, 0, 19, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD_DARK; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = active ? "#d7fff2" : TEAL_LIGHT; c.lineWidth = 4; c.lineCap = "round";
    for (let i = 0; i < 4; i += 1) { const a = i * Math.PI / 2; c.beginPath(); c.arc(Math.cos(a) * 7, Math.sin(a) * 7, 8, a - .45, a + .45); c.stroke(); }
    c.fillStyle = GOLD_DARK; c.beginPath(); c.moveTo(20, -9); c.lineTo(32, -5); c.lineTo(32, 5); c.lineTo(20, 9); c.closePath(); c.fill();
  }

  private drawCounterweight(c: CanvasRenderingContext2D, weight: Extract<WorldElementSnapshot, { kind: "counterweight" }>): void {
    c.save(); c.translate(weight.position.x, weight.position.y); c.rotate(weight.angle);
    c.fillStyle = INK; c.beginPath(); c.arc(0, 0, weight.radius, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD_DARK; c.beginPath(); c.arc(0, 0, Math.max(1, weight.radius - 4), 0, Math.PI * 2); c.fill();
    c.fillStyle = RASPBERRY_DARK; c.beginPath(); c.arc(0, 0, Math.max(1, weight.radius - 7), 0, Math.PI * 2); c.fill();
    c.fillStyle = "#7e315f"; c.beginPath(); c.arc(-weight.radius * .12, -weight.radius * .12, Math.max(1, weight.radius * .57), 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; this.starPath(c, 0, 0, weight.radius * .36, weight.radius * .16, 5); c.fill();
    c.fillStyle = GOLD_LIGHT; c.beginPath(); c.arc(-weight.radius * .3, -weight.radius * .35, Math.max(1.5, weight.radius * .08), 0, Math.PI * 2); c.fill();
    c.restore();
  }

  private drawHazard(c: CanvasRenderingContext2D, b: Bounds, triggered: boolean): void {
    c.save();
    c.beginPath(); c.rect(b.x, b.y, b.width, b.height); c.clip();
    c.fillStyle = triggered ? "rgba(217,62,75,.78)" : "rgba(80,29,48,.72)"; c.fillRect(b.x, b.y, b.width, b.height);
    c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(b.x, b.y, b.width, b.height);
    c.strokeStyle = triggered ? "#ffe276" : GOLD; c.lineWidth = Math.max(3, Math.min(6, b.height * .22));
    const stripeSpan = Math.max(14, b.height * .75);
    for (let x = b.x - b.height; x < b.x + b.width + b.height; x += stripeSpan) { c.beginPath(); c.moveTo(x, b.y + b.height); c.lineTo(x + b.height, b.y); c.stroke(); }
    c.restore();
  }

  private traceCord(c: CanvasRenderingContext2D, points: readonly Vec[]): void {
    c.beginPath(); c.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const next = points[index + 1];
      c.quadraticCurveTo(points[index].x, points[index].y, (points[index].x + next.x) / 2, (points[index].y + next.y) / 2);
    }
    const last = points[points.length - 1]; c.lineTo(last.x, last.y);
  }

  private roundedRect(c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + width - r, y); c.quadraticCurveTo(x + width, y, x + width, y + r); c.lineTo(x + width, y + height - r); c.quadraticCurveTo(x + width, y + height, x + width - r, y + height); c.lineTo(x + r, y + height); c.quadraticCurveTo(x, y + height, x, y + height - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  private ticketPath(c: CanvasRenderingContext2D, halfWidth: number, halfHeight: number): void {
    c.beginPath(); c.moveTo(-halfWidth + 3, -halfHeight); c.lineTo(halfWidth - 3, -halfHeight); c.quadraticCurveTo(halfWidth - 1, -halfHeight * .55, halfWidth, -halfHeight * .3); c.quadraticCurveTo(halfWidth - 4, 0, halfWidth, halfHeight * .3); c.quadraticCurveTo(halfWidth - 1, halfHeight * .55, halfWidth - 3, halfHeight); c.lineTo(-halfWidth + 3, halfHeight); c.quadraticCurveTo(-halfWidth + 1, halfHeight * .55, -halfWidth, halfHeight * .3); c.quadraticCurveTo(-halfWidth + 4, 0, -halfWidth, -halfHeight * .3); c.quadraticCurveTo(-halfWidth + 1, -halfHeight * .55, -halfWidth + 3, -halfHeight); c.closePath();
  }

  private starPath(c: CanvasRenderingContext2D, x: number, y: number, outerRadius: number, innerRadius: number, points: number): void {
    c.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + i * Math.PI / points;
      const px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
  }
}
