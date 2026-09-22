import type { Intake, Rect } from "./types";

/** Geometry in world units matching the opaque barrel and rear mouth collar.
 * The left portion of the gold mouth stays open to the delivery sensor.
 * Sprite bounds include transparent padding and must not become a collider.
 */
export class IntakeGeometry {
  static readonly artwork = { x: -1.1, y: -0.72, w: 2.2, h: 1.46 };

  static readonly cappedArtwork = { x: -0.64, y: -0.96, w: 1.28, h: 1.92 };

  static body(intake: Pick<Intake, "x" | "y" | "facing">, capped = false): Rect[] {
    const turns = (capped ? { up: 0, right: 1, down: 2, left: 3 } : { left: 0, up: 1, right: 2, down: 3 })[intake.facing];
    const rects = capped ? [
      { x: -0.23, y: -0.81, w: 0.46, h: 0.18 },
      { x: -0.33, y: -0.63, w: 0.66, h: 0.23 },
      { x: -0.29, y: -0.40, w: 0.58, h: 1.20 },
    ] : [
      { x: -0.46, y: -0.43, w: 0.14, h: 0.87 },
      { x: -0.32, y: -0.27, w: 1.22, h: 0.58 },
    ];
    return rects.map((rect) => {
      const corners = [
        [rect.x, rect.y], [rect.x + rect.w, rect.y],
        [rect.x, rect.y + rect.h], [rect.x + rect.w, rect.y + rect.h],
      ].map(([x, y]) => {
        for (let turn = 0; turn < turns; turn++) [x, y] = [-y, x];
        return { x: intake.x + x, y: intake.y + y };
      });
      const x = Math.min(...corners.map((point) => point.x));
      const y = Math.min(...corners.map((point) => point.y));
      return { x, y, w: Math.max(...corners.map((point) => point.x)) - x,
        h: Math.max(...corners.map((point) => point.y)) - y };
    });
  }
}
