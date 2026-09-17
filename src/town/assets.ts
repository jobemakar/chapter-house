import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { assetUrl } from "../core/asset-url";

const ASSET_SOURCES = {
  "mini-tree": assetUrl("town/mini/tree.glb"),
  "mini-tree-high": assetUrl("town/mini/tree-high.glb"),
  "mini-roof": assetUrl("town/mini/building-roof.glb"),
  "mini-tent": assetUrl("town/mini/tent.glb"),
  "mini-rocks": assetUrl("town/mini/rocks-low.glb"),
  "mini-plant": assetUrl("town/mini/plant.glb"),
  "flower-yellow": assetUrl("town/nature/flower_yellowA.glb"),
  "flower-purple": assetUrl("town/nature/flower_purpleA.glb"),
  mushroom: assetUrl("town/nature/mushroom_redGroup.glb"),
  grass: assetUrl("town/nature/grass_leafs.glb"),
  bush: assetUrl("town/nature/plant_bush.glb"),
  rock: assetUrl("town/nature/rock_smallA.glb"),
  "dig-dirt": assetUrl("town/nature/crops_dirtSingle.glb"),
  "mill-sails": assetUrl("town/fantasy/windmill.glb"),
  "mill-base": assetUrl("town/fantasy/wall-block.glb"),
  "mill-timber": assetUrl("town/fantasy/wall-wood-block.glb"),
  "mill-roof": assetUrl("town/fantasy/roof-high-point.glb"),
  "cliff-block": assetUrl("town/nature/cliff_block_stone.glb"),
  "cliff-half": assetUrl("town/nature/cliff_blockHalf_stone.glb"),
  "cliff-face": assetUrl("town/nature/cliff_stone.glb"),
  "cliff-half-face": assetUrl("town/nature/cliff_half_stone.glb"),
  waterfall: assetUrl("town/nature/cliff_waterfall_stone.glb"),
  "waterfall-top": assetUrl("town/nature/cliff_waterfallTop_stone.glb"),
  "waterfall-boulder": assetUrl("town/nature/rock_largeD.glb"),
  "waterfall-column-a": assetUrl("town/nature/rock_tallC.glb"),
  "waterfall-column-b": assetUrl("town/nature/rock_tallD.glb"),
  "waterfall-column-c": assetUrl("town/nature/rock_tallG.glb"),
  "river-rocks": assetUrl("town/nature/rock_largeA.glb"),
} as const;

export type TownAssetKey = keyof typeof ASSET_SOURCES;

export type TownAssetOptions = {
  /** Takes precedence over footprint dimensions when supplied. */
  height?: number;
  /** Maximum desired X footprint. */
  width?: number;
  /** Maximum desired Z footprint. */
  depth?: number;
};

type LoadedAsset = {
  scene: THREE.Group;
  bounds: THREE.Box3;
  size: THREE.Vector3;
};

/**
 * Owns the curated town GLBs for one outdoor scene.
 *
 * Instances returned from {@link create} share the imported geometry, material,
 * and texture resources. Detach those instances before calling another generic
 * scene-resource disposer; this class remains their resource owner.
 */
export class TownAssets {
  private readonly loader: Pick<GLTFLoader, "loadAsync">;
  private readonly assets = new Map<TownAssetKey, LoadedAsset>();
  private loading: Promise<void> | null = null;
  private disposed = false;
  private generation = 0;

  constructor(loader: Pick<GLTFLoader, "loadAsync"> = new GLTFLoader()) {
    this.loader = loader;
  }

  /** Loads the bounded, local asset set exactly once for this instance. */
  load(): Promise<void> {
    if (this.disposed)
      return Promise.reject(
        new Error("TownAssets cannot load after dispose()."),
      );
    if (!this.loading) this.loading = this.loadAll();
    return this.loading;
  }

  /** Returns a centered, ground-aligned clone after {@link load} resolves. */
  create(key: TownAssetKey, options: TownAssetOptions = {}): THREE.Group {
    const asset = this.assets.get(key);
    if (!asset)
      throw new Error(
        `Town asset '${key}' is unavailable. Call and await TownAssets.load() first.`,
      );

    const scale = this.scaleFor(key, asset.size, options);
    const instance = new THREE.Group();
    instance.name = `Town asset: ${key}`;
    instance.userData.townAsset = key;
    const model = asset.scene.clone(true);
    const center = asset.bounds.getCenter(new THREE.Vector3());
    model.position.set(
      -center.x * scale,
      -asset.bounds.min.y * scale,
      -center.z * scale,
    );
    model.scale.setScalar(scale);
    instance.add(model);
    return instance;
  }

