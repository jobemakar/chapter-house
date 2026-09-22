import { IntakeGeometry } from "./intake-geometry";
import { getLevel, LEVELS, getNextLevel, loadCampaignLevels } from "./levels";
import { AuthoredObstacleRenderer } from "./authored-art";
import { COLS, ROWS, WaterSimulation } from "./physics";
import type { Canteen, Intake, LevelDefinition, Point } from "./types";
import { WaterSurfaceRenderer } from "./water-renderer";
import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import {
  DIG_AND_DOUSE_REWARD_ID,
  CampaignProgress,
  loadDigAndDouseProgress,
  type DigAndDouseProgress,
} from "./progress";
import backgroundUrl from "./assets/forest-frame.png";
import soilUrl from "./assets/soil-texture.png";
import rocksUrl from "./assets/bedrock-cluster.png";
import canteenUrl from "./assets/canteen-buddy.png";
import reservoirUrl from "./assets/reservoir-frame.png";
import workingUrl from "./assets/intake-working.png";
import dummyUrl from "./assets/intake-dummy-capped.png";
import targetUrl from "./assets/campsite-target.png";
import Box2DFactory from "liquidfun-wasm/dist/es/Box2D.js";
import box2dWasmUrl from "liquidfun-wasm/dist/es/Box2D.wasm?url";

const SCALE = 50;
const WIDTH = 600;
const HEIGHT = 750;
type AssetName =
  | "background"
  | "soil"
  | "rocks"
  | "canteen"
  | "reservoir"
  | "working"
  | "dummy"
  | "target";
type GameAssets = Record<AssetName, HTMLImageElement>;
const assetPaths: Record<AssetName, string> = {
  background: backgroundUrl,
  soil: soilUrl,
  rocks: rocksUrl,
  canteen: canteenUrl,
  reservoir: reservoirUrl,
  working: workingUrl,
  dummy: dummyUrl,
  target: targetUrl,
};

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required game element: ${selector}`);
  return element;
}
function layer(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  return canvas;
}
function pointFromEvent(canvas: HTMLCanvasElement, event: PointerEvent): Point {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * 12,
    y: ((event.clientY - box.top) / box.height) * 15,
  };
}

class AssetLoader {
  async load(): Promise<GameAssets> {
    const entries = await Promise.all(
      (Object.keys(assetPaths) as AssetName[]).map(
        async (key) => [key, await this.image(assetPaths[key])] as const,
      ),
    );
    return Object.fromEntries(entries) as GameAssets;
  }
  private image(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load ${url}`));
      image.src = url;
    });
  }
}

/** Keeps DOM feedback and accessible control state separate from simulation/rendering. */
class HudController {
  private readonly reset: HTMLButtonElement;
  private readonly hint: HTMLButtonElement;
  private readonly state: HTMLElement;
  private readonly drops: HTMLElement;
  private readonly progress: HTMLProgressElement;
  private readonly victory: HTMLElement;
  private readonly buddies: HTMLElement;
  private readonly victoryBuddies: HTMLElement;
  private reported = "";
  private readonly again: HTMLButtonElement;
  private readonly loading: HTMLElement;
  constructor(private readonly root: HTMLElement) {
    this.reset = required(root, '[data-douse="reset"]');
    this.hint = required(root, '[data-douse="hint"]');
    this.state = required(root, '[data-douse="state"]');
    this.drops = required(root, '[data-douse="drops"]');
    this.progress = required(root, '[data-douse="progress"]');
    this.victory = required(root, '[data-douse="win"]');
    this.buddies = required(root, '[data-douse="buddies"]');
    this.victoryBuddies = required(root, '[data-douse="win-buddies"]');
    this.again = required(root, '[data-douse="again"]');
    this.loading = required(root, '[data-douse="loading"]');
  }
  bind(restart: () => void, toggleHint: () => void): void {
    this.reset.addEventListener("click", restart);
    this.again.addEventListener("click", restart);
    this.hint.addEventListener("click", toggleHint);
  }
  setReady(): void {
    this.reset.disabled = false;
    this.loading.hidden = true;
  }
  setFailure(): void {
    this.loading.querySelector("h2")!.textContent = "The water couldn’t load";
    this.loading.querySelector("p")!.textContent =
      "Please reload. This game needs WebAssembly.";
    this.state.textContent = "Physics unavailable";
  }
  setHint(showing: boolean): void {
    this.hint.setAttribute("aria-pressed", String(showing));
    this.hint.textContent = showing ? "Hide the hint" : "Show a hint";
  }
  resetReport(): void {
    this.reported = "";
  }
  update(level: WaterSimulation): void {
    const filled = level.canteens.filter((canteen) => canteen.filled).length;
    const blockedRecent = level.steps - level.lastBlocked < 120;
    const next = `${level.collected}/${filled}/${level.wasted}/${blockedRecent}/${level.won}`;
    if (next === this.reported) return;
    this.reported = next;
    this.progress.max = level.required;
    this.progress.value = Math.min(level.required, level.collected);
    this.drops.textContent = `${Math.min(100, Math.round((100 * level.collected) / level.required))}% doused`;
    this.buddies.textContent = `Canteen buddies ${filled} / ${level.canteens.length}`;
    this.state.textContent = level.won
      ? "Campsite fire extinguished!"
      : blockedRecent
        ? "That pipe is capped — redirect the water"
        : level.collected
          ? "Intake working — the hose is spraying!"
          : "Guide water into the large open pipe mouth";
    this.victory.hidden = !level.won;
    this.victoryBuddies.textContent = `${filled} of ${level.canteens.length} canteen buddies filled`;
  }
}

