/**
 * Package-owned art contract for Veda's painted-diorama presentation.
 *
 * The atlas rectangles are normalized so the Phase 2 renderer can draw them
 * with either DOM background positioning or Canvas drawImage without making
 * assumptions about the generated image's pixel dimensions.
 */

export type VedaDirection = "up" | "right" | "down" | "left";
export type VedaMotionState = "idle" | "walk" | "push";

export type VedaObjectId =
  | "crate"
  | "crateOnSwitch"
  | "brassSwitch"
  | "stoneSwitch"
  | "peach"
  | "gateClosed"
  | "gateOpen"
  | "wall"
  | "foliage";

export type VedaEnvironmentId =
  "terrainBase" | "terrainQuietStone" | "terrainQuietMoss" | "terrainQuietRoot";

export interface AtlasCrop {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface AtlasDefinition {
  readonly src: string;
  readonly columns: number;
  readonly rows: number;
  readonly cell: (column: number, row: number) => AtlasCrop;
}

export interface VedaDirectionFrames {
  readonly idle: AtlasCrop;
  readonly walk: readonly AtlasCrop[];
  readonly push: readonly AtlasCrop[];
}

export interface VedaAssetCatalog {
  readonly walk: AtlasDefinition;
  readonly idle: AtlasDefinition;
  readonly push: AtlasDefinition;
  readonly motion: Readonly<Record<VedaDirection, VedaDirectionFrames>>;
  readonly objectsAtlas: AtlasDefinition;
  readonly objects: Readonly<Record<VedaObjectId, AtlasCrop>>;
  readonly environmentAtlas: AtlasDefinition;
  readonly environment: Readonly<Record<VedaEnvironmentId, AtlasCrop>>;
}

const cell = (
  columns: number,
  rows: number,
  column: number,
  row: number,
): AtlasCrop => ({
  x: column / columns,
  y: row / rows,
  width: 1 / columns,
  height: 1 / rows,
});

const walkAtlas: AtlasDefinition = {
  src: new URL("./assets/veda-walk-atlas.png", import.meta.url).href,
  columns: 4,
  rows: 4,
  cell: (column, row) => cell(4, 4, column, row),
};

const idleAtlas: AtlasDefinition = {
  src: new URL("./assets/veda-idle-atlas.png", import.meta.url).href,
  columns: 1,
  rows: 4,
  cell: (column, row) => cell(1, 4, column, row),
};

const objectAtlas: AtlasDefinition = {
  src: new URL("./assets/veda-object-atlas.png", import.meta.url).href,
  columns: 3,
  rows: 3,
  cell: (column, row) => cell(3, 3, column, row),
};

const pushAtlas: AtlasDefinition = {
  src: new URL("./assets/veda-push-atlas.png", import.meta.url).href,
  columns: 2,
  rows: 4,
  cell: (column, row) => cell(2, 4, column, row),
};

const environmentAtlas: AtlasDefinition = {
  src: new URL("./assets/veda-environment-atlas.png", import.meta.url).href,
  columns: 2,
  rows: 2,
  cell: (column, row) => cell(2, 2, column, row),
};

/** Four authored source-frame rows: up, right, down, and left. */
export const VEDA_DIRECTION_ROWS: Readonly<Record<VedaDirection, number>> = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
};

