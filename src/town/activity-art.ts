import * as THREE from "three";
import { AnimalRig, RoomArt } from "../room/art";
import type { Point } from "../core/profile";
import type { ActivityAction, TownActivityState } from "./activities";

/** Procedural, disposable props for the lightweight town activities. */
export class TownActivityArt {
  private root = new THREE.Group();
  private rod = new THREE.Group();
  private shovel = new THREE.Group();
  private ripples: THREE.Mesh[] = [];
  private lure: THREE.Mesh;
  private splash = new THREE.Group();
  private digMark = new THREE.Group();
  private proceduralSoil = new THREE.Group();
  private importedDigMound: THREE.Group | null = null;
  private line: THREE.Line;
  private time = 0;
  private stateAge = 0;
  private state: TownActivityState = "idle";
  private lastAction: ActivityAction | null = null;
  private target: Point | null = null;

  constructor(
    scene: THREE.Scene,
    private avatar: AnimalRig,
  ) {
    this.makeRod();
    this.makeShovel();
    avatar.root.add(this.rod, this.shovel);

    for (const [inner, outer, opacity] of [
      [0.14, 0.2, 0.95],
      [0.29, 0.36, 0.78],
      [0.48, 0.56, 0.58],
    ] as const) {
      const ripple = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 40),
        new THREE.MeshBasicMaterial({
          color: 0xe8ffff,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ripple.rotation.x = -Math.PI / 2;
      this.ripples.push(ripple);
      this.root.add(ripple);
    }
    this.lure = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 8),
      new THREE.MeshStandardMaterial({
        color: 0xf1bd61,
        emissive: 0x6b3d10,
        emissiveIntensity: 0.12,
      }),
    );
    for (let i = 0; i < 5; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xd9fbff, transparent: true }),
      );
      const angle = (i / 5) * Math.PI * 2;
      drop.position.set(Math.cos(angle) * 0.18, 0.08, Math.sin(angle) * 0.18);
      this.splash.add(drop);
    }
    this.makeDigMark();
    this.line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
      new THREE.LineBasicMaterial({
        color: 0xf8f2d6,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.root.add(this.lure, this.splash, this.digMark, this.line);
    scene.add(this.root);
    this.hide();
  }

  private makeRod() {
    const wood = new THREE.MeshStandardMaterial({
      color: 0x875b38,
      roughness: 0.8,
    });
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 1.15, 10),
      wood,
    );
    handle.rotation.z = -0.47;
    handle.position.set(0.1, 0.18, 0.13);
    const reel = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.024, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0xe4b455,
        metalness: 0.2,
        roughness: 0.5,
      }),
    );
    reel.position.set(-0.05, -0.04, 0.18);
    reel.rotation.x = Math.PI / 2;
    this.rod.add(handle, reel);
    this.rod.position.set(0.03, 0.72, 0.24);
  }

  private makeShovel() {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.88, 10),
      new THREE.MeshStandardMaterial({ color: 0x835a39, roughness: 0.9 }),
    );
    handle.rotation.z = -0.42;
    const blade = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x8aa2a1,
        metalness: 0.35,
        roughness: 0.55,
      }),
    );
    blade.scale.set(0.75, 1.05, 0.22);
    blade.position.set(0.19, -0.39, 0.02);
    blade.rotation.z = -0.42;
    this.shovel.add(handle, blade);
    this.shovel.position.set(0.02, 0.78, 0.28);
  }

  private makeDigMark() {
    const hole = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 32),
      new THREE.MeshBasicMaterial({
        color: 0x4e3d2b,
        transparent: true,
        opacity: 0.86,
        side: THREE.DoubleSide,
      }),
    );
    hole.rotation.x = -Math.PI / 2;
    hole.scale.set(1, 0.68, 1);
    hole.position.y = 0.012;
    this.digMark.add(hole, this.proceduralSoil);
    const soil = new THREE.MeshStandardMaterial({
      color: 0x9a7045,
      roughness: 1,
    });
    for (const [x, z, scale] of [
      [-0.3, 0.05, 0.2],
      [-0.12, 0.25, 0.24],
      [0.13, 0.27, 0.2],
      [0.31, 0.08, 0.18],
    ] as const) {
      const clod = new THREE.Mesh(
        new THREE.DodecahedronGeometry(scale, 0),
        soil,
      );
      clod.scale.y = 0.5;
      clod.position.set(x, scale * 0.25, z);
      clod.rotation.set(scale * 2, x * 2, z);
      this.proceduralSoil.add(clod);
    }
  }

  /** Installs the loaded Kenney soil mound while retaining a procedural fallback. */
  setImportedDigMound(mound: THREE.Group) {
    this.importedDigMound?.removeFromParent();
    this.importedDigMound = mound;
    mound.position.set(0, 0.014, 0.2);
    mound.rotation.y = Math.PI / 2;
    this.proceduralSoil.visible = false;
    this.digMark.add(mound);
  }

  setState(
    state: TownActivityState,
    avatarPoint: Point,
    target: Point | null,
    action: ActivityAction | null,
  ) {
    const continuingDigResult =
      this.state === "digging" &&
      state === "result" &&
      this.lastAction === "dig";
    if (state !== this.state && !continuingDigResult) this.stateAge = 0;
    this.state = state;
    this.target = target;
    if (action) this.lastAction = action;
    const fishing = ["casting", "waiting", "reelReady", "reeling"].includes(
      state,
    );
    const digging = state === "digging";
    const showDigMark =
      digging || (state === "result" && this.lastAction === "dig");
    this.rod.visible = fishing;
    this.shovel.visible = digging;
    this.line.visible = fishing && !!target;
    const showWater =
      ["waiting", "reelReady", "reeling"].includes(state) && !!target;
    this.ripples.forEach((ripple) => (ripple.visible = showWater));
    this.lure.visible = showWater;
    this.splash.visible = showWater;
    this.digMark.visible = showDigMark && this.stateAge > 0.12;
    const facing = this.avatar.root.rotation.y;
    this.digMark.position.set(
      avatarPoint.x + Math.sin(facing) * 0.66,
      0,
      avatarPoint.z + Math.cos(facing) * 0.66,
    );
    this.digMark.rotation.y = facing;
    if (target) {
      this.ripples.forEach((ripple) =>
        ripple.position.set(target.x, 0.085, target.z),
      );
      this.lure.position.set(target.x, 0.13, target.z);
      this.splash.position.set(target.x, 0.08, target.z);
    }
    this.avatar.setActivityPose(fishing ? "rod" : digging ? "shovel" : null);
  }

  private hide() {
    this.rod.visible = false;
    this.shovel.visible = false;
    this.ripples.forEach((ripple) => (ripple.visible = false));
    this.lure.visible = false;
    this.splash.visible = false;
    this.digMark.visible = false;
    this.line.visible = false;
  }

  update(dt: number, reduced: boolean) {
    this.time += dt;
    this.stateAge += dt;
    const motion = reduced ? 0.25 : 1;
    this.ripples.forEach((ripple, index) => {
      if (!ripple.visible) return;
      const wave = reduced
        ? 0.5
        : (Math.sin(this.time * 4.2 - index * 1.35) + 1) / 2;
      ripple.scale.setScalar(0.92 + wave * (0.28 + index * 0.08));
      (ripple.material as THREE.MeshBasicMaterial).opacity =
        0.9 - index * 0.16 - wave * 0.22;
    });
    if (this.lure.visible)
      this.lure.position.y = 0.13 + Math.sin(this.time * 4.6) * 0.035 * motion;
    if (this.splash.visible) {
      this.splash.children.forEach((drop, index) => {
        drop.position.y =
          0.06 + Math.abs(Math.sin(this.time * 3.8 + index)) * 0.16 * motion;
        if (drop instanceof THREE.Mesh)
          (drop.material as THREE.MeshBasicMaterial).opacity = reduced
            ? 0.55
            : 0.8;
      });
    }
    if (this.rod.visible)
      this.rod.rotation.z = Math.sin(this.time * 2.4) * 0.05 * motion;
    if (this.shovel.visible) {
      const progress = Math.min(1, this.stateAge / 0.82);
      const stroke = (1 - Math.cos(progress * Math.PI * 4)) / 2;
      this.shovel.rotation.x = -0.22 - stroke * 0.72 * motion;
      this.shovel.rotation.z = -0.08 + stroke * 0.12 * motion;
      this.shovel.position.y = 0.82 - stroke * 0.12 * motion;
    }
    if (this.line.visible && this.target) {
      const tip = this.avatar.root.localToWorld(
        new THREE.Vector3(0.32, 1.42, 0.28),
      );
      const positions = this.line.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      positions.setXYZ(0, tip.x, tip.y, tip.z);
      positions.setXYZ(1, this.target.x, 0.1, this.target.z);
      positions.needsUpdate = true;
    }
  }

  dispose() {
    this.avatar.setActivityPose(null);
    this.rod.removeFromParent();
    this.shovel.removeFromParent();
    this.root.removeFromParent();
    // Imported town models share TownAssets resources, so detach before the
    // procedural release below. TownArt remains their sole resource owner.
    this.importedDigMound?.removeFromParent();
    this.importedDigMound = null;
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
    this.line.removeFromParent();
    RoomArt.release(this.rod);
    RoomArt.release(this.shovel);
    RoomArt.release(this.root);
  }
}