/** Touch, mouse and keyboard input mapped to the game’s authored 12×15 world. */
class InputController {
  pointer: Point | null = null;
  private activeId: number | null = null;
  private keyboardDig = false;
  private keyPosition: Point = { x: 2.5, y: 3.7 };
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly level: () => WaterSimulation | undefined,
    private readonly onMeaningfulDig: () => void,
  ) {
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.endPointer);
    canvas.addEventListener("pointercancel", this.endPointer);
    canvas.addEventListener("lostpointercapture", this.endPointer);
    canvas.addEventListener("pointerleave", () => {
      if (this.activeId === null) this.pointer = null;
    });
    canvas.addEventListener("keydown", this.onKeyDown);
    canvas.addEventListener("keyup", (event) => {
      if (event.key === " ") this.keyboardDig = false;
    });
    canvas.addEventListener("blur", () => this.clear());
  }
  reset(): void {
    this.activeId = null;
    this.keyboardDig = false;
    this.keyPosition = { x: 2.5, y: 3.7 };
    this.pointer = null;
  }
  clear(): void {
    this.activeId = null;
    this.keyboardDig = false;
    this.pointer = null;
  }
  private onPointerDown = (event: PointerEvent): void => {
    const level = this.level();
    if (!level || level.won || this.activeId !== null) return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.activeId = event.pointerId;
    this.pointer = pointFromEvent(this.canvas, event);
    if (
      level.digLine(
        this.pointer.x,
        this.pointer.y,
        this.pointer.x,
        this.pointer.y,
      )
    )
      this.onMeaningfulDig();
  };
  private onPointerMove = (event: PointerEvent): void => {
    const level = this.level();
    if (!level) return;
    const next = pointFromEvent(this.canvas, event);
    if (event.pointerId === this.activeId && this.pointer) {
      event.preventDefault();
      if (level.digLine(this.pointer.x, this.pointer.y, next.x, next.y))
        this.onMeaningfulDig();
    }
    if (this.activeId === null || event.pointerId === this.activeId)
      this.pointer = next;
  };
  private endPointer = (event: PointerEvent): void => {
    if (event.pointerId === this.activeId) {
      this.activeId = null;
      this.pointer = null;
    }
  };
  private onKeyDown = (event: KeyboardEvent): void => {
    const level = this.level();
    if (
      !level ||
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    if (event.key === " ") this.keyboardDig = true;
    const old = { ...this.keyPosition };
    if (event.key === "ArrowLeft") this.keyPosition.x -= 0.25;
    if (event.key === "ArrowRight") this.keyPosition.x += 0.25;
    if (event.key === "ArrowUp") this.keyPosition.y -= 0.25;
    if (event.key === "ArrowDown") this.keyPosition.y += 0.25;
    this.keyPosition.x = Math.max(0.4, Math.min(11.6, this.keyPosition.x));
    this.keyPosition.y = Math.max(0.4, Math.min(14.6, this.keyPosition.y));
    this.pointer = { ...this.keyPosition };
    if (
      this.keyboardDig &&
      level.digLine(old.x, old.y, this.keyPosition.x, this.keyPosition.y)
    )
      this.onMeaningfulDig();
  };
}

