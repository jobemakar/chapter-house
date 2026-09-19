import type { WaterSimulation } from "./physics";

export const LOW = 0.45;
export const HIGH = 0.65;
const SIGMA = 2.3;
const SUPPORT = 7;
type KernelEntry = readonly [number, number, number];
const kernel: KernelEntry[] = [];
for (let y = -SUPPORT; y <= SUPPORT; y++)
  for (let x = -SUPPORT; x <= SUPPORT; x++) {
    const weight = Math.exp(-(x * x + y * y) / (2 * SIGMA * SIGMA));
    if (weight > 0.008) kernel.push([x, y, weight]);
  }
export function coverage(density: number): number {
  const t = Math.max(0, Math.min(1, (density - LOW) / (HIGH - LOW)));
  return t * t * (3 - 2 * t);
}
export function splat(
  field: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = (1 - fx) * (1 - fy);
  const b = fx * (1 - fy);
  const c = (1 - fx) * fy;
  const d = fx * fy;
  for (const [offsetX, offsetY, value] of kernel) {
    const px = ix + offsetX;
    const py = iy + offsetY;
    if (px < 0 || py < 0 || px + 1 >= width || py + 1 >= height) continue;
    const index = py * width + px;
    field[index] += value * a;
    field[index + 1] += value * b;
    field[index + width] += value * c;
    field[index + width + 1] += value * d;
  }
}

/** Renders the unchanged particle simulation as a clipped joined liquid surface. */
export class WaterSurfaceRenderer {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly image: ImageData;
  readonly field: Float32Array;
  readonly solid: Uint8Array;
  private samples = 0;
  private totalMs = 0;
  private maxMs = 0;
  constructor(width: number, height: number, worldScale: number) {
    this.width = width / 2;
    this.height = height / 2;
    this.scale = worldScale / 2;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d")!;
    this.image = this.context.createImageData(this.width, this.height);
    this.field = new Float32Array(this.width * this.height);
    this.solid = new Uint8Array(this.field.length);
  }
  updateMask(
    _simulation: WaterSimulation,
    visualMask: HTMLCanvasElement,
  ): void {
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.drawImage(visualMask, 0, 0, this.width, this.height);
    const data = this.context.getImageData(0, 0, this.width, this.height).data;
    for (let index = 0; index < this.solid.length; index++)
      this.solid[index] = data[index * 4 + 3] > 100 ? 1 : 0;
  }
  draw(target: CanvasRenderingContext2D, positions: Float32Array): void {
    const started = performance.now();
    const pixels = this.image.data;
    this.field.fill(0);
    pixels.fill(0);
    for (let index = 0; index < positions.length; index += 2)
      splat(
        this.field,
        this.width,
        this.height,
        positions[index] * this.scale - 0.5,
        positions[index + 1] * this.scale - 0.5,
      );
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        const density = this.field[index];
        if (this.solid[index] || density <= LOW) continue;
        const alpha = coverage(density);
        const above = y > 1 ? coverage(this.field[index - 2 * this.width]) : 0;
        const rim = Math.max(0, alpha - above) * 0.8;
        const depth = y / this.height;
        const offset = index * 4;
        pixels[offset] = 49 + rim * 100 - depth * 12;
        pixels[offset + 1] = 187 + rim * 53 - depth * 18;
        pixels[offset + 2] = 218 + rim * 30 - depth * 12;
        pixels[offset + 3] = Math.round(alpha * 255);
      }
    this.context.putImageData(this.image, 0, 0);
    target.save();
    target.imageSmoothingEnabled = true;
    target.drawImage(this.canvas, 0, 0, this.width * 2, this.height * 2);
    target.restore();
    const elapsed = performance.now() - started;
    this.samples++;
    this.totalMs += elapsed;
    this.maxMs = Math.max(this.maxMs, elapsed);
  }
  stats(): {
    mode: string;
    resolution: [number, number];
    frames: number;
    averageMs: number;
    maxMs: number;
  } {
    return {
      mode: "gaussian-metaballs",
      resolution: [this.width, this.height],
      frames: this.samples,
      averageMs: this.samples ? this.totalMs / this.samples : 0,
      maxMs: this.maxMs,
    };
  }
}
