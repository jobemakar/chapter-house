export interface ScreenPoint {
  x: number;
  y: number;
}

export type GestureUpdate =
  | { kind: "none" }
  | { kind: "pan"; from: ScreenPoint; to: ScreenPoint }
  | { kind: "pinch-start"; midpoint: ScreenPoint }
  | { kind: "pinch"; midpoint: ScreenPoint; scale: number };

export type GestureEnd = { kind: "none" } | { kind: "tap"; point: ScreenPoint };

interface PointerState extends ScreenPoint {
  startX: number;
  startY: number;
  previousX: number;
  previousY: number;
  moved: boolean;
}

/**
 * Small DOM-independent gesture recognizer shared by the two 3D worlds.
 * Once a second pointer joins, every pointer in that gesture is ineligible
 * for tap/pan until all fingers lift.
 */
export class PointerGesture {
  private pointers = new Map<number, PointerState>();
  private pinchDistance = 0;
  private pinched = false;

  constructor(private threshold = 10) {}

  down(id: number, point: ScreenPoint): GestureUpdate {
    this.pointers.set(id, {
      ...point,
      startX: point.x,
      startY: point.y,
      previousX: point.x,
      previousY: point.y,
      moved: false,
    });
    if (this.pointers.size !== 2) return { kind: "none" };
    const [a, b] = [...this.pointers.values()];
    this.pinched = true;
    a.moved = b.moved = true;
    this.pinchDistance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    return { kind: "pinch-start", midpoint: this.midpoint(a, b) };
  }

  move(id: number, point: ScreenPoint): GestureUpdate {
    const pointer = this.pointers.get(id);
    if (!pointer) return { kind: "none" };
    const from = { x: pointer.previousX, y: pointer.previousY };
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.previousX = point.x;
    pointer.previousY = point.y;
    if (this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      return {
        kind: "pinch",
        midpoint: this.midpoint(a, b),
        scale: distance / this.pinchDistance,
      };
    }
    if (this.pinched) return { kind: "none" };
    if (
      !pointer.moved &&
      Math.hypot(point.x - pointer.startX, point.y - pointer.startY) <
        this.threshold
    )
      return { kind: "none" };
    pointer.moved = true;
    return { kind: "pan", from, to: { ...point } };
  }

  up(id: number, point: ScreenPoint): GestureEnd {
    const pointer = this.pointers.get(id);
    this.pointers.delete(id);
    const tap =
      !!pointer &&
      !this.pinched &&
      !pointer.moved &&
      Math.hypot(point.x - pointer.startX, point.y - pointer.startY) <
        this.threshold;
    if (!this.pointers.size) {
      this.pinched = false;
      this.pinchDistance = 0;
    }
    return tap ? { kind: "tap", point: { ...point } } : { kind: "none" };
  }

  cancel(id?: number) {
    if (id === undefined) this.pointers.clear();
    else this.pointers.delete(id);
    if (!this.pointers.size) {
      this.pinched = false;
      this.pinchDistance = 0;
    }
  }

  private midpoint(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}
