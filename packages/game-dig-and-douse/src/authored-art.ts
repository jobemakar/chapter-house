import type { LevelDefinition, Rect } from "./types";

type Edge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  side: "top" | "right" | "bottom" | "left";
};

type Tank = NonNullable<LevelDefinition["tanks"]>[number];

/** Draws editor-authored obstacles without changing their collision silhouettes. */
export class AuthoredObstacleRenderer {
  private readonly layers = new WeakMap<
    LevelDefinition,
    Map<string, HTMLCanvasElement>
  >();

  draw(
    context: CanvasRenderingContext2D,
    config: LevelDefinition,
    scale = 50,
  ): void {
    if (
      !config.tankWalls?.length &&
      !config.pipeRects?.length &&
      !config.paintedRocks?.length
    )
      return;

    const key = `${scale}:${context.canvas.width}:${context.canvas.height}`;
    let levels = this.layers.get(config);
    if (!levels) {
      levels = new Map<string, HTMLCanvasElement>();
      this.layers.set(config, levels);
    }
    let layer = levels.get(key);
    if (!layer) {
      layer = context.canvas.ownerDocument.createElement("canvas");
      layer.width = context.canvas.width;
      layer.height = context.canvas.height;
      this.render(layer.getContext("2d")!, config, scale);
      levels.set(key, layer);
    }
    context.drawImage(layer, 0, 0);
  }

  private render(
    context: CanvasRenderingContext2D,
    config: LevelDefinition,
    scale: number,
  ): void {
    const tankWalls = this.validRects(config.tankWalls);
    const pipeRects = this.validRects(config.pipeRects);
    const paintedRocks = this.validRects(config.paintedRocks);
    const tanks = config.tanks ?? [];
    if (
      !tankWalls.length &&
      !pipeRects.length &&
      !paintedRocks.length &&
      !tanks.length
    )
      return;

    context.save();
    this.drawPaintedRocks(context, paintedRocks, scale);
    this.drawPipes(context, pipeRects, scale);
    this.drawTankWalls(context, tankWalls, tanks, scale);
    context.restore();
  }

