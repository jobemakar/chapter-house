import * as THREE from "three";
import { AnimalRig, RoomArt } from "../room/art";
import { RouteMotion } from "../room/motion";
import { PetRoamingController, type PetMotionActor } from "../room/pet-motion";
import { PetAssets, PetRig } from "../room/pet-assets";
import { ActorReaction, type ReactionKind } from "../room/reactions";
import { getPet } from "../core/catalog";
import type { Point, ProfileRepository } from "../core/profile";
import { PointerGesture, type ScreenPoint } from "../core/pointer-gesture";
import { PirateArt } from "./pirate-art";
import { PIRATE_ISLAND } from "./pirate-layout";
import { PirateNavigation } from "./pirate-navigation";
import { TownRenderPerformance } from "./render-performance";

/** A temporary outdoor destination, deliberately independent of town progress and activities. */
export class PirateIslandWorld {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly art = new PirateArt();
  private readonly nav = new PirateNavigation();
  private readonly performance = new TownRenderPerformance(0.95, 0.72, 1.7);
  private readonly gesture = new PointerGesture(9);
  private readonly ray = new THREE.Raycaster();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly abort = new AbortController();
  private readonly observer: ResizeObserver;
  private readonly avatarReaction = new ActorReaction("avatar");
  private readonly petReaction = new ActorReaction("pet");
  private avatar: AnimalRig;
  private pet: AnimalRig | PetRig | null = null;
  private petId: string | null = null;
  private point: Point = { ...PIRATE_ISLAND.entry };
  private focus: Point = { ...PIRATE_ISLAND.entry };
  private route: Point[] = [];
  private petActor: PetMotionActor = {
    point: { x: PIRATE_ISLAND.entry.x + 0.9, z: PIRATE_ISLAND.entry.z },
    path: [],
    wait: 0,
  };
  private petMotion = new PetRoamingController(
    this.nav,
    undefined,
    Math.random,
    (origin, facing) => this.nav.companionTarget(origin, facing),
  );
  private following = true;
  private pinch: { zoom: number; anchor: THREE.Vector3 } | null = null;
  private raf = 0;
  private last = 0;
  private disposed = false;
  constructor(
    private readonly host: HTMLElement,
    private readonly profile: ProfileRepository,
    private readonly notify: (text: string) => void,
    private readonly petAssets: PetAssets = new PetAssets(),
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x62b5c7);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.style.touchAction = "none";
    canvas.setAttribute(
      "aria-label",
      "Pirate Island. Tap sand to walk and explore; use Outside to sail back to Willowbrook.",
    );
    this.scene.add(new THREE.HemisphereLight(0xfff3c8, 0x4d96a1, 1.75));
    const sun = new THREE.DirectionalLight(0xffdf9c, 3.8);
    sun.position.set(
      PIRATE_ISLAND.center.x - 12,
      34,
      PIRATE_ISLAND.center.z + 16,
    );
    sun.target.position.set(PIRATE_ISLAND.center.x, 0, PIRATE_ISLAND.center.z);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -32;
    sun.shadow.camera.right = 32;
    sun.shadow.camera.top = 32;
    sun.shadow.camera.bottom = -32;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 90;
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0001;
    sun.shadow.radius = 3;
    this.scene.add(sun, sun.target, this.art.root);
    this.avatar = new AnimalRig(
      profile.state.avatar.color,
      "fox",
      profile.state.avatar.accessory,
    );
    this.avatar.root.userData.kind = "avatar";
    this.avatar.root.add(this.avatarReaction.sprite);
    this.scene.add(this.avatar.root);
    const selected = getPet(profile.state.activePets[0]);
    if (selected) {
      this.petId = selected.id;
      this.pet = this.makePet(this.petId);
      this.pet.root.userData.kind = "pet";
      this.pet.root.add(this.petReaction.sprite);
      this.scene.add(this.pet.root);
    }
    this.observer = new ResizeObserver(() => {
      this.gesture.cancel();
      this.pinch = null;
      this.resize();
    });
    this.observer.observe(host);
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0) return;
        canvas.focus();
        canvas.setPointerCapture(event.pointerId);
        const update = this.gesture.down(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
        if (update.kind === "pinch-start") this.beginPinch(update.midpoint);
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener("pointermove", (event) => this.move(event), {
      signal: this.abort.signal,
    });
    canvas.addEventListener(
      "pointerup",
      (event) => {
        const end = this.gesture.up(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
        if (end.kind === "tap") this.tap(end.point);
        this.pinch = null;
        if (canvas.hasPointerCapture(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        this.setZoom(event.deltaY > 0 ? -0.1 : 0.1);
      },
      { signal: this.abort.signal, passive: false },
    );
    canvas.addEventListener(
      "keydown",
      (event) => {
        const directions: Record<string, Point> = {
          ArrowUp: { x: -1, z: -1 },
          ArrowDown: { x: 1, z: 1 },
          ArrowLeft: { x: -1, z: 1 },
          ArrowRight: { x: 1, z: -1 },
          w: { x: -1, z: -1 },
          s: { x: 1, z: 1 },
          a: { x: -1, z: 1 },
          d: { x: 1, z: -1 },
        };
        const direction = directions[event.key];
        if (direction) {
          event.preventDefault();
          this.walk({
            x: this.point.x + direction.x,
            z: this.point.z + direction.z,
          });
        }
        if (event.code === "Space") {
          event.preventDefault();
          this.jump();
        }
      },
      { signal: this.abort.signal },
    );
    const loading = document.createElement("div");
    loading.className = "town-loading";
    loading.textContent = "Hoisting the pirate sails…";
    host.append(loading);
    void this.art
      .load()
      .then(() => loading.remove())
      .catch(() => {
        loading.textContent =
          "Pirate Island couldn't load. Use Outside to return.";
      });
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }
  private makePet(id: string) {
    const pet = getPet(id)!;
    try {
      return this.petAssets.create(pet.assetKey);
    } catch {
      // Fall through while the local model is still loading or unavailable.
    }
    return new AnimalRig(pet.color, "fox", "none", true);
  }
  useLoadedPetAssets() {
    if (!this.pet || !this.petId || this.pet instanceof PetRig) return;
    const old = this.pet;
    const fresh = this.makePet(this.petId);
    if (!(fresh instanceof PetRig)) return;
    fresh.root.position.copy(old.root.position);
    fresh.root.rotation.copy(old.root.rotation);
    fresh.root.userData.kind = "pet";
    fresh.root.add(this.petReaction.sprite);
    old.root.removeFromParent();
    RoomArt.release(old.root);
    this.pet = fresh;
    this.scene.add(fresh.root);
  }
  syncAvatarAppearance() {
    const old = this.avatar;
    const fresh = new AnimalRig(
      this.profile.state.avatar.color,
      "fox",
      this.profile.state.avatar.accessory,
    );
    fresh.root.position.copy(old.root.position);
    fresh.root.rotation.copy(old.root.rotation);
    fresh.root.userData.kind = "avatar";
    fresh.root.add(this.avatarReaction.sprite);
    old.root.removeFromParent();
    RoomArt.release(old.root);
    this.avatar = fresh;
    this.scene.add(fresh.root);
  }
  setMuted(_: boolean) {
    /* Island has no independent audio layer. */
  }
  react(kind: ReactionKind) {
    this.avatarReaction.show(kind);
  }
  wave() {
    this.avatar.wave();
  }
  jump() {
    this.avatar.jump();
  }
  callPet() {
    if (!this.pet) return;
    this.petMotion.call(
      this.petActor,
      { point: this.point },
      this.avatar.root.rotation.y,
    );
    this.petReaction.show("heart");
    this.avatar.wave();
    this.notify("Your first mate trots over.");
  }
  center() {
    this.following = true;
    this.focus = { ...this.point };
    this.positionCamera();
  }
  setZoom(delta: number) {
    this.performance.nudgeZoom(delta);
  }
  private resize() {
    const width = this.host.clientWidth,
      height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.projection(width, height);
    this.positionCamera();
  }
  private projection(
    width = this.host.clientWidth,
    height = this.host.clientHeight,
  ) {
    if (!width || !height) return;
    const size = 15 / this.performance.zoom,
      aspect = width / height;
    this.camera.left = (-size * aspect) / 2;
    this.camera.right = (size * aspect) / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.camera.updateProjectionMatrix();
  }
  private positionCamera() {
    this.focus.x = Math.max(2, Math.min(PIRATE_ISLAND.width - 2, this.focus.x));
    this.focus.z = Math.max(2, Math.min(PIRATE_ISLAND.depth - 2, this.focus.z));
    this.camera.position.set(this.focus.x + 13, 17, this.focus.z + 15);
    this.camera.lookAt(this.focus.x, 0, this.focus.z);
    this.camera.updateMatrixWorld();
  }
  private floor(x: number, y: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((x - r.left) / r.width) * 2 - 1,
        1 - ((y - r.top) / r.height) * 2,
      ),
      this.camera,
    );
    return this.ray.ray.intersectPlane(this.plane, new THREE.Vector3());
  }
  private beginPinch(midpoint: ScreenPoint) {
    const anchor = this.floor(midpoint.x, midpoint.y);
    this.pinch = anchor ? { zoom: this.performance.zoom, anchor } : null;
    this.following = false;
  }
  private move(event: PointerEvent) {
    const update = this.gesture.move(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (update.kind === "pinch" && this.pinch) {
      this.performance.setZoomImmediate(this.pinch.zoom * update.scale);
      this.projection();
      const after = this.floor(update.midpoint.x, update.midpoint.y);
      if (after) {
        this.focus.x += this.pinch.anchor.x - after.x;
        this.focus.z += this.pinch.anchor.z - after.z;
        this.positionCamera();
      }
      return;
    }
    if (update.kind !== "pan") return;
    const a = this.floor(update.from.x, update.from.y),
      b = this.floor(update.to.x, update.to.y);
    if (a && b) {
      this.following = false;
      this.focus.x += a.x - b.x;
      this.focus.z += a.z - b.z;
      this.positionCamera();
    }
  }
  private tap(screen: ScreenPoint) {
    const point = this.floor(screen.x, screen.y);
    if (!point) return;
    for (const hit of this.ray.intersectObjects(
      [this.avatar.root, ...(this.pet ? [this.pet.root] : [])],
      true,
    )) {
      let object: THREE.Object3D | null = hit.object;
      while (object && !object.userData.kind) object = object.parent;
      if (object?.userData.kind === "pet") {
        this.pet?.pet();
        this.petReaction.show("heart");
        return;
      }
    }
    this.walk({ x: point.x, z: point.z });
  }
  private walk(point: Point) {
    if (this.art.status() !== "ready") return;
    const route = this.nav.path(this.point, point);
    if (!route.length) {
      this.avatarReaction.show("question");
      this.notify("Stay on the island sand.");
      return;
    }
    this.route = route;
    this.following = true;
  }
  private frame = (time: number) => {
    if (this.disposed) return;
    const dt = this.last ? Math.min((time - this.last) / 1000, 0.05) : 0;
    this.last = time;
    if (!document.hidden) {
      const render = this.performance.update(dt);
      if (render.zoomChanged) this.projection();
      if (render.refreshShadows) this.renderer.shadowMap.needsUpdate = true;
      const moved = RouteMotion.step(
        this.point,
        this.route,
        this.avatar.root.rotation.y,
        3,
        dt,
      );
      this.avatar.root.rotation.y = moved.facing;
      this.avatar.root.position.set(this.point.x, 0, this.point.z);
      this.avatar.update(dt, moved.moved, this.profile.state.reduced);
      if (this.pet) {
        const pm = this.petMotion.update(
          this.petActor,
          { point: this.point },
          this.pet.root.rotation.y,
          dt,
        );
        this.pet.root.rotation.y = pm.facing;
        this.pet.root.position.set(
          this.petActor.point.x,
          0,
          this.petActor.point.z,
        );
        this.pet.update(dt, pm.moved, this.profile.state.reduced);
      }
      if (this.following) {
        const mix = this.profile.state.reduced ? 1 : 1 - Math.exp(-dt * 4);
        this.focus.x += (this.point.x - this.focus.x) * mix;
        this.focus.z += (this.point.z - this.focus.z) * mix;
        this.positionCamera();
      }
      this.art.update(dt, this.profile.state.reduced);
      this.avatarReaction.update(dt, this.profile.state.reduced);
      this.petReaction.update(dt, this.profile.state.reduced);
      this.renderer.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame(this.frame);
  };
  status() {
    return {
      destination: "pirate-island",
      avatar: { ...this.point },
      walking: this.route.length > 0,
      scenery: this.art.status(),
      pet: this.petId,
    };
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.observer.disconnect();
    this.art.dispose();
    this.avatarReaction.dispose();
    this.petReaction.dispose();
    if (this.pet) {
      this.pet.root.removeFromParent();
      if (this.pet instanceof PetRig) this.pet.dispose();
      else RoomArt.release(this.pet.root);
    }
    RoomArt.release(this.scene);
    this.renderer.dispose();
    this.host.replaceChildren();
  }
}
