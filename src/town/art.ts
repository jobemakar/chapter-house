import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TOWN, type TownBuilding } from "./layout";

const material = (color: THREE.ColorRepresentation, roughness = 0.82) =>
  new THREE.MeshStandardMaterial({ color, roughness });

/** Procedural, low-poly scenery for the walkable outdoor village. */
export class TownArt {
  readonly root = new THREE.Group();
  private elapsed = 0;
  private readonly water: THREE.MeshStandardMaterial[] = [];
  private readonly jets: THREE.Mesh[] = [];
  private readonly ripples: THREE.Mesh[] = [];
  private readonly signTextures = new Set<THREE.Texture>();
  private coinMesh: THREE.Mesh | null = null;
  private coinAge = 0;

  constructor() {
    this.root.name = "Forest village";
    this.makeGround();
    this.makeStream();
    this.makePlaza();
    TOWN.trees.forEach((tree) => this.makeTree(tree.x, tree.z, tree.radius, tree.variant ?? 0));
    TOWN.buildings.forEach((building) => this.makeBuilding(building));
    this.makeFountain();
  }

  update(dt: number, reducedMotion: boolean): void {
    const safeDt = Math.min(Math.max(dt, 0), 0.1);
    this.elapsed += safeDt;
    const calm = reducedMotion ? 0.22 : 1;
    this.water.forEach((water, index) => {
      water.emissiveIntensity = 0.075 + Math.sin(this.elapsed * 1.8 + index) * 0.025 * calm;
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
    const arc = Math.sin(p * Math.PI);
    this.coinMesh.position.y = 1.05 + arc * 2.25;
    this.coinMesh.position.x = TOWN.fountain.x + Math.sin(p * Math.PI * 2.4) * 0.3;
    this.coinMesh.position.z = TOWN.fountain.z - 0.25 + p * 0.9;
    this.coinMesh.rotation.y += safeDt * (reducedMotion ? 5 : 18);
    if (p >= 1) {
      this.coinMesh.parent?.remove(this.coinMesh);
      this.coinMesh.geometry.dispose();
      (this.coinMesh.material as THREE.Material).dispose();
      this.coinMesh = null;
    }
  }

  /** A visual-only, bounded toss; the caller owns no currency mutation. */
  tossCoin(): void {
    if (this.coinMesh) return;
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.045, 20),
      new THREE.MeshStandardMaterial({ color: 0xffd567, metalness: 0.55, roughness: 0.28 }),
    );
    coin.castShadow = true;
    coin.position.set(TOWN.fountain.x, 1.05, TOWN.fountain.z - 0.25);
    coin.rotation.x = Math.PI / 2;
    this.root.add(coin);
    this.coinMesh = coin;
    this.coinAge = 0;
  }

