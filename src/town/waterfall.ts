import * as THREE from "three";
import { TownAssets, type TownAssetKey } from "./assets";
import { TOWN } from "./layout";
import { TownStream } from "./stream";

/** Kit-built bluff. Full-depth cliff modules retain their authored proportions. */
export class TownWaterfall {
  readonly root = new THREE.Group();
  readonly imports = new THREE.Group();
  private readonly flowMaterial: THREE.ShaderMaterial;
  private readonly foam: THREE.Mesh[] = [];
  private elapsed = 0;

  constructor(private readonly assets: TownAssets) {
    this.root.name = "Natural waterfall bluff";
    this.imports.name = "Waterfall shared kit instances";
    this.root.add(this.imports);
    const { x, height } = TOWN.waterfall;
    const front = TownStream.bank(x, -1) + 0.16;

    // Overlapping, staggered shoulders, not two walls bordering a trench.
    // Native full blocks are cubes; half blocks make real horizontal ledges.
    const shelves = [
      { dx: 0, dz: -2.55, width: 4.6, top: 4.6, tree: false },
      { dx: -0.3, dz: -6.4, width: 4.6, top: 4.6, tree: false },
      { dx: -0.1, dz: -9.7, width: 4.6, top: 4.6, tree: false },
      { dx: -3.5, dz: -2.1, width: 3.3, top: 1.65, tree: false },
      { dx: -3.9, dz: -4.7, width: 3.5, top: 3.5, tree: true },
      { dx: -3.8, dz: -8.1, width: 3.8, top: 5.7, tree: true },
      { dx: 3.9, dz: -2.1, width: 3.4, top: 1.7, tree: false },
      { dx: 3.9, dz: -4.6, width: 3.1, top: 3.1, tree: true },
      { dx: 3.9, dz: -8.3, width: 3.6, top: 5.4, tree: true },
    ];
    shelves.forEach((shelf, i) => {
      const px = x + shelf.dx,
        pz = front + shelf.dz;
      const key = shelf.top < shelf.width ? "cliff-half" : "cliff-block";
      this.place(key, px, pz, shelf.width, 0, ((i % 4) * Math.PI) / 2);
      if (shelf.top > shelf.width)
        this.place(
          "cliff-half",
          px,
          pz,
          shelf.width,
          shelf.width,
          (((i + 1) % 4) * Math.PI) / 2,
        );
      // Native sculpted facade pieces face OUT; their flat backing is buried
      // inside the structural tile. Uniform scale retains the stone bevels.
      const faceKey = key === "cliff-half" ? "cliff-half-face" : "cliff-face";
      if (i !== 0)
        this.place(
          faceKey,
          px,
          pz + shelf.width / 2 + 0.22,
          shelf.width,
          0,
          Math.PI,
        );
      this.place(
        faceKey,
        px + shelf.width / 2 + 0.22,
        pz,
        shelf.width,
        0,
        -Math.PI / 2,
      );
      if (shelf.top > shelf.width) {
        this.place(
          "cliff-half-face",
          px,
          pz + shelf.width / 2 + 0.22,
          shelf.width,
          shelf.width,
          Math.PI,
        );
        this.place(
          "cliff-half-face",
          px + shelf.width / 2 + 0.22,
          pz,
          shelf.width,
          shelf.width,
          -Math.PI / 2,
        );
      }
      if (shelf.tree) {
        this.place(
          i % 2 ? "mini-tree" : "mini-tree-high",
          px - 0.45,
          pz - 0.4,
          1.25,
          shelf.top,
          i * 0.7,
        );
        this.place("bush", px + 0.6, pz + 0.5, 0.8, shelf.top);
        this.place("grass", px - 0.5, pz + 0.65, 0.55, shelf.top);
        this.place("flower-purple", px + 0.35, pz + 0.8, 0.28, shelf.top);
      }
    });

    // Irregular upright rocks hide tile edges and create the reference's broken
    // vertical silhouette. Different heights, depths and turns avoid a palisade.
    const columns = [
      [-2.5, -0.5, 3.7, 0.2],
      [-3.9, -1.0, 2.7, -0.3],
      [-5.2, -2.3, 2.6, 0.7],
      [-5.0, -4.7, 4.0, -0.2],
      [-4.6, -7.3, 5.4, 0.4],
      [-3.9, -9.5, 6.1, -0.6],
      [2.6, -0.65, 3.9, -0.1],
      [4.4, -1.5, 2.7, 0.5],
      [5.0, -3.1, 3.5, -0.5],
      [5.0, -5.1, 4.6, 0.3],
      [4.3, -7.5, 6.1, -0.4],
      [3.6, -10.0, 5.9, 0.6],
    ];
    columns.forEach(([dx, dz, columnHeight, turn], i) => {
      const key = (
        [
          "waterfall-column-a",
          "waterfall-column-b",
          "waterfall-column-c",
        ] as const
      )[i % 3];
      const rock = this.assets.create(key, { height: columnHeight });
      rock.position.set(x + dx, 0, front + dz);
      rock.rotation.y = turn;
      this.imports.add(rock);
    });

    // A curved, variable-width brook sits ON the planted plateau. Its source
    // disappears among rear rocks instead of terminating in a floating disk.
    const brook = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - 0.75, height + 0.025, front - 11.1),
      new THREE.Vector3(x + 0.65, height + 0.025, front - 8.7),
      new THREE.Vector3(x - 0.55, height + 0.025, front - 6.5),
      new THREE.Vector3(x, height + 0.025, front - 3.8),
      new THREE.Vector3(x, height + 0.025, front + 0.2),
    ]);
    this.flowMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv;
        void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform float time;varying vec2 vUv;
        void main(){
          float edge=1.-smoothstep(.015,.09,min(vUv.y,1.-vUv.y));
          float wave=sin(vUv.x*95.-time*5.+sin(vUv.y*20.)*.6);
          float fleck=pow(max(0.,wave),20.)*.12;
          vec3 c=mix(vec3(.24,.60,.65),vec3(.79,.95,.91),edge*.65+fleck);
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.root.add(new THREE.Mesh(this.brookGeometry(brook), this.flowMaterial));

    // Faceted boulders break the hard module seams and anchor the brook source.
    for (const [dx, dz, width, y] of [
      [-1.5, -10.8, 1.7, 4.6],
      [0.4, -11.3, 1.4, 4.6],
      [1.4, -10.6, 1.1, 4.6],
      [-1.8, -7.5, 0.85, 4.6],
      [1.7, -5.3, 0.8, 4.6],
      [-4.8, -1.4, 1.4, 0],
      [4.8, -1.5, 1.8, 0],
      [-2.4, -0.4, 1.5, 0],
      [2.5, -0.35, 1.7, 0],
      [5.6, -6.1, 1.1, 0],
    ])
      this.place("waterfall-boulder", x + dx, front + dz, width, y, dz);

    // The kit waterfall is a THIN facade. Use uniform native scale, never a
    // distorted full-depth wall, and align its face with the bluff edge.
    this.place("waterfall", x, front - 0.2, height, 0, Math.PI);
    this.root.add(
      new THREE.Mesh(this.fallGeometry(x, front, height), this.flowMaterial),
    );

    // Broad irregular whitewater, not fine vertical dashes or concentric rings.
    for (let i = 0; i < 17; i++) {
      const angle = i * 2.39996;
      const radius = Math.sqrt((i + 1) / 17);
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.18 + (i % 4) * 0.055, 7),
        new THREE.MeshBasicMaterial({
          color: i % 3 ? 0xe0faf3 : 0xb8e8df,
          opacity: 1,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(
        x + Math.cos(angle) * radius * 1.8,
        0.105 + i * 0.0004,
        front + 1.25 + Math.sin(angle) * radius * 0.55,
      );
      mesh.userData.phase = i * 0.45;
      this.root.add(mesh);
      this.foam.push(mesh);
    }
  }

  update(dt: number, reducedMotion: boolean): void {
    if (!reducedMotion) this.elapsed += Math.max(0, Math.min(0.1, dt));
    this.flowMaterial.uniforms.time.value = this.elapsed;
    this.foam.forEach((mesh) => {
      const pulse = reducedMotion
        ? 0
        : Math.sin(this.elapsed * 2.5 + mesh.userData.phase);
      mesh.scale.setScalar(1 + pulse * 0.18);
    });
  }

  /** Detach before generic disposal: TownAssets owns all imported resources. */
  detachImports(): void {
    this.imports.removeFromParent();
  }

  private place(
    key: TownAssetKey,
    x: number,
    z: number,
    width: number,
    y = 0,
    turn = 0,
  ) {
    const instance = this.assets.create(key, { width });
    instance.position.set(x, y, z);
    instance.rotation.y = turn;
    this.imports.add(instance);
    return instance;
  }

  private fallGeometry(
    x: number,
    front: number,
    height: number,
  ): THREE.BufferGeometry {
    const vertices: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const width = 1.33 + t * 0.15 + Math.sin(t * 18) * 0.025;
      for (const side of [-1, 1]) {
        vertices.push(
          x + side * width,
          height + 0.025 - t * (height - 0.075),
          front + 0.2 + Math.sin(t * Math.PI) * 0.16,
        );
        uv.push(t, (side + 1) / 2);
      }
      if (i < 48) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  private brookGeometry(curve: THREE.CatmullRomCurve3): THREE.BufferGeometry {
    const vertices: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80,
        p = curve.getPoint(t),
        tangent = curve.getTangent(t);
      const halfWidth = 0.68 + Math.sin(t * Math.PI * 3) * 0.12 + t * 0.65;
      if (i === 80) tangent.set(0, 0, 1);
      for (const side of [-1, 1]) {
        vertices.push(
          p.x - tangent.z * halfWidth * side,
          p.y,
          p.z + tangent.x * halfWidth * side,
        );
        uv.push(t, (side + 1) / 2);
      }
      if (i < 80) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
}