  private drawPaintedRocks(
    context: CanvasRenderingContext2D,
    rects: readonly Rect[],
    scale: number,
  ): void {
    if (!rects.length) return;
    const bounds = this.bounds(rects);
    const shape = this.unionPath(rects, scale);
    const stone = context.createLinearGradient(
      bounds.x * scale,
      bounds.y * scale,
      (bounds.x + bounds.w * 0.35) * scale,
      (bounds.y + bounds.h) * scale,
    );
    stone.addColorStop(0, "#9aa49f");
    stone.addColorStop(0.48, "#747f7d");
    stone.addColorStop(1, "#556260");
    context.fillStyle = stone;
    context.fill(shape);

    context.save();
    context.clip(shape);
    let seed = this.seed(rects);
    const random = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const area = rects.reduce((sum, rect) => sum + rect.w * rect.h, 0);
    const flecks = Math.max(5, Math.min(90, Math.ceil(area * 2.7)));
    for (let index = 0; index < flecks; index++) {
      const x = (bounds.x + random() * bounds.w) * scale;
      const y = (bounds.y + random() * bounds.h) * scale;
      const radius = Math.max(
        0.8,
        Math.min(3.5, scale * (0.025 + random() * 0.04)),
      );
      context.fillStyle =
        index % 3 === 0 ? "rgba(211,220,211,0.24)" : "rgba(37,49,48,0.22)";
      context.beginPath();
      context.ellipse(
        x,
        y,
        radius * (1.2 + random()),
        radius,
        random(),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.restore();

    this.strokeUnion(context, rects, scale, "#33413f", 2.5);
    this.strokeUnion(
      context,
      rects,
      scale,
      "rgba(220,229,218,0.46)",
      1.2,
      new Set(["top", "left"]),
    );
  }

  private drawPipes(
    context: CanvasRenderingContext2D,
    rects: readonly Rect[],
    scale: number,
  ): void {
    if (!rects.length) return;
    const bounds = this.bounds(rects);
    const shape = this.unionPath(rects, scale);
    const metal = context.createLinearGradient(
      bounds.x * scale,
      bounds.y * scale,
      bounds.x * scale,
      (bounds.y + bounds.h) * scale,
    );
    metal.addColorStop(0, "#667b80");
    metal.addColorStop(0.42, "#42585e");
    metal.addColorStop(1, "#263d43");
    context.fillStyle = metal;
    context.fill(shape);

    context.save();
    context.clip(shape);
    context.fillStyle = "rgba(210,229,224,0.12)";
    context.fillRect(
      bounds.x * scale,
      bounds.y * scale,
      bounds.w * scale,
      Math.min(3.5, bounds.h * scale * 0.2),
    );
    context.restore();

    this.strokeUnion(context, rects, scale, "#1e3035", 3);
    this.strokeUnion(
      context,
      rects,
      scale,
      "rgba(201,221,215,0.48)",
      1.2,
      new Set(["top", "left"]),
    );
  }

  private drawTankWalls(
    context: CanvasRenderingContext2D,
    walls: readonly Rect[],
    tanks: readonly Tank[],
    scale: number,
  ): void {
    if (!walls.length) return;
    const bounds = this.bounds(walls);
    const shape = this.unionPath(walls, scale);
    const metal = context.createLinearGradient(
      bounds.x * scale,
      bounds.y * scale,
      (bounds.x + bounds.w) * scale,
      (bounds.y + bounds.h) * scale,
    );
    metal.addColorStop(0, "#879a9b");
    metal.addColorStop(0.35, "#536a6d");
    metal.addColorStop(0.7, "#435a5d");
    metal.addColorStop(1, "#31474b");
    context.fillStyle = metal;
    context.fill(shape);

    context.save();
    context.clip(shape);
    const weathering = context.createLinearGradient(
      bounds.x * scale,
      bounds.y * scale,
      (bounds.x + bounds.w) * scale,
      bounds.y * scale,
    );
    weathering.addColorStop(0, "rgba(190,112,57,0.2)");
    weathering.addColorStop(0.18, "rgba(190,112,57,0)");
    weathering.addColorStop(0.78, "rgba(222,184,103,0)");
    weathering.addColorStop(1, "rgba(222,184,103,0.16)");
    context.fillStyle = weathering;
    context.fillRect(
      bounds.x * scale,
      bounds.y * scale,
      bounds.w * scale,
      bounds.h * scale,
    );
    context.restore();

    this.strokeUnion(context, walls, scale, "#253a3c", 3);
    this.strokeUnion(
      context,
      walls,
      scale,
      "rgba(225,234,218,0.55)",
      1.25,
      new Set(["top", "left"]),
    );
    tanks.forEach((tank) => this.drawOutletCaps(context, tank, walls, scale));
  }

  /** Marks the two collision-wall ends that form the tank's centered outlet. */
  private drawOutletCaps(
    context: CanvasRenderingContext2D,
    tank: Tank,
    walls: readonly Rect[],
    scale: number,
  ): void {
    const epsilon = 0.025;
    const horizontal = tank.outlet === "bottom";
    const center = horizontal ? tank.x + tank.w / 2 : tank.y + tank.h / 2;
    const candidates = walls.filter((wall) => {
      if (horizontal)
        return (
          Math.abs(wall.y + wall.h - (tank.y + tank.h)) <= epsilon &&
          wall.x < tank.x + tank.w &&
          wall.x + wall.w > tank.x
        );
      const edge = tank.outlet === "left" ? wall.x : wall.x + wall.w;
      const tankEdge = tank.outlet === "left" ? tank.x : tank.x + tank.w;
      return (
        Math.abs(edge - tankEdge) <= epsilon &&
        wall.y < tank.y + tank.h &&
        wall.y + wall.h > tank.y
      );
    });
    if (candidates.length < 2) return;

    const before = candidates
      .filter(
        (wall) =>
          (horizontal ? wall.x + wall.w : wall.y + wall.h) <= center + epsilon,
      )
      .sort(
        (a, b) =>
          (horizontal ? b.x + b.w : b.y + b.h) -
          (horizontal ? a.x + a.w : a.y + a.h),
      )[0];
    const after = candidates
      .filter((wall) => (horizontal ? wall.x : wall.y) >= center - epsilon)
      .sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y))[0];
    if (!before || !after) return;

    const capDepth = Math.max(2, Math.min(5, scale * 0.08));
    const capColor = "#b99858";
    const capShadow = "#5e4728";
    context.save();
    context.fillStyle = capColor;
    context.strokeStyle = capShadow;
    context.lineWidth = 1;
    if (horizontal) {
      const y = before.y * scale;
      const h = before.h * scale;
      const points = [
        { x: (before.x + before.w) * scale - capDepth, w: capDepth },
        { x: after.x * scale, w: capDepth },
      ];
      points.forEach((point) => {
        context.fillRect(point.x, y, point.w, h);
        context.strokeRect(
          point.x + 0.5,
          y + 0.5,
          Math.max(0, point.w - 1),
          Math.max(0, h - 1),
        );
      });
    } else {
      const x = before.x * scale;
      const w = before.w * scale;
      const points = [
        { y: (before.y + before.h) * scale - capDepth, h: capDepth },
        { y: after.y * scale, h: capDepth },
      ];
      points.forEach((point) => {
        context.fillRect(x, point.y, w, point.h);
        context.strokeRect(
          x + 0.5,
          point.y + 0.5,
          Math.max(0, w - 1),
          Math.max(0, point.h - 1),
        );
      });
    }
    context.restore();
  }

