import * as THREE from "three";
import { TOWN } from "./layout";
import { TownArt } from "./art";
import { TownAudio } from "./audio";
import { TownNavigation } from "./navigation";
import { TownActivityArt } from "./activity-art";
import {
  TownActivities,
  type ActivityAction,
} from "./activities";
import { AnimalRig, RoomArt } from "../room/art";
import { ActorReaction, type ReactionKind } from "../room/reactions";
import { RouteMotion } from "../room/motion";
import { PetAssets, PetRig, type PetAssetKey } from "../room/pet-assets";
import { getPet } from "../core/catalog";
import type { ProfileRepository, Point } from "../core/profile";
import { PointerGesture, type ScreenPoint } from "../core/pointer-gesture";

export interface TownContextView {
  actions: ("dig" | "fish" | "reel")[];
  x: number;
  y: number;
  visible: boolean;
}

/** Disposable outdoor scene; the shared profile remains authoritative inside and outside. */
export class TownWorld {
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera();
  private renderer: THREE.WebGLRenderer;
  private art = new TownArt();
  private audio: TownAudio;
  private nav = new TownNavigation();
  private avatar: AnimalRig;
  private activityArt: TownActivityArt;
  private activities = new TownActivities();
  private activityAction: ActivityAction | null = null;
  private castTarget: Point | null = null;
  private contextKey = "";
  private pet: AnimalRig | PetRig | null = null;
  private petId: PetAssetKey | null = null;
  private avatarReaction = new ActorReaction("avatar");
  private petReaction = new ActorReaction("pet");
  private point: Point = { ...TOWN.entry };
  private petPoint: Point = { x: TOWN.entry.x + 0.7, z: TOWN.entry.z };
  private route: Point[] = [];
  private petRoute: Point[] = [];
  private petWait = 0;
  private focus: Point = { ...TOWN.entry };
  private zoom = 0.8;
  private following = false;
  private gesture = new PointerGesture(9);
  private pinch: { zoom: number; anchor: THREE.Vector3 } | null = null;
  private abort = new AbortController();
  private observer: ResizeObserver;
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private raf = 0;
  private last = 0;
  private disposed = false;
  private coinCooldown = 0;
  private coinAvailable = false;
  constructor(
    private host: HTMLElement,
    private profile: ProfileRepository,
    private home: () => void,
    private notify: (text: string) => void,
    private coinAvailabilityChanged: (available: boolean) => void,
    private contextChanged: (view: TownContextView) => void = () => {},
    private petAssets: PetAssets = new PetAssets(),
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0xdce8cd);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    host.append(this.renderer.domElement);
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute(
      "aria-label",
      "Woodland village. Tap paths to walk, cross the stream by its bridge, and approach the fountain to toss a coin.",
    );
    canvas.style.touchAction = "none";
    this.scene.add(new THREE.HemisphereLight(0xfff7dc, 0x7c997e, 2.5));
    const sun = new THREE.DirectionalLight(0xffebbd, 3);
    sun.position.set(TOWN.width / 2 - 3, 34, TOWN.depth / 2 - 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -36;
    sun.shadow.camera.right = 36;
    sun.shadow.camera.top = 36;
    sun.shadow.camera.bottom = -36;
    sun.shadow.normalBias = 0.045;
    sun.target.position.set(TOWN.width / 2, 0, TOWN.depth / 2);
    this.scene.add(sun, sun.target, this.art.root);
    this.avatar = new AnimalRig(
      profile.state.avatar.color,
      "fox",
      profile.state.avatar.accessory,
    );
    this.avatar.root.add(this.avatarReaction.sprite);
    this.scene.add(this.avatar.root);
    this.activityArt = new TownActivityArt(this.scene, this.avatar);
    const selected = getPet(profile.state.activePets[0]);
    if (selected) {
      this.petId = selected.id as PetAssetKey;
      this.pet = this.createPetRig(this.petId);
      this.pet.root.userData.kind = "pet";
      this.pet.root.add(this.petReaction.sprite);
      this.scene.add(this.pet.root);
    }
    this.audio = new TownAudio(profile.state.muted);
    this.audio.setActive(true);
    this.audio.setHidden(document.hidden);
    // Entering town is itself a user gesture, so the woodland can begin at once.
    this.audio.unlock();
    this.updateCoinAvailability();
    this.observer = new ResizeObserver(() => {
      this.gesture.cancel();
      this.pinch = null;
      this.resize();
    });
    this.observer.observe(host);
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0) return;
        this.audio.unlock();
        canvas.focus();
        canvas.setPointerCapture(e.pointerId);
        const update = this.gesture.down(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });
        if (update.kind === "pinch-start") this.beginPinch(update.midpoint);
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener("pointermove", (e) => this.moveGesture(e), {
      signal: this.abort.signal,
    });
    canvas.addEventListener(
      "pointerup",
      (e) => {
        const end = this.gesture.up(e.pointerId, {
          x: e.clientX,
          y: e.clientY,
        });
        if (end.kind === "tap") this.tap(end.point);
        this.pinch = null;
        if (canvas.hasPointerCapture(e.pointerId))
          canvas.releasePointerCapture(e.pointerId);
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener(
      "pointercancel",
      (e) => {
        this.gesture.cancel(e.pointerId);
        this.pinch = null;
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.setZoom(e.deltaY > 0 ? -0.1 : 0.1);
      },
      { signal: this.abort.signal, passive: false },
    );
    canvas.addEventListener(
      "keydown",
      (e) => {
        this.audio.unlock();
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
        const dir = directions[e.key];
        if (dir) {
          e.preventDefault();
          this.walk({ x: this.point.x + dir.x, z: this.point.z + dir.z });
        }
        if (e.code === "Space") {
          e.preventDefault();
          this.jump();
        }
      },
      { signal: this.abort.signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        this.audio.setHidden(document.hidden);
        this.gesture.cancel();
        this.pinch = null;
        this.last = 0;
      },
      { signal: this.abort.signal },
    );
    const loading = document.createElement("div");
    loading.className = "town-loading";
    loading.setAttribute("role", "status");
    loading.textContent = "Growing your woodland…";
    host.append(loading);
    void this.art
      .load()
      .then(() => {
        if (!this.disposed) loading.remove();
      })
      .catch((error: unknown) => {
        if (this.disposed) return;
        loading.textContent =
          "The woodland couldn't load. Return to the clubhouse and try again.";
        console.error("Town scenery failed to load", error);
      });
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }
  private createPetRig(id: PetAssetKey): AnimalRig | PetRig {
    const selected = getPet(id)!;
    try {
      return this.petAssets.create(id);
    } catch {
      return new AnimalRig(selected.color, selected.shape, "none", true);
    }
  }
  /** Swap the initial stand-in if the shared pet package loaded after entry. */
  useLoadedPetAssets() {
    if (!this.pet || !this.petId || this.pet instanceof PetRig) return;
    const previous = this.pet;
    const replacement = this.createPetRig(this.petId);
    if (!(replacement instanceof PetRig)) return;
    replacement.root.position.copy(previous.root.position);
    replacement.root.rotation.copy(previous.root.rotation);
    replacement.root.userData.kind = "pet";
    replacement.root.add(this.petReaction.sprite);
    previous.root.removeFromParent();
    RoomArt.release(previous.root);
    this.pet = replacement;
    this.scene.add(replacement.root);
  }
  setMuted(value: boolean) {
    this.audio.setMuted(value);
  }
  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const height = 15 / this.zoom,
      aspect = w / h;
    this.camera.left = (-height * aspect) / 2;
    this.camera.right = (height * aspect) / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.camera.updateProjectionMatrix();
    this.positionCamera();
  }
  private positionCamera() {
    this.focus.x = Math.max(3, Math.min(TOWN.width - 3, this.focus.x));
    this.focus.z = Math.max(3, Math.min(TOWN.depth - 3, this.focus.z));
    this.camera.position.set(this.focus.x + 14, 18, this.focus.z + 17);
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
    this.pinch = anchor ? { zoom: this.zoom, anchor } : null;
    this.following = false;
  }
  private moveGesture(event: PointerEvent) {
    const update = this.gesture.move(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (update.kind === "pinch") {
      const pinch = this.pinch;
      if (!pinch) return;
      this.zoom = Math.max(0.65, Math.min(1.7, pinch.zoom * update.scale));
      this.resize();
      const after = this.floor(update.midpoint.x, update.midpoint.y);
      if (after) {
        this.focus.x += pinch.anchor.x - after.x;
        this.focus.z += pinch.anchor.z - after.z;
        this.positionCamera();
      }
      return;
    }
    if (update.kind !== "pan") return;
    const a = this.floor(update.from.x, update.from.y);
    const b = this.floor(update.to.x, update.to.y);
    if (a && b) {
      this.following = false;
      this.focus.x += a.x - b.x;
      this.focus.z += a.z - b.z;
      this.positionCamera();
    }
  }
  private tap(screen: ScreenPoint) {
    const p = this.floor(screen.x, screen.y);
    if (!p) return;
    for (const hit of this.ray.intersectObjects(
      [this.art.root, ...(this.pet ? [this.pet.root] : [])],
      true,
    )) {
      let o: THREE.Object3D | null = hit.object;
      while (o && !o.userData.kind) o = o.parent;
      if (o?.userData.kind === "fountain") {
        this.tossCoin();
        return;
      }
      if (o?.userData.kind === "home") {
        this.home();
        return;
      }
      if (o?.userData.kind === "pet") {
        this.pet?.pet();
        this.petReaction.show("heart");
        return;
      }
    }
    this.walk({ x: p.x, z: p.z });
  }
  private walk(p: Point) {
    if (this.art.status() !== "ready" || this.activities.view.busy) return;
    const path = this.nav.path(this.point, p);
    if (!path.length) {
      this.avatarReaction.show("question");
      this.notify("Try an open path.");
      return;
    }
    this.route = path;
    this.following = true;
  }
  visitSquare() {
    this.walk({ x: TOWN.fountain.x, z: TOWN.fountain.z + 3.1 });
  }
  center() {
    this.following = true;
    this.focus = { ...this.point };
    this.positionCamera();
  }
  setZoom(delta: number) {
    this.zoom = Math.max(0.65, Math.min(1.7, this.zoom + delta));
    this.resize();
  }
  react(kind: ReactionKind) {
    this.avatarReaction.show(kind);
  }
  wave() {
    this.avatar.wave();
    this.react("hello");
  }
  jump() {
    this.avatar.jump();
    this.react("surprise");
  }
  tossCoin() {
    if (!this.coinAvailable) {
      this.avatarReaction.show("question");
      this.notify("Come a little closer to the fountain.");
      return;
    }
    if (this.coinCooldown > 0) return;
    this.coinCooldown = 1.5;
    this.audio.unlock();
    this.art.tossCoin(this.point);
    this.audio.coin();
    this.react("heart");
    this.notify("A little wish for the village.");
  }
  dig() {
    if (!this.nav.walkable(this.point) || !this.activities.dig()) return;
    this.route = [];
    this.activityAction = "dig";
    this.castTarget = null;
    this.audio.dig();
    this.activityArt.setState("digging", this.point, null, "dig");
  }
  fish() {
    const target = this.nav.streamTarget(this.point);
    if (!target || !this.activities.cast()) {
      this.notify("Try fishing from a clear spot beside the stream.");
      return;
    }
    this.route = [];
    this.activityAction = "fish";
    this.castTarget = target;
    this.avatar.root.rotation.y = Math.atan2(
      target.x - this.point.x,
      target.z - this.point.z,
    );
    this.audio.fishCast();
    this.activityArt.setState("casting", this.point, target, "fish");
  }
  reel() {
    if (!this.activities.reel()) return;
    this.audio.reel();
  }
  private updateActivity(dt: number) {
    const before = this.activities.state;
    const outcome = this.activities.update(dt);
    const state = this.activities.state;
    if (state !== before) {
      if (state === "waiting") this.audio.fishRipple();
      if (state === "reelReady") this.audio.actionPrompt();
      if (state === "idle") {
        this.activityAction = null;
        this.castTarget = null;
      }
    }
    if (outcome) {
      if (outcome.discovery) {
        const count = this.profile.addDiscovery(
          outcome.discovery.kind,
          outcome.discovery.id,
        );
        if (outcome.action === "fish")
          this.audio.catchFish(outcome.discovery.rarity);
        else this.audio.discover(outcome.discovery.rarity);
        this.react(outcome.discovery.rarity === "rare" ? "surprise" : "heart");
        this.notify(`${outcome.message} · Collection ×${count}`);
      } else {
        if (outcome.action === "fish") this.audio.emptyLine();
        this.react("question");
        this.notify(outcome.message);
      }
    }
    this.activityArt.setState(
      state,
      this.point,
      this.castTarget,
      this.activityAction,
    );
  }
  private updateContext() {
    const actions: TownContextView["actions"] = [];
    if (this.activities.state === "idle") {
      actions.push("dig");
      if (this.nav.streamTarget(this.point)) actions.unshift("fish");
    } else if (this.activities.state === "reelReady") actions.push("reel");
    const projected = new THREE.Vector3(
      this.point.x,
      1.72,
      this.point.z,
    ).project(this.camera);
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const key = actions.join(",");
    if (key && key !== this.contextKey && key !== "reel")
      this.audio.actionPrompt();
    this.contextKey = key;
    this.contextChanged({
      actions,
      x: Math.max(58, Math.min(width - 58, ((projected.x + 1) / 2) * width)),
      y: Math.max(74, Math.min(height - 88, ((1 - projected.y) / 2) * height)),
      visible: actions.length > 0 && Math.abs(projected.z) <= 1,
    });
  }
  private updateCoinAvailability() {
    const available = this.nav.nearFountain(this.point);
    if (available === this.coinAvailable) return;
    this.coinAvailable = available;
    this.coinAvailabilityChanged(available);
  }
  private frame = (time: number) => {
    if (this.disposed) return;
    const dt = this.last ? Math.min((time - this.last) / 1000, 0.05) : 0;
    this.last = time;
    if (!document.hidden) {
      this.updateActivity(dt);
      const moved = this.activities.view.busy
        ? { facing: this.avatar.root.rotation.y, moved: false }
        : RouteMotion.step(
            this.point,
            this.route,
            this.avatar.root.rotation.y,
            3,
            dt,
          );
      this.avatar.root.rotation.y = moved.facing;
      this.avatar.root.position.set(this.point.x, 0, this.point.z);
      this.avatar.update(dt, moved.moved, this.profile.state.reduced);
      this.updateCoinAvailability();
      if (this.pet) {
        this.petWait -= dt;
        if (this.petWait <= 0) {
          this.petWait = 0.35;
          const target = this.nav.companionTarget(
            this.point,
            this.avatar.root.rotation.y,
          );
          if (
            Math.hypot(this.petPoint.x - target.x, this.petPoint.z - target.z) >
            0.3
          )
            this.petRoute = this.nav.path(this.petPoint, target);
        }
        const pm = RouteMotion.step(
          this.petPoint,
          this.petRoute,
          this.pet.root.rotation.y,
          3.1,
          dt,
        );
        this.pet.root.rotation.y = pm.facing;
        this.pet.root.position.set(this.petPoint.x, 0, this.petPoint.z);
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
      this.activityArt.update(dt, this.profile.state.reduced);
      this.coinCooldown = Math.max(0, this.coinCooldown - dt);
      const p = new THREE.Vector3(TOWN.fountain.x, 1, TOWN.fountain.z).project(
        this.camera,
      );
      this.audio.setView(
        Math.abs(p.x) < 1.12 && Math.abs(p.y) < 1.12,
        Math.hypot(
          this.focus.x - TOWN.fountain.x,
          this.focus.z - TOWN.fountain.z,
        ),
        Math.max(-1, Math.min(1, p.x)),
      );
      this.updateContext();
      this.renderer.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame(this.frame);
  };
  status() {
    return {
      avatar: { ...this.point },
      walking: this.route.length > 0,
      focus: { ...this.focus },
      zoom: this.zoom,
      coinFlipping: this.coinCooldown > 0,
      coinAvailable: this.coinAvailable,
      activity: this.activities.view,
      streamBank: !!this.nav.streamTarget(this.point),
      audio: this.audio.status(),
      scenery: this.art.status(),
      pet:
        this.pet instanceof PetRig
          ? { id: this.petId, renderer: "cube-pet", ...this.pet.status() }
          : this.pet
            ? { id: this.petId, renderer: "procedural-fallback" }
            : null,
    };
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.observer.disconnect();
    this.audio.dispose();
    this.coinAvailabilityChanged(false);
    this.contextChanged({ actions: [], x: 0, y: 0, visible: false });
    this.avatarReaction.dispose();
    this.petReaction.dispose();
    this.activityArt.dispose();
    this.art.dispose();
    if (this.pet) {
      this.pet.root.removeFromParent();
      if (this.pet instanceof PetRig) this.pet.dispose();
      else RoomArt.release(this.pet.root);
      this.pet = null;
    }
    RoomArt.release(this.scene);
    this.renderer.dispose();
    this.host.replaceChildren();
  }
}
