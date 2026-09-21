import { H, kit, levels, W } from "./levels";
import type { ContraptionEngine } from "./engine";
import type { Part, PartType, Point } from "./types";

const INK = "#365b73";
const line = (
  c: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color = INK,
  width = 3,
) => {
  c.beginPath();
  c.moveTo(...points[0]);
  points.slice(1).forEach((point) => c.lineTo(...point));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.stroke();
};
const polygon = (
  c: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  fill: string,
  stroke: string | null = INK,
) => {
  c.beginPath();
  c.moveTo(...points[0]);
  points.slice(1).forEach((point) => c.lineTo(...point));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 3;
    c.stroke();
  }
};
const oval = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  stroke: string | null = INK,
  width = 3,
) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
};
const box = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string | null = INK,
  radius = 6,
) => {
  c.beginPath();
  c.roundRect(x, y, width, height, radius);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 3;
    c.stroke();
  }
};
const label = (
  c: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 14,
  color = INK,
) => {
  c.font = `bold ${size}px Trebuchet MS`;
  c.textAlign = "center";
  c.fillStyle = color;
  c.fillText(value, x, y);
};
const arrow = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  color = INK,
) => {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  line(
    c,
    [
      [0, 0],
      [length, 0],
    ],
    color,
    2,
  );
  line(
    c,
    [
      [length - 9, -6],
      [length, 0],
      [length - 9, 6],
    ],
    color,
    2,
  );
  c.restore();
};
const screw = (c: CanvasRenderingContext2D, x: number, y: number) => {
  oval(c, x, y, 4, 4, "#f8e6ad", INK, 1.5);
  line(
    c,
    [
      [x - 2, y + 2],
      [x + 2, y - 2],
    ],
    INK,
    1,
  );
};
const kernel = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle = 0,
  alpha = 1,
) => {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.rotate(angle);
  for (const [px, py, scale] of [
    [-0.42, -0.05, 0.61],
    [0.36, -0.34, 0.63],
    [0.31, 0.43, 0.61],
    [-0.33, 0.5, 0.5],
    [-0.1, -0.48, 0.53],
  ] as const)
    oval(
      c,
      px * radius,
      py * radius,
      scale * radius,
      scale * radius,
      "#fff7ce",
      INK,
      1.2,
    );
  oval(c, 0, 0, radius * 0.24, radius * 0.2, "#e7b859", null);
  c.restore();
};

