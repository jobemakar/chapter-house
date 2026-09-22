import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import {
  VEDA_ASSET_CATALOG,
  VEDA_DIRECTION_ROWS,
  VedaAssetLoader,
  vedaMotionFrames,
  vedaWalkFrame,
} from "../src/assets";

interface DecodedPng {
  width: number;
  height: number;
  pixels: Uint8Array;
}

function decodePng(path: string): DecodedPng {
  const source = readFileSync(path);
  assert.deepEqual(
    [...source.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const kind = source.toString("ascii", offset + 4, offset + 8);
    const data = source.subarray(offset + 8, offset + 8 + length);
    if (kind === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "assets must use 8-bit channels");
      assert.equal(data[9], 6, "assets must use RGBA PNGs");
    } else if (kind === "IDAT") idat.push(data);
    offset += length + 12;
    if (kind === "IEND") break;
  }
  const filtered = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  let input = 0;
  for (let y = 0; y < height; y++) {
    const filter = filtered[input++];
    const row = y * stride;
    const previous = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const raw = filtered[input++];
      const left = x >= 4 ? pixels[row + x - 4] : 0;
      const up = y > 0 ? pixels[previous + x] : 0;
      const upLeft = y > 0 && x >= 4 ? pixels[previous + x - 4] : 0;
      let value = raw;
      if (filter === 1) value = (raw + left) & 255;
      else if (filter === 2) value = (raw + up) & 255;
      else if (filter === 3) value = (raw + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        value = (raw + predictor) & 255;
      } else assert.equal(filter, 0, `unsupported PNG filter ${filter}`);
      pixels[row + x] = value;
    }
  }
  return { width, height, pixels };
}

const assetPath = (name: string): string =>
  fileURLToPath(new URL(`../src/assets/${name}`, import.meta.url));
const sourcePath = (name: string): string =>
  fileURLToPath(
    new URL(
      `../../../docs/concepts/vedas-great-escape/sources/${name}`,
      import.meta.url,
    ),
  );
const conceptPath = (name: string): string =>
  fileURLToPath(
    new URL(
      `../../../docs/concepts/vedas-great-escape/${name}`,
      import.meta.url,
    ),
  );

const EXPECTED_HASHES = {
  "veda-environment-atlas.png":
    "d234056dde0c9740f66431953fd5b186bf12b476121ca156aac0c82d1ce6eea3",
  "veda-idle-atlas.png":
    "dbd80f06710d82b854165167e0482edebe347fd4b196757e525cfb5345cfcd1c",
  "veda-object-atlas.png":
    "2e973126349e8ca6ba21f08818f7043eccfe416fae02b44787254d0188fd4e1a",
  "veda-push-atlas.png":
    "c04c5ba4fe12f76f02e0e72ee8e617c4c93ca94477093b02de46efa8ed9a6a54",
  "veda-walk-atlas.png":
    "744e1a82500b9aa9c3abb554cc492f197b1ba15852d251e2aba1ed947c776346",
} as const;

const EXPECTED_INSPECTION_HASHES = {
  "terrain-repeat-3x3-native.png":
    "e5c9a3e52f80d71872c839616118aba479169ff9b0fece96e0844c1db33ab919",
  "terrain-repeat-3x3-phone.png":
    "4e3987728e5f5f6a3e6488fafafee20d2ec5403846cbfdeba3f6fd5fae72f150",
} as const;

const EXPECTED_SOURCE_HASHES = {
  "veda-idle-raw.png":
    "ae51c272351bc1efb11fa7f9eef501e04acb95cbb7a392bb4ec46bab005fab92",
  "veda-push-raw.png":
    "caccd24b338b24579a345ddc9e6e2204d183c75676273b3f97cee342b8fc1036",
  "veda-terrain-raw.png":
    "5737c4b09d8fec861f866cae86abded85f3a4addf75e25f0cc0d08c4580d1f0b",
  "veda-walk-reference-runtime.png":
    "e63b855d6ee9e206d7fb63c560660e47195553278dcc43f3820de82c14cd7428",
} as const;

