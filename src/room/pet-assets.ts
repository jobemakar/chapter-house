import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { assetUrl } from "../core/asset-url";

const PET_SOURCES = {
  cat: assetUrl("pets/animal-cat.glb"),
  bunny: assetUrl("pets/animal-bunny.glb"),
  fox: assetUrl("pets/animal-fox.glb"),
} as const;

const REQUIRED_CLIPS = [
  "idle",
  "walk",
  "eat",
  "dance",
  "gesture-positive",
] as const;
const PET_SCALE = 0.48;

export type PetAssetKey = keyof typeof PET_SOURCES;
export type PetActivity = "eat" | "dance" | null;
export type PetLoader = Pick<GLTFLoader, "loadAsync">;

type LoadedPet = {
  scene: THREE.Group;
  clips: Map<string, THREE.AnimationClip>;
  bounds: THREE.Box3;
};

/**
 * A locally packaged, shared-resource owner for the three Cube Pets trial models.
 * PetRig clones never dispose imported geometry, materials, or textures; this owner
 * releases those resources once all consumers have detached their rigs.
 */
export class PetAssets {
  private readonly loader: PetLoader;
  private readonly assets = new Map<PetAssetKey, LoadedPet>();
  private loading: Promise<void> | null = null;
  private disposed = false;
  private generation = 0;

  constructor(loader: PetLoader = new GLTFLoader()) {
    this.loader = loader;
  }

  /** Loads the three local GLBs exactly once for this resource owner. */
  load(): Promise<void> {
    if (this.disposed)
      return Promise.reject(
        new Error("PetAssets cannot load after dispose()."),
      );
    if (!this.loading) this.loading = this.loadAll();
    return this.loading;
  }

  /** Creates a skeleton-safe, independently animated pet after {@link load}. */
  create(key: PetAssetKey): PetRig {
    const asset = this.assets.get(key);
    if (!asset)
      throw new Error(
        `Pet asset '${key}' is unavailable. Call and await PetAssets.load() first.`,
      );

    const root = new THREE.Group();
    root.name = `Pet: ${key}`;
    root.userData.petAsset = key;
    const model = SkeletonUtils.clone(asset.scene) as THREE.Group;
    const center = asset.bounds.getCenter(new THREE.Vector3());
    // Cube Pets' head/front-leg nodes are at +Z; this is already this app's
    // forward convention, so the explicit source yaw is intentionally zero.
    const sourceYaw = 0;
    model.rotation.y = sourceYaw;
    model.position.set(
      -center.x * PET_SCALE,
      -asset.bounds.min.y * PET_SCALE,
      -center.z * PET_SCALE,
    );
    model.scale.setScalar(PET_SCALE);
    root.add(model);
    return new PetRig(key, root, model, asset.clips);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    this.disposeScenes([...this.assets.values()].map((asset) => asset.scene));
    this.assets.clear();
  }

  private async loadAll(): Promise<void> {
    const generation = this.generation;
    const results = await Promise.allSettled(
      (Object.entries(PET_SOURCES) as [PetAssetKey, string][]).map(
        async ([key, url]) => {
          try {
            const gltf = await this.loader.loadAsync(url);
            if (this.disposed || generation !== this.generation) {
              this.disposeScenes([gltf.scene]);
              throw new Error(`PetAssets was disposed while loading '${key}'.`);
            }
            const clips = new Map(
              gltf.animations.map((clip) => [clip.name, clip]),
            );
            const missing = REQUIRED_CLIPS.filter((name) => !clips.has(name));
            if (missing.length) {
              this.disposeScenes([gltf.scene]);
              throw new Error(
                `Pet asset '${key}' from ${url} is missing required clip(s): ${missing.join(", ")}.`,
              );
            }
            return { key, scene: gltf.scene, clips };
          } catch (error) {
            const detail =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `Could not load pet asset '${key}' from ${url}: ${detail}`,
            );
          }
        },
      ),
    );
    const loaded = results
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          key: PetAssetKey;
          scene: THREE.Group;
          clips: Map<string, THREE.AnimationClip>;
        }> => result.status === "fulfilled",
      )
      .map((result) => result.value);
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failure || this.disposed || generation !== this.generation) {
      this.disposeScenes(loaded.map((asset) => asset.scene));
      const detail =
        failure?.reason instanceof Error ? failure.reason.message : "disposed";
      throw new Error(`Pet asset loading failed: ${detail}`);
    }

    for (const { key, scene, clips } of loaded) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      const bounds = new THREE.Box3().setFromObject(scene);
      if (bounds.isEmpty()) {
        this.disposeScenes(loaded.map((asset) => asset.scene));
        this.assets.clear();
        throw new Error(
          `Pet asset '${key}' from ${PET_SOURCES[key]} has empty bounds.`,
        );
      }
      this.assets.set(key, { scene, clips, bounds });
    }
  }

  private disposeScenes(scenes: THREE.Group[]): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    for (const scene of scenes)
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((material) => materials.add(material));
      });
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

