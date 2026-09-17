import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Position = readonly [number, number, number];

/** Decorative perimeter only; navigation and saved furniture remain unchanged. */
export class TreehouseShell {
  readonly root = new THREE.Group();
  private bark = this.material(0x8e6039);
  private trim = this.material(0xc69760);
  private leaves = [0x78924b, 0x8fa45a, 0xa5b66b, 0x647e42].map((c) =>
    this.material(c),
  );

  constructor() {
    const grain = this.woodGrain();
    const boards = [0xc79860, 0xd1a56f, 0xbd8d55, 0xcda16b].map((color) => {
      const material = this.material(color);
      material.map = grain;
      return material;
    });
    this.box([10.35, 0.3, 8.35], [5, -0.2, 4], this.bark, 0.1);
    for (let row = 0; row < 16; row++) {
      const offset = row % 2;
      for (let start = -offset; start < 10; start += 2) {
        const left = Math.max(0, start),
          right = Math.min(10, start + 2);
        this.box(
          [right - left - 0.018, 0.075, 0.486],
          [(left + right) / 2, -0.015, 0.25 + row * 0.5],
          boards[(row * 3 + start + offset) % 4],
          0.012,
        );
      }
    }
    this.box([10.25, 3.25, 0.16], [5, 1.54, -0.1], this.bark);
    this.box([0.16, 3.25, 8.2], [-0.1, 1.54, 4], this.bark);
    for (let row = 0; row < 11; row++) {
      const y = 0.12 + row * 0.29;
      this.box([10.15, 0.276, 0.09], [5, y, 0.02], boards[row % 4], 0.018);
      const side = this.box(
        [8.12, 0.276, 0.09],
        [0.02, y, 4],
        boards[(row + 1) % 4],
        0.018,
      );
      side.rotation.y = Math.PI / 2;
    }
    this.branch(
      [
        [0, 0, 0],
        [-0.04, 1, 0],
        [0.08, 2.15, 0],
        [0, 3.42, 0],
      ],
      0.27,
      0.2,
    );
    this.branch(
      [
        [10, 0, 0],
        [10.05, 1.15, 0],
        [9.93, 2.3, 0],
        [10, 3.32, 0],
      ],
      0.25,
      0.16,
    );
    this.branch(
      [
        [0, 0, 8],
        [0.05, 1.1, 8],
        [-0.04, 2.25, 8],
        [0, 3.3, 8],
      ],
      0.25,
      0.16,
    );
    this.branch(
      [
        [0, 3.12, 0],
        [3, 3.2, -0.02],
        [6.8, 3.12, 0],
        [10, 3.16, 0],
      ],
      0.16,
      0.12,
    );
    this.branch(
      [
        [0, 3.12, 0],
        [-0.04, 3.2, 3],
        [0, 3.1, 5.5],
        [0, 3.16, 8],
      ],
      0.16,
      0.12,
    );
    this.branch(
      [
        [0, 1.9, 0],
        [0.5, 2.45, 0],
        [1.5, 2.85, 0],
        [2.3, 3.17, 0],
      ],
      0.17,
      0.065,
    );
    this.branch(
      [
        [10, 1.8, 0],
        [9.6, 2.45, 0],
        [8.85, 2.8, 0],
        [8.1, 3.14, 0],
      ],
      0.15,
      0.055,
    );
    this.branch(
      [
        [0, 1.9, 8],
        [0, 2.5, 7.5],
        [0, 2.86, 6.65],
      ],
      0.15,
      0.055,
    );
    this.window();
    for (const [x, z, size] of [
      [0, 0, 1],
      [10, 0, 0.8],
      [0, 8, 0.8],
      [2.1, -0.08, 0.55],
      [8.6, -0.08, 0.55],
      [-0.08, 5.8, 0.55],
    ])
      this.foliage(x, 3.3, z, size);
  }