function alpha(image: DecodedPng, x: number, y: number): number {
  return image.pixels[(y * image.width + x) * 4 + 3]!;
}

interface AlphaBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function alphaBounds(
  image: DecodedPng,
  column: number,
  row: number,
  columns: number,
  rows: number,
): AlphaBounds {
  const cellWidth = image.width / columns;
  const cellHeight = image.height / rows;
  const bounds: AlphaBounds = {
    minX: cellWidth,
    minY: cellHeight,
    maxX: -1,
    maxY: -1,
  };
  for (let y = 0; y < cellHeight; y++) {
    for (let x = 0; x < cellWidth; x++) {
      if (alpha(image, column * cellWidth + x, row * cellHeight + y) < 32)
        continue;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }
  return bounds;
}

function cellPixelHash(
  image: DecodedPng,
  column: number,
  row: number,
  columns: number,
  rows: number,
  mirrorX = false,
): string {
  const cellWidth = image.width / columns;
  const cellHeight = image.height / rows;
  const hash = createHash("sha256");
  for (let y = 0; y < cellHeight; y++) {
    for (let outputX = 0; outputX < cellWidth; outputX++) {
      const sourceX = mirrorX ? cellWidth - outputX - 1 : outputX;
      const offset =
        ((row * cellHeight + y) * image.width + column * cellWidth + sourceX) *
        4;
      hash.update(image.pixels.subarray(offset, offset + 4));
    }
  }
  return hash.digest("hex");
}

function colorDistance(
  image: DecodedPng,
  firstX: number,
  firstY: number,
  secondX: number,
  secondY: number,
): number {
  const first = (firstY * image.width + firstX) * 4;
  const second = (secondY * image.width + secondX) * 4;
  return Math.hypot(
    image.pixels[first]! - image.pixels[second]!,
    image.pixels[first + 1]! - image.pixels[second + 1]!,
    image.pixels[first + 2]! - image.pixels[second + 2]!,
  );
}

function assertBoundaryGradientContinuity(
  image: DecodedPng,
  tileX: number,
  tileY: number,
): void {
  const x0 = tileX * 256;
  const y0 = tileY * 256;
  let horizontalSeam = 0;
  let horizontalInterior = 0;
  let horizontalInteriorCount = 0;
  let verticalSeam = 0;
  let verticalInterior = 0;
  let verticalInteriorCount = 0;
  for (let y = 0; y < 256; y++) {
    horizontalSeam += colorDistance(image, x0 + 255, y0 + y, x0, y0 + y);
    for (let x = 1; x < 255; x += 4) {
      horizontalInterior += colorDistance(
        image,
        x0 + x - 1,
        y0 + y,
        x0 + x,
        y0 + y,
      );
      horizontalInteriorCount += 1;
    }
  }
  for (let x = 0; x < 256; x++) {
    verticalSeam += colorDistance(image, x0 + x, y0 + 255, x0 + x, y0);
    for (let y = 1; y < 255; y += 4) {
      verticalInterior += colorDistance(
        image,
        x0 + x,
        y0 + y - 1,
        x0 + x,
        y0 + y,
      );
      verticalInteriorCount += 1;
    }
  }
  const horizontalRatio =
    horizontalSeam / 256 / (horizontalInterior / horizontalInteriorCount);
  const verticalRatio =
    verticalSeam / 256 / (verticalInterior / verticalInteriorCount);
  assert.ok(
    horizontalRatio <= 1.5,
    `terrain ${tileX},${tileY} horizontal boundary gradient ratio ${horizontalRatio.toFixed(3)}`,
  );
  assert.ok(
    verticalRatio <= 1.5,
    `terrain ${tileX},${tileY} vertical boundary gradient ratio ${verticalRatio.toFixed(3)}`,
  );
}

function assertGrid(
  name: string,
  columns: number,
  rows: number,
  width: number,
  height: number,
): DecodedPng {
  const image = decodePng(assetPath(name));
  assert.equal(image.width, width, `${name} width`);
  assert.equal(image.height, height, `${name} height`);
  assert.equal(image.width % columns, 0, `${name} width is grid-divisible`);
  assert.equal(image.height % rows, 0, `${name} height is grid-divisible`);
  const cellWidth = image.width / columns;
  const cellHeight = image.height / rows;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      let visible = 0;
      for (let y = row * cellHeight; y < (row + 1) * cellHeight; y += 2)
        for (let x = column * cellWidth; x < (column + 1) * cellWidth; x += 2)
          visible += alpha(image, x, y) >= 32 ? 1 : 0;
      assert.ok(visible > 0, `${name} cell ${column},${row} has content`);
    }
  }
  return image;
}