/** Runtime animation state for one cloned Cube Pet. */
export class PetRig {
  readonly mixer: THREE.AnimationMixer;
  private readonly hitTarget: THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshBasicMaterial
  >;
  private activity: PetActivity = null;
  private moving = false;
  private reduced = false;
  private current = "idle";
  private readonly actions = new Map<string, THREE.AnimationAction>();

  constructor(
    readonly key: PetAssetKey,
    readonly root: THREE.Group,
    model: THREE.Group,
    clips: Map<string, THREE.AnimationClip>,
  ) {
    this.mixer = new THREE.AnimationMixer(model);
    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    hitMaterial.colorWrite = false;
    this.hitTarget = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 12, 8),
      hitMaterial,
    );
    this.hitTarget.name = "Pet touch target";
    this.hitTarget.position.y = 0.42;
    this.hitTarget.castShadow = false;
    this.hitTarget.receiveShadow = false;
    root.add(this.hitTarget);
    clips.forEach((clip, name) =>
      this.actions.set(name, this.mixer.clipAction(clip)),
    );
    this.mixer.addEventListener("finished", (event) => {
      if (event.action === this.actions.get("gesture-positive"))
        this.playLocomotion();
    });
    this.play("idle", true);
  }

  update(dt: number, moving: boolean, reduced: boolean): void {
    this.moving = moving;
    this.reduced = reduced;
    this.mixer.timeScale = reduced ? 0.62 : 1;
    if (!this.activity && this.current !== "gesture-positive")
      this.playLocomotion();
    this.mixer.update(Math.max(0, dt));
  }

  pet(): void {
    this.play("gesture-positive", false);
  }

  setActivity(activity: PetActivity): void {
    this.activity = activity;
    if (activity) this.play(activity, true);
    else if (this.current !== "gesture-positive") this.playLocomotion();
  }

  status(): {
    activity: PetActivity;
    animation: string;
    moving: boolean;
    reduced: boolean;
  } {
    return {
      activity: this.activity,
      animation: this.current,
      moving: this.moving,
      reduced: this.reduced,
    };
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
    this.hitTarget.geometry.dispose();
    this.hitTarget.material.dispose();
    this.root.removeFromParent();
  }

  private playLocomotion(): void {
    this.play(this.activity ?? (this.moving ? "walk" : "idle"), true);
  }

  private play(name: string, loop: boolean): void {
    const action = this.actions.get(name);
    if (!action)
      throw new Error(`Pet '${this.key}' has no '${name}' animation action.`);
    if (this.current === name && action.isRunning()) return;
    const previous = this.actions.get(this.current);
    if (previous && previous !== action) previous.fadeOut(0.12);
    action.reset();
    action.setLoop(
      loop ? THREE.LoopRepeat : THREE.LoopOnce,
      loop ? Infinity : 1,
    );
    action.clampWhenFinished = !loop;
    action.setEffectiveTimeScale(this.reduced ? 0.62 : 1);
    action.fadeIn(0.12).play();
    this.current = name;
  }
}