  private validRects(rects: readonly Rect[] | undefined): Rect[] {
    return (rects ?? []).filter(
      (rect) =>
        Number.isFinite(rect.x) &&
        Number.isFinite(rect.y) &&
        Number.isFinite(rect.w) &&
        Number.isFinite(rect.h) &&
        rect.w > 0 &&
        rect.h > 0,
    );
  }

  private unionPath(rects: readonly Rect[], scale: number): Path2D {
    const path = new Path2D();
    rects.forEach((rect) =>
      path.rect(rect.x * scale, rect.y * scale, rect.w * scale, rect.h * scale),
    );
    return path;
  }

  private strokeUnion(
    context: CanvasRenderingContext2D,
    rects: readonly Rect[],
    scale: number,
    color: string,
    width: number,
    sides?: ReadonlySet<Edge["side"]>,
  ): void {
    const edges = this.exposedEdges(rects).filter(
      (edge) => !sides || sides.has(edge.side),
    );
    const shape = this.unionPath(rects, scale);
    context.save();
    context.clip(shape);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = "square";
    context.lineJoin = "miter";
    context.beginPath();
    edges.forEach((edge) => {
      context.moveTo(edge.x1 * scale, edge.y1 * scale);
      context.lineTo(edge.x2 * scale, edge.y2 * scale);
    });
    context.stroke();
    context.restore();
  }

  /** Coordinate compression gives the exact exterior of any rectangle union. */
  private exposedEdges(rects: readonly Rect[]): Edge[] {
    const xs = this.boundaries(
      rects.flatMap((rect) => [rect.x, rect.x + rect.w]),
    );
    const ys = this.boundaries(
      rects.flatMap((rect) => [rect.y, rect.y + rect.h]),
    );
    const occupied: boolean[][] = Array.from({ length: ys.length - 1 }, () =>
      Array<boolean>(xs.length - 1).fill(false),
    );
    const xIndexes = new Map(xs.map((value, index) => [value, index]));
    const yIndexes = new Map(ys.map((value, index) => [value, index]));
    rects.forEach((rect) => {
      const left = xIndexes.get(this.normalized(rect.x))!;
      const right = xIndexes.get(this.normalized(rect.x + rect.w))!;
      const top = yIndexes.get(this.normalized(rect.y))!;
      const bottom = yIndexes.get(this.normalized(rect.y + rect.h))!;
      for (let row = top; row < bottom; row++)
        for (let col = left; col < right; col++) occupied[row][col] = true;
    });

    const edges: Edge[] = [];
    for (let row = 0; row < occupied.length; row++)
      for (let col = 0; col < occupied[row].length; col++) {
        if (!occupied[row][col]) continue;
        if (row === 0 || !occupied[row - 1][col])
          edges.push({
            x1: xs[col],
            y1: ys[row],
            x2: xs[col + 1],
            y2: ys[row],
            side: "top",
          });
        if (col === occupied[row].length - 1 || !occupied[row][col + 1])
          edges.push({
            x1: xs[col + 1],
            y1: ys[row],
            x2: xs[col + 1],
            y2: ys[row + 1],
            side: "right",
          });
        if (row === occupied.length - 1 || !occupied[row + 1][col])
          edges.push({
            x1: xs[col],
            y1: ys[row + 1],
            x2: xs[col + 1],
            y2: ys[row + 1],
            side: "bottom",
          });
        if (col === 0 || !occupied[row][col - 1])
          edges.push({
            x1: xs[col],
            y1: ys[row],
            x2: xs[col],
            y2: ys[row + 1],
            side: "left",
          });
      }
    return edges;
  }

  private boundaries(values: readonly number[]): number[] {
    return [...new Set(values.map((value) => this.normalized(value)))].sort(
      (a, b) => a - b,
    );
  }

  private normalized(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
  }

  private bounds(rects: readonly Rect[]): Rect {
    const left = Math.min(...rects.map((rect) => rect.x));
    const top = Math.min(...rects.map((rect) => rect.y));
    const right = Math.max(...rects.map((rect) => rect.x + rect.w));
    const bottom = Math.max(...rects.map((rect) => rect.y + rect.h));
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  private seed(rects: readonly Rect[]): number {
    return rects.reduce(
      (value, rect) =>
        Math.imul(
          value ^
            Math.round((rect.x + rect.y * 3 + rect.w * 5 + rect.h * 7) * 1000),
          16777619,
        ) >>> 0,
      2166136261,
    );
  }
}
