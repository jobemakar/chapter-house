import * as THREE from "three";
import { RoomArt, AnimalRig } from "./art";
import { RouteMotion } from "./motion";
import { InteractiveFurnishing } from "./furnishings";
import { ActorReaction, type ReactionKind } from "./reactions";
import type { RoomSound } from "./audio";
import { RoomNavigation, ROOM, footprint } from "./navigation";
import { PetAssets, PetRig, type PetAssetKey } from "./pet-assets";
import { getFurniture, getPet } from "../core/catalog";
import { PointerGesture, type ScreenPoint } from "../core/pointer-gesture";
import {
  ProfileRepository,
  type OwnedItem,
  type Point,
  type Placement,
} from "../core/profile";
interface Actor<Rig extends AnimalRig | PetRig = AnimalRig | PetRig> {
  rig: Rig;
  point: Point;
  path: Point[];
  wait: number;
  id: string;
  following: boolean;
}
interface Draft {
  item: OwnedItem;
  placement: Placement;
  ghost: THREE.Group;
  marker: THREE.Mesh;
  error: string | null;
}
/** World coordinates are authoritative; Three's depth buffer handles occlusion. */
export class ClubhouseRoom {
  private reactions = new Map<Actor, ActorReaction>();
  private showReaction(actor: Actor, kind: ReactionKind) {
    if (!this.reactions) return;
    let reaction = this.reactions.get(actor);
    if (!reaction) {
      reaction = new ActorReaction(actor === this.avatar ? "avatar" : "pet");
      this.reactions.set(actor, reaction);
    }
    actor.rig.root.add(reaction.sprite);
    reaction.show(kind);
  }
  react(kind: ReactionKind) {
    this.showReaction(this.avatar, kind);
  }
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera();
  private renderer: THREE.WebGLRenderer;
  private furnitureRoot = new THREE.Group();
  private furnishings = new Map<string, InteractiveFurnishing>();
  private petPlay: {
    pet: Actor;
    itemId: string;
    kind: "bowl" | "trampoline";
    approach: Point;
    center: Point;
    time: number;
    arrived: boolean;
    facing: number;
  } | null = null;
  private avatar: Actor<AnimalRig>;
  private pets: Actor<AnimalRig | PetRig>[] = [];
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private target = new THREE.Vector3();
  private raf = 0;
  private last = 0;
  private observer: ResizeObserver;
  private abort = new AbortController();
  private unsub: () => void;
  private signature = "";
  private layoutSignature = "";
  private appearance = "";
  private draft: Draft | null = null;
  private editing = false;
  private undoState: { id: string; placement: Placement | null }[] | null =
    null;
  private zoom = 1;
  private pan = { x: 0, z: 0 };
  private paused = false;
  private gesture = new PointerGesture(12);
  private pinch: { zoom: number; anchor: THREE.Vector3 } | null = null;
  private destination: THREE.Mesh;
  private destinationAge = 0;
  constructor(
    private host: HTMLElement,
    private profile: ProfileRepository,
    private notify: (text: string) => void,
    private editChanged: (item: OwnedItem | null, error: string | null) => void,
    private sound: (sound: RoomSound) => void = () => {},
    private petAssets: PetAssets = new PetAssets(),
  ) {
    if (window.matchMedia("(max-width: 540px)").matches) this.zoom = 1.18;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Your library clubhouse. Tap the floor to walk; tap a pet to pet it.",
    );
    this.renderer.domElement.tabIndex = 0;
    this.scene.add(RoomArt.environment(), this.furnitureRoot);
    this.scene.add(new THREE.HemisphereLight(0xfff0d3, 0xc2aa8b, 2.8));
    const sun = new THREE.DirectionalLight(0xffe8bd, 3.5);
    sun.position.set(3, 12, 7);
    sun.target.position.set(5, 0, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.0001;
    sun.shadow.radius = 4;
    this.scene.add(sun, sun.target);
    this.avatar = {
      id: "avatar",
      rig: new AnimalRig(
        profile.state.avatar.color,
        "fox",
        profile.state.avatar.accessory,
      ),
      point: { x: 5, z: 6.4 },
      path: [],
      wait: 0,
      following: false,
    };
    this.scene.add(this.avatar.rig.root);
    this.destination = new THREE.Mesh(
      new THREE.RingGeometry(0.17, 0.23, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfff2b4,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.destination.rotation.x = -Math.PI / 2;
    this.destination.visible = false;
    this.scene.add(this.destination);
    this.refresh();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    const canvas = this.renderer.domElement;
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0) return;
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
        this.setZoom(this.zoom * (e.deltaY > 0 ? 0.92 : 1.08));
      },
      { passive: false, signal: this.abort.signal },
    );
    canvas.addEventListener(
      "keydown",
      (e) => {
        if (this.paused || this.draft) return;
        const d: Record<string, Point> = {
          ArrowUp: { x: -0.7, z: -0.7 },
          ArrowDown: { x: 0.7, z: 0.7 },
          ArrowLeft: { x: -0.7, z: 0.7 },
          ArrowRight: { x: 0.7, z: -0.7 },
          w: { x: -0.7, z: -0.7 },
          s: { x: 0.7, z: 0.7 },
          a: { x: -0.7, z: 0.7 },
          d: { x: 0.7, z: -0.7 },
        };
        if (d[e.key]) {
          e.preventDefault();
          this.walk({
            x: this.avatar.point.x + d[e.key].x,
            z: this.avatar.point.z + d[e.key].z,
          });
        }
        if (e.code === "Space") {
          e.preventDefault();
          this.jump();
        }
      },
      { signal: this.abort.signal },
    );
    this.unsub = profile.subscribe(() => this.refresh());
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }
  private get nav() {
    return new RoomNavigation(this.profile.state.items);
  }
  private actors() {
    return [this.avatar, ...this.pets];
  }
  private createPetRig(id: string): AnimalRig | PetRig {
    const def = getPet(id)!;
    if (id === "cat" || id === "bunny" || id === "fox") {
      try {
        return this.petAssets.create(id as PetAssetKey);
      } catch {
        // The room is usable immediately while the local GLBs load, and this
        // procedural stand-in remains available if they fail.
      }
    }
    return new AnimalRig(def.color, def.shape, "none", true);
  }
  private releasePetRig(rig: AnimalRig | PetRig) {
    rig.root.removeFromParent();
    if (rig instanceof PetRig) rig.dispose();
    else RoomArt.release(rig.root);
  }
  /** Swap initial stand-ins after the shared application asset load resolves. */
  useLoadedPetAssets() {
    for (const pet of this.pets) {
      if (pet.rig instanceof PetRig) continue;
      const previous = pet.rig;
      const replacement = this.createPetRig(pet.id);
      if (!(replacement instanceof PetRig)) continue;
      replacement.root.position.copy(previous.root.position);
      replacement.root.rotation.copy(previous.root.rotation);
      const reaction = this.reactions.get(pet);
      if (reaction) replacement.root.add(reaction.sprite);
      this.releasePetRig(previous);
      pet.rig = replacement;
      this.scene.add(replacement.root);
    }
  }
  private refresh() {
    const state = this.profile.state,
      key = JSON.stringify(state.items);
    if (key !== this.signature) {
      this.signature = key;
      const previousFurnishings = this.furnishings;
      for (const controller of previousFurnishings.values())
        this.furnitureRoot.remove(controller.root);
      RoomArt.release(this.furnitureRoot);
      this.furnitureRoot.clear();
      this.furnishings = new Map();
      for (const item of state.items) {
        if (!item.placement) continue;
        const def = getFurniture(item.definitionId)!;
        const interactive = ["bowl", "aquarium", "trampoline"].includes(
          def.kind,
        )
          ? (previousFurnishings.get(item.id) ??
            new InteractiveFurnishing(def, item.filled))
          : null;
        if (interactive) {
          interactive.setFilled(item.filled === true);
          this.furnishings.set(item.id, interactive);
        }
        const group = interactive?.root ?? RoomArt.furniture(def, item.lampOn);
        group.position.set(item.placement.x, 0, item.placement.z);
        group.rotation.y = (item.placement.rotation * Math.PI) / 2;
        group.userData.itemId = item.id;
        this.furnitureRoot.add(group);
      }
      for (const [id, controller] of previousFurnishings)
        if (!this.furnishings.has(id)) RoomArt.release(controller.root);
      const layout = JSON.stringify(
        state.items.map(({ id, definitionId, placement }) => ({
          id,
          definitionId,
          placement,
        })),
      );
      if (layout !== this.layoutSignature) {
        this.cancelPetPlay();
        this.layoutSignature = layout;
        this.actors().forEach((a) => (a.path = []));
      }
    }
    const appearance = JSON.stringify(state.avatar);
    if (appearance !== this.appearance) {
      this.appearance = appearance;
      const old = this.avatar.rig;
      this.scene.remove(old.root);
      RoomArt.release(old.root);
      this.avatar.rig = new AnimalRig(
        state.avatar.color,
        "fox",
        state.avatar.accessory,
      );
      this.avatar.rig.root.rotation.y = old.root.rotation.y;
      this.scene.add(this.avatar.rig.root);
    }
    for (const pet of this.pets.filter(
      (p) => !state.activePets.includes(p.id),
    )) {
      this.releasePetRig(pet.rig);
    }
    this.pets = this.pets.filter((p) => state.activePets.includes(p.id));
    for (const id of state.activePets) {
      if (this.pets.some((p) => p.id === id)) continue;
      const rig = this.createPetRig(id);
      rig.root.userData.petId = id;
      const point = this.freeNear(this.avatar.point);
      const actor = { id, rig, point, path: [], wait: 1, following: false };
      this.pets.push(actor);
      this.scene.add(rig.root);
    }
    for (const actor of this.actors()) {
      if (!this.nav.walkable(actor.point))
        actor.point = this.freeNear(ROOM.entry);
      actor.rig.root.position.set(actor.point.x, 0, actor.point.z);
    }
  }
  private freeNear(p: Point): Point {
    for (let radius = 0.5; radius < 8; radius += 0.5)
      for (let i = 0; i < 12; i++) {
        const q = {
          x: p.x + Math.cos((i * Math.PI) / 6) * radius,
          z: p.z + Math.sin((i * Math.PI) / 6) * radius,
        };
        if (this.nav.walkable(q)) return q;
      }
    return { ...ROOM.entry };
  }
  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const vertical = Math.max(11.7, 16 / aspect) / this.zoom;
    this.camera.left = (-vertical * aspect) / 2;
    this.camera.right = (vertical * aspect) / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.camera.position.set(17 + this.pan.x, 15, 19 + this.pan.z);
    this.camera.lookAt(5 + this.pan.x, 0.75, 3.8 + this.pan.z);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  private floorAt(x: number, y: number): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        (-(y - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    return this.ray.ray.intersectPlane(this.plane, new THREE.Vector3());
  }
  private beginPinch(midpoint: ScreenPoint) {
    const anchor = this.floorAt(midpoint.x, midpoint.y);
    this.pinch = anchor ? { zoom: this.zoom, anchor } : null;
  }
  private moveGesture(event: PointerEvent) {
    const update = this.gesture.move(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (update.kind === "pinch") {
      const pinch = this.pinch;
      if (!pinch) return;
      this.zoom = Math.max(0.8, Math.min(1.55, pinch.zoom * update.scale));
      this.resize();
      const after = this.floorAt(update.midpoint.x, update.midpoint.y);
      if (after) {
        this.pan.x = Math.max(
          -3,
          Math.min(3, this.pan.x + pinch.anchor.x - after.x),
        );
        this.pan.z = Math.max(
          -3,
          Math.min(3, this.pan.z + pinch.anchor.z - after.z),
        );
        this.resize();
      }
      return;
    }
    if (update.kind !== "pan" || this.paused || this.draft) return;
    const from = this.floorAt(update.from.x, update.from.y),
      to = this.floorAt(update.to.x, update.to.y);
    if (from && to) {
      this.pan.x = Math.max(-3, Math.min(3, this.pan.x + from.x - to.x));
      this.pan.z = Math.max(-3, Math.min(3, this.pan.z + from.z - to.z));
      this.resize();
    }
  }
  setZoom(value: number) {
    this.zoom = Math.max(0.8, Math.min(1.55, value));
    this.resize();
  }
  zoomBy(factor: number) {
    this.setZoom(this.zoom * factor);
  }
  private tap(screen: ScreenPoint) {
    if (this.paused) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((screen.x - rect.left) / rect.width) * 2 - 1,
        (-(screen.y - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    if (!this.draft) {
      const hits = this.ray.intersectObjects(
        [...this.furnitureRoot.children, ...this.pets.map((p) => p.rig.root)],
        true,
      );
      for (const hit of hits) {
        let o: THREE.Object3D | null = hit.object;
        while (o && !o.userData.itemId && !o.userData.petId) o = o.parent;
        if (o?.userData.petId) {
          const pet = this.pets.find((p) => p.id === o!.userData.petId)!;
          this.pet(pet.id);
          return;
        }
        if (this.editing && o?.userData.itemId) {
          this.beginPlacement(o.userData.itemId);
          return;
        }
        if (o?.userData.itemId) {
          if (this.interactWithFurniture(o.userData.itemId)) return;
          const on = this.profile.toggleLamp(o.userData.itemId);
          if (on !== null) {
            this.sound("lamp");
            this.notify(on ? "A little warm light." : "Lamp switched off.");
            return;
          }
          break;
        }
      }
    }
    if (!this.ray.ray.intersectPlane(this.plane, this.target)) return;
    const point = { x: this.target.x, z: this.target.z };
    if (this.draft) {
      this.draft.placement.x = Math.round(point.x * 4) / 4;
      this.draft.placement.z = Math.round(point.z * 4) / 4;
      this.updateDraft();
    } else this.walk(point);
  }
  private walk(point: Point) {
    const path = this.nav.path(this.avatar.point, point);
    if (!path.length) {
      this.notify("Tap an open spot on the floor.");
      return;
    }
    this.avatar.path = path;
    this.destination.position.set(point.x, 0.09, point.z);
    this.destination.visible = true;
    this.destinationAge = 1.5;
  }
  interactWithFurniture(id: string): boolean {
    const furniture = this.furnishings.get(id);
    const item = this.profile.state.items.find((i) => i.id === id);
    if (!furniture || !item?.placement || this.editing || this.paused)
      return false;
    const kind = getFurniture(item.definitionId)!.kind;
    if (kind === "bowl") {
      if (!item.filled) {
        this.profile.fillBowl(id);
        furniture.setFilled(true);
        this.notify("A bowl full of good things.");
      } else if (!this.petPlay) {
        this.startPetPlay(id, "bowl");
      }
    } else if (kind === "aquarium") {
      furniture.interact();
      this.notify("There they go!");
    } else {
      this.startPetPlay(id, "trampoline");
    }
    this.sound("pet");
    return true;
  }
  /** Route one free pet to an accessible edge and reserve it until the action ends. */
  private startPetPlay(id: string, kind: "bowl" | "trampoline") {
    if (this.petPlay) return;
    const item = this.profile.state.items.find(
      (candidate) => candidate.id === id,
    );
    if (!item?.placement) return;
    const pet = this.pets.find((candidate) => !candidate.following);
    if (!pet) {
      this.notify(
        kind === "bowl"
          ? "Bring a pet out to enjoy the food."
          : "Bring a pet out to try the trampoline.",
      );
      return;
    }
    const center = { x: item.placement.x, z: item.placement.z };
    const edge = kind === "bowl" ? 0.68 : 1.05;
    const approaches = [
      [edge, 0],
      [-edge, 0],
      [0, edge],
      [0, -edge],
    ]
      .map(([x, z]) => ({ x: center.x + x, z: center.z + z }))
      .filter((point) => this.nav.walkable(point))
      .map((point) => {
        const path = this.nav.path(pet.point, point);
        return {
          point,
          path,
          // A pet already standing at an edge has arrived even though A* has
          // no waypoint to return. An empty route elsewhere stays unavailable.
          reached:
            Math.hypot(pet.point.x - point.x, pet.point.z - point.z) < 0.04,
        };
      })
      .filter((route) => route.path.length || route.reached)
      .sort((a, b) => a.path.length - b.path.length);
    if (!approaches.length) {
      this.notify(
        kind === "bowl"
          ? "Leave a little room beside the bowl."
          : "Leave a little room beside the trampoline.",
      );
      return;
    }
    pet.path = approaches[0].path;
    this.petPlay = {
      pet,
      itemId: id,
      kind,
      approach: approaches[0].point,
      center,
      time: 0,
      arrived: false,
      facing: pet.rig.root.rotation.y,
    };
    this.notify(
      kind === "bowl"
        ? `${getPet(pet.id)!.name} is coming to eat!`
        : `${getPet(pet.id)!.name} is coming for a bounce!`,
    );
  }
  private cancelPetPlay() {
    if (!this.petPlay) return;
    const pet = this.petPlay.pet;
    if (pet.rig instanceof PetRig) pet.rig.setActivity(null);
    pet.path = [];
    pet.wait = 3;
    if (this.petPlay.kind === "bowl") {
      pet.rig.root.rotation.y = this.petPlay.facing;
      pet.rig.root.position.y = 0;
    }
    pet.rig.root.position.set(pet.point.x, 0, pet.point.z);
    this.petPlay = null;
  }
  private animatePetPlay(dt: number) {
    const play = this.petPlay;
    if (!play) return;
    if (!this.pets.includes(play.pet) || !this.furnishings.has(play.itemId)) {
      this.cancelPetPlay();
      return;
    }
    if (!play.arrived) {
      if (play.pet.path.length) return;
      play.arrived = true;
      if (play.kind === "bowl") {
        // The rig faces +Z, so turn the pet's face toward the bowl before it
        // starts dipping. Keep this separately from route heading so cancel
        // can return normal roaming transforms exactly.
        play.pet.rig.root.rotation.y = Math.atan2(
          play.center.x - play.approach.x,
          play.center.z - play.approach.z,
        );
        this.showReaction(play.pet, "nom");
        if (play.pet.rig instanceof PetRig) play.pet.rig.setActivity("eat");
        this.notify(`${getPet(play.pet.id)!.name}: nom nom!`);
      } else {
        if (play.pet.rig instanceof PetRig) play.pet.rig.setActivity("dance");
        this.furnishings.get(play.itemId)!.interact();
      }
    }
    play.time += dt;
    const t = play.time;
    if (play.kind === "bowl") {
      const reduced = this.profile.state.reduced;
      const bite = (1 - Math.cos(t * Math.PI * (reduced ? 2 : 4))) / 2;
      const toward = {
        x: play.center.x - play.approach.x,
        z: play.center.z - play.approach.z,
      };
      const distance = Math.hypot(toward.x, toward.z) || 1;
      // A small forward/downward dip is readable as eating without competing
      // with the normal walk and idle rig motions.
      play.pet.rig.root.position.set(
        play.approach.x +
          (toward.x / distance) * bite * (reduced ? 0.018 : 0.06),
        bite * (reduced ? 0.009 : 0.03),
        play.approach.z +
          (toward.z / distance) * bite * (reduced ? 0.018 : 0.06),
      );
      if (t >= 2) {
        // Do not spend food until arrival and the visible nibble both completed.
        if (this.profile.emptyBowl(play.itemId))
          this.furnishings.get(play.itemId)?.setFilled(false);
        this.cancelPetPlay();
      }
      return;
    }
    if (t >= 3.4) {
      this.cancelPetPlay();
      return;
    }
    const blend = t < 0.45 ? t / 0.45 : t > 2.95 ? (3.4 - t) / 0.45 : 1;
    const hop = Math.abs(Math.sin((t - 0.45) * Math.PI * 2.4));
    const height =
      t < 0.45 || t > 2.95
        ? Math.sin(blend * Math.PI) * 0.25
        : hop * (this.profile.state.reduced ? 0.12 : 0.45);
    play.pet.rig.root.position.set(
      play.approach.x + (play.center.x - play.approach.x) * blend,
      0.35 * blend + height,
      play.approach.z + (play.center.z - play.approach.z) * blend,
    );
  }
  setEditing(value: boolean) {
    if (value) this.cancelPetPlay();
    this.editing = value;
    if (!value) this.cancelPlacement();
    this.host.classList.toggle("editing", value);
  }
  beginPlacement(id: string) {
    this.cancelPlacement();
    const item = this.profile.state.items.find((i) => i.id === id);
    if (!item) return;
    this.setEditing(true);
    const def = getFurniture(item.definitionId)!;
    const placement = item.placement
      ? { ...item.placement }
      : { ...this.freeNear(this.avatar.point), rotation: 0 };
    const ghost = RoomArt.furniture(def);
    ghost.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const material = o.material as THREE.MeshStandardMaterial;
        material.transparent = true;
        material.opacity = 0.6;
        o.castShadow = false;
      }
    });
    this.scene.add(ghost);
    const marker = new THREE.Mesh(
      new THREE.PlaneGeometry(def.width + 0.08, def.depth + 0.08),
      new THREE.MeshBasicMaterial({
        color: 0x7ca68b,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    marker.rotation.x = -Math.PI / 2;
    this.scene.add(marker);
    this.draft = { item, placement, ghost, marker, error: null };
    this.actors().forEach((a) => (a.path = []));
    this.updateDraft();
  }
  private updateDraft() {
    const draft = this.draft;
    if (!draft) return;
    const p = draft.placement;
    draft.ghost.position.set(p.x, 0.05, p.z);
    draft.ghost.rotation.y = (p.rotation * Math.PI) / 2;
    draft.marker.position.set(p.x, 0.085, p.z);
    draft.marker.rotation.z = (p.rotation * Math.PI) / 2;
    draft.error = this.nav.validate(
      draft.item,
      p,
      this.actors().map((a) => a.point),
    );
    (draft.marker.material as THREE.MeshBasicMaterial).color.set(
      draft.error ? 0xdb8a73 : 0x77aa8d,
    );
    this.editChanged(draft.item, draft.error);
  }
  rotate() {
    if (this.draft) {
      this.draft.placement.rotation = (this.draft.placement.rotation + 1) % 4;
      this.updateDraft();
    }
  }
  commitPlacement() {
    const d = this.draft;
    if (!d) return;
    this.updateDraft();
    if (d.error) {
      this.notify(d.error);
      return;
    }
    this.remember();
    d.item.placement = { ...d.placement };
    this.cancelPlacement();
    this.profile.save();
    this.notify("A lovely spot. Saved.");
  }
  storeSelected() {
    if (!this.draft) return;
    this.remember();
    this.draft.item.placement = null;
    this.cancelPlacement();
    this.profile.save();
    this.notify("Stored safely in Decorate.");
  }
  private remember() {
    this.undoState = this.profile.state.items.map((i) => ({
      id: i.id,
      placement: i.placement ? { ...i.placement } : null,
    }));
  }
  undo() {
    if (!this.undoState) {
      this.notify("Nothing to undo yet.");
      return;
    }
    this.cancelPlacement();
    for (const old of this.undoState) {
      const item = this.profile.state.items.find((i) => i.id === old.id);
      if (item) item.placement = old.placement;
    }
    this.undoState = null;
    this.profile.save();
    this.notify("Last room change undone.");
  }
  cancelPlacement() {
    if (!this.draft) return;
    this.scene.remove(this.draft.ghost, this.draft.marker);
    RoomArt.release(this.draft.ghost);
    this.draft.marker.geometry.dispose();
    (this.draft.marker.material as THREE.Material).dispose();
    this.draft = null;
    this.editChanged(null, null);
  }
  wave() {
    this.avatar.rig.wave();
    this.react("hello");
    this.sound("wave");
  }
  jump() {
    this.avatar.rig.jump();
    this.react("surprise");
    this.sound("jump");
  }
  pet(id: string) {
    this.cancelPetPlay();
    const pet = this.pets.find((p) => p.id === id);
    if (!pet) return;
    pet.rig.pet();
    this.showReaction(pet, "heart");
    this.sound("pet");
    pet.wait = 3;
    pet.path = [];
    this.notify(`${getPet(pet.id)!.name} loved that. ♥`);
  }
  callPets() {
    this.cancelPetPlay();
    this.sound("call");
    for (const pet of this.pets) {
      pet.path = this.nav.path(pet.point, this.freeNear(this.avatar.point));
      pet.wait = 4;
      this.showReaction(pet, "question");
    }
    this.avatar.rig.wave();
    if (this.pets.length) this.notify("Here, little friend!");
  }
  setPaused(value: boolean) {
    if (value) this.cancelPetPlay();
    if (value) {
      this.gesture.cancel();
      this.pinch = null;
    }
    this.paused = value;
    this.last = 0;
  }
  private frame = (timestamp: number) => {
    const dt = this.last ? Math.min((timestamp - this.last) / 1000, 0.05) : 0;
    this.last = timestamp;
    if (!this.paused && !document.hidden) {
      for (const actor of this.actors()) {
        if (
          actor !== this.avatar &&
          actor !== this.petPlay?.pet &&
          !actor.path.length &&
          !this.draft
        ) {
          actor.wait -= dt;
          if (actor.wait <= 0) {
            const target = {
              x: 0.6 + Math.random() * 8.8,
              z: 0.6 + Math.random() * 6.8,
            };
            actor.path = this.nav.path(actor.point, target);
            actor.wait = 3 + Math.random() * 4;
          }
        }
        const motion = !this.draft
          ? RouteMotion.step(
              actor.point,
              actor.path,
              actor.rig.root.rotation.y,
              actor === this.avatar ? 2.35 : 0.8,
              dt,
            )
          : { facing: actor.rig.root.rotation.y, moved: false };
        actor.rig.root.rotation.y = motion.facing;
        actor.rig.root.position.set(actor.point.x, 0, actor.point.z);
        actor.rig.update(dt, motion.moved, this.profile.state.reduced);
      }
      this.destinationAge -= dt;
      for (const furnishing of this.furnishings.values())
        furnishing.update(dt, this.profile.state.reduced);
      this.animatePetPlay(dt);
      for (const [actor, reaction] of this.reactions) {
        if (!this.actors().includes(actor)) {
          reaction.dispose();
          this.reactions.delete(actor);
        } else reaction.update(dt, this.profile.state.reduced);
      }
      if (this.destinationAge <= 0) this.destination.visible = false;
      this.renderer.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame(this.frame);
  };
  status() {
    return {
      avatar: { ...this.avatar.point },
      facing: this.avatar.rig.root.rotation.y,
      petPlaying: this.petPlay?.itemId ?? null,
      furnishings: [...this.furnishings].map(([id, controller]) => ({
        id,
        ...controller.status(),
      })),
      editing: this.editing,
      walking: this.avatar.path.length > 0,
      pets: this.pets.map((p) => ({
        id: p.id,
        ...p.point,
        visual:
          p.rig instanceof PetRig
            ? { renderer: "cube-pet", ...p.rig.status() }
            : { renderer: "procedural-fallback" },
      })),
      placing: this.draft?.item.id ?? null,
      placementError: this.draft?.error ?? null,
      zoom: this.zoom,
      pan: { ...this.pan },
      paused: this.paused,
    };
  }
  dispose() {
    for (const reaction of this.reactions.values()) reaction.dispose();
    this.reactions.clear();
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.unsub();
    this.observer.disconnect();
    for (const pet of this.pets) this.releasePetRig(pet.rig);
    this.pets = [];
    RoomArt.release(this.scene);
    this.renderer.dispose();
    this.host.replaceChildren();
  }
}
