import * as THREE from "three";
import type { FurnitureDefinition } from "../core/catalog";

type Status = {
  filled: boolean;
  fishDarting: boolean;
  trampolineWobbling: boolean;
};

const solid = (color: THREE.ColorRepresentation) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.03 });

const mesh = (
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) => {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(x, y, z);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
};

/**
 * Independent, render-only state for an interactive room furnishing. The room
 * owns persistence and routes taps/pet movement into this compact controller.
 */
export class InteractiveFurnishing {
  readonly root = new THREE.Group();
  private food = new THREE.Group();
  private fish: THREE.Group[] = [];
  private fishBases: THREE.Vector3[] = [];
  private fishPhases: number[] = [];
  private mat: THREE.Group | null = null;
  private dartFor = 0;
  private wobbleFor = 0;
  private isFilled: boolean;

  constructor(
    readonly definition: FurnitureDefinition,
    filled = false,
  ) {
    this.isFilled = filled;
    switch (definition.kind) {
      case "bowl":
        this.buildBowl();
        break;
      case "aquarium":
        this.buildAquarium();
        break;
      case "trampoline":
        this.buildTrampoline();
        break;
      default:
        this.buildFallback();
    }
  }

  get filled() {
    return this.isFilled;
  }

  status(): Status {
    return {
      filled: this.isFilled,
      fishDarting: this.dartFor > 0,
      trampolineWobbling: this.wobbleFor > 0,
    };
  }

  setFilled(value: boolean) {
    this.isFilled = value;
    this.food.visible = value;
  }

  interact() {
    if (this.definition.kind === "bowl") this.setFilled(true);
    if (this.definition.kind === "aquarium") this.dartFor = 2;
    if (this.definition.kind === "trampoline") this.wobbleFor = 0.72;
  }

  update(dt: number, reduced: boolean) {
    // Rendering can resume after a background pause; never turn that gap into
    // a huge visual jump or let a short response linger for minutes.
    const step = Math.min(Math.max(dt, 0), 0.05);
    this.wobbleFor = Math.max(0, this.wobbleFor - step);
    const dart = this.dartFor > 0;
    this.fish.forEach((fish, index) => {
      const base = this.fishBases[index];
      const speed = dart ? (reduced ? 2.2 : 7.2) : reduced ? 0.35 : 1.25;
      // Keep a per-fish integrated phase. Multiplying a shared elapsed clock
      // by a newly selected speed would teleport fish on every tap/end state.
      const t = (this.fishPhases[index] += step * speed) + index * 1.9;
      const x = base.x + Math.sin(t) * (reduced ? 0.12 : 0.22);
      const y = base.y + Math.sin(t * 1.7) * (reduced ? 0.008 : 0.025);
      const z = base.z + Math.cos(t * 0.8) * 0.09;
      fish.position.set(x, y, z);
      fish.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
    });
    this.dartFor = Math.max(0, this.dartFor - step);
    if (this.mat) {
      const amount = this.wobbleFor > 0 ? this.wobbleFor / 0.72 : 0;
      const wobble = Math.sin((0.72 - this.wobbleFor) * 24) * 0.055 * amount;
      this.mat.position.y = 0.31 + wobble * (reduced ? 0.35 : 1);
      this.mat.scale.set(
        1 - Math.abs(wobble) * 0.9,
        1,
        1 - Math.abs(wobble) * 0.9,
      );
    }
  }

