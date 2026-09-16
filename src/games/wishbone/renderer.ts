import Matter from "matter-js";
import { assetUrl } from "../../core/asset-url";
import { PowerYard, definitions } from "./powers";
import { TUNE } from "./yard";
import { drawPlush } from "./plush";
import type { PieceBody, Life, AimInput } from "./types";
import { WishboneScenery } from "./scenery";
const colors = ["#e6ac64", "#7ea59a", "#df8569", "#d1af63"];
function round(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | null,
  stroke?: string,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
function line(
  c: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  width = 2,
) {
  c.beginPath();
  points.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  c.stroke();
}
function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
function sock(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 1,
  angle = 0,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(size, size);
  round(c, -18, -14, 36, 28, 13, "#fff4d6", "#aa7355");
  round(c, -18, -14, 12, 28, 5, "#df7954");
  line(
    c,
    [
      [-12, -11],
      [-12, 11],
    ],
    "#f8c991",
    3,
  );
  line(
    c,
    [
      [1, -9],
      [7, -1],
      [3, 8],
    ],
    "#ddd6b8",
    2,
  );
  c.restore();
}
function squeaker(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  color = 0,
  scale = 1,
  life: Life = {},
) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const fill = ["#e59b38", "#db795e", "#68a79b", "#a38cbc"][color % 4];
  // Rubber animal: round body, two soft ears, and an unmistakable face.
  const wiggle = life.reduced ? 0 : Math.sin((life.time || 0) * 4) * 2;
  ellipse(c, -12 - wiggle, -14, 7, 11, fill);
  ellipse(c, 12 + wiggle, -14, 7, 11, fill);
  ellipse(c, 0, 1, 20, 19, fill);
  ellipse(c, -5, 7, 8, 7, "#fff1cc");
  ellipse(c, 6, 7, 8, 7, "#fff1cc");
  const blink = !life.reduced && (life.time || 0) % 3.8 < 0.14;
  const eyeHeight = blink ? 0.6 : life.near ? 4.5 : 3;
  const look = life.look || 0;
  ellipse(c, -7 + look, -2, 2.3, eyeHeight, "#374940");
  ellipse(c, 7 + look, -2, 2.3, eyeHeight, "#374940");
  if (life.near) ellipse(c, 0, 14, 3, 3.5, "#765b42");
  ellipse(c, 0, 5, 3, 2.5, "#765b42");
  line(
    c,
    [
      [-4, 13],
      [0, 15],
      [4, 13],
    ],
    "#99674c",
    1.5,
  );
  c.restore();
}
function prop(c: CanvasRenderingContext2D, b: PieceBody, life: Life) {
  const p = b.game;
  c.save();
  c.translate(b.position.x, b.position.y);
  c.rotate(b.angle);
  if (p.kind === "target") {
    squeaker(c, 0, 0, p.color, 1, life);
    c.restore();
    return;
  }
  const w = p.w,
    h = p.h;
  if (p.kind === "box") {
    round(c, -w / 2, -h / 2, w, h, 4, colors[p.color], "#80664c");
    round(c, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 1, null, "#fff0c75c");
    c.fillStyle = "#f7dda88c";
    c.fillRect(-7, -h / 2, 14, h);
    line(
      c,
      [
        [-w / 2 + 6, 0],
        [w / 2 - 6, 0],
      ],
      "#745b4633",
    );
    c.fillStyle = "#5e63535c";
    c.font = "bold 13px DM";
    c.textAlign = "left";
    c.fillText("↑↑", -w / 2 + 9, h / 2 - 12);
  } else if (p.kind === "plank") {
    round(c, -w / 2, -h / 2, w, h, 4, "#b98152", "#795b42");
    line(
      c,
      [
        [-w / 2 + 8, -3],
        [w / 2 - 9, -3],
      ],
      "#e9bf87",
      2,
    );
    line(
      c,
      [
        [-w / 2 + 16, 4],
        [w / 2 - 28, 4],
      ],
      "#916139",
      1,
    );
    ellipse(c, -w / 2 + 11, 1, 2, 2, "#735443");
    ellipse(c, w / 2 - 11, 1, 2, 2, "#735443");
  } else if (p.kind === "bucket") {
    // These keep the legacy "bucket" physics kind but read as magnetic blocks.
    round(c, -w / 2, -h / 2, w, h, 5, "#78959a", "#405b62");
    round(c, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 3, "#a8c2c0", "#55737a");
    c.fillStyle = "#e7f0df88";
    c.fillRect(-w / 2 + 8, -h / 2 + 7, w - 16, 6);
    c.fillStyle = "#48676f66";
    c.fillRect(-w / 2 + 7, 2, w - 14, h / 2 - 6);
    for (const x of [-w / 2 + 8, w / 2 - 8])
      for (const y of [-h / 2 + 8, h / 2 - 8]) {
        ellipse(c, x, y, 3, 3, "#e9e6ca");
        ellipse(c, x - 0.7, y - 0.7, 1, 1, "#ffffff");
      }
  } else if (p.kind === "cushion") {
    round(c, -w / 2, -h / 2, w, h, 12, "#de8e87", "#aa6d65");
    line(
      c,
      [
        [-w / 2 + 10, 0],
        [w / 2 - 10, 0],
      ],
      "#f5c4ad",
      2,
    );
    for (let x = -25; x <= 25; x += 25) ellipse(c, x, 0, 2, 2, "#a86a67");
  }
  c.restore();
}

