import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { assetUrl } from "../core/asset-url";

const KEYS = [
  "ship-pirate-large",
  "ship-pirate-medium",
  "tower-complete-large",
  "tower-watch",
  "castle-gate",
  "structure-platform-dock",
  "mast-ropes",
  "palm-detailed-straight",
  "palm-bend",
  "rocks-sand-a",
  "rocks-sand-b",
  "rocks-sand-c",
  "chest",
  "barrel",
  "crate-bottles",
  "cannon-mobile",
  "flag-pirate-high",
  "flag-pirate",
  "platform-planks",
  "grass-patch",
  "structure-platform-dock-small",
  "castle-wall",
  "structure",
  "tower-complete-small",
  "ship-wreck",
  "boat-row-small",
  "grass-plant",
  "patch-sand",
  "patch-sand-foliage",
  "patch-grass",
  "patch-grass-foliage",
] as const;
export type PirateAssetKey = (typeof KEYS)[number];

type Loaded = { scene: THREE.Group; bounds: THREE.Box3; size: THREE.Vector3 };

/** Owns locally packaged Pirate Kit clones and their shared source resources. */
export class PirateAssets {
  private readonly assets = new Map<PirateAssetKey, Loaded>();
  private loading: Promise<void> | null = null;
  private disposed = false;
  constructor(
    private readonly loader: Pick<GLTFLoader, "loadAsync"> = new GLTFLoader(),
  ) {}
  load() {
    if (!this.loading) this.loading = this.loadAll();
    return this.loading;
  }
  create(key: PirateAssetKey, height: number) {
    const source = this.assets.get(key);
    if (!source) throw new Error(`Pirate asset '${key}' is unavailable.`);
    const scale = height / source.size.y;
    const group = new THREE.Group();
    group.name = `Pirate asset: ${key}`;
    const model = source.scene.clone(true);
    const center = source.bounds.getCenter(new THREE.Vector3());
    model.position.set(
      -center.x * scale,
      -source.bounds.min.y * scale,
      -center.z * scale,
    );
    model.scale.setScalar(scale);
    group.add(model);
    return group;
  }
  createFootprint(
    key: PirateAssetKey,
    width: number,
    depth: number,
    alignTop = false,
  ) {
    const source = this.assets.get(key);
    if (!source) throw new Error(`Pirate asset '${key}' is unavailable.`);
    const scaleX = width / source.size.x;
    const scaleZ = depth / source.size.z;
    const scaleY = Math.min(scaleX, scaleZ);
    const group = new THREE.Group();
    group.name = `Pirate ground: ${key}`;
    const model = source.scene.clone(true);
    const center = source.bounds.getCenter(new THREE.Vector3());
    model.position.set(
      -center.x * scaleX,
      -(alignTop ? source.bounds.max.y : source.bounds.min.y) * scaleY,
      -center.z * scaleZ,
    );
    model.scale.set(scaleX, scaleY, scaleZ);
    group.add(model);
    return group;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.assets.forEach(({ scene }) =>
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((m) => materials.add(m));
      }),
    );
    materials.forEach((m) => m.dispose());
    geometries.forEach((g) => g.dispose());
    this.assets.clear();
  }
  private async loadAll() {
    const loaded = await Promise.all(
      KEYS.map(async (key) => {
        const scene = (
          await this.loader.loadAsync(assetUrl(`pirate/models/${key}.glb`))
        ).scene;
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        const bounds = new THREE.Box3().setFromObject(scene);
        return [
          key,
          { scene, bounds, size: bounds.getSize(new THREE.Vector3()) },
        ] as const;
      }),
    );
    if (this.disposed) {
      this.dispose();
      throw new Error("PirateAssets was disposed while loading.");
    }
    loaded.forEach(([key, asset]) => this.assets.set(key, asset));
  }
}