export class ContraptionRenderer {
  draw(
    canvas: HTMLCanvasElement,
    engine: ContraptionEngine,
    selected: string | null,
    ghost: Part | null,
    trails: boolean,
    hint: Part[] | null = null,
  ): void {
    const c = canvas.getContext("2d")!;
    c.save();
    c.scale(canvas.width / W, canvas.height / H);
    this.background(c, engine);
    if (trails)
      for (const particle of engine.particles)
        if (!particle.delay && particle.trail.length > 1) {
          c.save();
          c.globalAlpha = 0.24;
          line(
            c,
            particle.trail.map((point: Point) => [point.x, point.y]),
            "#b8903e",
            2,
          );
          c.restore();
        }
    for (const controller of engine.parts.filter(
      (part) => part.type === "switch",
    ))
      for (const id of controller.targets ?? []) {
        const target = engine.parts.find((part) => part.id === id);
        if (target) {
          c.save();
          c.globalAlpha = 0.55;
          c.setLineDash([5, 6]);
          line(
            c,
            [
              [controller.x, controller.y + 20],
              [controller.x, controller.y + 48],
              [target.x, target.y - 20],
            ],
            (controller.direction || 1) > 0 ? "#b66b48" : "#548896",
            2,
          );
          c.restore();
        }
      }
    if (hint)
      for (const part of hint.filter((part) => !part.locked)) {
        c.save();
        c.globalAlpha = 0.35;
        this.device(c, part, engine.time, true);
        c.restore();
        label(c, "HINT POSITION", part.x, part.y - 48, 11, "#a36c3d");
      }
    for (const part of engine.parts) {
      const effect = engine.effects.find(
        (item) =>
          item.type === part.type &&
          Math.hypot(item.x - part.x, item.y - part.y) < 100,
      );
      this.device(
        c,
        part.type === "belt" ? { ...part, flip: engine.direction(part) } : part,
        engine.time,
        part.id === selected,
        effect?.life ?? 0,
      );
    }
    engine.particles.forEach((particle) =>
      kernel(
        c,
        particle.x,
        particle.y,
        particle.r,
        particle.spin,
        particle.delay ? 0.65 : 1,
      ),
    );
    for (const effect of engine.effects.filter(
      (item) => item.type === "delivery",
    )) {
      for (let index = 0; index < 8; index++) {
        const angle = (index * Math.PI) / 4,
          radius = (0.7 - effect.life) * 110;
        c.save();
        c.globalAlpha = effect.life / 0.7;
        line(
          c,
          [
            [
              effect.x + Math.cos(angle) * radius,
              effect.y + Math.sin(angle) * radius - 30,
            ],
            [
              effect.x + Math.cos(angle) * (radius + 8),
              effect.y + Math.sin(angle) * (radius + 8) - 30,
            ],
          ],
          index % 2 ? "#c88253" : "#648d91",
          3,
        );
        c.restore();
      }
      label(
        c,
        "+1",
        effect.x,
        effect.y - (0.7 - effect.life) * 80 - 18,
        22,
        "#5a806f",
      );
    }
    if (ghost) {
      c.save();
      c.globalAlpha = 0.5;
      this.device(c, ghost, engine.time, true);
      c.restore();
    }
    c.restore();
  }
  icon(canvas: HTMLCanvasElement, type: PartType): void {
    const c = canvas.getContext("2d")!;
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(canvas.width / 2, canvas.height / 2);
    c.scale(
      type === "ramp" || type === "belt" ? 0.35 : 0.31,
      type === "ramp" || type === "belt" ? 0.35 : 0.31,
    );
    this.device(c, {
      id: "icon",
      type,
      x: 0,
      y: type === "funnel" ? 0 : -8,
      angle: type === "fan" ? -0.3 : type === "ramp" ? 0.12 : 0,
      power: 1,
      flip: 1,
    });
    c.restore();
  }
  private background(
    c: CanvasRenderingContext2D,
    engine: ContraptionEngine,
  ): void {
    const level = levels[engine.board],
      palette = ["#f7e9b9", "#dce9dc", "#e2dfee"],
      ink = ["#446477", "#487b79", "#6e7199"][engine.board % 3];
    c.fillStyle = palette[engine.board % 3];
    c.fillRect(0, 0, W, H);
    const shade = c.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "#fff9e35c");
    shade.addColorStop(1, "#95855b12");
    c.fillStyle = shade;
    c.fillRect(0, 0, W, H);
    for (let x = 25; x < W; x += 30)
      for (let y = 25; y < H - 50; y += 30)
        oval(c, x, y, 1.6, 1.6, "#375b6b1b", null);
    level.sources.forEach((source, index) => {
      line(
        c,
        [
          [source.x - 70, 9],
          [source.x - 70, 76],
        ],
        INK,
        4,
      );
      polygon(
        c,
        [
          [source.x - 70, 45],
          [source.x + 8, 45],
          [source.x + 8, 76],
          [source.x + 21, 76],
          [source.x + 21, 96],
          [source.x - 4, 96],
          [source.x - 4, 75],
          [source.x - 49, 75],
        ],
        "#d7aa58",
      );
      box(c, source.x - 82, 12, 103, 45, "#f0cc6e", INK, 8);
      label(c, "POP-O-MATIC", source.x - 30, 32, 10);
      label(c, "freshly ridiculous", source.x - 30, 47, 8);
      for (let n = 0; n < 5; n++) kernel(c, source.x - 65 + n * 16, 7, 8, n);
      arrow(c, source.x + 43, source.y - 10, 0.9, 27, "#af8050");
      label(
        c,
        level.sources.length > 1 ? `INLET ${index + 1}` : "START HERE",
        source.x + 92,
        source.y - 21,
        10,
        "#8b7850",
      );
    });
    const bowl = level.bowl;
    polygon(
      c,
      [
        [bowl.x - 69, bowl.y],
        [bowl.x + 69, bowl.y],
        [bowl.x + 52, bowl.y + 60],
        [bowl.x - 52, bowl.y + 60],
      ],
      "#f9e9ad",
    );
    for (let index = 0; index < 5; index++) {
      const x = bowl.x - 51 + index * 23;
      polygon(
        c,
        [
          [x, bowl.y + 3],
          [x + 10, bowl.y + 3],
          [x + 7, bowl.y + 57],
          [x + 1, bowl.y + 57],
        ],
        "#d58163",
        null,
      );
    }
    oval(c, bowl.x, bowl.y, 69, 10, "#f3dba0");
    oval(c, bowl.x, bowl.y, 56, 6, "#a48b55", null);
    box(c, bowl.x - 35, bowl.y + 23, 70, 23, "#fff2c9", INK, 4);
    label(c, "GOOD POPS", bowl.x, bowl.y + 39, 10);
    for (let index = 0; index < Math.min(18, engine.delivered); index++)
      kernel(
        c,
        bowl.x - 40 + (index % 6) * 16,
        bowl.y - 3 - Math.floor(index / 6) * 8,
        9,
        index * 0.7,
      );
    label(c, "LAND IT HERE", bowl.x, bowl.y - 39, 11, ink);
    arrow(c, bowl.x, bowl.y - 27, Math.PI / 2, 18, ink);
    box(c, 15, 618, 1070, 33, "#92acb0", INK, 14);
    for (let index = 0; index < 24; index++)
      arrow(
        c,
        35 + index * 45 - ((engine.time * 40) % 45),
        635,
        Math.PI,
        17,
        "#547787",
      );
    box(c, 430, 622, 245, 25, "#dfe4cd", INK, 6);
    label(c, "SPILLS GO ROUND AGAIN  ↶", 552, 639, 11);
  }
  private device(
    c: CanvasRenderingContext2D,
    part: Part,
    time = 0,
    selected = false,
    flash = 0,
  ): void {
    const size = kit[part.type];
    c.save();
    c.translate(part.x, part.y);
    c.rotate(part.angle);
    if (selected) {
      c.save();
      c.setLineDash([5, 5]);
      box(
        c,
        -size.w / 2 - 11,
        -size.h / 2 - 14,
        size.w + 22,
        size.h + 28,
        part.locked ? "#c8d9df42" : "#fff7d62a",
        part.locked ? "#4f7180" : "#cf7456",
        9,
      );
      c.restore();
    }
    if (part.type === "wall") {
      box(c, -110, -14, 220, 28, "#99a6a7");
      for (let x = -98; x < 100; x += 24)
        line(
          c,
          [
            [x, -10],
            [x + 14, 10],
          ],
          "#637f88",
          3,
        );
      screw(c, -100, 0);
      screw(c, 100, 0);
    }
    if (part.type === "switch") {
      box(c, -29, -19, 58, 39, "#b98a5e");
      box(c, -25, -26, 50, 27, flash ? "#f9d777" : "#e59c6d");
      arrow(
        c,
        -14 * (part.direction || 1),
        -11,
        (part.direction || 1) < 0 ? Math.PI : 0,
        28,
      );
    }
    if (part.type === "ramp") {
      polygon(
        c,
        [
          [-90, 1],
          [90, 1],
          [90, 17],
          [-90, 17],
        ],
        "#edc66f",
      );
      line(
        c,
        [
          [-88, -1],
          [88, -1],
        ],
        "#fff3cb",
        3,
      );
      screw(c, -77, 8);
      screw(c, 76, 8);
      arrow(c, -19, -14, 0, 40, "#7e764f");
    }
    if (part.type === "belt") {
      box(c, -90, -2, 180, 26, "#4f7f8b", INK, 13);
      for (let x = -76; x <= 76; x += 38) {
        oval(c, x, 11, 9, 9, "#a6c5bb", INK, 2);
        const angle = time * 4 * part.flip;
        line(
          c,
          [
            [x - Math.cos(angle) * 6, 11 - Math.sin(angle) * 6],
            [x + Math.cos(angle) * 6, 11 + Math.sin(angle) * 6],
          ],
          INK,
          2,
        );
      }
      box(c, -26, 23, 52, 20, "#6e97a1", INK, 4);
      arrow(
        c,
        -25 * part.flip,
        -18,
        part.flip < 0 ? Math.PI : 0,
        48,
        "#4e7882",
      );
    }
    if (part.type === "spring") {
      const squish = flash > 0 ? Math.sin(flash * 20) * 4 : 0;
      for (const x of [-37, 37])
        line(
          c,
          [
            [x, 8],
            [x - 8, 14],
            [x + 8, 20],
            [x - 8, 26],
            [x + 8, 32],
            [x, 39],
          ],
          "#456f84",
          3,
        );
      box(c, -56, 36, 112, 12, "#da9b6f", INK, 4);
      box(c, -55, squish - 5, 110, 14, "#d97866", INK, 6);
      arrow(c, 0, -18, -Math.PI / 2, 35, "#b86a56");
    }
    if (part.type === "funnel") {
      polygon(
        c,
        [
          [-70, -39],
          [70, -39],
          [16, 38],
          [16, 59],
          [-16, 59],
          [-16, 38],
        ],
        "#ecc66e",
      );
      polygon(
        c,
        [
          [-57, -33],
          [-39, -33],
          [-6, 36],
          [-6, 52],
          [-13, 52],
          [-13, 32],
        ],
        "#fff0b9",
        null,
      );
      oval(c, 0, -40, 70, 10, "#ac9960");
      oval(c, 0, -40, 57, 5, "#e6cf8a", null);
    }
    if (part.type === "fan") {
      c.save();
      c.globalAlpha = 0.2;
      for (let index = -2; index <= 2; index++)
        arrow(
          c,
          35 + ((time * 90 + index * 22) % 40),
          index * 14,
          0,
          120 + index * 8,
          "#3d859e",
        );
      c.restore();
      box(c, -33, -21, 25, 42, "#80aaba", INK, 5);
      oval(c, 0, 0, 20, 35, "#bcd4ca");
      c.save();
      c.scale(0.58, 1);
      for (let index = 0; index < 3; index++) {
        c.save();
        c.rotate(time * 9 + (index * Math.PI * 2) / 3);
        oval(c, 0, -15, 10, 20, "#608ba0", INK, 2);
        c.restore();
      }
      c.restore();
      oval(c, 0, 0, 6, 8, "#f5cf71", INK, 2);
    }
    if (part.type === "bumper") {
      const radius = 34 + flash * 7;
      oval(c, 0, 0, radius, radius, "#9b84b0");
      oval(c, 0, 0, radius - 8, radius - 8, "#d5bbd8");
      oval(c, 0, 0, radius - 16, radius - 16, "#e4c669");
      label(c, "BOOP", 0, 4, 10);
    }
    if (part.locked) {
      c.save();
      c.setLineDash([]);
      box(
        c,
        -size.w / 2 - 8,
        -size.h / 2 - 8,
        size.w + 16,
        size.h + 16,
        "#b9d0d644",
        "#456f7d",
        8,
      );
      c.restore();
      label(c, "⚓ BOLTED", 0, size.h / 2 + 30, 9, "#365f70");
    } else {
      c.save();
      c.setLineDash([4, 4]);
      box(
        c,
        -size.w / 2 - 6,
        -size.h / 2 - 6,
        size.w + 12,
        size.h + 12,
        "#ffe7a522",
        "#c77654",
        7,
      );
      c.restore();
      label(c, "⠿ DRAG", 0, size.h / 2 + 28, 8, "#a95842");
    }
    c.restore();
  }
}