function assertSpriteGutters(
  image: DecodedPng,
  columns: number,
  rows: number,
): void {
  const cellWidth = image.width / columns;
  const cellHeight = image.height / rows;
  for (let boundary = 1; boundary < columns; boundary++) {
    const x = boundary * cellWidth;
    for (let y = 0; y < image.height; y++)
      for (let dx = -2; dx <= 2; dx++)
        assert.ok(alpha(image, x + dx, y) < 32, `alpha crossed x=${x}`);
  }
  for (let boundary = 1; boundary < rows; boundary++) {
    const y = boundary * cellHeight;
    for (let x = 0; x < image.width; x++)
      for (let dy = -2; dy <= 2; dy++)
        assert.ok(alpha(image, x, y + dy) < 32, `alpha crossed y=${y}`);
  }
}

test("repacked runtime atlases have exact dimensions, content, and transparent gutters", () => {
  const walk = assertGrid("veda-walk-atlas.png", 4, 4, 768, 768);
  const idle = assertGrid("veda-idle-atlas.png", 1, 4, 192, 768);
  const push = assertGrid("veda-push-atlas.png", 2, 4, 384, 768);
  const objects = assertGrid("veda-object-atlas.png", 3, 3, 576, 576);
  assertSpriteGutters(walk, 4, 4);
  assertSpriteGutters(idle, 1, 4);
  assertSpriteGutters(push, 2, 4);
  assertSpriteGutters(objects, 3, 3);
});

test("runtime atlas hashes match the provenance receipt", () => {
  for (const [name, expected] of Object.entries(EXPECTED_HASHES)) {
    const actual = createHash("sha256")
      .update(readFileSync(assetPath(name)))
      .digest("hex");
    assert.equal(actual, expected, name);
  }
});

test("raw generated inputs and the exact walk reference are retained", () => {
  for (const [name, expected] of Object.entries(EXPECTED_SOURCE_HASHES)) {
    const actual = createHash("sha256")
      .update(readFileSync(sourcePath(name)))
      .digest("hex");
    assert.equal(actual, expected, name);
  }
});

test("native and phone-scale 3x3 terrain inspection sheets are retained", () => {
  for (const [name, expected] of Object.entries(EXPECTED_INSPECTION_HASHES)) {
    const actual = createHash("sha256")
      .update(readFileSync(conceptPath(name)))
      .digest("hex");
    assert.equal(actual, expected, name);
  }
  const native = decodePng(conceptPath("terrain-repeat-3x3-native.png"));
  const phone = decodePng(conceptPath("terrain-repeat-3x3-phone.png"));
  assert.deepEqual([native.width, native.height], [1536, 1536]);
  assert.deepEqual([phone.width, phone.height], [258, 258]);
});

