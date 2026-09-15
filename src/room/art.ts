import * as THREE from "three";
import { InteractiveFurnishing } from "./furnishings";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { FurnitureDefinition, PetDefinition } from "../core/catalog";
const palette = [0xbd705c, 0xe2bf75, 0x789887, 0x7f96a9, 0xbaa0ac, 0xf0ddac];
export class RoomArt {
  static material(color: THREE.ColorRepresentation) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
  }
  static box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    color: THREE.ColorRepresentation,
    x = 0,
    y = 0,
    z = 0,
    round = 0.04,
  ) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(round, w / 4, h / 4, d / 4)),
      this.material(color),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  static ball(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    color: THREE.ColorRepresentation,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      this.material(color),
    );
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  static cylinder(
    parent: THREE.Object3D,
    top: number,
    bottom: number,
    height: number,
    color: THREE.ColorRepresentation,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(top, bottom, height, 24),
      this.material(color),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  static furniture(def: FurnitureDefinition, lampOn = false): THREE.Group {
    if (["bowl", "aquarium", "trampoline"].includes(def.kind))
      return new InteractiveFurnishing(def).root;
    const g = new THREE.Group(),
      w = def.width,
      d = def.depth,
      h = def.height,
      c = def.color;
    const legs = (height: number) => {
      for (const x of [-w * 0.38, w * 0.38])
        for (const z of [-d * 0.33, d * 0.33])
          this.box(g, 0.1, height, 0.1, 0x79523e, x, height / 2, z);
    };
    if (def.kind === "bookcase") {
      this.box(g, w, h, 0.1, c, 0, h / 2, -d / 2 + 0.05);
      this.box(g, 0.13, h, d, c, -w / 2 + 0.065, h / 2);
      this.box(g, 0.13, h, d, c, w / 2 - 0.065, h / 2);
      for (let row = 0; row < 4; row++) {
        const y = 0.12 + row * 0.59;
        this.box(g, w, 0.1, d, c, 0, y);
        for (let b = 0; b < 11; b++) {
          const bh = 0.26 + ((b * 13 + row * 7) % 9) * 0.024;
          const book = this.box(
            g,
            0.12 + (b % 3) * 0.014,
            bh,
            0.31,
            palette[(b + row * 3) % palette.length],
            -w / 2 + 0.25 + b * 0.185,
            y + 0.07 + bh / 2,
            0.08,
            0.014,
          );
          if (b === 3 || b === 8) book.rotation.z = 0.1;
          this.box(
            book,
            0.09,
            0.016,
            0.008,
            0xf3deb3,
            0,
            bh * 0.21,
            0.16,
            0.003,
          );
        }
      }
      this.box(g, w + 0.12, 0.14, d + 0.08, 0xb68255, 0, h);
      return g;
    }
    if (def.kind === "table" || def.kind === "doghouse") {
      legs(h - 0.12);
      this.box(g, w, 0.14, d, c, 0, h - 0.07);
      if (def.kind === "doghouse") {
        this.box(g, w * 0.8, h * 0.58, d * 0.78, 0xf0d5aa, 0, h * 0.37);
        this.box(g, 0.4, 0.48, 0.02, 0x725644, 0, 0.25, d * 0.4);
      }
      return g;
    }
    if (def.kind === "sofa" || def.kind === "chair") {
      legs(0.28);
      this.box(g, w, 0.35, d, c, 0, 0.4);
      this.box(g, w, 0.55, 0.22, c, 0, 0.73, -d * 0.39);
      this.box(g, 0.19, 0.46, d, c, -w * 0.45, 0.62);
      this.box(g, 0.19, 0.46, d, c, w * 0.45, 0.62);
      const cushions = def.kind === "sofa" ? 3 : 1;
      for (let i = 0; i < cushions; i++)
        this.box(
          g,
          (w - 0.4) / cushions - 0.035,
          0.16,
          d * 0.7,
          def.kind === "sofa" ? 0x91b29a : 0xe0b895,
          (-0.5 + (i + 0.5) / cushions) * (w - 0.4),
          0.62,
          0.05,
          0.07,
        );
      if (def.kind === "sofa") {
        const pillow = this.box(
          g,
          0.45,
          0.42,
          0.19,
          0xe5bf79,
          -w * 0.28,
          0.86,
          -d * 0.12,
          0.08,
        );
        pillow.rotation.z = -0.15;
      }
      return g;
    }
    if (def.kind === "lamp") {
      this.cylinder(g, 0.24, 0.28, 0.08, 0x8e7651, 0, 0.04);
      this.cylinder(g, 0.027, 0.027, 1.5, 0xa78b5b, 0, 0.8);
      const shade = this.cylinder(g, 0.22, 0.33, 0.42, c, 0, 1.63);
      const bulb = this.ball(g, 0.16, 0.06, 0.16, 0xffe9ae, 0, 1.43);
      if (lampOn) {
        shade.material.emissive.set(0xffb94e);
        shade.material.emissiveIntensity = 0.8;
        bulb.material.emissive.set(0xffe9ae);
        bulb.material.emissiveIntensity = 2;
        const light = new THREE.PointLight(0xffc977, 5, 4, 2);
        light.position.set(0, 1.35, 0);
        g.add(light);
        // A soft pool keeps the on/off state readable in this sunlit room.
        const glow = new THREE.Mesh(
          new THREE.CircleGeometry(0.8, 40),
          new THREE.MeshBasicMaterial({
            color: 0xffd589,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
          }),
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.025;
        g.add(glow);
      }
      return g;
    }
    if (def.kind === "plant") {
      this.cylinder(g, 0.23, 0.16, 0.38, 0xcf916e, 0, 0.19);
      this.cylinder(g, 0.2, 0.2, 0.035, 0x69583e, 0, 0.39);
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4;
        const leaf = this.ball(
          g,
          0.08,
          0.28,
          0.085,
          i % 2 ? 0x6d9c6d : 0x91b180,
          Math.sin(a) * 0.12,
          0.58 + (i % 3) * 0.07,
          Math.cos(a) * 0.12,
        );
        leaf.rotation.z = Math.sin(a) * 0.6;
        leaf.rotation.x = Math.cos(a) * 0.6;
      }
      return g;
    }
    if (def.kind === "bed") {
      this.box(g, w, h, d, c, 0, h / 2, 0, 0.15);
      this.box(g, w * 0.76, 0.09, d * 0.7, 0xf6dfab, 0, h / 2 + 0.12, 0, 0.1);
      for (let i = 0; i < 3; i++)
        this.box(
          g,
          0.28,
          0.018,
          0.27,
          palette[i],
          (i - 1) * 0.31,
          h + 0.001,
          0,
          0.01,
        );
      return g;
    }
    if (def.kind === "basket") {
      this.cylinder(g, 0.35, 0.29, 0.44, c, 0, 0.22);
      for (let i = 0; i < 4; i++) {
        const a = i * 2.1;
        this.ball(
          g,
          0.15,
          0.15,
          0.15,
          palette[i],
          Math.sin(a) * 0.17,
          0.48,
          Math.cos(a) * 0.17,
        );
      }
      return g;
    }
    this.cylinder(g, 0.24, 0.27, 0.08, 0xa57e56, 0, 0.04);
    this.cylinder(g, 0.05, 0.05, 0.34, 0xa57e56, 0, 0.22);
    if (def.gameReward === "sock") {
      this.box(g, 0.16, 0.28, 0.13, 0xf1dca9, -0.035, 0.5);
      this.box(g, 0.27, 0.12, 0.13, 0xf1dca9, 0.03, 0.38);
      this.box(g, 0.17, 0.065, 0.14, c, -0.035, 0.62);
    } else if (
      def.gameReward?.includes("bandana") ||
      def.gameReward === "power-magnet"
    ) {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.32, 3),
        this.material(c),
      );
      m.rotation.z = Math.PI;
      m.position.y = 0.52;
      m.castShadow = true;
      g.add(m);
    } else if (def.gameReward === "power-wind") {
      for (let i = 0; i < 4; i++) {
        const blade = this.box(
          g,
          0.1,
          0.22,
          0.055,
          palette[i],
          Math.sin((i * Math.PI) / 2) * 0.11,
          0.54 + Math.cos((i * Math.PI) / 2) * 0.11,
          0,
        );
        blade.rotation.z = (-i * Math.PI) / 2 - 0.4;
      }
    } else this.ball(g, 0.2, 0.19, 0.17, c, 0, 0.51);
    return g;
  }
  static environment(): THREE.Group {
    const g = new THREE.Group();
    this.box(g, 10.35, 0.3, 8.35, 0x866145, 5, -0.2, 4, 0.1);
    for (let row = 0; row < 16; row++)
      for (let col = 0; col < 5; col++) {
        const x = 1 + col * 2,
          z = 0.25 + row * 0.5;
        this.box(
          g,
          1.984,
          0.075,
          0.486,
          [0xd8b88d, 0xd1ad80, 0xe0c099, 0xd6b48a][(row * 3 + col) % 4],
          x,
          -0.015,
          z,
          0.012,
        );
      }
    this.box(g, 10.25, 3.25, 0.16, 0xf2e3c7, 5, 1.54, -0.1);
    this.box(g, 0.16, 3.25, 8.2, 0xe8d9bb, -0.1, 1.54, 4);
    this.box(g, 10.2, 0.25, 0.16, 0xa47f56, 5, 0.14, 0.01);
    this.box(g, 0.16, 0.25, 8.2, 0xa47f56, 0.01, 0.14, 4);
    this.box(g, 10.35, 0.1, 0.22, 0xc9a579, 5, 3.2, -0.1);
    this.box(g, 0.22, 0.1, 8.35, 0xc9a579, -0.1, 3.2, 4);
    // Window layers face into the room; the visible sky is an intentional painted backdrop.
    this.box(g, 2.3, 1.8, 0.15, 0xba9569, 6.1, 2.02, 0.02);
    this.box(g, 2.07, 1.57, 0.17, 0xaac9c1, 6.1, 2.02, 0.08);
    this.box(g, 2.08, 0.055, 0.2, 0xf7e7c7, 6.1, 2.02, 0.15);
    this.box(g, 0.06, 1.58, 0.2, 0xf7e7c7, 6.1, 2.02, 0.15);
    this.box(g, 2.65, 0.13, 0.42, 0xc69d6b, 6.1, 1.1, 0.17);
    this.ball(g, 0.25, 0.25, 0.02, 0xf8e8b4, 6.65, 2.45, 0.18);
    // A quiet landscape and a little entry mat.
    this.box(g, 0.12, 1.35, 1.55, 0xb68b61, 0.02, 2.0, 3.2);
    this.box(g, 0.14, 1.13, 1.33, 0xb6c4a0, 0.06, 2, 3.2);
    this.ball(g, 0.02, 0.35, 0.5, 0x73958a, 0.15, 1.72, 3.1);
    this.ball(g, 0.02, 0.17, 0.17, 0xf1d79f, 0.16, 2.28, 3.45);
    this.box(g, 4.3, 0.025, 3.0, 0xc6c9ab, 5.9, 0.04, 4.2, 0.1);
    this.box(g, 4.05, 0.012, 2.76, 0xe5dfbf, 5.9, 0.055, 4.2, 0.1);
    this.box(g, 3.84, 0.012, 2.55, 0xaeb89a, 5.9, 0.066, 4.2, 0.1);
    for (let i = 0; i < 11; i++)
      this.box(
        g,
        0.018,
        0.012,
        2.45,
        0xcbd0b2,
        4.1 + i * 0.36,
        0.075,
        4.2,
        0.004,
      );
    this.box(g, 1.7, 0.026, 0.65, 0xd4a476, 5, 0.035, 7.56, 0.06);
    return g;
  }
  static release(root: THREE.Object3D) {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((m) => m.dispose());
      }
    });
  }
}