/** Owns cached terrain and exact scene draw order for the painted hillside. */
class SceneRenderer {
  private readonly authoredArt = new AuthoredObstacleRenderer();
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly terrain = layer();
  private readonly terrainContext = this.terrain.getContext("2d")!;
  private readonly mask = layer();
  private readonly maskContext = this.mask.getContext("2d")!;
  private readonly waterClip = layer();
  private readonly waterClipContext = this.waterClip.getContext("2d")!;
  private readonly waterSurface = layer();
  private readonly waterSurfaceContext = this.waterSurface.getContext("2d")!;
  private readonly water = new WaterSurfaceRenderer(WIDTH, HEIGHT, SCALE);
  private readonly soilFallback = layer();
  private readonly soilFallbackContext = this.soilFallback.getContext("2d")!;
  private originalGrid = new Uint8Array(COLS * ROWS);
  constructor(
    canvas: HTMLCanvasElement,
    private readonly assets: GameAssets,
    private readonly config: LevelDefinition,
  ) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d")!;
    this.makeFallbackSoil();
  }
  diagnostics(): WaterSurfaceRenderer {
    return this.water;
  }
  setOriginalGrid(grid: Uint8Array): void {
    this.originalGrid = grid.slice();
  }
  draw(
    level: WaterSimulation,
    time: number,
    showHint: boolean,
    pointer: Point | null,
  ): void {
    this.context.drawImage(this.assets.background, 0, 0, WIDTH, HEIGHT);
    if (level.dirty) this.updateTerrain(level);
    this.context.drawImage(this.terrain, 0, 0);
    level.rocks.forEach((rock, index) => {
      this.context.save();
      if (index % 2) {
        this.context.translate((rock.x * 2 + rock.w) * SCALE, 0);
        this.context.scale(-1, 1);
        this.context.drawImage(
          this.assets.rocks,
          150,
          105,
          1120,
          910,
          rock.x * SCALE,
          rock.y * SCALE,
          rock.w * SCALE,
          rock.h * SCALE,
        );
      } else
        this.context.drawImage(
          this.assets.rocks,
          150,
          105,
          1120,
          910,
          rock.x * SCALE,
          rock.y * SCALE,
          rock.w * SCALE,
          rock.h * SCALE,
        );
      this.context.restore();
    });
    this.waterSurfaceContext.clearRect(0, 0, WIDTH, HEIGHT);
    this.water.draw(this.waterSurfaceContext, level.positions());
    this.waterSurfaceContext.globalCompositeOperation = "destination-out";
    this.waterSurfaceContext.drawImage(this.waterClip, 0, 0);
    this.waterSurfaceContext.globalCompositeOperation = "source-atop";
    this.drawWaterGlints(time);
    this.waterSurfaceContext.globalCompositeOperation = "source-over";
    this.context.drawImage(this.waterSurface, 0, 0);
    if (!this.config.tanks)
      this.context.drawImage(this.assets.reservoir, 170, 0, 260, 190);
    this.authoredArt.draw(this.context, this.config, SCALE);
    level.canteens.forEach((canteen) => this.drawCanteen(canteen, level, time));
    this.config.intakes.forEach((intake) => this.drawPipe(intake, level, time));
    this.drawCamp(level, time);
    if (!level.dug)
      (this.roundRect(215, 176, 170, 29, 15, "#4e371dd6"),
        this.text("DRAG TO CLEAR A PATH", 300, 196, 10, "#ffedc1"));
    if (showHint && !level.won) {
      this.context.strokeStyle = "#ffffcba6";
      this.context.lineWidth = 3;
      this.context.setLineDash([6, 9]);
      this.context.beginPath();
      this.config.hint.forEach(([x, y], index) =>
        index
          ? this.context.lineTo(x * SCALE, y * SCALE)
          : this.context.moveTo(x * SCALE, y * SCALE),
      );
      this.context.stroke();
      this.context.setLineDash([]);
    }
    if (pointer && !level.won) {
      this.context.strokeStyle = "#fff0bcbb";
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.arc(
        pointer.x * SCALE,
        pointer.y * SCALE,
        0.46 * SCALE,
        0,
        Math.PI * 2,
      );
      this.context.stroke();
    }
  }
  private makeFallbackSoil(): void {
    const gradient = this.soilFallbackContext.createLinearGradient(
      0,
      180,
      0,
      580,
    );
    gradient.addColorStop(0, "#c6924d");
    gradient.addColorStop(0.5, "#b27b3e");
    gradient.addColorStop(1, "#93612f");
    this.soilFallbackContext.fillStyle = gradient;
    this.soilFallbackContext.fillRect(0, 0, WIDTH, HEIGHT);
    let seed = 7919;
    const random = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let index = 0; index < 12500; index++) {
      const x = random() * WIDTH;
      const y = random() * HEIGHT;
      const radius = 0.3 + random() * 1.3;
      this.soilFallbackContext.fillStyle =
        index % 3 ? "#f2c77b20" : "#3c281926";
      this.soilFallbackContext.beginPath();
      this.soilFallbackContext.ellipse(
        x,
        y,
        radius * 1.7,
        radius,
        0.3,
        0,
        Math.PI * 2,
      );
      this.soilFallbackContext.fill();
    }
    for (let index = 0; index < 260; index++) {
      const x = random() * WIDTH;
      const y = random() * HEIGHT;
      this.soilFallbackContext.fillStyle = "#734c30";
      this.soilFallbackContext.beginPath();
      this.soilFallbackContext.ellipse(
        x,
        y,
        2 + (index % 3),
        1.5 + (index % 2),
        0.5,
        0,
        Math.PI * 2,
      );
      this.soilFallbackContext.fill();
      this.soilFallbackContext.fillStyle = "#d2aa71";
      this.soilFallbackContext.beginPath();
      this.soilFallbackContext.ellipse(
        x - 0.6,
        y - 0.7,
        1.5 + (index % 3),
        1 + (index % 2),
        0.5,
        0,
        Math.PI * 2,
      );
      this.soilFallbackContext.fill();
    }
  }
  private updateTerrain(level: WaterSimulation): void {
    const tc = this.terrainContext;
    const mc = this.maskContext;
    const wc = this.waterClipContext;
    mc.clearRect(0, 0, WIDTH, HEIGHT);
    mc.fillStyle = "#fff";
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS;) {
        if (!level.grid[row * COLS + col]) {
          col++;
          continue;
        }
        const start = col;
        while (col < COLS && level.grid[row * COLS + col]) col++;
        mc.fillRect(start * 7.5, row * 7.5, (col - start) * 7.5, 7.5);
      }
    tc.clearRect(0, 0, WIDTH, HEIGHT);
    tc.filter = "blur(4px)";
    tc.drawImage(this.mask, 0, 0);
    tc.filter = "none";
    const pixels = tc.getImageData(0, 0, WIDTH, HEIGHT);
    for (let index = 3; index < pixels.data.length; index += 4)
      pixels.data[index] = Math.max(
        0,
        Math.min(255, (pixels.data[index] - 110) * 6),
      );
    tc.putImageData(pixels, 0, 0);
    wc.clearRect(0, 0, WIDTH, HEIGHT);
    wc.drawImage(this.terrain, 0, 0);
    tc.globalCompositeOperation = "source-in";
    tc.fillStyle = tc.createPattern(this.assets.soil, "repeat")!;
    tc.fillRect(0, 0, WIDTH, HEIGHT);
    tc.globalCompositeOperation = "source-over";
    mc.clearRect(0, 0, WIDTH, HEIGHT);
    mc.drawImage(this.waterClip, 0, 2);
    mc.globalCompositeOperation = "destination-out";
    mc.drawImage(this.waterClip, 0, 0);
    mc.globalCompositeOperation = "source-in";
    mc.fillStyle = "#5b3b2959";
    mc.fillRect(0, 0, WIDTH, HEIGHT);
    mc.globalCompositeOperation = "source-over";
    tc.drawImage(this.mask, 0, 0);
    for (let row = 1; row < 75; row++)
      for (let col = 0; col < COLS; col++) {
        if (
          !level.grid[row * COLS + col] ||
          !this.originalGrid[row * COLS + col] ||
          this.originalGrid[(row - 1) * COLS + col]
        )
          continue;
        const x = col * 7.5;
        const y = row * 7.5;
        tc.fillStyle = "#567f34";
        tc.fillRect(x, y - 3, 7.7, 4);
        for (let blade = 0; blade < 3; blade++) {
          tc.fillStyle = blade % 2 ? "#9caf4c" : "#6d983e";
          tc.beginPath();
          tc.moveTo(x + blade * 3, y + 4);
          tc.lineTo(x + blade * 3 - 2, y - 6 - ((col + blade) % 5));
          tc.lineTo(x + blade * 3 + 3, y - 1);
          tc.fill();
        }
      }
    wc.fillStyle = "#fff";
    level.colliders.forEach((collider) =>
      wc.fillRect(
        collider.x * SCALE,
        collider.y * SCALE,
        collider.w * SCALE,
        collider.h * SCALE,
      ),
    );
    this.water.updateMask(level, this.waterClip);
    level.dirty = false;
  }
  private text(
    label: string,
    x: number,
    y: number,
    size = 12,
    color = "#ebdfb7",
  ): void {
    this.context.font = `600 ${size}px system-ui,sans-serif`;
    this.context.fillStyle = color;
    this.context.textAlign = "center";
    this.context.fillText(label, x, y);
  }
  private roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    fill: string | CanvasGradient,
  ): void {
    this.context.fillStyle = fill;
    this.context.beginPath();
    this.context.roundRect(x, y, w, h, radius);
    this.context.fill();
  }
  private drawCanteen(
    canteen: Canteen,
    level: WaterSimulation,
    _time: number,
  ): void {
    const x = canteen.x * SCALE;
    const y = canteen.y * SCALE;
    const age = canteen.filled
      ? Math.max(0, level.steps - canteen.filledAt)
      : 0;
    if (canteen.filled && age >= 78) return;
    this.context.save();
    this.context.translate(x, y);
    if (canteen.filled) {
      const u = Math.min(1, age / 78);
      const burst = Math.min(1, age / 24);
      const fade = 1 - Math.max(0, (u - 0.45) / 0.55);
      this.context.translate(0, -18 * u);
      const scale = 1 + 0.2 * Math.sin(Math.min(1, u / 0.58) * Math.PI);
      this.context.scale(scale, scale);
      const glow = this.context.createRadialGradient(
        0,
        0,
        3,
        0,
        0,
        24 + 32 * burst,
      );
      glow.addColorStop(0, `rgba(93,231,246,${0.65 * fade})`);
      glow.addColorStop(0.45, `rgba(255,226,111,${0.42 * fade})`);
      glow.addColorStop(1, "rgba(255,226,111,0)");
      this.context.fillStyle = glow;
      this.context.fillRect(-62, -62, 124, 124);
      this.context.strokeStyle = `rgba(192,255,252,${0.8 * (1 - burst) * fade})`;
      this.context.lineWidth = 3;
      this.context.beginPath();
      this.context.arc(0, 0, 22 + 28 * burst, 0, Math.PI * 2);
      this.context.stroke();
      for (let index = 0; index < 8; index++) {
        const angle = (index * Math.PI) / 4 + 0.25;
        const travel = 12 + 34 * burst;
        this.context.fillStyle = `rgba(${index % 2 ? "255,224,111" : "107,232,244"},${0.9 * fade})`;
        this.context.beginPath();
        this.context.arc(
          Math.cos(angle) * travel,
          Math.sin(angle) * travel,
          2.6 - 1.3 * burst,
          0,
          Math.PI * 2,
        );
        this.context.fill();
      }
      this.context.globalAlpha = fade;
    }
    this.context.shadowColor = "#24160b99";
    this.context.shadowBlur = 7;
    this.context.shadowOffsetY = 3;
    this.context.drawImage(this.assets.canteen, -29, -30, 58, 56);
    this.context.restore();
  }
  private drawPipe(intake: Intake, level: WaterSimulation, time: number): void {
    const x = intake.x * SCALE;
    const y = intake.y * SCALE;
    if (intake.dummy) {
      this.context.save();
      this.context.translate(x, y);
      this.context.rotate(
        { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[
          intake.facing
        ],
      );
      this.context.shadowColor = "#17120baa";
      this.context.shadowBlur = 7;
      this.context.shadowOffsetY = 4;
      const art = IntakeGeometry.cappedArtwork;
      this.context.drawImage(this.assets.dummy, art.x * SCALE, art.y * SCALE, art.w * SCALE, art.h * SCALE);
      this.context.restore();
      if (level.steps - level.lastWaste < 120)
        this.text("LEAK — NO HOSE", x, y - 47, 10, "#eed59f");
      return;
    }
    this.context.save();
    this.context.translate(x, y);
    const angle = {
      left: 0,
      up: Math.PI / 2,
      right: Math.PI,
      down: -Math.PI / 2,
    }[intake.facing];
    this.context.rotate(angle);
    this.context.shadowColor = "#17120baa";
    this.context.shadowBlur = 7;
    this.context.shadowOffsetY = 4;
    const art = IntakeGeometry.artwork;
    this.context.drawImage(this.assets.working, art.x * SCALE, art.y * SCALE, art.w * SCALE, art.h * SCALE);
    this.context.restore();
    const mouthX = x - 45 * Math.cos(angle);
    const mouthY = y - 45 * Math.sin(angle);
    if (level.steps - level.lastDelivery < 35) {
      const pulse = 0.35 + 0.3 * Math.sin(time / 130);
      this.context.strokeStyle = `rgba(107,235,242,${pulse})`;
      this.context.lineWidth = 3;
      this.context.beginPath();
      this.context.arc(mouthX, mouthY, 24, 0, Math.PI * 2);
      this.context.stroke();
      this.context.fillStyle = `rgba(76,215,238,${0.55 + pulse * 0.35})`;
      this.context.beginPath();
      this.context.ellipse(
        mouthX + 2,
        mouthY,
        12 + 3 * Math.sin(time / 90),
        16,
        0,
        0,
        Math.PI * 2,
      );
      this.context.fill();
    }
  }
  private drawCamp(level: WaterSimulation, time: number): void {
    const fireX = this.config.fire.x * SCALE;
    const fireY = this.config.fire.y * SCALE;
    const strength = Math.max(0, 1 - level.collected / level.required);
    const target = this.config.target;
    this.context.save();
    this.context.shadowColor = "#071a18cc";
    this.context.shadowBlur = 14;
    this.context.drawImage(
      this.assets.target,
      target.x * SCALE,
      target.y * SCALE,
      target.w * SCALE,
      target.h * SCALE,
    );
    this.context.restore();
    const glow = this.context.createRadialGradient(
      fireX,
      fireY - 12,
      2,
      fireX,
      fireY - 12,
      45,
    );
    glow.addColorStop(0, `rgba(255,168,58,${0.35 * strength})`);
    glow.addColorStop(1, "#f4893500");
    this.context.fillStyle = glow;
    this.context.fillRect(fireX - 48, fireY - 60, 96, 75);
    if (!level.won) {
      const flicker = Math.sin(time / 90) * 4;
      this.context.save();
      this.context.translate(fireX, fireY);
      this.context.scale(0.55 + 0.45 * strength, 0.25 + 0.75 * strength);
      this.context.fillStyle = "#ed8131";
      this.context.beginPath();
      this.context.moveTo(-13, 2);
      this.context.bezierCurveTo(-21, -13, -3, -20, -4, -39 + flicker);
      this.context.bezierCurveTo(10, -27, 1, -20, 13, -29 - flicker);
      this.context.bezierCurveTo(12, -11, 22, -2, 9, 3);
      this.context.closePath();
      this.context.fill();
      this.context.fillStyle = "#ffe4a0";
      this.context.beginPath();
      this.context.moveTo(-6, 2);
      this.context.quadraticCurveTo(-8, -10, 3, -22);
      this.context.quadraticCurveTo(1, -9, 8, -5);
      this.context.quadraticCurveTo(10, 3, -6, 2);
      this.context.fill();
      this.context.restore();
    }
    // The nozzle opening is part of the target artwork (1536 × 1024).
    // Anchor to that image so moving/resizing the target keeps spray attached.
    const hoseX = (target.x + target.w * (984 / 1536)) * SCALE;
    const hoseY = (target.y + target.h * (407 / 1024)) * SCALE;
    if (level.steps - level.lastDelivery < 50) {
      this.context.save();
      this.context.lineCap = "round";
      const size = target.w * SCALE / 237.5;
      const controlX = hoseX - 24 * size;
      const controlY = hoseY + 11 * size;
      for (let strand = -2; strand <= 2; strand++) {
        const endX = fireX + strand * 5 * size;
        const endY = fireY - 3 * size + Math.abs(strand) * 2 * size;
        this.context.strokeStyle = strand === 0 ? "#b8f8f3b8" : "#54d5e96b";
        this.context.lineWidth = (strand === 0 ? 2.4 : 1.6) * size;
        this.context.beginPath();
        this.context.moveTo(hoseX, hoseY);
        this.context.quadraticCurveTo(controlX + strand * size, controlY, endX, endY);
        this.context.stroke();
        // Small moving droplets separate as the jet fans toward the fire.
        for (let drop = 0; drop < 6; drop++) {
          const t = ((time / 650 + drop / 6 + strand * 0.071) % 1 + 1) % 1;
          const u = 1 - t;
          const x = u * u * hoseX + 2 * u * t * (controlX + strand * size) + t * t * endX;
          const y = u * u * hoseY + 2 * u * t * controlY + t * t * endY;
          this.context.fillStyle = "#dcffffc7";
          this.context.beginPath();
          this.context.ellipse(x, y, (0.55 + t * 0.6) * size, (0.9 + t) * size, 0.5, 0, Math.PI * 2);
          this.context.fill();
        }
      }
      this.context.restore();
    }
    if (level.won) this.text("FIRE OUT!", fireX, fireY - 32, 12, "#e9facb");
  }
  private drawWaterGlints(time: number): void {
    this.waterSurfaceContext.strokeStyle = "#dcffff4a";
    this.waterSurfaceContext.lineWidth = 1.5;
    this.waterSurfaceContext.lineCap = "round";
    this.waterSurfaceContext.beginPath();
    for (let index = 0; index < 85; index++) {
      const x = ((index * 83.77) % WIDTH) + Math.sin(time / 900 + index) * 4;
      const y = 55 + ((index * 47.13) % 505);
      this.waterSurfaceContext.moveTo(x, y);
      this.waterSurfaceContext.quadraticCurveTo(
        x + 8,
        y + Math.sin(time / 800 + index) * 2,
        x + 15 + (index % 3) * 7,
        y,
      );
    }
    this.waterSurfaceContext.stroke();
  }
}