export const VEDA_ASSET_CATALOG: VedaAssetCatalog = {
  walk: walkAtlas,
  idle: idleAtlas,
  push: pushAtlas,
  motion: {
    up: {
      idle: idleAtlas.cell(0, 0),
      walk: [0, 1, 2, 3].map((column) => walkAtlas.cell(column, 0)),
      push: [0, 1].map((column) => pushAtlas.cell(column, 0)),
    },
    right: {
      idle: idleAtlas.cell(0, 1),
      walk: [0, 1, 2, 3].map((column) => walkAtlas.cell(column, 1)),
      push: [0, 1].map((column) => pushAtlas.cell(column, 1)),
    },
    down: {
      idle: idleAtlas.cell(0, 2),
      walk: [0, 1, 2, 3].map((column) => walkAtlas.cell(column, 2)),
      push: [0, 1].map((column) => pushAtlas.cell(column, 2)),
    },
    left: {
      idle: idleAtlas.cell(0, 3),
      walk: [0, 1, 2, 3].map((column) => walkAtlas.cell(column, 3)),
      push: [0, 1].map((column) => pushAtlas.cell(column, 3)),
    },
  },
  objectsAtlas: objectAtlas,
  objects: {
    crate: objectAtlas.cell(0, 0),
    crateOnSwitch: objectAtlas.cell(1, 0),
    brassSwitch: objectAtlas.cell(2, 0),
    stoneSwitch: objectAtlas.cell(0, 1),
    peach: objectAtlas.cell(1, 1),
    gateClosed: objectAtlas.cell(2, 1),
    gateOpen: objectAtlas.cell(0, 2),
    wall: objectAtlas.cell(1, 2),
    foliage: objectAtlas.cell(2, 2),
  },
  environmentAtlas,
  environment: {
    terrainBase: environmentAtlas.cell(0, 0),
    terrainQuietStone: environmentAtlas.cell(1, 0),
    terrainQuietMoss: environmentAtlas.cell(0, 1),
    terrainQuietRoot: environmentAtlas.cell(1, 1),
  },
};

/** Returns one of the four source frames for a direction and cycle index. */
export function vedaWalkFrame(
  direction: VedaDirection,
  frame: number,
): AtlasCrop {
  const row = VEDA_DIRECTION_ROWS[direction];
  const index = Number.isFinite(frame) ? Math.trunc(frame) : 0;
  const column = ((index % 4) + 4) % 4;
  return VEDA_ASSET_CATALOG.walk.cell(column, row);
}

export function vedaMotionFrames(
  direction: VedaDirection,
  state: VedaMotionState,
): readonly AtlasCrop[] {
  const frames = VEDA_ASSET_CATALOG.motion[direction];
  return state === "idle" ? [frames.idle] : frames[state];
}

export interface VedaLoadedAssets {
  readonly catalog: VedaAssetCatalog;
  readonly images: Readonly<{
    walk: HTMLImageElement;
    idle: HTMLImageElement;
    push: HTMLImageElement;
    objects: HTMLImageElement;
    environment: HTMLImageElement;
  }>;
}

/**
 * Preloads and decodes every runtime atlas. Phase 2 can use the returned
 * decoded images without introducing an untracked first-frame fetch.
 */
export class VedaAssetLoader {
  private readonly imagePromises = new Map<string, Promise<HTMLImageElement>>();

  constructor(
    private readonly catalog: VedaAssetCatalog = VEDA_ASSET_CATALOG,
  ) {}

  load(): Promise<VedaLoadedAssets> {
    return Promise.all([
      this.loadImage(this.catalog.walk.src),
      this.loadImage(this.catalog.idle.src),
      this.loadImage(this.catalog.push.src),
      this.loadImage(this.catalog.objectsAtlas.src),
      this.loadImage(this.catalog.environmentAtlas.src),
    ]).then(([walk, idle, push, objects, environment]) => ({
      catalog: this.catalog,
      images: { walk, idle, push, objects, environment },
    }));
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    const existing = this.imagePromises.get(src);
    if (existing) return existing;
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      if (typeof Image === "undefined") {
        reject(new Error("Veda assets require an image-capable browser"));
        return;
      }
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const decoded = image.decode?.();
        if (decoded)
          decoded.then(
            () => resolve(image),
            () => reject(new Error(`Unable to decode Veda asset: ${src}`)),
          );
        else resolve(image);
      };
      image.onerror = () =>
        reject(new Error(`Unable to load Veda asset: ${src}`));
      image.src = src;
    });
    this.imagePromises.set(src, promise);
    return promise;
  }
}
