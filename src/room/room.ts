import * as THREE from "three";
import { RoomArt, AnimalRig } from "./art";
import { RouteMotion } from "./motion";
import type { RoomSound } from "./audio";
import { RoomNavigation, ROOM, footprint } from "./navigation";
import { getFurniture, getPet } from "../core/catalog";
import {
  ProfileRepository,
  type OwnedItem,
  type Point,
  type Placement,
} from "../core/profile";
interface Actor {
  rig: AnimalRig;
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
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera();
  private renderer: THREE.WebGLRenderer;
  private furnitureRoot = new THREE.Group();
  private avatar: Actor;
  private pets: Actor[] = [];
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
  private pointer: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null = null;
  private destination: THREE.Mesh;
  private destinationAge = 0;
  constructor(
    private host: HTMLElement,
    private profile: ProfileRepository,
    private notify: (text: string) => void,
    private editChanged: (item: OwnedItem | null, error: string | null) => void,
    private sound: (sound: RoomSound) => void = () => {},
  ) {
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
        this.pointer = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          moved: false,
        };
        canvas.setPointerCapture(e.pointerId);
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener("pointermove", this.panMove, {
      signal: this.abort.signal,
    });
    canvas.addEventListener(
      "pointerup",
      (e) => {
        if (
          this.pointer?.id === e.pointerId &&
          !this.pointer.moved &&
          Math.hypot(e.clientX - this.pointer.x, e.clientY - this.pointer.y) <
            12
        )
          this.tap(e);
        this.pointer = null;
      },
      { signal: this.abort.signal },
    );
    canvas.addEventListener(
      "pointercancel",
      () => {
        this.pointer = null;
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
  private refresh() {
    const state = this.profile.state,
      key = JSON.stringify(state.items);
    if (key !== this.signature) {
      this.signature = key;
      RoomArt.release(this.furnitureRoot);
      this.furnitureRoot.clear();
      for (const item of state.items) {
        if (!item.placement) continue;
        const group = RoomArt.furniture(
          getFurniture(item.definitionId)!,
          item.lampOn,
        );
        group.position.set(item.placement.x, 0, item.placement.z);
        group.rotation.y = (item.placement.rotation * Math.PI) / 2;
        group.userData.itemId = item.id;
        this.furnitureRoot.add(group);
      }
      const layout = JSON.stringify(
        state.items.map(({ id, definitionId, placement }) => ({
          id,
          definitionId,
          placement,
        })),
      );
      if (layout !== this.layoutSignature) {
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
      this.scene.remove(pet.rig.root);
      RoomArt.release(pet.rig.root);
    }
    this.pets = this.pets.filter((p) => state.activePets.includes(p.id));
    for (const id of state.activePets) {
      if (this.pets.some((p) => p.id === id)) continue;
      const def = getPet(id)!;
      const rig = new AnimalRig(def.color, def.shape, "none", true);
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
  private panMove = (event: PointerEvent) => {
    const p = this.pointer;
    if (!p || p.id !== event.pointerId || this.paused || this.draft) return;
    if (!p.moved && Math.hypot(event.clientX - p.x, event.clientY - p.y) < 12)
      return;
    p.moved = true;
    const from = this.floorAt(p.lastX, p.lastY),
      to = this.floorAt(event.clientX, event.clientY);
    if (from && to) {
      this.pan.x = Math.max(-3, Math.min(3, this.pan.x + from.x - to.x));
      this.pan.z = Math.max(-3, Math.min(3, this.pan.z + from.z - to.z));
      this.resize();
    }
    p.lastX = event.clientX;
    p.lastY = event.clientY;
  };
  setZoom(value: number) {
    this.zoom = Math.max(0.8, Math.min(1.55, value));
    this.resize();
  }
  zoomBy(factor: number) {
    this.setZoom(this.zoom * factor);
  }
  private tap(event: PointerEvent) {
    if (this.paused) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
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
  setEditing(value: boolean) {
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
    this.sound("wave");
  }
  jump() {
    this.avatar.rig.jump();
    this.sound("jump");
  }
  pet(id: string) {
    const pet = this.pets.find((p) => p.id === id);
    if (!pet) return;
    pet.rig.pet();
    this.sound("pet");
    pet.wait = 3;
    pet.path = [];
    this.notify(`${getPet(pet.id)!.name} loved that. ♥`);
  }
  callPets() {
    this.sound("call");
    for (const pet of this.pets) {
      pet.path = this.nav.path(pet.point, this.freeNear(this.avatar.point));
      pet.wait = 4;
    }
    this.avatar.rig.wave();
    if (this.pets.length) this.notify("Here, little friend!");
  }
  setPaused(value: boolean) {
    this.paused = value;
    this.last = 0;
  }
  private frame = (timestamp: number) => {
    const dt = this.last ? Math.min((timestamp - this.last) / 1000, 0.05) : 0;
    this.last = timestamp;
    if (!this.paused && !document.hidden) {
      for (const actor of this.actors()) {
        if (actor !== this.avatar && !actor.path.length && !this.draft) {
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
      if (this.destinationAge <= 0) this.destination.visible = false;
      this.renderer.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame(this.frame);
  };
  status() {
    return {
      avatar: { ...this.avatar.point },
      facing: this.avatar.rig.root.rotation.y,
      editing: this.editing,
      walking: this.avatar.path.length > 0,
      pets: this.pets.map((p) => ({ id: p.id, ...p.point })),
      placing: this.draft?.item.id ?? null,
      placementError: this.draft?.error ?? null,
      zoom: this.zoom,
      pan: { ...this.pan },
      paused: this.paused,
    };
  }
  dispose() {
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.unsub();
    this.observer.disconnect();
    RoomArt.release(this.scene);
    this.renderer.dispose();
    this.host.replaceChildren();
  }
}