/** A small rig, oriented in world space, so all eight walk directions share one model. */
export class AnimalRig {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private legs: THREE.Group[] = [];
  private arms: THREE.Group[] = [];
  private phase = 0;
  private jumpTime = 0;
  private waveTime = 0;
  private petTime = 0;
  private petBody = false;
  constructor(
    color: THREE.ColorRepresentation,
    shape: "fox" | "cat" | "bunny" = "fox",
    accessory = "none",
    pet = false,
  ) {
    this.root.add(this.body);
    const a = RoomArt,
      cream = 0xffebc9;
    a.ball(this.body, 0.25, 0.36, 0.2, color, 0, 0.57);
    a.ball(this.body, 0.17, 0.23, 0.025, cream, 0, 0.58, 0.19);
    a.ball(this.body, 0.3, 0.28, 0.25, color, 0, 1.02, 0.015);
    a.ball(this.body, 0.2, 0.12, 0.13, cream, 0, 0.94, 0.23);
    a.ball(this.body, 0.055, 0.043, 0.04, 0x4e3c34, 0, 0.97, 0.345);
    for (const s of [-1, 1]) {
      a.ball(this.body, 0.027, 0.039, 0.02, 0x42372e, s * 0.115, 1.075, 0.248);
      a.ball(
        this.body,
        0.011,
        0.012,
        0.008,
        0xfff5de,
        s * 0.115 - 0.006,
        1.087,
        0.266,
      );
      const ear = a.ball(
        this.body,
        shape === "bunny" ? 0.07 : 0.105,
        shape === "bunny" ? 0.28 : 0.17,
        0.075,
        color,
        s * 0.185,
        shape === "bunny" ? 1.36 : 1.25,
      );
      ear.rotation.z = -s * 0.18;
      a.ball(ear, 0.55, 0.66, 0.15, 0xe5ac9d, 0, 0.15, 0.9);
      const leg = new THREE.Group();
      leg.position.set(s * 0.13, 0.34, 0);
      this.body.add(leg);
      a.ball(leg, 0.1, 0.19, 0.115, color, 0, -0.12, 0.03);
      a.ball(leg, 0.105, 0.07, 0.16, cream, 0, -0.27, 0.065);
      this.legs.push(leg);
      const arm = new THREE.Group();
      arm.position.set(s * 0.23, 0.73, 0);
      this.body.add(arm);
      a.ball(arm, 0.08, 0.2, 0.09, color, s * 0.035, -0.15, 0);
      a.ball(arm, 0.09, 0.085, 0.095, cream, s * 0.04, -0.3, 0.015);
      this.arms.push(arm);
    }
    const tail = a.ball(
      this.body,
      shape === "bunny" ? 0.12 : 0.14,
      shape === "bunny" ? 0.12 : 0.32,
      shape === "bunny" ? 0.12 : 0.14,
      color,
      0,
      0.49,
      -0.28,
    );
    tail.rotation.x = -0.7;
    if (shape === "fox") a.ball(tail, 0.72, 0.38, 0.72, cream, 0, -0.67, 0);
    if (accessory === "scarf") {
      a.cylinder(this.body, 0.235, 0.25, 0.12, 0x628f82, 0, 0.82);
      a.box(this.body, 0.12, 0.23, 0.04, 0x628f82, 0.11, 0.68, 0.21);
    }
    if (accessory === "bow") {
      a.ball(this.body, 0.1, 0.06, 0.045, 0xba7867, -0.1, 1.27, 0.15);
      a.ball(this.body, 0.1, 0.06, 0.045, 0xba7867, 0.05, 1.27, 0.15);
    }
    if (pet) {
      this.petBody = true;
      this.root.scale.setScalar(0.6);
      this.body.rotation.x = 0.08;
    }
  }
  jump() {
    this.jumpTime = 0.9;
  }
  wave() {
    this.waveTime = 1.5;
  }
  pet() {
    this.petTime = 1.8;
    this.jump();
  }
  update(dt: number, moving: boolean, reduced: boolean) {
    this.phase += dt * (moving ? 10 : 2);
    this.jumpTime = Math.max(0, this.jumpTime - dt);
    this.waveTime = Math.max(0, this.waveTime - dt);
    this.petTime = Math.max(0, this.petTime - dt);
    const progress = this.jumpTime > 0 ? 1 - this.jumpTime / 0.9 : 1;
    const strength = reduced ? 0.25 : 1;
    const crouch = progress < 0.18 ? Math.sin((progress / 0.18) * Math.PI) : 0;
    const flight =
      progress >= 0.18 && progress < 0.8
        ? Math.sin(((progress - 0.18) / 0.62) * Math.PI)
        : 0;
    const landing =
      progress >= 0.8 && progress < 1
        ? Math.sin(((progress - 0.8) / 0.2) * Math.PI)
        : 0;
    const squash = (crouch * 0.18 + landing * 0.16) * strength;
    const stretch = flight * 0.08 * strength;
    this.body.scale.set(
      1 + squash * 0.5 - stretch * 0.5,
      1 - squash + stretch,
      1 + squash * 0.5,
    );
    this.body.position.y =
      flight * 0.62 * strength +
      (this.jumpTime === 0 && !reduced
        ? moving
          ? Math.abs(Math.sin(this.phase)) * 0.035
          : Math.sin(this.phase) * 0.007
        : 0);
    this.body.rotation.x = (this.petBody ? 0.08 : 0) - flight * 0.12 * strength;
    this.legs.forEach(
      (l, i) =>
        (l.rotation.x =
          flight > 0
            ? (-0.8 + i * 0.25) * flight * strength
            : moving
              ? Math.sin(this.phase + i * Math.PI) * 0.6 * (reduced ? 0.4 : 1)
              : 0),
    );
    this.arms.forEach((a, i) => {
      a.rotation.x =
        flight > 0
          ? -flight * 0.35 * strength
          : moving
            ? Math.sin(this.phase + i * Math.PI) * -0.45
            : 0;
      const waveBlend = Math.min(
        1,
        (1.5 - this.waveTime) / 0.15,
        this.waveTime / 0.2,
      );
      a.position.y =
        0.73 + (i === 1 && this.waveTime > 0 ? waveBlend * 0.18 : 0);
      a.rotation.z =
        i === 1 && this.waveTime > 0
          ? (2.25 +
              Math.sin(this.waveTime * (reduced ? 5 : 16)) *
                (reduced ? 0.08 : 0.25)) *
            waveBlend
          : (i === 1 ? 1 : -1) * flight * 0.6 * strength;
      if (i === 1 && this.waveTime > 0) a.rotation.x = -0.15;
    });
  }
}
