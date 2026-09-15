import Matter from "matter-js";
import { PowerYard, definitions } from "./powers";
import { TUNE } from "./yard";
import { drawPlush } from "./plush";
import type { PieceBody, Life, AimInput } from "./types";
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
    round(c, -w / 2 + 2, -h / 2 + 3, w - 4, h - 6, 8, "#8ba8aa", "#576f70");
    round(c, -w / 2, -h / 2, w, 8, 3, "#bed0c3", "#667d7a");
    line(
      c,
      [
        [-17, -21],
        [-17, 23],
      ],
      "#d1e0ca88",
      5,
    );
    c.beginPath();
    c.arc(0, -2, 20, 0, Math.PI);
    c.strokeStyle = "#637d7c";
    c.lineWidth = 3;
    c.stroke();
    ellipse(c, -20, -2, 3, 3, "#e8e4c8");
    ellipse(c, 20, -2, 3, 3, "#e8e4c8");
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
  if (!yard.gadgets) return;
  const f = yard.field;
  c.save();
  c.setLineDash([7, 8]);
  c.strokeStyle = yard.polarity === -1 ? "#b97d6a99" : "#4f928499";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  if (yard.polarity) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        r = 100 + (reduced ? 0 : Math.sin(time * 3) * 12);
      const x = f.x + Math.cos(a) * r,
        y = f.y + Math.sin(a) * r,
        dir = yard.polarity === 1 ? -1 : 1;
      line(
        c,
        [
          [x, y],
          [x + Math.cos(a) * dir * 20, y + Math.sin(a) * dir * 20],
        ],
        "#588e80",
        3,
      );
      ellipse(
        c,
        x + Math.cos(a) * dir * 20,
        y + Math.sin(a) * dir * 20,
        3,
        3,
        "#588e80",
      );
    }
  }
  gadgetLabel(
    c,
    yard.polarity === 0
      ? "MAGNET OFF"
      : yard.polarity === 1
        ? "PULL IN +"
        : "PUSH OUT −",
    970,
    232,
  );
  // Striped buckets are the metal props affected by this fixed field.
  for (const b of yard.pieces)
    if (b.game.kind === "bucket") {
      c.save();
      c.translate(b.position.x, b.position.y - 38);
      c.rotate(b.angle);
      line(
        c,
        [
          [-14, 0],
          [-7, -7],
          [0, 0],
          [7, -7],
          [14, 0],
        ],
        "#386b64",
        3,
      );
      c.restore();
    }
  line(
    c,
    [
      [420, 523],
      [420, 620],
      [1100, 620],
      [1100, 600],
    ],
    yard.gateOpen ? "#77a38e" : "#bca27e",
    3,
  );
  round(c, 401, 510, 38, 15, 5, "#9e8060");
  c.save();
  c.translate(420, 510);
  c.rotate(yard.gateOpen ? 0.7 : -0.5);
  round(c, -5, -58, 10, 58, 5, "#8b7052");
  ellipse(c, 0, -58, 17, 17, yard.gateOpen ? "#83b59d" : "#df9067");
  c.restore();
  gadgetLabel(c, "LEVER", 365, 530);
  const gateY = yard.gate.position.y;
  round(c, 1088, gateY - 110, 24, 220, 5, "#a88a61", "#6f6247");
  for (let y = gateY - 99; y < gateY + 104; y += 22)
    line(
      c,
      [
        [1091, y],
        [1109, y + 12],
      ],
      "#edce87",
      4,
    );
  gadgetLabel(c, yard.gateOpen ? "OPEN" : "BONUS GATE", 1100, gateY - 120);
  round(c, 822, 565, 56, 32, 10, "#688e85", "#3f685d");
  ellipse(c, 850, 564, 23, 12, yard.polarity === -1 ? "#df927c" : "#a4d0b6");
  c.fillStyle = "#304c43";
  c.font = "bold 20px DM";
  c.textAlign = "center";
  c.fillText("+ / −", 850, 568);
  const compressed = yard.time - yard.bellowsAt < 0.3;
  round(
    c,
    433,
    compressed ? 586 : 576,
    74,
    compressed ? 12 : 22,
    8,
    "#c29cce",
    "#815f8e",
  );
  line(
    c,
    [
      [440, 586],
      [454, 579],
      [468, 586],
      [482, 579],
      [495, 586],
    ],
    "#f1d8e8",
    3,
  );
  gadgetLabel(c, "BELLOWS ↑", 470, 646);
  if (yard.time < yard.gustUntil)
    for (let i = 0; i < 5; i++) {
      const x = 420 + i * 25,
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
  if (yard.mode === "flight" && yard.active === "magnet") {
    c.beginPath();
    c.arc(yard.dog.position.x, yard.dog.position.y, 170, 0, Math.PI * 2);
    c.strokeStyle = "#83c5b077";
    c.lineWidth = 3;
    c.stroke();
  }
  if (yard.mode === "flight" && yard.bounces > 0)
    gadgetLabel(
      c,
      "↗ ".repeat(yard.bounces).trim(),
      yard.dog.position.x,
      yard.dog.position.y - 80,
    );
  c.restore();
}

function drawPickups(
  c: CanvasRenderingContext2D,
  yard: PowerYard,
  time: number,
  reduced: boolean,
) {
  if (!yard.pickups) return;
  c.save();
  for (const p of yard.pickups)
    if (!yard.claimed.has(p.id)) {
      const bob = reduced ? 0 : Math.sin(time * 3 + p.x) * 3;
      c.beginPath();
      c.arc(p.x, p.y, 30, 0, Math.PI * 2);
      c.strokeStyle = "#fff5d9";
      c.lineWidth = 3;
      c.stroke();
      powerIcon(c, p.id, p.x, p.y + bob);
      gadgetLabel(
        c,
        p.id === "bounce"
          ? "BOUNCE"
          : p.id === "magnet"
            ? "MAGNET"
            : "TAILWIND",
        p.x,
        p.y + 47,
      );
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
    this.background.src = "/assets/backdrop.png";
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
  ) {
    const c = this.c,
      W = 1200,
      H = 720;
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
    if (this.background.complete && this.background.naturalWidth)
      c.drawImage(this.background, 0, 0, W, H);
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
    c.fillStyle = "#8cac7340";
    c.fillRect(0, 601, 1200, 119);
    line(
      c,
      [
        [20, 602],
        [1180, 602],
      ],
      "#84956a70",
      3,
    );
    gadgets(c, yard, this.clock, reduced);
    // Shadows establish one consistent ground line.
    for (const b of yard.pieces)
      if (!yard.rescued.has(b.game.id)) {
        const size = Math.max(12, (b.game.w || 40) * 0.44);
        ellipse(c, b.position.x, 605, size, 5, "#4a684014");
      }
    ellipse(c, yard.dog.position.x, 606, 53, 8, "#435d4638");
    // The patchwork cushion is the launch pad, not a second dog.
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
            [origin.x - 12, origin.y + 32],
            [x, y],
            [origin.x + 18, origin.y + 28],
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
          ...(yard.gate ? [yard.gate] : []),
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
          if (py > 585 || px > 1180 || px < 20) break;
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
    drawPickups(c, yard, this.clock, reduced);
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
