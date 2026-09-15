import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TOWN, type TownBuilding, type TownPoint } from "./layout";
import { TownAssets } from "./assets";

const material = (color: THREE.ColorRepresentation, roughness = 0.82) =>
  new THREE.MeshStandardMaterial({ color, roughness });

/** Deterministic avatar-to-fountain arc, shared with regression tests. */
export const coinFlightPoint = (from: TownPoint, progress: number) => {
  const p = Math.max(0, Math.min(1, progress));
  return {
    x: from.x + (TOWN.fountain.x - from.x) * p,
    y: 1.15 + (0.58 - 1.15) * p + Math.sin(p * Math.PI) * 2.25,
    z: from.z + (TOWN.fountain.z - from.z) * p,
  };
};

/** Composes curated Kenney scenery with the interactive village landmarks. */
export class TownArt {
  readonly root = new THREE.Group();
  private elapsed = 0;
  private readonly assets = new TownAssets();
  private readonly imported = new THREE.Group();
  private disposed = false;
  private assetState: "loading" | "ready" | "failed" = "loading";
  private readonly water: THREE.MeshStandardMaterial[] = [];
  private readonly jets: THREE.Mesh[] = [];
  private readonly ripples: THREE.Mesh[] = [];
  private readonly signTextures = new Set<THREE.Texture>();
  private coinMesh: THREE.Mesh | null = null;
  private coinStart = new THREE.Vector3();
  private coinAge = 0;

  constructor() {
    this.root.name = "Forest village";
    this.makeGround();
    this.makeStream();
    this.makeBridge();
    this.makePlaza();
    this.makePaths();
    this.root.add(this.imported);
    this.makeFountain();
  }

  async load(): Promise<void> {
    try {
      await this.assets.load();
      if (this.disposed) return;
      TOWN.trees.forEach((tree) =>
        this.makeTree(tree.x, tree.z, tree.radius, tree.variant ?? 0),
      );
      TOWN.buildings.forEach((building) => this.makeBuilding(building));
      this.makeGardenAccents();
      this.assetState = "ready";
    } catch (error) {
      this.assetState = "failed";
      throw error;
    }
  }

  status() {
    return this.assetState;
  }

  update(dt: number, reducedMotion: boolean): void {
    const safeDt = Math.min(Math.max(dt, 0), 0.1);
    this.elapsed += safeDt;
    const calm = reducedMotion ? 0.22 : 1;
    this.water.forEach((water, index) => {
      water.emissiveIntensity =
        0.075 + Math.sin(this.elapsed * 1.8 + index) * 0.025 * calm;
    });
    this.jets.forEach((jet, index) => {
      const wave = Math.sin(this.elapsed * 4.1 + index * 1.5) * 0.035 * calm;
      jet.scale.y = 1 + wave;
      jet.position.y = 0.95 + wave * 0.4;
    });
    this.ripples.forEach((ripple, index) => {
      const pulse = (Math.sin(this.elapsed * 2.2 + index * 1.8) + 1) * 0.5;
      ripple.scale.setScalar(0.82 + pulse * 0.24 * calm);
      const m = ripple.material as THREE.MeshBasicMaterial;
      m.opacity = 0.16 + (1 - pulse) * 0.14;
    });
    if (!this.coinMesh) return;
    this.coinAge += safeDt;
    const p = Math.min(this.coinAge / 1.2, 1);
    const point = coinFlightPoint(this.coinStart, p);
    this.coinMesh.position.set(point.x, point.y, point.z);
    this.coinMesh.rotation.y += safeDt * (reducedMotion ? 5 : 18);
    if (p >= 1) {
      this.coinMesh.parent?.remove(this.coinMesh);
      this.coinMesh.geometry.dispose();
      (this.coinMesh.material as THREE.Material).dispose();
      this.coinMesh = null;
    }
  }