  dispose(): void {
    if (this.coinMesh) {
      this.coinMesh.parent?.remove(this.coinMesh);
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
    this.mesh(this.root, new THREE.PlaneGeometry(TOWN.width, TOWN.depth), 0x82aa6e, 15, -0.025, 12).rotation.x = -Math.PI / 2;
    for (let z = 0.9; z < TOWN.streamZ; z += 2.1) {
      for (let x = 1; x < TOWN.width; x += 2.4) {
        const dot = this.mesh(this.root, new THREE.CircleGeometry(0.055, 8), (x + z) % 4 > 2 ? 0xbac66e : 0xd8c56c, x + Math.sin(z * 2) * 0.22, 0.004, z + Math.cos(x) * 0.14, { shadow: false });
        dot.rotation.x = -Math.PI / 2;
      }
    }
  }

  private makeStream() {
    const bank = this.mesh(this.root, new THREE.BoxGeometry(TOWN.width, 0.12, 1.05), 0x6f8757, 15, 0.015, TOWN.streamZ - 0.12, { shadow: false });
    const stream = this.mesh(this.root, new THREE.PlaneGeometry(TOWN.width, TOWN.depth - TOWN.streamZ + 0.65), 0x5ba7b6, 15, 0.06, (TOWN.streamZ + TOWN.depth) / 2, { shadow: false, roughness: 0.38 });
    stream.rotation.x = -Math.PI / 2;
    const streamMaterial = stream.material as THREE.MeshStandardMaterial;
    streamMaterial.emissive.set(0x17485a);
    streamMaterial.emissiveIntensity = 0.08;
    streamMaterial.transparent = true;
    streamMaterial.opacity = 0.88;
    this.water.push(streamMaterial);
    bank.receiveShadow = true;
    for (let x = 1.2; x < 30; x += 2.1) {
      const stone = this.mesh(this.root, new THREE.DodecahedronGeometry(0.17, 0), 0x97a28a, x, 0.12, 20.1 + Math.sin(x * 1.7) * 0.23);
      stone.scale.set(1.4, 0.55, 0.9);
    }
  }

  private makePlaza() {
    const plaza = this.mesh(this.root, new THREE.CircleGeometry(5.35, 48), 0xc9b48d, TOWN.fountain.x, 0.015, TOWN.fountain.z, { shadow: false });
    plaza.rotation.x = -Math.PI / 2;
    for (let r = 1; r < 5.2; r += 0.64) for (let n = 0; n < Math.max(9, r * 8); n++) {
      const angle = (n / Math.max(9, r * 8)) * Math.PI * 2 + (Math.floor(r * 4) % 2) * 0.15;
      const cobble = this.mesh(this.root, new RoundedBoxGeometry(0.38, 0.025, 0.28, 2, 0.045), n % 3 ? 0xd9c59f : 0xbba581, TOWN.fountain.x + Math.cos(angle) * r, 0.034, TOWN.fountain.z + Math.sin(angle) * r, { shadow: false });
      cobble.rotation.y = angle + Math.PI / 2;
    }
  }

  private makeTree(x: number, z: number, radius: number, variant: number) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    this.root.add(tree);
    this.mesh(tree, new THREE.CylinderGeometry(radius * 0.82, radius, 0.12, 12), 0x6c8056, 0, 0.06, 0, { shadow: false });
    this.mesh(tree, new THREE.CylinderGeometry(radius * 0.17, radius * 0.24, 1.45, 10), 0x75513b, 0, 0.74, 0);
    const hues = [0x527c55, 0x638b59, 0x789d61];
    for (let i = 0; i < 3; i++) {
      const crown = this.mesh(tree, new THREE.IcosahedronGeometry(radius * (0.82 - i * 0.07), 1), hues[(variant + i) % hues.length], Math.sin(i * 2.15) * radius * 0.22, 1.58 + i * 0.3, Math.cos(i * 1.7) * radius * 0.22);
      crown.scale.y = 1.02;
    }
    if (variant === 2) for (let i = 0; i < 3; i++) this.mesh(tree, new THREE.SphereGeometry(0.08, 8, 6), 0xe9b85d, Math.sin(i * 2.1) * radius * 0.55, 1.88 + (i % 2) * 0.28, Math.cos(i * 1.9) * radius * 0.55);
  }