test("character frames share a stable contact anchor and authored scale", () => {
  const walk = decodePng(assetPath("veda-walk-atlas.png"));
  const idle = decodePng(assetPath("veda-idle-atlas.png"));
  const push = decodePng(assetPath("veda-push-atlas.png"));
  for (let row = 0; row < 4; row++) {
    const walkHeights: number[] = [];
    for (let column = 0; column < 4; column++) {
      const bounds = alphaBounds(walk, column, row, 4, 4);
      assert.equal(bounds.maxY, 174, `walk ${column},${row} contact anchor`);
      assert.ok(
        Math.abs((bounds.minX + bounds.maxX) / 2 - 96) <= 1,
        `walk ${column},${row} optical anchor`,
      );
      walkHeights.push(bounds.maxY - bounds.minY + 1);
    }
    assert.ok(
      Math.max(...walkHeights) - Math.min(...walkHeights) <= 12,
      `walk row ${row} keeps a consistent authored scale`,
    );

    const idleBounds = alphaBounds(idle, 0, row, 1, 4);
    assert.equal(idleBounds.maxY, 174, `idle 0,${row} contact anchor`);
    assert.ok(
      Math.abs((idleBounds.minX + idleBounds.maxX) / 2 - 96) <= 1,
      `idle 0,${row} optical anchor`,
    );
    assert.ok(
      idleBounds.maxX - idleBounds.minX + 1 >= 120 &&
        idleBounds.maxY - idleBounds.minY + 1 >= 120,
      `idle row ${row} remains readable at phone cell scale`,
    );

    const pushHeights: number[] = [];
    for (let column = 0; column < 2; column++) {
      const bounds = alphaBounds(push, column, row, 2, 4);
      assert.equal(bounds.maxY, 174, `push ${column},${row} contact anchor`);
      assert.ok(
        Math.abs((bounds.minX + bounds.maxX) / 2 - 96) <= 1,
        `push ${column},${row} optical anchor`,
      );
      assert.ok(
        bounds.maxX - bounds.minX + 1 >= 90 &&
          bounds.maxY - bounds.minY + 1 >= 90,
        `push ${column},${row} remains readable at phone cell scale`,
      );
      pushHeights.push(bounds.maxY - bounds.minY + 1);
    }
    assert.ok(
      Math.max(...pushHeights) - Math.min(...pushHeights) <= 14,
      `push row ${row} keeps a consistent authored scale`,
    );
  }
});

test("every idle, walk, and push pose has distinct authored pixels", () => {
  const walk = decodePng(assetPath("veda-walk-atlas.png"));
  const idle = decodePng(assetPath("veda-idle-atlas.png"));
  const push = decodePng(assetPath("veda-push-atlas.png"));
  for (let row = 0; row < 4; row++) {
    const walkHashes = Array.from({ length: 4 }, (_, column) =>
      cellPixelHash(walk, column, row, 4, 4),
    );
    const pushHashes = Array.from({ length: 2 }, (_, column) =>
      cellPixelHash(push, column, row, 2, 4),
    );
    assert.equal(new Set(walkHashes).size, 4, `walk row ${row}`);
    assert.equal(new Set(pushHashes).size, 2, `push row ${row}`);
    assert.notEqual(
      cellPixelHash(idle, 0, row, 1, 4),
      cellPixelHash(walk, 0, row, 4, 4),
      `idle row ${row} is dedicated art, not the first walk frame`,
    );
  }
  for (let column = 0; column < 4; column++) {
    assert.notEqual(
      cellPixelHash(walk, column, 1, 4, 4),
      cellPixelHash(walk, column, 3, 4, 4, true),
      `left/right walk frame ${column} is not a mirrored duplicate`,
    );
  }
  for (let column = 0; column < 2; column++) {
    assert.notEqual(
      cellPixelHash(push, column, 1, 2, 4),
      cellPixelHash(push, column, 3, 2, 4, true),
      `left/right push frame ${column} is not a mirrored duplicate`,
    );
  }
});