  /** A visual-only, bounded toss; the caller owns no currency mutation. */
  tossCoin(from: { x: number; z: number }): void {
    if (this.coinMesh) return;
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.045, 20),
      new THREE.MeshStandardMaterial({
        color: 0xffd567,
        metalness: 0.55,
        roughness: 0.28,
      }),
    );
    coin.castShadow = true;
    this.coinStart.set(from.x, 1.15, from.z);
    coin.position.copy(this.coinStart);
    coin.rotation.x = Math.PI / 2;
    this.root.add(coin);
    this.coinMesh = coin;
    this.coinAge = 0;
  }

  dispose(): void {
    this.disposed = true;
    this.imported.removeFromParent();
    this.assets.dispose();
    if (this.coinMesh) {
      this.coinMesh.parent?.remove(this.coinMesh);
      this.coinMesh.geometry.dispose();
      (this.coinMesh.material as THREE.Material).dispose();
      this.coinMesh = null;
    }
    this.signTextures.forEach((texture) => texture.dispose());
    this.signTextures.clear();
  }

  private mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    color: THREE.ColorRepresentation,
    x: number,
    y: number,
    z: number,
    options: { shadow?: boolean; roughness?: number } = {},
  ) {
    const mesh = new THREE.Mesh(geometry, material(color, options.roughness));
    mesh.position.set(x, y, z);
    mesh.castShadow = options.shadow ?? true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private makeGround() {
    this.mesh(
      this.root,
      new THREE.PlaneGeometry(TOWN.width, TOWN.depth),
      0x88ae77,
      TOWN.width / 2,
      -0.025,
      TOWN.depth / 2,
    ).rotation.x = -Math.PI / 2;
    // Broad low patches give the lawn variation without hundreds of individual dots.
    for (const [x, z, r] of [
      [6, 7, 5],
      [12, 35, 5.5],
      [25, 15, 5],
      [41, 8, 6],
      [50, 35, 6],
      [32, 44, 4.5],
    ]) {
      const patch = this.mesh(
        this.root,
        new THREE.CircleGeometry(r, 32),
        0x7fa56c,
        x,
        -0.018,
        z,
        { shadow: false },
      );
      patch.rotation.x = -Math.PI / 2;
    }
  }

  private makePaths() {
    // South district: gate, fountain square, and the three familiar landmarks.
    this.path(
      [
        [30, 47.5],
        [30, 44],
        [29.2, 40],
        [30, 37.5],
      ],
      1.8,
    );
    this.path(
      [
        [26, 35],
        [24.5, 34.5],
        [22, 36.4],
      ],
      1.7,
    );
    this.path(
      [
        [34, 35],
        [36.5, 34],
        [39, 34.4],
      ],
      1.5,
    );
    this.path(
      [
        [33, 38],
        [35.5, 40],
        [40, 42.7],
      ],
      1.45,
    );
    // A continuous trail makes the bridge the intentional route between districts.
    this.path(
      [
        [30, 32],
        [30, 28.5],
        [30, 24],
        [30, 19],
        [27, 16],
        [24, 13],
      ],
      1.7,
    );
    this.path(
      [
        [24, 13],
        [18, 11],
        [12, 12],
        [7, 15],
      ],
      1.45,
    );
    this.path(
      [
        [30, 19],
        [37, 17],
        [45, 14],
        [53, 15],
      ],
      1.45,
    );
  }

  private path(points: number[][], width: number) {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    );
    const vertices: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 40; i++) {
      const p = curve.getPoint(i / 40),
        t = curve.getTangent(i / 40);
      for (const side of [-1, 1])
        vertices.push(
          p.x - t.z * width * 0.5 * side,
          0.018,
          p.z + t.x * width * 0.5 * side,
        );
      if (i < 40) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    this.mesh(this.root, geo, 0xd7c399, 0, 0, 0, { shadow: false });
  }

  private makeStream() {
    const streamDepth = TOWN.stream.maxZ - TOWN.stream.minZ;
    for (const z of [TOWN.stream.minZ - 0.18, TOWN.stream.maxZ + 0.18])
      this.mesh(
        this.root,
        new THREE.BoxGeometry(TOWN.width, 0.12, 0.72),
        0x6f8757,
        TOWN.width / 2,
        0.015,
        z,
        { shadow: false },
      );
    const stream = this.mesh(
      this.root,
      new THREE.PlaneGeometry(TOWN.width, streamDepth),
      0x5ba7b6,
      TOWN.width / 2,
      0.06,
      (TOWN.stream.minZ + TOWN.stream.maxZ) / 2,
      { shadow: false, roughness: 0.38 },
    );
    stream.rotation.x = -Math.PI / 2;
    const streamMaterial = stream.material as THREE.MeshStandardMaterial;
    streamMaterial.emissive.set(0x17485a);
    streamMaterial.emissiveIntensity = 0.08;
    streamMaterial.transparent = true;
    streamMaterial.opacity = 0.88;
    this.water.push(streamMaterial);
    for (const bankZ of [TOWN.stream.minZ, TOWN.stream.maxZ]) {
      for (let x = 1.2; x < TOWN.width; x += 2.1) {
        if (Math.abs(x - TOWN.bridge.x) < TOWN.bridge.width / 2 + 0.8) continue;
        const stone = this.mesh(
          this.root,
          new THREE.DodecahedronGeometry(0.17, 0),
          0x97a28a,
          x,
          0.12,
          bankZ + Math.sin(x * 1.7) * 0.18,
        );
        stone.scale.set(1.4, 0.55, 0.9);
      }
    }
  }

  private makeBridge() {
    const bridge = new THREE.Group();
    bridge.name = "Woodland bridge";
    bridge.position.set(TOWN.bridge.x, 0, TOWN.bridge.z);
    this.root.add(bridge);
    const plankCount = 12;
    for (let i = 0; i < plankCount; i++) {
      const z =
        -TOWN.bridge.depth / 2 + (TOWN.bridge.depth * (i + 0.5)) / plankCount;
      const plank = this.mesh(
        bridge,
        new RoundedBoxGeometry(
          TOWN.bridge.width,
          0.16,
          TOWN.bridge.depth / plankCount - 0.035,
          2,
          0.035,
        ),
        i % 3 === 0 ? 0x9c6f46 : 0xb17e4c,
        0,
        0.17,
        z,
      );
      plank.rotation.y = Math.sin(i * 1.8) * 0.012;
    }
    for (const side of [-1, 1]) {
      for (const z of [-2.15, 0, 2.15])
        this.mesh(
          bridge,
          new THREE.CylinderGeometry(0.07, 0.09, 1.05, 8),
          0x6f4b32,
          side * 1.72,
          0.62,
          z,
        );
      for (const y of [0.65, 0.95]) {
        const rail = this.mesh(
          bridge,
          new THREE.CylinderGeometry(0.055, 0.055, 4.6, 8),
          0x765036,
          side * 1.72,
          y,
          0,
        );
        rail.rotation.x = Math.PI / 2;
      }
    }
  }

  private makePlaza() {
    const plaza = this.mesh(
      this.root,
      new THREE.CircleGeometry(5.35, 48),
      0xc9b48d,
      TOWN.fountain.x,
      0.015,
      TOWN.fountain.z,
      { shadow: false },
    );
    plaza.rotation.x = -Math.PI / 2;
    for (let r = 1; r < 5.2; r += 0.64)
      for (let n = 0; n < Math.max(9, r * 8); n++) {
        const angle =
          (n / Math.max(9, r * 8)) * Math.PI * 2 +
          (Math.floor(r * 4) % 2) * 0.15;
        const cobble = this.mesh(
          this.root,
          new RoundedBoxGeometry(0.38, 0.025, 0.28, 2, 0.045),
          n % 3 ? 0xd9c59f : 0xbba581,
          TOWN.fountain.x + Math.cos(angle) * r,
          0.034,
          TOWN.fountain.z + Math.sin(angle) * r,
          { shadow: false },
        );
        cobble.rotation.y = angle + Math.PI / 2;
      }
  }

  private place(
    key: Parameters<TownAssets["create"]>[0],
    x: number,
    z: number,
    options: Parameters<TownAssets["create"]>[1],
    y = 0,
    turn = 0,
  ) {
    const model = this.assets.create(key, options);
    model.position.set(x, y, z);
    model.rotation.y = turn;
    this.imported.add(model);
    return model;
  }

  private makeTree(x: number, z: number, radius: number, variant: number) {
    this.place(
      variant === 1 ? "mini-tree-high" : "mini-tree",
      x,
      z,
      { height: variant === 2 ? 3.3 : variant === 1 ? 4.1 : 3.5 },
      0,
      x * 0.7,
    );
    const ring = this.mesh(
      this.root,
      new THREE.CircleGeometry(radius, 16),
      0x6e925c,
      x,
      0.004,
      z,
      { shadow: false },
    );
    ring.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + x;
      this.place(
        i === 1 ? "flower-yellow" : "grass",
        x + Math.cos(a) * radius * 0.7,
        z + Math.sin(a) * radius * 0.7,
        { height: i === 1 ? 0.25 : 0.18 },
      );
    }
  }

  private makeBuilding(def: TownBuilding) {
    const { x, z, width, depth } = def;
    if (def.style === "clubhouse") {
      // The Kenney roof already includes its four posts. Keep its open silhouette.
      const roof = this.place("mini-roof", x, z, { width, depth }, 0.12);
      roof.userData.kind = "home";
      const porch = this.mesh(
        this.root,
        new RoundedBoxGeometry(width - 0.35, 0.16, depth - 0.25, 2, 0.08),
        0xb99262,
        x,
        0.08,
        z,
      );
      porch.userData.kind = "home";
      // Back wall of individual timber boards makes a warm, readable entrance.
      for (let i = 0; i < 9; i++)
        this.mesh(
          this.root,
          new RoundedBoxGeometry(0.38, 1.7, 0.12, 2, 0.035),
          i % 2 ? 0xb88353 : 0xc18e5f,
          x - 1.52 + i * 0.38,
          0.99,
          z + 1.35,
        );
      const door = this.mesh(
        this.root,
        new RoundedBoxGeometry(0.95, 1.6, 0.18, 3, 0.15),
        0x526b68,
        x,
        0.96,
        z + 1.48,
      );
      door.userData.kind = "home";
      this.mesh(
        this.root,
        new THREE.SphereGeometry(0.065, 10, 8),
        0xf2c778,
        x + 0.29,
        0.87,
        z + 1.6,
      );
      this.makeShopSign(this.root, "CLUBHOUSE", x, 1.85, z + 1.65, 1.65);
      for (const side of [-1, 1]) {
        const lamp = this.mesh(
          this.root,
          new RoundedBoxGeometry(0.21, 0.32, 0.21, 2, 0.025),
          0xffd38b,
          x + side * 1.05,
          1.32,
          z + 1.6,
        );
        (lamp.material as THREE.MeshStandardMaterial).emissive.set(0xffbb57);
        (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
        this.place(
          "mini-plant",
          x + side * 1.75,
          z + 0.85,
          { height: 0.62 },
          0.17,
        );
      }
    } else if (def.style === "reading") {
      this.place("mini-tent", x, z, { width, depth });
      this.makeShopSign(
        this.root,
        "READ & REST",
        x,
        0.42,
        z + depth / 2 + 0.12,
        1.45,
      );
    } else {
      this.mesh(
        this.root,
        new RoundedBoxGeometry(width, 0.25, depth, 2, 0.08),
        0xa5754a,
        x,
        0.125,
        z,
      );
      this.mesh(
        this.root,
        new RoundedBoxGeometry(width - 0.18, 0.05, depth - 0.18, 2, 0.04),
        0x725642,
        x,
        0.265,
        z,
      );
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 5; col++)
          this.place(
            col % 2 ? "flower-purple" : "flower-yellow",
            x - 1.3 + col * 0.65,
            z - 0.65 + row * 1.25,
            { height: 0.48 },
            0.29,
            col * 0.6,
          );
      this.makeShopSign(
        this.root,
        "GROW TOGETHER",
        x,
        0.5,
        z + depth / 2 + 0.08,
        1.5,
      );
    }
  }

  private makeGardenAccents() {
    // Decorative clusters stay within existing tree/landmark footprints or along the stream.
    for (const bankZ of [TOWN.stream.minZ, TOWN.stream.maxZ]) {
      for (let i = 0; i < 30; i++) {
        const x = 0.6 + i * 2.03;
        if (Math.abs(x - TOWN.bridge.x) < TOWN.bridge.width / 2 + 0.8) continue;
        const z = bankZ + Math.sin(i * 1.6) * 0.13;
        this.place(
          i % 3 === 0 ? "mini-rocks" : "rock",
          x,
          z,
          { height: i % 3 === 0 ? 0.43 : 0.22 },
          0,
          i * 0.9,
        );
        if (i % 2 === 0)
          this.place("grass", x + 0.25, z - 0.12, { height: 0.35 });
      }
    }
    for (const [x, z] of [
      [3.5, 4],
      [17, 15],
      [48, 4],
      [13.5, 44],
      [47.5, 42],
    ]) {
      this.place("mushroom", x + 0.25, z + 0.1, { height: 0.26 });
      this.place("bush", x - 0.25, z - 0.15, { height: 0.45 });
    }
  }

  private makeShopSign(
    parent: THREE.Object3D,
    text: string,
    x: number,
    y: number,
    z: number,
    width: number,
  ) {
    const board = this.mesh(
      parent,
      new RoundedBoxGeometry(width + 0.12, 0.34, 0.055, 2, 0.035),
      0x6b4b39,
      x,
      y,
      z,
      { shadow: false },
    );
    board.userData.label = text;
    if (typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 72;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#f7e4b4";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#6b4b39";
    context.font = "700 40px Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.signTextures.add(texture);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.27),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    label.position.set(x, y, z + 0.033);
    parent.add(label);
  }

  private makeFountain() {
    const f = new THREE.Group();
    f.name = "Fountain";
    f.userData.kind = "fountain";
    f.position.set(TOWN.fountain.x, 0, TOWN.fountain.z);
    this.root.add(f);
    this.mesh(
      f,
      new THREE.CylinderGeometry(2.0, 2.1, 0.38, 40),
      0xa9aab0,
      0,
      0.19,
      0,
    );
    this.mesh(
      f,
      new THREE.CylinderGeometry(1.7, 1.78, 0.12, 40),
      0xd3d0c4,
      0,
      0.42,
      0,
    );
    const pool = this.mesh(
      f,
      new THREE.CylinderGeometry(1.55, 1.55, 0.025, 40),
      0x5daec0,
      0,
      0.495,
      0,
      { shadow: false, roughness: 0.3 },
    );
    const poolMaterial = pool.material as THREE.MeshStandardMaterial;
    poolMaterial.emissive.set(0x1a6174);
    poolMaterial.emissiveIntensity = 0.15;
    this.water.push(poolMaterial);
    this.mesh(
      f,
      new THREE.CylinderGeometry(0.42, 0.56, 0.88, 18),
      0xc8c7c2,
      0,
      0.84,
      0,
    );
    this.mesh(f, new THREE.SphereGeometry(0.3, 18, 12), 0xe0d8c4, 0, 1.38, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const jet = this.mesh(
        f,
        new THREE.CylinderGeometry(0.036, 0.07, 0.72, 8),
        0xd2f4ed,
        Math.cos(a) * 0.48,
        0.95,
        Math.sin(a) * 0.48,
        { shadow: false, roughness: 0.15 },
      );
      jet.rotation.z = Math.cos(a) * 0.28;
      jet.rotation.x = -Math.sin(a) * 0.28;
      this.jets.push(jet);
      const ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.25, 0.31, 24),
        new THREE.MeshBasicMaterial({
          color: 0xe1ffff,
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ripple.position.set(Math.cos(a) * 0.75, 0.514, Math.sin(a) * 0.75);
      ripple.rotation.x = -Math.PI / 2;
      f.add(ripple);
      this.ripples.push(ripple);
    }
  }
}