/** Composes the fixed-step simulation, renderer and host lifecycle without global DOM state. */
export interface DigAndDouseOptions {
  level?: LevelDefinition;
  testMode?: boolean;
}
export class DigAndDouseGame implements GameSession {
  private assets?: GameAssets;
  private physicsModule?: any;
  private campaign!: CampaignProgress;
  private readonly levelPicker: HTMLSelectElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly hud: HudController;
  private level?: WaterSimulation;
  private renderer?: SceneRenderer;
  private readonly input: InputController;
  private showHint = false;
  private last = 0;
  private accumulator = 0;
  private paused = false;
  private muted: boolean;
  private disposed = false;
  private animationFrame = 0;
  private resizeFrame = 0;
  private readonly resizeObserver: ResizeObserver;
  private runDirty = false;
  private progressDirty = false;
  private completedThisRun = false;
  private persistedCanteensThisRun = 0;
  private activePlayTotal: number;
  private activeStepsSinceCredit = 0;
  private creditedActivePlayTotal: number;
  private activityStepsRemaining = 0;
  private progress: DigAndDouseProgress;
  readonly ready: Promise<void>;
  private readonly onVisibilityChange = (): void => {
    this.last = 0;
    this.accumulator = 0;
    this.input.clear();
  };

  constructor(
    target: HTMLElement,
    private readonly services: GameHostServices<DigAndDouseProgress>,
    private readonly options: DigAndDouseOptions = {},
  ) {
    this.root = document.createElement("section");
    this.root.className = "dig-and-douse";
    this.root.innerHTML = markup();
    target.replaceChildren(this.root);
    this.canvas = required(this.root, '[data-douse="game"]');
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(this.root);
    window.addEventListener("resize", this.scheduleResize);
    this.resizeBoard();
    this.hud = new HudController(this.root);
    this.input = new InputController(
      this.canvas,
      () => (this.paused ? undefined : this.level),
      () => this.noteMeaningfulDig(),
    );
    this.muted = services.muted;
    this.progress = loadDigAndDouseProgress(services.progress);
    this.campaign = new CampaignProgress(
      this.progress,
      LEVELS.map((level) => level.id),
    );
    this.levelPicker = document.createElement("select");
    this.levelPicker.setAttribute("aria-label", "Campaign level");
    this.levelPicker.className = "douse-level-picker";
    this.levelPicker.hidden = !!options.testMode || !!options.level;
    required(this.root, ".brief").append(this.levelPicker);
    this.levelPicker.addEventListener("change", () => {
      if (this.campaign.canPlay(this.levelPicker.value))
        this.changeLevel(getLevel(this.levelPicker.value));
    });
    this.nextButton = document.createElement("button");
    this.nextButton.type = "button";
    this.nextButton.textContent = "Next level →";
    this.nextButton.hidden = true;
    required(this.root, '[data-douse="win"] > div').append(this.nextButton);
    this.nextButton.addEventListener("click", () => {
      const next = this.level && getNextLevel(this.level.config.id);
      if (next && this.campaign.canPlay(next.id)) this.changeLevel(next);
    });
    this.activePlayTotal = services.activePlaySeconds;
    this.creditedActivePlayTotal = Math.floor(services.activePlaySeconds);
    this.hud.bind(
      () => this.restart(),
      () => {
        this.showHint = !this.showHint;
        this.hud.setHint(this.showHint);
      },
    );
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.ready = this.start();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.last = 0;
    this.accumulator = 0;
    if (paused) this.input.clear();
  }
  setMuted(muted: boolean): void {
    this.muted = muted;
  }
  status(): unknown {
    return {
      ready: !!this.level,
      paused: this.paused,
      muted: this.muted,
      progress: {
        ...this.progress,
        ownedRewardIds: [...this.progress.ownedRewardIds],
        completedLevelIds: [...this.progress.completedLevelIds],
        unlockedLevelIds: [...this.progress.unlockedLevelIds],
      },
      level: this.level?.snapshot() ?? null,
    };
  }
  flushProgress(): void {
    if (this.options.testMode) return;
    this.creditActivePlay();
    if (this.progressDirty) {
      this.services.saveProgress({
        ...this.progress,
        ownedRewardIds: [...this.progress.ownedRewardIds],
        completedLevelIds: [...this.progress.completedLevelIds],
        unlockedLevelIds: [...this.progress.unlockedLevelIds],
      });
      this.progressDirty = false;
    }
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    cancelAnimationFrame(this.resizeFrame);
    this.resizeObserver.disconnect();
    window.removeEventListener("resize", this.scheduleResize);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.input.clear();
    this.persistRun();
    this.flushProgress();
    this.level?.dispose();
    this.root.remove();
  }