test("terrain atlas is opaque with continuous repeat-boundary gradients", () => {
  const terrain = assertGrid("veda-environment-atlas.png", 2, 2, 512, 512);
  const variantHashes = new Set<string>();
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 2; column++) {
      variantHashes.add(cellPixelHash(terrain, column, row, 2, 2));
      const x0 = column * 256;
      const y0 = row * 256;
      for (let i = 0; i < 256; i++) {
        assert.equal(alpha(terrain, x0 + i, y0), 255);
        assert.equal(alpha(terrain, x0 + i, y0 + 255), 255);
        assert.equal(alpha(terrain, x0, y0 + i), 255);
        assert.equal(alpha(terrain, x0 + 255, y0 + i), 255);
      }
      assertBoundaryGradientContinuity(terrain, column, row);
    }
  }
  assert.equal(variantHashes.size, 4, "all four terrain variants are unique");
  const means: Array<[number, number, number]> = [];
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 2; column++) {
      const sums = [0, 0, 0];
      for (let y = 0; y < 256; y += 4) {
        for (let x = 0; x < 256; x += 4) {
          const offset =
            ((row * 256 + y) * terrain.width + column * 256 + x) * 4;
          sums[0] += terrain.pixels[offset]!;
          sums[1] += terrain.pixels[offset + 1]!;
          sums[2] += terrain.pixels[offset + 2]!;
        }
      }
      means.push(sums.map((sum) => sum / 4096) as [number, number, number]);
    }
  }
  for (let left = 0; left < means.length; left++) {
    for (let right = left + 1; right < means.length; right++) {
      const distance = Math.hypot(
        means[left]![0] - means[right]![0],
        means[left]![1] - means[right]![1],
        means[left]![2] - means[right]![2],
      );
      assert.ok(distance >= 24, `terrain means ${left}/${right} are distinct`);
    }
  }
});

test("all directions expose explicit idle, walk, and authored push frames", () => {
  assert.deepEqual(Object.keys(VEDA_DIRECTION_ROWS), [
    "up",
    "right",
    "down",
    "left",
  ]);
  for (const direction of Object.keys(VEDA_DIRECTION_ROWS) as Array<
    keyof typeof VEDA_DIRECTION_ROWS
  >) {
    const frames = VEDA_ASSET_CATALOG.motion[direction];
    assert.equal(frames.walk.length, 4);
    assert.equal(frames.push.length, 2);
    assert.notDeepEqual(frames.push[0], frames.walk[0]);
    assert.deepEqual(vedaMotionFrames(direction, "idle"), [frames.idle]);
    assert.deepEqual(vedaMotionFrames(direction, "walk"), frames.walk);
    assert.deepEqual(vedaMotionFrames(direction, "push"), frames.push);
  }
});

test("walk frame selection modulo-wraps negative and large indices", () => {
  for (const direction of Object.keys(VEDA_DIRECTION_ROWS) as Array<
    keyof typeof VEDA_DIRECTION_ROWS
  >) {
    assert.deepEqual(vedaWalkFrame(direction, -1), vedaWalkFrame(direction, 3));
    assert.deepEqual(vedaWalkFrame(direction, 4), vedaWalkFrame(direction, 0));
    assert.deepEqual(vedaWalkFrame(direction, 9), vedaWalkFrame(direction, 1));
    assert.deepEqual(
      vedaWalkFrame(direction, Number.NaN),
      vedaWalkFrame(direction, 0),
    );
  }
});

test("asset loader preloads and decodes every local runtime atlas", async () => {
  let decodeCalls = 0;
  class FakeImage {
    decoding = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";
    set src(value: string) {
      this._src = value;
      queueMicrotask(() => this.onload?.());
    }
    get src(): string {
      return this._src;
    }
    decode(): Promise<void> {
      decodeCalls += 1;
      return Promise.resolve();
    }
  }
  const globalWithImage = globalThis as typeof globalThis & {
    Image?: typeof Image;
  };
  const previousImage = globalWithImage.Image;
  globalWithImage.Image = FakeImage as unknown as typeof Image;
  try {
    const loaded = await new VedaAssetLoader().load();
    assert.equal(loaded.images.walk.src, VEDA_ASSET_CATALOG.walk.src);
    assert.equal(loaded.images.idle.src, VEDA_ASSET_CATALOG.idle.src);
    assert.equal(loaded.images.push.src, VEDA_ASSET_CATALOG.push.src);
    assert.equal(
      loaded.images.objects.src,
      VEDA_ASSET_CATALOG.objectsAtlas.src,
    );
    assert.equal(
      loaded.images.environment.src,
      VEDA_ASSET_CATALOG.environmentAtlas.src,
    );
    assert.equal(
      decodeCalls,
      5,
      "every loaded image is decoded before resolve",
    );
  } finally {
    if (previousImage) globalWithImage.Image = previousImage;
    else delete globalWithImage.Image;
  }
});