  private material(color: number) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
  }

  /** Deterministic grain data, with no browser canvas or external texture dependency. */
  private woodGrain() {
    const w = 128,
      h = 64,
      pixels = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const wave =
          y + 1.5 * Math.sin(x * 0.06) + 0.6 * Math.sin(x * 0.14 + y);
        const line = Math.pow((1 + Math.sin(wave * 2.1)) / 2, 12);
        const knot = Math.sin(Math.hypot((x - 42) * 0.18, (y - 30) * 0.8) * 3);
        const shade = Math.round(241 - line * 29 + knot * 3);
        const i = (y * w + x) * 4;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = shade;
        pixels[i + 3] = 255;
      }
    const texture = new THREE.DataTexture(pixels, w, h);
    texture.userData.roomOwned = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  private mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.MeshStandardMaterial,
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    this.root.add(mesh);
    return mesh;
  }

  private box(
    size: Position,
    position: Position,
    material: THREE.MeshStandardMaterial,
    round = 0.04,
  ) {
    const mesh = this.mesh(
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(round, ...size.map((v) => v / 4)),
      ),
      material,
    );
    mesh.position.set(...position);
    return mesh;
  }

  private branch(points: Position[], startRadius: number, endRadius: number) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const path = curve.getPoints(12);
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i],
        to = path[i + 1];
      const bottom = THREE.MathUtils.lerp(startRadius, endRadius, i / 12);
      const top = THREE.MathUtils.lerp(startRadius, endRadius, (i + 1) / 12);
      const segment = this.mesh(
        new THREE.CylinderGeometry(top, bottom, from.distanceTo(to), 12),
        this.bark,
      );
      segment.position.copy(from).add(to).multiplyScalar(0.5);
      segment.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        to.clone().sub(from).normalize(),
      );
      const joint = this.mesh(new THREE.SphereGeometry(top, 12, 8), this.bark);
      joint.position.copy(to);
    }
  }

  private foliage(x: number, y: number, z: number, scale: number) {
    for (let i = 0; i < 19; i++) {
      const a = i * 2.4,
        radius = Math.sqrt(i / 19) * 0.72 * scale;
      const leaf = this.mesh(
        new THREE.SphereGeometry(1, 8, 6),
        this.leaves[i % 4],
      );
      leaf.position.set(
        x + Math.cos(a) * radius,
        y + ((1 - i / 19) * 0.18 + Math.sin(i * 1.7) * 0.12) * scale,
        z + Math.sin(a) * radius,
      );
      leaf.scale.set(0.23 * scale, 0.1 * scale, 0.39 * scale);
      leaf.rotation.set(0.12 * Math.cos(a), -a, 0.24 * Math.sin(a));
    }
  }

  private window() {
    this.box([2.9, 1.85, 0.11], [6.1, 2.05, 0.13], this.bark, 0.1);
    this.box([2.65, 1.61, 0.05], [6.1, 2.05, 0.2], this.material(0xb7cda2));
    for (let i = 0; i < 15; i++) {
      const leaf = this.mesh(
        new THREE.SphereGeometry(1, 12, 8),
        this.leaves[(i + 1) % 4],
      );
      leaf.scale.set(0.18 + (i % 3) * 0.08, 0.16 + (i % 4) * 0.06, 0.018);
      leaf.position.set(
        4.98 + (i % 5) * 0.54,
        1.48 + Math.floor(i / 5) * 0.54,
        0.24,
      );
    }
    for (const y of [1.18, 2.92])
      this.box([2.82, 0.11, 0.16], [6.1, y, 0.25], this.trim);
    for (const x of [4.72, 7.48])
      this.box([0.11, 1.83, 0.16], [x, 2.05, 0.25], this.trim);
    this.box([2.7, 0.065, 0.13], [6.1, 2.05, 0.29], this.trim);
    this.box([0.065, 1.7, 0.13], [6.1, 2.05, 0.29], this.trim);
    this.box([3.03, 0.13, 0.43], [6.1, 1.08, 0.24], this.trim);
    this.branch(
      [
        [4.57, 1.12, 0.16],
        [4.4, 1.7, 0.16],
        [4.46, 2.5, 0.16],
        [4.73, 2.99, 0.16],
        [5.2, 3.13, 0.16],
      ],
      0.11,
      0.065,
    );
    this.branch(
      [
        [7.65, 1.12, 0.16],
        [7.83, 1.8, 0.16],
        [7.74, 2.5, 0.16],
        [7.43, 2.99, 0.16],
        [6.95, 3.13, 0.16],
      ],
      0.11,
      0.065,
    );
  }
}