  private makeBuilding(def: TownBuilding) {
    const g = new THREE.Group();
    g.position.set(def.x, 0, def.z);
    g.rotation.y = def.facing ?? 0;
    this.root.add(g);
    const colors: Record<NonNullable<TownBuilding["style"]>, number> = { clubhouse: 0xd78464, bookshop: 0x809c92, bakery: 0xe5b36d, cottage: 0xb98da0, greenhouse: 0x9cad85 };
    const wall = colors[def.style ?? "cottage"];
    this.mesh(g, new RoundedBoxGeometry(def.width, 1.65, def.depth, 3, 0.12), wall, 0, 0.825, 0);
    const roof = this.mesh(g, new THREE.ConeGeometry(Math.max(def.width, def.depth) * 0.78, 1.15, 4), def.style === "greenhouse" ? 0x6d9b85 : 0x8e6250, 0, 2.05, 0);
    roof.rotation.y = Math.PI / 4;
    const door = this.mesh(g, new RoundedBoxGeometry(0.62, 1.03, 0.07, 2, 0.045), 0x6b4a39, 0, 0.515, def.depth / 2 + 0.045);
    if (def.style === "clubhouse") door.userData.kind = "home";
    for (const side of [-1, 1]) {
      const window = this.mesh(g, new RoundedBoxGeometry(0.46, 0.48, 0.055, 2, 0.035), 0xa9d5d3, side * Math.min(0.92, def.width * 0.27), 1.06, def.depth / 2 + 0.055, { roughness: 0.3 });
      (window.material as THREE.MeshStandardMaterial).emissive.set(0x244a4f);
      (window.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.16;
    }
    const signText = { clubhouse: "HOME", bookshop: "BOOKS", bakery: "BAKE", cottage: "TEA", greenhouse: "GROW" }[def.style ?? "cottage"];
    this.makeShopSign(g, signText, 0, 1.53, def.depth / 2 + 0.09, Math.min(1.12, def.width * 0.38));
    const awning = this.mesh(g, new RoundedBoxGeometry(Math.min(2.0, def.width * 0.62), 0.12, 0.46, 2, 0.04), def.style === "bakery" ? 0xe7d6a8 : def.style === "bookshop" ? 0xc56455 : 0xeff0d5, 0, 1.31, def.depth / 2 + 0.24, { shadow: false });
    awning.rotation.x = -0.18;
    if (def.style === "bookshop") {
      for (let i = 0; i < 5; i++) this.mesh(g, new RoundedBoxGeometry(0.16, 0.44 + (i % 2) * 0.08, 0.08, 1, 0.015), [0xd7af5f, 0x638c88, 0xc86e61, 0xe8d7ac, 0x92786b][i], -def.width * 0.35 + i * 0.18, 0.34, def.depth / 2 + 0.13, { shadow: false });
    }
    if (def.style === "bakery") {
      for (const x of [-0.95, 0.95]) this.mesh(g, new THREE.SphereGeometry(0.17, 10, 8), 0xd7984d, x, 0.31, def.depth / 2 + 0.14, { shadow: false });
    }
    if (def.style === "greenhouse") {
      for (const x of [-0.95, 0.95]) {
        this.mesh(g, new THREE.CylinderGeometry(0.15, 0.19, 0.26, 10), 0xc77f5f, x, 0.14, def.depth / 2 + 0.15, { shadow: false });
        this.mesh(g, new THREE.SphereGeometry(0.2, 9, 7), 0x5b965c, x, 0.43, def.depth / 2 + 0.15, { shadow: false });
      }
    }
  }

  private makeShopSign(parent: THREE.Object3D, text: string, x: number, y: number, z: number, width: number) {
    const board = this.mesh(parent, new RoundedBoxGeometry(width + 0.12, 0.34, 0.055, 2, 0.035), 0x6b4b39, x, y, z, { shadow: false });
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
    const label = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.27), new THREE.MeshBasicMaterial({ map: texture }));
    label.position.set(x, y, z + 0.033);
    parent.add(label);
  }

  private makeFountain() {
    const f = new THREE.Group();
    f.name = "Fountain";
    f.userData.kind = "fountain";
    f.position.set(TOWN.fountain.x, 0, TOWN.fountain.z);
    this.root.add(f);
    this.mesh(f, new THREE.CylinderGeometry(2.0, 2.1, 0.38, 40), 0xa9aab0, 0, 0.19, 0);
    this.mesh(f, new THREE.CylinderGeometry(1.7, 1.78, 0.12, 40), 0xd3d0c4, 0, 0.42, 0);
    const pool = this.mesh(f, new THREE.CylinderGeometry(1.55, 1.55, 0.025, 40), 0x5daec0, 0, 0.495, 0, { shadow: false, roughness: 0.3 });
    const poolMaterial = pool.material as THREE.MeshStandardMaterial;
    poolMaterial.emissive.set(0x1a6174);
    poolMaterial.emissiveIntensity = 0.15;
    this.water.push(poolMaterial);
    this.mesh(f, new THREE.CylinderGeometry(0.42, 0.56, 0.88, 18), 0xc8c7c2, 0, 0.84, 0);
    this.mesh(f, new THREE.SphereGeometry(0.3, 18, 12), 0xe0d8c4, 0, 1.38, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const jet = this.mesh(f, new THREE.CylinderGeometry(0.036, 0.07, 0.72, 8), 0xd2f4ed, Math.cos(a) * 0.48, 0.95, Math.sin(a) * 0.48, { shadow: false, roughness: 0.15 });
      jet.rotation.z = Math.cos(a) * 0.28;
      jet.rotation.x = -Math.sin(a) * 0.28;
      this.jets.push(jet);
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.31, 24), new THREE.MeshBasicMaterial({ color: 0xe1ffff, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }));
      ripple.position.set(Math.cos(a) * 0.75, 0.514, Math.sin(a) * 0.75);
      ripple.rotation.x = -Math.PI / 2;
      f.add(ripple);
      this.ripples.push(ripple);
    }
  }
}
