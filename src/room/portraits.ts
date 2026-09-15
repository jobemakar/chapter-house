import * as THREE from "three";
import { RoomArt, AnimalRig } from "./art";
import { getFurniture } from "../core/catalog";

const PET_PORTRAITS: Record<string, string> = {
  cat: "/assets/pets/previews/animal-cat.png",
  bunny: "/assets/pets/previews/animal-bunny.png",
  fox: "/assets/pets/previews/animal-fox.png",
};

/** Furniture and avatar portraits are rendered locally; pet art is packaged. */
export class CatalogPortraits {
  private renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  private cache = new Map<string, string>();
  constructor() {
    this.renderer.setSize(280, 210);
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }
  image(id: string, pet = false): string {
    if (pet) return PET_PORTRAITS[id] ?? PET_PORTRAITS.cat;
    return this.portrait((pet ? "pet-" : "") + id, () => {
      return RoomArt.furniture(getFurniture(id)!);
    });
  }
  avatar(color: string, accessory: string): string {
    return this.portrait(
      `avatar-${color}-${accessory}`,
      () => new AnimalRig(color, "fox", accessory).root,
    );
  }
  private portrait(key: string, create: () => THREE.Group): string {
    const cached = this.cache.get(key);
    if (cached) return cached;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6e4, 0xc3b29c, 3));
    const sun = new THREE.DirectionalLight(0xfff0da, 3);
    sun.position.set(-3, 6, 5);
    scene.add(sun);
    const model = create();
    scene.add(model);
    const bounds = new THREE.Box3().setFromObject(model),
      size = bounds.getSize(new THREE.Vector3()),
      center = bounds.getCenter(new THREE.Vector3());
    const scale = Math.max(size.x, size.y, size.z) * 0.72 + 0.15;
    const camera = new THREE.OrthographicCamera(
      (-scale * 4) / 3,
      (scale * 4) / 3,
      scale,
      -scale,
      0.1,
      50,
    );
    camera.position.copy(center).add(new THREE.Vector3(3, 2.2, 4));
    camera.lookAt(center);
    this.renderer.render(scene, camera);
    const url = this.renderer.domElement.toDataURL();
    this.cache.set(key, url);
    RoomArt.release(scene);
    return url;
  }
  dispose() {
    this.renderer.dispose();
  }
}