function powerIcon(
  c: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  size = 22,
) {
  const p = definitions.find((p) => p.id === id) ?? definitions[0];
  ellipse(c, x, y, size, size, p.color);
  c.strokeStyle = "#5d6655";
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = "#283c35";
  c.font = "bold " + Math.round(size * 1.2) + "px DM";
  c.textAlign = "center";
  c.fillText(p.icon, x, y + size * 0.4);
}
function gadgetLabel(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) {
  c.font = "600 14px DM";
  c.textAlign = "center";
  const w = (c.measureText(text)?.width || text.length * 8) + 16;
  round(c, x - w / 2, y - 17, w, 24, 6, "#fff8e8", "#d7c6a4");
  c.fillStyle = "#35483c";
  c.fillText(text, x, y);
}
function gadgets(
  c: CanvasRenderingContext2D,
  yard: PowerYard,
  time: number,
  reduced: boolean,
) {
  c.save();
  if (yard.hasMechanism("magnet")) {
    const f = yard.field,
      button = yard.button.position;
    c.setLineDash([7, 8]);
    c.strokeStyle = yard.polarity === -1 ? "#b97d6a99" : "#4f928499";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    gadgetLabel(
      c,
      yard.polarity === 0
        ? "MAGNET OFF"
        : yard.polarity === 1
          ? "PULL IN"
          : "PUSH OUT",
      f.x + 90,
      f.y - 6,
    );
    // A clear red horseshoe at the field centre, connected to its control.
    c.save();
    c.translate(f.x, f.y);
    c.rotate(-0.22);
    c.beginPath();
    c.moveTo(-23, -22);
    c.lineTo(-23, 5);
    c.arc(0, 5, 23, Math.PI, 0, true);
    c.lineTo(23, -22);
    c.strokeStyle = "#c9473e";
    c.lineWidth = 15;
    c.lineCap = "round";
    c.stroke();
    c.lineCap = "butt";
    round(c, -30, -28, 14, 14, 3, "#e7e7d9", "#657579");
    round(c, 16, -28, 14, 14, 3, "#e7e7d9", "#657579");
    c.restore();
    line(
      c,
      [
        [f.x + 17, f.y + 26],
        [button.x - 22, button.y + 12],
      ],
      "#5d746b",
      2,
    );
    round(c, button.x - 28, button.y - 1, 56, 32, 10, "#688e85", "#3f685d");
    ellipse(
      c,
      button.x,
      button.y - 2,
      23,
      12,
      yard.polarity === -1 ? "#df927c" : "#a4d0b6",
    );
    c.fillStyle = "#304c43";
    c.font = "bold 16px DM";
    c.textAlign = "center";
    c.fillText(
      yard.polarity === 0 ? "↔ OFF" : yard.polarity === 1 ? "⇢ PULL" : "⇠ PUSH",
      button.x,
      button.y + 3,
    );
    for (const b of yard.pieces)
      if (b.game.kind === "bucket") {
        line(
          c,
          [
            [b.position.x - 14, b.position.y - 30],
            [b.position.x, b.position.y - 40],
            [b.position.x + 14, b.position.y - 30],
          ],
          "#386b64",
          3,
        );
      }
  }
  if (yard.hasMechanism("lever")) {
    const l = yard.lever.position,
      g = yard.gate.position;
    line(
      c,
      [
        [l.x, l.y + 38],
        [l.x, 620],
        [g.x, 620],
        [g.x, 600],
      ],
      yard.gateOpen ? "#77a38e" : "#bca27e",
      3,
    );
    round(c, l.x - 19, l.y + 25, 38, 15, 5, "#9e8060");
    c.save();
    c.translate(l.x, l.y + 25);
    c.rotate(yard.gateOpen ? 0.7 : -0.5);
    round(c, -5, -58, 10, 58, 5, "#8b7052");
    ellipse(c, 0, -58, 17, 17, yard.gateOpen ? "#83b59d" : "#df9067");
    c.restore();
    gadgetLabel(c, "LEVER", l.x - 45, l.y + 60);
    round(c, g.x - 12, g.y - 110, 24, 220, 5, "#a88a61", "#6f6247");
    for (let y = g.y - 99; y < g.y + 104; y += 22)
      line(
        c,
        [
          [g.x - 9, y],
          [g.x + 9, y + 12],
        ],
        "#edce87",
        4,
      );
    gadgetLabel(c, yard.gateOpen ? "OPEN" : "GATE", g.x, g.y - 120);
  }
  if (yard.hasMechanism("bellows")) {
    const b = yard.bellows.position,
      compressed = yard.time - yard.bellowsAt < 0.3;
    // Physics keeps its established bellows identifier; the player sees a spring pad.
    round(c, b.x - 42, b.y + 17, 84, 15, 7, "#526d77", "#354f58");
    line(
      c,
      [
        [b.x - 29, b.y + 17],
        [b.x - 18, compressed ? b.y + 9 : b.y - 2],
        [b.x - 7, b.y + 17],
        [b.x + 4, compressed ? b.y + 9 : b.y - 2],
        [b.x + 15, b.y + 17],
        [b.x + 26, compressed ? b.y + 9 : b.y - 2],
        [b.x + 31, b.y + 17],
      ],
      "#e6d66f",
      4,
    );
    round(
      c,
      b.x - 38,
      compressed ? b.y + 3 : b.y - 11,
      76,
      17,
      8,
      "#df7954",
      "#954f45",
    );
    line(
      c,
      [
        [b.x - 25, compressed ? b.y + 11 : b.y - 3],
        [b.x + 24, compressed ? b.y + 11 : b.y - 3],
      ],
      "#ffd59b",
      2,
    );
    gadgetLabel(c, "SPRING PAD", b.x, b.y + 62);
    if (yard.time < yard.gustUntil)
      for (let i = 0; i < 5; i++) {
        const x = b.x - 50 + i * 25,
          y = 550 - (reduced ? 70 : (time * 220 + i * 45) % 200);
        line(
          c,
          [
            [x, y + 35],
            [x + 5, y],
            [x - 2, y + 8],
          ],
          "#e6fff1",
          4,
        );
      }
  }
  c.restore();
}
export class WishboneRenderer {
  canvas: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  background: HTMLImageElement;
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }[] = [];
  labels: { text: string; x: number; y: number; life: number }[] = [];
  shake = 0;
  clock = 0;
  pullSway = 0;
  previousPull = { x: 0, y: 0 };
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d")!;
    this.background = new Image();
    this.background.src = assetUrl("backdrop.png");
    this.particles = [];
    this.labels = [];
    this.shake = 0;
    this.clock = 0;
    this.pullSway = 0;
    this.previousPull = { x: 0, y: 0 };
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(),
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }
  private drawFence(left: number, right: number) {
    const c = this.c;
    // Muted sage verge and warm ivory wood echo the watercolor without stealing focus.
    c.fillStyle = "#789467";
    c.fillRect(left, 576, right - left, 26);
    for (const y of [532, 559]) {
      round(c, left, y, right - left, 12, 2, "#dedbc0", "#9eaa83");
      line(
        c,
        [
          [left, y + 2],
          [right, y + 2],
        ],
        "#f7f0d3",
        3,
      );
    }
    for (let x = Math.floor(left / 34) * 34; x < right; x += 34) {
      const top = 513 + Math.sin(x * 0.07) * 2;
      c.beginPath();
      c.moveTo(x, 582);
      c.lineTo(x, top + 10);
      c.lineTo(x + 9, top);
      c.lineTo(x + 18, top + 10);
      c.lineTo(x + 18, 582);
      c.closePath();
      c.fillStyle = "#eee8ce";
      c.fill();
      c.strokeStyle = "#aab18e";
      c.lineWidth = 1.5;
      c.stroke();
      line(
        c,
        [
          [x + 4, top + 13],
          [x + 4, 578],
        ],
        "#fff8df",
        2,
      );
    }
    for (let x = Math.floor(left / 306) * 306; x < right; x += 306) {
      round(c, x - 4, 504, 26, 83, 3, "#e1dec1", "#9ca886");
      round(c, x - 7, 501, 32, 8, 3, "#f4edd3", "#aab18e");
      ellipse(c, x + 9, 499, 9, 5, "#f4edd3");
    }
    for (let x = Math.floor(left / 23) * 23; x < right; x += 23) {
      line(
        c,
        [
          [x, 596],
          [x + 4, 583],
          [x + 9, 594],
        ],
        "#91ae75",
        3,
      );
    }
  }
  burst(x: number, y: number, color: string, reduced: boolean) {
    for (let i = 0; i < (reduced ? 4 : 18); i++) {
      const a = Math.random() * Math.PI * 2,
        speed = 40 + Math.random() * 110;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 70,
        life: 0.9,
        color,
      });
    }
  }
  label(text: string, x: number, y: number) {
    this.labels.push({ text, x, y, life: 1.3 });
  }
  draw(
    yard: PowerYard,
    input: AimInput | null,
    dt: number,
    reduced: boolean,
    paused: boolean,
    camera?: { x: number; y: number; zoom: number },
  ) {
    const c = this.c,
      W = 1200,
      H = 720,
      worldW = yard.world.width;
    const view = camera ?? { x: W / 2, y: H / 2, zoom: 1 };
    if (!paused) this.clock += dt;
    c.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / H, 0, 0);
    c.clearRect(0, 0, W, H);
    c.save();
    if (!reduced && this.shake > 0) {
      c.translate(
        Math.sin(this.clock * 97) * this.shake,
        Math.cos(this.clock * 83) * this.shake * 0.5,
      );
      this.shake = Math.max(0, this.shake - dt * 18);
    }
    const scenery = WishboneScenery.layout(view, worldW, reduced);
    // The old painting includes a fence. Use only its sky/mountain region;
    // the fence below is a separate near-world layer, not baked-in scenery.
    if (this.background.complete && this.background.naturalWidth)
      c.drawImage(
        this.background,
        0,
        0,
        this.background.naturalWidth,
        Math.floor(this.background.naturalHeight * 0.665),
        scenery.farLeft,
        scenery.farTop,
        scenery.farWidth,
        scenery.farHeight,
      );
    else {
      c.fillStyle = "#dce8d0";
      c.fillRect(0, 0, W, H);
    }
    // A pale sky wash keeps the playable silhouettes clear against the painting.
    const wash = c.createLinearGradient(0, 0, 0, 600);
    wash.addColorStop(0, "#fbf7e680");
    wash.addColorStop(1, "#fbf7e608");
    c.fillStyle = wash;
    c.fillRect(0, 0, W, 600);
    // Lawn reaches the screen bottom even when the physics world is zoomed out.
    const ground = c.createLinearGradient(0, scenery.groundY, 0, H);
    ground.addColorStop(0, "#b9d093");
    ground.addColorStop(0.18, "#a8c781");
    ground.addColorStop(1, "#7fa366");
    c.fillStyle = ground;
    c.fillRect(0, scenery.groundY - 1, W, Math.max(0, H - scenery.groundY + 1));
    // Fence follows zoom and vertical ground exactly, with only a tiny horizontal lag.
    c.save();
    c.translate(600 + scenery.fenceX, scenery.groundY);
    c.scale(view.zoom, view.zoom);
    c.translate(-600, -WishboneScenery.floorY);
    this.drawFence(scenery.fenceLeft, scenery.fenceRight);
    c.restore();
    // Every physical thing now shares the camera transform, including flight marks
    // and labels. UI remains DOM-fixed above this canvas.
    c.save();
    c.translate(W / 2, H / 2);
    c.scale(view.zoom, view.zoom);
    c.translate(-view.x, -view.y);
    // The collision floor is part of the world, so shadows and pieces never float
    // when zooming or panning.
    line(
      c,
      [
        [20, 602],
        [worldW - 20, 602],
      ],
      "#71855d99",
      3,
    );
    // This platform belongs to the world, rather than the screen-painted
    // backdrop, so distant structures stay visibly grounded while panning.
    for (let x = 25; x < worldW; x += 46) {
      line(
        c,
        [
          [x, 603],
          [x + 7, 594],
          [x + 13, 603],
        ],
        "#6d925b",
        2,
      );
    }
    gadgets(c, yard, this.clock, reduced);
    // Shadows establish one consistent ground line.
    for (const b of yard.pieces)
      if (!yard.rescued.has(b.game.id)) {
        const size = Math.max(12, (b.game.w || 40) * 0.44);
        ellipse(c, b.position.x, 605, size, 5, "#4a684014");
      }
    ellipse(c, yard.dog.position.x, 606, 53, 8, "#435d4638");
    // A crooked fork is planted to Wishbone's right. The leather pouch and dog
    // sit left of it, so the fork never cuts over his face.
    line(
      c,
      [
        [242, 570],
        [242, 438],
        [268, 390],
      ],
      "#795435",
      18,
    );
    line(
      c,
      [
        [242, 568],
        [242, 438],
        [268, 391],
      ],
      "#c6965d",
      7,
    );
    // The left branch makes the rear band a real part of the planted fork,
    // rather than a floating anchor.
    line(
      c,
      [
        [242, 438],
        [215, 390],
      ],
      "#795435",
      18,
    );
    line(
      c,
      [
        [242, 438],
        [215, 391],
      ],
      "#c6965d",
      7,
    );
    const heldX =
      TUNE.origin.x -
      (input ? (input.velocity.x / TUNE.launchScale) * 0.48 : 0);
    const heldY =
      TUNE.origin.y -
      (input ? (input.velocity.y / TUNE.launchScale) * 0.48 : 0);
    if (yard.mode === "ready") {
      line(
        c,
        [
          [215, 390],
          [heldX - 23, heldY + 15],
        ],
        "#754c49",
        8,
      );
      round(c, heldX - 32, heldY + 9, 53, 25, 9, "#8d5b42", "#56382b");
      // Both elastic bands sit behind the payload. The front band attaches at
      // the pouch edge, leaving Wishbone's head completely unobstructed.
      line(
        c,
        [
          [heldX + 23, heldY + 16],
          [242, 438],
        ],
        "#5d3830",
        7,
      );
      ellipse(c, 242, 438, 8, 8, "#e0b57c");
    } else
      line(
        c,
        [
          [215, 390],
          [142, 460],
        ],
        "#754c49",
        6,
      );
    // A soft patch below the launcher fits the plush-toy tone.
    round(c, 100, 540, 128, 34, 16, "#db9b80", "#a87059");
    round(c, 106, 539, 116, 22, 11, "#f1c7a2", "#c38b6a");
    const origin = TUNE.origin;
    if (yard.cooldown <= 0) {
      c.beginPath();
      c.arc(
        origin.x,
        origin.y,
        66 + (reduced ? 0 : Math.sin(this.clock * 3) * 2),
        0,
        Math.PI * 2,
      );
      c.fillStyle = "#fff9de95";
      c.fill();
      c.strokeStyle = "#b67b4d99";
      c.lineWidth = 2;
      c.setLineDash([5, 7]);
      c.stroke();
      c.setLineDash([]);
      let x = origin.x,
        y = origin.y;
      if (input) {
        x -= (input.velocity.x / TUNE.launchScale) * 0.48;
        y -= (input.velocity.y / TUNE.launchScale) * 0.48;
        line(
          c,
          [
            [215, 390],
            [x, y],
          ],
          "#b8724d",
          5,
        );
        let px = origin.x,
          py = origin.y,
          vx = input.velocity.x,
          vy = input.velocity.y;
        // Same fixed step, gravity and air drag as the sock, stopping at the first prop.
        const blockers = [
          ...yard.pieces,
          ...(yard.hasMechanism("lever") ? [yard.gate] : []),
        ].filter(
          (b) =>
            !(
              "id" in (b.game || {}) &&
              yard.rescued.has((b as PieceBody).game.id)
            ),
        );
        for (let n = 0; n < 210; n++) {
          vx *= 0.9985;
          vy = vy * 0.9985 + 0.145833;
          px += vx * 0.5;
          py += vy * 0.5;
          if (py > 585 || px > worldW - 20 || px < 20) break;
          if (n % 9 === 0) {
            ellipse(
              c,
              px,
              py,
              Math.max(2, 5 - n * 0.012),
              Math.max(2, 5 - n * 0.012),
              "#fffbed",
            );
          }
          if (Matter.Query.point(blockers, { x: px, y: py }).length) {
            c.beginPath();
            c.arc(px, py, 13, 0, Math.PI * 2);
            c.strokeStyle = "#fffbed";
            c.lineWidth = 3;
            c.stroke();
            break;
          }
        }
        round(c, 107, 647, 110, 8, 4, "#f6eed2aa");
        round(
          c,
          107,
          647,
          Math.max(1, 110 * input.velocity.power),
          8,
          4,
          "#df7954",
        );
      }
      // The same plush is drawn below, with a pull offset while held.
    }
    if (!yard.shots && !input) {
      line(
        c,
        [
          [140, 490],
          [86, 526],
          [101, 526],
        ],
        "#fffbe7",
        4,
      );
      line(
        c,
        [
          [86, 526],
          [88, 511],
        ],
        "#fffbe7",
        4,
      );
    }
    for (const b of yard.pieces)
      if (!yard.rescued.has(b.game.id)) {
        if (b.game.kind === "target") {
          const pulse = reduced ? 0 : Math.sin(this.clock * 3 + b.game.id) * 2;
          c.beginPath();
          c.arc(b.position.x, b.position.y, 29 + pulse, 0, Math.PI * 2);
          c.strokeStyle = "#fff9dd";
          c.lineWidth = 2;
          c.setLineDash([3, 5]);
          c.stroke();
          c.setLineDash([]);
        }
        prop(c, b, {
          time: this.clock + b.id * 0.73,
          reduced,
          near:
            yard.mode === "flight" &&
            Math.hypot(
              b.position.x - yard.dog.position.x,
              b.position.y - yard.dog.position.y,
            ) < 190,
          look: Math.max(
            -1.5,
            Math.min(1.5, (yard.dog.position.x - b.position.x) / 140),
          ),
        });
      }
    const pull = input
      ? {
          x: (-input.velocity.x / TUNE.launchScale) * 0.48,
          y: (-input.velocity.y / TUNE.launchScale) * 0.48,
        }
      : { x: 0, y: 0 };
    if (!paused) {
      const movement = input
        ? pull.x - this.previousPull.x + (pull.y - this.previousPull.y) * 0.5
        : 0;
      this.pullSway = reduced
        ? 0
        : Math.max(
            -0.65,
            Math.min(
              0.65,
              this.pullSway * Math.exp(-dt * 9) - movement * 0.012,
            ),
          );
      this.previousPull = { ...pull };
    }
    drawPlush(c, yard.plush, pull, reduced ? 0 : yard.squash, {
      time: this.clock,
      reduced,
      ready: yard.mode === "ready",
      held: !!input,
      power: input ? input.velocity.power : 0,
      aim: input
        ? Math.atan2(input.velocity.y, Math.max(1, input.velocity.x))
        : 0,
      sway: this.pullSway,
    });
    // The pouch rim deliberately covers only Wishbone's lower body. His face
    // and ears remain clear at rest and at full draw.
    if (yard.mode === "ready") {
      line(
        c,
        [
          [heldX - 30, heldY + 10],
          [heldX - 19, heldY + 25],
          [heldX + 7, heldY + 29],
          [heldX + 23, heldY + 16],
        ],
        "#5d382b",
        5,
      );
      line(
        c,
        [
          [heldX - 25, heldY + 13],
          [heldX + 12, heldY + 19],
        ],
        "#d6a06d",
        2,
      );
    }
    for (const p of this.particles) {
      if (!paused && !input) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
      }
      c.globalAlpha = Math.max(0, p.life);
      ellipse(c, p.x, p.y, 4, 4, p.color);
    }
    c.globalAlpha = 1;
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.labels) {
      if (!paused && !input) {
        p.life -= dt;
        if (!reduced) p.y -= 25 * dt;
      }
      c.globalAlpha = Math.min(1, Math.max(0, p.life * 2));
      c.font = "600 25px Fraunces";
      c.textAlign = "center";
      const width = (c.measureText(p.text)?.width || p.text.length * 15) + 28;
      const x = Math.max(width / 2 + 8, Math.min(1192 - width / 2, p.x));
      const y = Math.max(38, Math.min(680, p.y));
      round(c, x - width / 2, y - 28, width, 40, 13, "#fff8e8", "#d8c9a6");
      c.fillStyle = "#293c30";
      c.fillText(p.text, x, y);
    }
    c.globalAlpha = 1;
    this.labels = this.labels.filter((p) => p.life > 0);
    c.restore();
    c.restore();
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
}
export function drawItem(
  canvas: HTMLCanvasElement,
  id: string,
  owned: boolean,
) {
  const c = canvas.getContext("2d")!;
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.clearRect(0, 0, 96, 64);
  c.save();
  if (!owned) c.globalAlpha = 0.35;
  if (id.startsWith("power-")) powerIcon(c, id.slice(6), 48, 32, 24);
  if (id === "sock") sock(c, 48, 32, 1.25, -0.25);
  if (id === "squeaker") squeaker(c, 48, 35, 0, 1.1);
  if (id === "bandana") {
    line(
      c,
      [
        [48, 52],
        [48, 12],
      ],
      "#936f4b",
      5,
    );
    line(
      c,
      [
        [31, 54],
        [66, 54],
      ],
      "#936f4b",
      5,
    );
    c.beginPath();
    c.moveTo(28, 15);
    c.lineTo(70, 15);
    c.lineTo(48, 46);
    c.closePath();
    c.fillStyle = "#df7954";
    c.fill();
  }
  if (id === "basket") {
    round(c, 22, 29, 53, 29, 7, "#b98d5f");
    for (let i = 0; i < 3; i++)
      ellipse(c, 32 + i * 16, 29 - (i % 2) * 8, 10, 10, colors[i]);
    line(
      c,
      [
        [22, 35],
        [75, 35],
      ],
      "#d2b57f",
      4,
    );
    line(
      c,
      [
        [27, 47],
        [71, 47],
      ],
      "#d2b57f",
      3,
    );
  }
  if (id === "bed") {
    ellipse(c, 48, 41, 37, 18, "#b37663");
    ellipse(c, 48, 34, 35, 17, "#df9d81");
    ellipse(c, 48, 32, 24, 10, "#f1c5a1");
    line(
      c,
      [
        [20, 36],
        [28, 46],
        [42, 50],
      ],
      "#f9dbc0",
      2,
    );
  }
  if (id === "table") {
    round(c, 20, 21, 57, 33, 4, "#b88a58");
    round(c, 15, 16, 67, 9, 3, "#d1af77");
    round(c, 39, 33, 20, 21, 10, "#725941");
    line(
      c,
      [
        [25, 49],
        [25, 59],
      ],
      "#886642",
      6,
    );
    line(
      c,
      [
        [71, 49],
        [71, 59],
      ],
      "#886642",
      6,
    );
  }
  c.restore();
}
