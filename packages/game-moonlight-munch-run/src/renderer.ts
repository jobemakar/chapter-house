import {
  RunModel,
  Creature as RenderCreature,
  Pickup as RenderPickup,
  EnemyShot as RenderEnemyShot,
  Hazard as RenderHazard,
} from "./model";
interface SpriteCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Comic night-market scene and atlas renderer for Moonlight Munch Run. */
export class NightRenderer {
  private readonly road = new Image();
  private readonly sprites = new Image();
  private readonly motion = new Image();
  private readonly hazards = new Image();
  private readonly g: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
    this.road.src = new URL("./assets/comic-road.png", import.meta.url).href;
    this.sprites.src = new URL("./assets/comic-sprites.png", import.meta.url).href;
    this.motion.src = new URL("./assets/comic-motion.png", import.meta.url).href;
    this.hazards.src = new URL("./assets/comic-hazards.png", import.meta.url).href;
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    const width = Math.max(1, r.width || this.canvas.clientWidth || 1);
    const height = Math.max(1, r.height || this.canvas.clientHeight || 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.g.imageSmoothingEnabled = true;
    this.g.imageSmoothingQuality = "high";
  }

  private finite(value: number | undefined, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : fallback;
  }

  private ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
  ): void {
    const g = this.g;
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  }

  private roundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: string,
  ): void {
    const g = this.g;
    g.fillStyle = fill;
    g.beginPath();
    g.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
    g.fill();
  }

  private cellForWeapon(kind: unknown): SpriteCell {
    const value = String(kind ?? "straight").toLowerCase();
    if (value.includes("spread") || value === "1")
      return { x: 0.27, y: 0.56, width: 0.23, height: 0.44 };
    if (value.includes("pierce") || value === "2")
      return { x: 0.51, y: 0.56, width: 0.25, height: 0.44 };
    if (value.includes("rapid") || value === "3")
      return { x: 0.77, y: 0.56, width: 0.23, height: 0.44 };
    return { x: 0, y: 0.56, width: 0.25, height: 0.44 };
  }

  /** Initial normalized crops for the two-column hazard sheet. */
  private cellForHazard(kind: 0 | 1): SpriteCell {
    return kind === 1
      ? { x: 0.5, y: 0.2, width: 0.5, height: 0.59 }
      : { x: 0, y: 0.2, width: 0.5, height: 0.59 };
  }

  /** Four rows (truck, bat, leaf, boss), each with four source poses. */
  private cellForMotion(row: 0 | 1 | 2 | 3, frame: number): SpriteCell {
    const bossColumns: SpriteCell[] = [
      { x: 0, y: 0.713, width: 0.26, height: 0.274 },
      { x: 0.264, y: 0.713, width: 0.251, height: 0.274 },
      { x: 0.52, y: 0.713, width: 0.228, height: 0.274 },
      { x: 0.765, y: 0.713, width: 0.235, height: 0.274 },
    ];
    if (row === 3) return bossColumns[Math.max(0, Math.min(3, frame))];
    const y = [0, 0.252, 0.469][row] ?? 0;
    const height = [0.247, 0.214, 0.238][row] ?? 0.247;
    return {
      x: Math.max(0, Math.min(3, frame)) * 0.25,
      y,
      width: 0.25,
      height,
    };
  }

  /** Draw an atlas region centered in a box, preserving the authored sprite proportions. */
  private sprite(
    cell: SpriteCell,
    centerX: number,
    centerY: number,
    maxWidth: number,
    maxHeight: number,
    angle = 0,
    alpha = 1,
    scaleX = 1,
    scaleY = 1,
  ): boolean {
    return this.atlasSprite(
      this.sprites,
      cell,
      centerX,
      centerY,
      maxWidth,
      maxHeight,
      angle,
      alpha,
      scaleX,
      scaleY,
    );
  }

  private motionSprite(
    cell: SpriteCell,
    centerX: number,
    centerY: number,
    maxWidth: number,
    maxHeight: number,
    alpha = 1,
  ): boolean {
    return this.atlasSprite(
      this.motion,
      cell,
      centerX,
      centerY,
      maxWidth,
      maxHeight,
      0,
      alpha,
      1,
      1,
    );
  }

  private atlasSprite(
    image: HTMLImageElement,
    cell: SpriteCell,
    centerX: number,
    centerY: number,
    maxWidth: number,
    maxHeight: number,
    angle: number,
    alpha: number,
    scaleX: number,
    scaleY: number,
  ): boolean {
    if (!image.complete || image.naturalWidth <= 0) return false;
    const sw = image.naturalWidth * cell.width;
    const sh = image.naturalHeight * cell.height;
    const scale = Math.min(maxWidth / sw, maxHeight / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const g = this.g;
    g.save();
    g.globalAlpha *= alpha;
    g.translate(centerX, centerY);
    g.rotate(angle);
    g.scale(scaleX, scaleY);
    g.drawImage(
      image,
      image.naturalWidth * cell.x,
      image.naturalHeight * cell.y,
      sw,
      sh,
      -dw / 2,
      -dh / 2,
      dw,
      dh,
    );
    g.restore();
    return true;
  }

  private roadOffsetPixels(offset: number, tileWidth: number): number {
    return offset * tileWidth;
  }

  private drawScene(
    w: number,
    h: number,
    offset: number,
    reduced: boolean,
  ): void {
    const g = this.g;
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#101832");
    sky.addColorStop(0.56, "#222848");
    sky.addColorStop(1, "#12182f");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    if (this.road.complete && this.road.naturalWidth > 0) {
      const scale = h / this.road.naturalHeight;
      const tileWidth = this.road.naturalWidth * scale;
      const scroll = this.roadOffsetPixels(reduced ? 0 : offset, tileWidth);
      const wrapped = ((scroll % tileWidth) + tileWidth) % tileWidth;
      for (let x = -wrapped - tileWidth; x < w + tileWidth; x += tileWidth) {
        const sourceHeight = this.road.naturalHeight;
        const sourceWidth = this.road.naturalWidth;
        g.drawImage(
          this.road,
          0,
          0,
          sourceWidth,
          sourceHeight * 0.18,
          x,
          0,
          tileWidth,
          h * 0.12,
        );
        g.drawImage(
          this.road,
          0,
          sourceHeight * 0.18,
          sourceWidth,
          sourceHeight * 0.68,
          x,
          h * 0.12,
          tileWidth,
          h * 0.8,
        );
        g.drawImage(
          this.road,
          0,
          sourceHeight * 0.86,
          sourceWidth,
          sourceHeight * 0.14,
          x,
          h * 0.92,
          tileWidth,
          h * 0.08,
        );
      }
    }
    const shade = g.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, "#0a123325");
    shade.addColorStop(0.12, "#0a123300");
    shade.addColorStop(0.88, "#0a123300");
    shade.addColorStop(1, "#0a123340");
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);
  }

  private drawHazard(
    hazard: RenderHazard,
    w: number,
    h: number,
    reduced: boolean,
  ): void {
    const g = this.g;
    const x = hazard.x * w;
    const y = hazard.y * h;
    const width = Math.min(w * 0.045, 48);
    const height = Math.min(h * 0.075, 52);
    const warning = hazard.age < 0.65;
    this.ellipse(
      x,
      y + height * 0.32,
      width * 0.52,
      height * 0.14,
      "#11152b88",
    );
    if (warning) {
      // The landing silhouette and ring are telegraph effects. The authored
      // pothole/spore pixels appear only once the drop can actually collide.
      g.save();
      g.globalAlpha = reduced ? 0.46 : 0.56 + Math.sin(hazard.age * 18) * 0.18;
      g.strokeStyle = hazard.kind === 1 ? "#d67bd6" : "#ffd276";
      g.lineWidth = Math.max(2, Math.min(4, w * 0.004));
      g.setLineDash([6, 5]);
      g.beginPath();
      g.ellipse(x, y, width * 0.62 + 8, height * 0.45 + 8, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = hazard.kind === 1 ? "#7d467d66" : "#4e493866";
      g.beginPath();
      g.ellipse(
        x,
        y + height * 0.16,
        width * 0.37,
        height * 0.18,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
      g.restore();
      return;
    }
    this.atlasSprite(
      this.hazards,
      this.cellForHazard(hazard.kind),
      x,
      y,
      width,
      height,
      0,
      1,
      1,
      1,
    );
    if (hazard.contact) {
      g.save();
      g.globalAlpha = 0.28;
      g.strokeStyle = hazard.kind === 1 ? "#e599ec" : "#ffe39c";
      g.lineWidth = Math.max(1.5, w * 0.002);
      g.beginPath();
      g.ellipse(x, y, width * 0.58, height * 0.48, 0, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
  }

  private drawFireLock(
    fireLock: number,
    x: number,
    y: number,
    w: number,
  ): void {
    if (fireLock <= 0) return;
    const g = this.g;
    const label = `FIRE LOCK ${fireLock.toFixed(1)}s`;
    const fontSize = Math.max(10, Math.min(13, w * 0.014));
    g.save();
    g.font = `700 ${fontSize}px system-ui`;
    g.textAlign = "center";
    const width = g.measureText(label).width + 18;
    this.roundedRect(x - width / 2, y - 52, width, 22, 10, "#321a3dcc");
    g.fillStyle = "#ffb8df";
    g.fillText(label, x, y - 37);
    g.restore();
  }

  private drawEnemyShot(shot: RenderEnemyShot, w: number, h: number): void {
    const g = this.g;
    const x = shot.x * w;
    const y = shot.y * h;
    const length = Math.max(
      10,
      Math.min(34, Math.hypot(shot.vx, shot.vy) * w * 0.18),
    );
    g.save();
    g.translate(x, y);
    g.rotate(Math.atan2(shot.vy * h, shot.vx * w));
    g.globalAlpha = 0.26;
    g.fillStyle = "#f02c9b";
    g.fillRect(-length, -3, length, 6);
    g.globalAlpha = 1;
    g.fillStyle = "#e52f9c";
    g.beginPath();
    g.moveTo(10, 0);
    g.lineTo(0, 7);
    g.lineTo(-9, 0);
    g.lineTo(0, -7);
    g.closePath();
    g.fill();
    g.fillStyle = "#ff9fd4";
    g.beginPath();
    g.arc(0, -2, 2.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  private drawPickup(
    pickup: RenderPickup,
    w: number,
    h: number,
    t: number,
    reduced: boolean,
  ): void {
    const x = pickup.x * w;
    const y = pickup.y * h;
    const supply = pickup.type === "supplies";
    const bob = reduced
      ? 0
      : Math.sin(t * 3.2 + pickup.age * 2) * Math.min(6, h * 0.012);
    const color = supply ? "#63d6dc" : "#ffd17c";
    this.ellipse(
      x,
      y + h * 0.025,
      Math.min(w * 0.025, 22),
      Math.min(h * 0.012, 8),
      "#10152a66",
    );
    this.ellipse(
      x,
      y + bob,
      Math.min(w * 0.04, 30),
      Math.min(h * 0.03, 18),
      `${color}22`,
    );
    this.sprite(
      supply
        ? { x: 0, y: 0.56, width: 0.25, height: 0.44 }
        : this.cellForWeapon(pickup.type),
      x,
      y + bob,
      Math.min(w * 0.075, 48),
      Math.min(h * 0.11, 52),
    );
    const g = this.g;
    g.fillStyle = supply ? "#a9f3e6" : "#ffe3a2";
    g.font = `700 ${Math.max(9, Math.min(12, w * 0.013))}px system-ui`;
    g.textAlign = "center";
    g.fillText(
      supply ? "+ SUPPLIES" : String(pickup.type).toUpperCase(),
      x,
      y + bob - Math.min(h * 0.055, 24),
    );
    g.textAlign = "left";
  }

  private drawCreature(
    c: RenderCreature,
    w: number,
    h: number,
    t: number,
    reduced: boolean,
  ): void {
    const kind = String(c.kind).toLowerCase();
    const boss = c.boss === true || kind.includes("boss");
    const x = c.x * w;
    const y = c.y * h;
    const bw = boss ? Math.min(w * 0.13, 130) : Math.min(w * 0.058, 58);
    const bh = boss ? Math.min(h * 0.24, 150) : Math.min(h * 0.13, 70);
    const frame = reduced ? 0 : Math.floor(t * 8) % 4;
    const departure = Math.max(0, c.departure);
    const alpha = c.fed ? Math.max(0.18, 1 - departure / 2.2) : 1;
    const row = boss ? 3 : kind.includes("leaf") || kind === "1" ? 2 : 1;
    this.ellipse(x, y + bh * 0.35, bw * 0.42, bh * 0.11, "#0c112766");
    if (
      boss &&
      typeof c.hp === "number" &&
      typeof c.maxHp === "number" &&
      c.maxHp > 0
    ) {
      const ratio = Math.max(0, Math.min(1, c.hp / c.maxHp));
      const radius = Math.max(bw, bh) * 0.46;
      const g = this.g;
      g.save();
      g.lineWidth = Math.max(3, bw * 0.045);
      g.strokeStyle = "#24142f99";
      g.beginPath();
      g.arc(x, y, radius, -Math.PI / 2, Math.PI * 1.5);
      g.stroke();
      g.strokeStyle = "#ffcd75";
      g.beginPath();
      g.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      g.stroke();
      g.restore();
    }
    // The motion sheet changes source pixels; transforms stay fixed so the
    // generated wing, blink, breath, and wheel poses remain the animation.
    const motion = this.motionSprite(
      this.cellForMotion(row as 0 | 1 | 2 | 3, frame),
      x,
      y,
      bw,
      bh,
      alpha,
    );
    if (!motion) {
      const fallback = boss
        ? { x: 0.73, y: 0, width: 0.27, height: 0.54 }
        : row === 2
          ? { x: 0.51, y: 0, width: 0.22, height: 0.54 }
          : { x: 0.29, y: 0, width: 0.215, height: 0.54 };
      this.sprite(fallback, x, y, bw, bh, 0, alpha);
    }
    if (!boss && !c.fed && c.maxHp > 1) {
      for (let i = 0; i < c.maxHp; i++)
        this.ellipse(
          x + (i - (c.maxHp - 1) / 2) * 8,
          y - bh * 0.4,
          2.6,
          2.6,
          i < c.hp ? "#ffe3a2" : "#3d334b",
        );
    }
    if (c.fed) {
      const g = this.g;
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = "#fff0b5";
      g.font = `700 ${Math.max(11, Math.min(17, bw * 0.34))}px system-ui`;
      g.textAlign = "center";
      g.fillText("♥", x + bw * 0.4, y - bh * 0.42);
      g.restore();
    }
  }

  private drawBossBar(m: RunModel, w: number, h: number): void {
    const phase = String(m.phase ?? "").toLowerCase();
    const boss = m.creatures?.find(
      (c) => c.boss === true || String(c.kind).toLowerCase().includes("boss"),
    );
    if (phase !== "boss" && !boss) return;
    const max = this.finite(m.bossMaxHp, this.finite(boss?.maxHp, 1));
    const hp = this.finite(m.bossHp, this.finite(boss?.hp, max));
    const ratio = Math.max(0, Math.min(1, max > 0 ? hp / max : 0));
    const width = Math.min(w * 0.48, 390);
    const height = Math.max(12, Math.min(18, h * 0.026));
    const x = (w - width) / 2;
    const y = Math.max(12, h * 0.055);
    this.roundedRect(x - 8, y - 20, width + 16, height + 30, 12, "#10142dcc");
    const g = this.g;
    g.fillStyle = "#ffe2a1";
    g.font = `700 ${Math.max(10, Math.min(13, w * 0.014))}px system-ui`;
    g.textAlign = "center";
    g.fillText("MOONLIGHT BOSS", w / 2, y - 7);
    this.roundedRect(x, y, width, height, height / 2, "#3a1a4399");
    if (ratio > 0)
      this.roundedRect(x, y, width * ratio, height, height / 2, "#e54aaf");
    g.textAlign = "left";
  }

  draw(model: RunModel, reduced: boolean): void {
    const m = model;
    const g = this.g;
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
    const t = this.finite(m.clock, 0);
    const creatures = Array.isArray(m.creatures) ? m.creatures : [];
    const shots = Array.isArray(m.shots) ? m.shots : [];
    const pickups = Array.isArray(m.pickups) ? m.pickups : [];
    const sparks = Array.isArray(m.sparks) ? m.sparks : [];
    const enemyShots = Array.isArray(m.enemyShots) ? m.enemyShots : [];
    const hazards = Array.isArray(m.hazards) ? m.hazards : [];
    const monsterFrame = reduced ? 0 : Math.floor(t * 8) % 4;
    const truckFrame =
      reduced || m.phase === "boss" ? 0 : Math.floor(t * 6) % 4;
    this.canvas.dataset.spriteFrame = `truck-${truckFrame};monster-${monsterFrame}`;
    this.g.clearRect(0, 0, w, h);
    this.drawScene(w, h, this.finite(m.roadOffset, t * 0.08), reduced);
    for (const hazard of hazards) this.drawHazard(hazard, w, h, reduced);
    for (const shot of enemyShots) this.drawEnemyShot(shot, w, h);
    for (const pickup of pickups) this.drawPickup(pickup, w, h, t, reduced);
    for (const shot of shots) {
      const x = shot.x * w;
      const y = shot.y * h;
      const angle = reduced
        ? 0
        : Math.atan2(this.finite(shot.vy, 0), this.finite(shot.vx, 1));
      // Serving baskets label pickups; projectiles remain food. Kind 1 stretches
      // the bun for piercing and kind 2 enlarges it for the special serving.
      this.ellipse(
        x,
        y,
        Math.min(w * 0.018, 13),
        Math.min(h * 0.012, 8),
        "#ffd06b2e",
      );
      this.sprite(
        this.cellForWeapon("straight"),
        x,
        y,
        Math.min(w * 0.047, 34),
        Math.min(h * 0.07, 38),
        angle,
        1,
        shot.kind === 1 ? 1.4 : shot.kind === 2 ? 1.2 : 1,
        shot.kind === 1 ? 0.7 : shot.kind === 2 ? 1.2 : 1,
      );
    }
    for (const creature of creatures)
      this.drawCreature(creature, w, h, t, reduced);
    const truckX = this.finite(m.truckX, 0.16) * w;
    const truckY = this.finite(m.truckY, 0.5) * h;
    const tw = Math.min(w * 0.11, 125);
    const th = Math.min(h * 0.22, 135);
    this.ellipse(truckX, truckY + th * 0.35, tw * 0.46, th * 0.1, "#0c112a88");
    if (this.finite(m.burstCharge, 0) >= 1) {
      g.save();
      g.globalAlpha = reduced ? 0.35 : 0.5 + Math.sin(t * 4) * 0.12;
      g.strokeStyle = "#80ecdc";
      g.lineWidth = Math.max(2, w * 0.004);
      g.beginPath();
      g.arc(truckX, truckY, Math.max(tw, th) * 0.55, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    const motionTruck = this.motionSprite(
      this.cellForMotion(0, truckFrame),
      truckX,
      truckY,
      tw,
      th,
    );
    if (!motionTruck)
      this.sprite(
        { x: 0, y: 0, width: 0.28, height: 0.54 },
        truckX,
        truckY,
        tw,
        th,
      );
    this.drawFireLock(this.finite(m.fireLock, 0), truckX, truckY, w);
    for (const spark of sparks) {
      if (spark.age < 0) continue;
      const life = Math.max(0, Math.min(1, spark.age / 0.8));
      g.globalAlpha = 1 - life;
      this.ellipse(
        spark.x * w,
        spark.y * h,
        Math.max(2, w * 0.004),
        Math.max(2, h * 0.006),
        `hsl(${spark.hue} 92% 74%)`,
      );
    }
    g.globalAlpha = 1;
    this.drawBossBar(m, w, h);
  }
}