  private addBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    color: THREE.ColorRepresentation,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const part = mesh(new THREE.BoxGeometry(w, h, d), solid(color), x, y, z);
    parent.add(part);
    return part;
  }

  private addBall(
    parent: THREE.Object3D,
    radius: number,
    color: THREE.ColorRepresentation,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const part = mesh(
      new THREE.SphereGeometry(radius, 14, 10),
      solid(color),
      x,
      y,
      z,
    );
    parent.add(part);
    return part;
  }

  private buildBowl() {
    const bowl = mesh(
      new THREE.CylinderGeometry(0.29, 0.36, 0.19, 28, 1, true),
      solid(this.definition.color),
      0,
      0.125,
    );
    this.root.add(bowl);
    const rim = mesh(
      new THREE.TorusGeometry(0.295, 0.035, 10, 28),
      solid(0xffd67c),
      0,
      0.215,
    );
    rim.rotation.x = Math.PI / 2;
    this.root.add(rim);
    this.root.add(
      mesh(
        new THREE.CylinderGeometry(0.29, 0.29, 0.015, 28),
        solid(0x875c3d),
        0,
        0.035,
      ),
    );
    this.food.position.y = 0.2;
    for (let i = 0; i < 16; i++) {
      const angle = i * 2.4;
      const radius = 0.05 + (i % 4) * 0.043;
      this.addBall(
        this.food,
        0.028,
        i % 3 === 0 ? 0xe5b66b : 0x9c6943,
        Math.sin(angle) * radius,
        (i % 2) * 0.012,
        Math.cos(angle) * radius,
      );
    }
    this.root.add(this.food);
    this.setFilled(this.isFilled);
  }

  private buildAquarium() {
    const w = this.definition.width;
    const d = this.definition.depth;
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xbfe9ed,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const water = new THREE.MeshPhysicalMaterial({
      color: 0x4faec3,
      transparent: true,
      opacity: 0.18,
      roughness: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (const x of [-w / 2, w / 2])
      for (const z of [-d / 2, d / 2])
        this.root.add(
          mesh(
            new THREE.CylinderGeometry(0.045, 0.055, 0.46, 10),
            solid(0x625a52),
            x * 0.82,
            0.23,
            z * 0.78,
          ),
        );
    this.addBox(this.root, w * 0.94, 0.12, d * 0.94, 0x5f625e, 0, 0.49);
    this.addBox(this.root, w * 0.82, 0.06, d * 0.72, 0xc5a178, 0, 0.55);
    const waterBox = mesh(
      new THREE.BoxGeometry(w * 0.88, 0.83, d * 0.86),
      water,
      0,
      1.0,
    );
    waterBox.renderOrder = 1;
    this.root.add(waterBox);
    const rim = solid(0x697e82);
    this.root.add(mesh(new THREE.BoxGeometry(w, 0.05, d), rim, 0, 1.47));
    this.root.add(
      mesh(new THREE.BoxGeometry(w, 0.05, d), rim.clone(), 0, 0.56),
    );
    for (const x of [-w / 2, w / 2]) {
      for (const z of [-d / 2, d / 2])
        this.root.add(
          mesh(
            new THREE.BoxGeometry(0.035, 0.9, 0.035),
            rim.clone(),
            x,
            1.015,
            z,
          ),
        );
      const side = mesh(
        new THREE.BoxGeometry(0.025, 0.9, d),
        glass.clone(),
        x,
        1.015,
      );
      side.renderOrder = 2;
      this.root.add(side);
    }
    for (const z of [-d / 2, d / 2]) {
      const pane = mesh(
        new THREE.BoxGeometry(w, 0.9, 0.035),
        glass.clone(),
        0,
        1.015,
        z,
      );
      pane.renderOrder = 2;
      this.root.add(pane);
    }
    for (let i = 0; i < 4; i++) {
      const plant = new THREE.Group();
      plant.position.set(-0.48 + i * 0.3, 0.61, -0.17 + (i % 2) * 0.2);
      for (let leaf = 0; leaf < 3; leaf++) {
        const blade = this.addBox(
          plant,
          0.055,
          0.32,
          0.025,
          i % 2 ? 0x5d9b74 : 0x79ad68,
          0,
          0.15 + leaf * 0.07,
        );
        blade.rotation.z = (leaf - 1) * 0.35;
      }
      this.root.add(plant);
    }
    const colors = [0xffb34f, 0x887bd2, 0xf07483];
    const points = [
      [-0.32, 1.13, 0.05],
      [0.12, 0.91, -0.16],
      [0.36, 1.28, 0.14],
    ];
    points.forEach((point, index) =>
      this.addFish(colors[index], new THREE.Vector3(...point)),
    );
    for (let i = 0; i < 7; i++) {
      const bubble = mesh(
        new THREE.SphereGeometry(0.018 + (i % 3) * 0.008, 10, 8),
        new THREE.MeshBasicMaterial({
          color: 0xe9ffff,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        }),
        -0.52 + (i % 3) * 0.07,
        0.72 + (i % 4) * 0.13,
        0.18,
      );
      this.root.add(bubble);
    }
  }

  private addFish(color: number, position: THREE.Vector3) {
    const fish = new THREE.Group();
    fish.name = `aquarium-fish-${this.fish.length}`;
    fish.position.copy(position);
    this.addBall(fish, 0.07, color);
    const tail = mesh(
      new THREE.ConeGeometry(0.065, 0.14, 3),
      solid(color),
      -0.11,
      0,
      0,
    );
    tail.rotation.z = -Math.PI / 2;
    fish.add(tail);
    this.addBall(fish, 0.014, 0x293c49, 0.055, 0.025, 0.055);
    this.root.add(fish);
    this.fish.push(fish);
    this.fishBases.push(position);
    this.fishPhases.push(0);
  }

  private buildTrampoline() {
    const ring = mesh(
      new THREE.TorusGeometry(0.56, 0.075, 10, 32),
      solid(this.definition.color),
      0,
      0.32,
    );
    ring.rotation.x = Math.PI / 2;
    this.root.add(ring);
    this.mat = new THREE.Group();
    const surface = mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.035, 32),
      new THREE.MeshStandardMaterial({ color: 0x41515d, roughness: 0.84 }),
    );
    this.mat.add(surface);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const spring = mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8),
        solid(0xd8e0de),
        Math.sin(a) * 0.53,
        -0.025,
        Math.cos(a) * 0.53,
      );
      this.mat.add(spring);
    }
    this.mat.position.y = 0.31;
    this.root.add(this.mat);
    for (const x of [-0.39, 0.39])
      for (const z of [-0.39, 0.39]) {
        const leg = mesh(
          new THREE.CylinderGeometry(0.035, 0.05, 0.25, 10),
          solid(0x667075),
          x,
          0.14,
          z,
        );
        leg.rotation.z = x * 0.26;
        this.root.add(leg);
      }
  }

  private buildFallback() {
    this.addBox(
      this.root,
      this.definition.width,
      this.definition.height,
      this.definition.depth,
      this.definition.color,
      0,
      this.definition.height / 2,
    );
  }
}