  /** Natural source dimensions, before an instance is scaled. */
  size(key: TownAssetKey): THREE.Vector3 {
    const asset = this.assets.get(key);
    if (!asset)
      throw new Error(
        `Town asset '${key}' is unavailable. Call and await TownAssets.load() first.`,
      );
    return asset.size.clone();
  }

  /** Releases resources imported by this instance and ignores late loader results. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.disposeScenes([...this.assets.values()].map((asset) => asset.scene));
    this.assets.clear();
  }

  private async loadAll(): Promise<void> {
    const generation = this.generation;
    const settled = await Promise.allSettled(
      (Object.entries(ASSET_SOURCES) as [TownAssetKey, string][]).map(
        async ([key, url]) => {
          try {
            const gltf = await this.loader.loadAsync(url);
            if (this.disposed || generation !== this.generation) {
              this.disposeScenes([gltf.scene]);
              throw new Error(
                `TownAssets was disposed while loading '${key}'.`,
              );
            }
            return { key, scene: gltf.scene };
          } catch (error) {
            const detail =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `Could not load town asset '${key}' from ${url}: ${detail}`,
            );
          }
        },
      ),
    );

    const loaded = settled
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          key: TownAssetKey;
          scene: THREE.Group;
        }> => result.status === "fulfilled",
      )
      .map((result) => result.value);
    const failure = settled.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failure || this.disposed || generation !== this.generation) {
      this.disposeScenes(loaded.map((asset) => asset.scene));
      const detail =
        failure?.reason instanceof Error ? failure.reason.message : "disposed";
      throw new Error(`Town asset loading failed: ${detail}`);
    }

    for (const { key, scene } of loaded) {
      this.harmonizeNaturePalette(key, scene);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());
      if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
        this.disposeScenes(loaded.map((asset) => asset.scene));
        this.assets.clear();
        throw new Error(`Town asset '${key}' has empty bounds.`);
      }
      this.assets.set(key, { scene, bounds, size });
    }
  }

  private harmonizeNaturePalette(key: TownAssetKey, scene: THREE.Group): void {
    if (!ASSET_SOURCES[key].includes("/nature/")) return;
    const colors: Record<string, THREE.ColorRepresentation> = {
      grass: 0x749963,
      leafsGreen: 0x66865b,
      woodBark: 0x956344,
      dirt: 0xa2a69b,
      dirtDark: 0x5b412c,
      water: 0x91dce2,
    };
    if (key === "dig-dirt") colors.dirt = 0x9a7045;
    // These kit boulders provide the reference's broken-column silhouettes.
    // Harmonize their earth faces to the pale cliff stone, retaining grass caps.
    if (key.startsWith("waterfall-column") || key === "waterfall-boulder")
      colors.dirt = 0xb8cfd1;
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => {
        if ("metalness" in material) {
          (material as THREE.MeshStandardMaterial).metalness = 0;
          (material as THREE.MeshStandardMaterial).roughness = 0.9;
        }
        const color = colors[material.name];
        if (color !== undefined && "color" in material)
          (material as THREE.MeshStandardMaterial).color.set(color);
      });
    });
  }

  private scaleFor(
    key: TownAssetKey,
    size: THREE.Vector3,
    options: TownAssetOptions,
  ): number {
    const validate = (
      name: keyof TownAssetOptions,
      value: number | undefined,
    ) => {
      if (value !== undefined && (!Number.isFinite(value) || value <= 0))
        throw new Error(
          `Town asset '${key}' ${name} must be a positive finite number.`,
        );
    };
    validate("height", options.height);
    validate("width", options.width);
    validate("depth", options.depth);
    if (options.height !== undefined) return options.height / size.y;
    const footprint = [
      options.width === undefined ? undefined : options.width / size.x,
      options.depth === undefined ? undefined : options.depth / size.z,
    ].filter((value): value is number => value !== undefined);
    return footprint.length ? Math.min(...footprint) : 1;
  }

  private disposeScenes(scenes: THREE.Group[]): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    for (const scene of scenes) {
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const meshMaterials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        meshMaterials.forEach((material) => materials.add(material));
      });
    }
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
      material.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    textures.forEach((texture) => texture.dispose());
  }
}
