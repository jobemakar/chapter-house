export interface SceneryCamera {
  x: number;
  y: number;
  zoom: number;
}

/** Depth layers share the floor's vertical anchor, never a screen-fixed horizon. */
export class WishboneScenery {
  static readonly floorY = 602;
  static layout(view: SceneryCamera, worldWidth: number, reduced: boolean) {
    const groundY = 360 + (this.floorY - view.y) * view.zoom;
    const fenceX = (600 - view.x) * view.zoom * (reduced ? 1 : 0.96);
    const farX = (600 - view.x) * (reduced ? 0 : 0.2);
    const overscan = 120 + Math.abs(worldWidth - 1200) * 0.2;
    const farHeight = Math.max(
      groundY + 100,
      674 * (1 + (view.zoom - 1) * 0.12),
    );
    return {
      groundY,
      fenceX,
      fenceBaseY: groundY - 20 * view.zoom,
      farX,
      farTop: groundY + 10 - farHeight,
      farHeight,
      farLeft: -overscan + farX,
      farWidth: 1200 + overscan * 2,
      // Overscan in world units covers any legal zoom/pan, including wide overview.
      fenceLeft: 600 + (-600 - fenceX) / view.zoom - 100,
      fenceRight: 600 + (600 - fenceX) / view.zoom + 100,
    };
  }
}

