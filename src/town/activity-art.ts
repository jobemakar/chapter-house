import * as THREE from "three";
import { AnimalRig, RoomArt } from "../room/art";
import type { Point } from "../core/profile";
import type { ActivityAction, TownActivityState } from "./activities";

/** Procedural, disposable props for the lightweight town activities. */
export class TownActivityArt {
  private root = new THREE.Group();
  private rod = new THREE.Group();
  private shovel = new THREE.Group();
  private ripple: THREE.Mesh;
  private dirt: THREE.Mesh;
  private line: THREE.Line;
  private time = 0;
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

    this.ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 32),
      new THREE.MeshBasicMaterial({
        color: 0xd9fbff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.ripple.rotation.x = -Math.PI / 2;
    this.dirt = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 18, 10),
      new THREE.MeshStandardMaterial({ color: 0x8b6845, roughness: 1 }),
    );
    this.dirt.scale.set(1, 0.14, 0.68);
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
    this.root.add(this.ripple, this.dirt, this.line);
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
    this.shovel.position.set(0.02, 0.72, 0.26);
  }

  setState(
    state: TownActivityState,
    avatarPoint: Point,
    target: Point | null,
    action: ActivityAction | null,
  ) {
    this.state = state;
    this.target = target;
    if (action) this.lastAction = action;
    const fishing = ["casting", "waiting", "reelReady", "reeling"].includes(
      state,
    );
    const digging =
      state === "digging" || (state === "result" && this.lastAction === "dig");
    this.rod.visible = fishing;
    this.shovel.visible = digging;
    this.line.visible = fishing && !!target;
    this.ripple.visible =
      ["waiting", "reelReady", "reeling"].includes(state) && !!target;
    this.dirt.visible = digging;
    this.dirt.position.set(avatarPoint.x, 0.03, avatarPoint.z + 0.55);
    if (target) this.ripple.position.set(target.x, 0.08, target.z);
    this.avatar.setActivityPose(fishing ? "rod" : digging ? "shovel" : null);
  }

  private hide() {
    this.rod.visible = false;
    this.shovel.visible = false;
    this.ripple.visible = false;
    this.dirt.visible = false;
    this.line.visible = false;
  }

  update(dt: number, reduced: boolean) {
    this.time += dt;
    const motion = reduced ? 0.25 : 1;
    if (this.ripple.visible) {
      const pulse = 1 + Math.sin(this.time * 5) * 0.2 * motion;
      this.ripple.scale.setScalar(pulse);
      (this.ripple.material as THREE.MeshBasicMaterial).opacity =
        0.55 + Math.sin(this.time * 5) * 0.18 * motion;
    }
    if (this.dirt.visible)
      this.dirt.rotation.y +=
        dt * (this.state === "digging" ? 1.4 : 0.2) * motion;
    if (this.rod.visible)
      this.rod.rotation.z = Math.sin(this.time * 2.4) * 0.05 * motion;
    if (this.shovel.visible)
      this.shovel.rotation.x = Math.sin(this.time * 5) * 0.12 * motion;
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
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
    this.line.removeFromParent();
    RoomArt.release(this.rod);
    RoomArt.release(this.shovel);
    RoomArt.release(this.root);
  }
}