  private readonly scheduleResize = (): void => {
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => this.resizeBoard());
  };

  private resizeBoard(): void {
    if (this.disposed) return;
    const shell = required<HTMLElement>(this.root, ".dig-and-douse__shell");
    const board = required<HTMLElement>(this.root, ".board");
    const rootRect = this.root.getBoundingClientRect();
    const windowHeight = Math.max(
      0,
      window.innerHeight - Math.max(0, rootRect.top),
    );
    const viewportHeight = Math.min(this.root.clientHeight, windowHeight);
    const nonBoardHeight = shell.scrollHeight - board.offsetHeight;
    const availableBoardHeight = Math.max(0, viewportHeight - nonBoardHeight);
    const aspectRatio = this.canvas.width / this.canvas.height;
    const maxWidth = Math.min(
      shell.clientWidth,
      availableBoardHeight * aspectRatio,
    );
    this.root.style.setProperty(
      "--douse-board-max-width",
      `${Math.max(1, Math.floor(maxWidth))}px`,
    );
  }

  private async start(): Promise<void> {
    try {
      if (!this.options.level) {
        await loadCampaignLevels();
        if (this.disposed) return;
        this.campaign = new CampaignProgress(
          this.progress,
          LEVELS.map((level) => level.id),
        );
      }
      const initialId = this.campaign.initial();
      if (!this.options.level && !initialId)
        throw new Error(
          "The campaign has no levels. Add a draft in the editor.",
        );
      const config = this.options.level ?? getLevel(initialId);
      const assets = await new AssetLoader().load();
      const factory = Box2DFactory as unknown as (options: {
        locateFile: (name: string) => string;
      }) => Promise<any>;
      const Box2D = await factory({ locateFile: () => box2dWasmUrl });
      if (this.disposed) return;
      this.assets = assets;
      this.physicsModule = Box2D;
      this.changeLevel(config);
      this.hud.setReady();
      this.hud.update(this.level!);
      this.animationFrame = requestAnimationFrame((time) => this.frame(time));
    } catch (error) {
      if (!this.disposed) {
        this.hud.setFailure();
        this.services.notify("Dig & Douse could not load its water physics.");
        console.error(error);
        required(this.root, '[data-douse="loading"] p').textContent =
          error instanceof Error ? error.message : "Unable to load this level.";
      }
    }
  }
  private changeLevel(config: LevelDefinition): void {
    if (!this.assets || !this.physicsModule || this.disposed) return;
    this.persistRun();
    this.creditActivePlay();
    this.level?.dispose();
    this.level = new WaterSimulation(this.physicsModule, config);
    this.renderer = new SceneRenderer(this.canvas, this.assets, config);
    this.renderer.setOriginalGrid(this.level.grid);
    this.resetRunState();
    this.showHint = false;
    this.hud.setHint(false);
    required<HTMLElement>(this.root, '[data-douse="hint"]').hidden =
      !config.hint.length;
    required(this.root, ".brief p").textContent = config.name;
    required(this.root, ".brief span").textContent = this.options.testMode
      ? "EDITOR TEST"
      : "";
    this.canvas.setAttribute(
      "aria-label",
      "Drag to dig soil and guide water to the open intake. Canteens are optional. Use arrow keys and hold Space to dig with the keyboard.",
    );
    if (!this.options.testMode) {
      this.progress.currentLevelId = config.id;
      this.progressDirty = true;
      this.flushProgress();
    }
    this.updateCampaignControls();
    this.scheduleResize();
  }
  private updateCampaignControls(): void {
    this.levelPicker.replaceChildren();
    for (const [index, level] of LEVELS.entries()) {
      const option = document.createElement("option");
      option.value = level.id;
      option.textContent = `${index + 1}. ${level.name}${this.progress.completedLevelIds.includes(level.id) ? " ✓" : this.campaign.canPlay(level.id) ? "" : " · Locked"}`;
      option.disabled = !this.campaign.canPlay(level.id);
      this.levelPicker.append(option);
    }
    this.levelPicker.value = this.level?.config.id ?? "";
    const next = this.level && getNextLevel(this.level.config.id);
    this.nextButton.hidden =
      !!this.options.testMode ||
      !!this.options.level ||
      !next ||
      !this.campaign.canPlay(next.id);
  }
  private resetRunState(): void {
    this.input.reset();
    this.accumulator = 0;
    this.last = 0;
    this.completedThisRun = false;
    this.persistedCanteensThisRun = 0;
    this.activityStepsRemaining = 0;
    this.runDirty = false;
    this.hud.resetReport();
    if (this.level) this.hud.update(this.level);
  }
  restart(): void {
    if (!this.level || !this.renderer) return;
    this.persistRun();
    this.level.reset();
    this.renderer.setOriginalGrid(this.level.grid);
    this.input.reset();
    this.accumulator = 0;
    this.last = 0;
    this.hud.resetReport();
    this.hud.update(this.level);
    this.completedThisRun = false;
    this.persistedCanteensThisRun = 0;
    this.activityStepsRemaining = 0;
    this.runDirty = false;
  }
  private persistRun(): void {
    if (this.options.testMode) return;
    if (!this.level || !this.runDirty) return;
    const filled = this.level.canteens.filter(
      (canteen) => canteen.filled,
    ).length;
    this.progress.bestCanteens = Math.max(this.progress.bestCanteens, filled);
    const newlyFilled = Math.max(0, filled - this.persistedCanteensThisRun);
    this.progress.totalCanteens += newlyFilled;
    this.persistedCanteensThisRun = filled;
    if (this.level.won && !this.completedThisRun) {
      this.completedThisRun = true;
      this.progress.firesExtinguished++;
      this.campaign.complete(this.level.config.id);
      if (
        !this.progress.ownedRewardIds.includes(DIG_AND_DOUSE_REWARD_ID) &&
        this.services.awardReward(DIG_AND_DOUSE_REWARD_ID)
      )
        this.progress.ownedRewardIds.push(DIG_AND_DOUSE_REWARD_ID);
      this.services.notify("Fire out! The camp lantern reward is ready.");
      this.updateCampaignControls();
    }
    this.progressDirty = true;
    this.runDirty = false;
    this.flushProgress();
  }
  private noteMeaningfulDig(): void {
    this.activityStepsRemaining = 8 * 60;
    this.runDirty = true;
  }
  private creditActivePlay(): void {
    if (this.options.testMode) {
      this.activeStepsSinceCredit = 0;
      return;
    }
    if (!this.activeStepsSinceCredit) return;
    this.activePlayTotal += this.activeStepsSinceCredit / 60;
    this.activeStepsSinceCredit = 0;
    const wholeSeconds = Math.floor(this.activePlayTotal);
    if (wholeSeconds > this.creditedActivePlayTotal) {
      this.creditedActivePlayTotal = wholeSeconds;
      this.services.creditActivePlay(wholeSeconds);
    }
  }
  private frame(time: number): void {
    if (!this.disposed && this.level && this.renderer && !document.hidden) {
      if (!this.paused) {
        this.accumulator += this.last
          ? Math.min((time - this.last) / 1000, 0.05)
          : 0;
        let steps = 0;
        while (this.accumulator >= 1 / 60 && steps < 3) {
          const wasWon = this.level.won;
          this.level.step();
          this.accumulator -= 1 / 60;
          steps++;
          if (this.activityStepsRemaining > 0 && !this.level.won) {
            this.activityStepsRemaining--;
            this.activeStepsSinceCredit++;
          }
          if (!wasWon && this.level.won) {
            this.runDirty = true;
            this.persistRun();
          }
        }
        if (this.activeStepsSinceCredit >= 60) this.creditActivePlay();
      }
      this.hud.update(this.level);
      this.renderer.draw(
        this.level,
        this.services.reducedMotion ? 0 : time,
        this.showHint,
        this.input.pointer,
      );
    }
    this.last = time;
    if (!this.disposed)
      this.animationFrame = requestAnimationFrame((next) => this.frame(next));
  }
}

function markup(): string {
  return `<div class="dig-and-douse__shell"><header><div><p class="eyebrow">BATTLE OF THE BOOKS · VISUAL PROTOTYPE</p><h1>Wildfire<span>Dig &amp; Douse</span></h1></div><button data-douse="reset" type="button" disabled>↻ Reset</button></header><div class="brief"><p>The forest relay</p><span>DEMO LEVEL 03</span></div><section class="board" aria-label="Dig and douse game"><canvas data-douse="game" width="600" height="750" tabindex="0" aria-label="Clear hillside soil to guide reservoir water to the side-facing blue-drop intake at the right. It powers a separate hose at the campsite below. Fill three optional golden canteens. Avoid the cracked intake at the bottom left. Drag to dig, or arrow keys and hold Space.">Your browser needs canvas and WebAssembly to play this game.</canvas><div data-douse="loading" class="overlay"><div><span class="loading-dot"></span><h2>Getting the water ready…</h2><p>Loading the physics engine</p></div></div><div data-douse="win" class="overlay victory" hidden><div><p class="eyebrow">NICE WORK</p><h2>Fire out!</h2><p data-douse="win-buddies"></p><button data-douse="again" type="button">Play again ↻</button></div></div></section><div class="readout"><div><span data-douse="state" aria-live="polite">Loading water physics…</span><span data-douse="drops">0% doused</span></div><progress data-douse="progress" max="100" value="0" aria-label="Water delivered to the hose"></progress></div><footer><p data-douse="buddies" aria-live="polite">Canteen buddies 0 / 3</p><button data-douse="hint" type="button" aria-pressed="false">Show a hint</button></footer><p class="prototype-note">Drag to clear soil · Grey stone stays put<br><span>Only the large open pipe mouth accepts water. Capped pipes block it.</span></p></div>`;
}
