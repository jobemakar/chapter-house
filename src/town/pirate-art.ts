import * as THREE from "three";
import { PirateAssets, type PirateAssetKey } from "./pirate-assets";
import {
  PIRATE_AREA_SCALE,
  PIRATE_COAST,
  PIRATE_ISLAND,
  pirateExpandedPoint,
} from "./pirate-layout";

export function pirateShipPose(
  elapsed: number,
  index: number,
  reduced: boolean,
) {
  if (reduced) return { y: 0.1, roll: 0, pitch: 0 };
  return {
    y: 0.1 + Math.sin(elapsed * 0.85 + index * 1.7) * 0.075,
    roll: Math.sin(elapsed * 0.72 + index) * 0.018,
    pitch: Math.cos(elapsed * 0.57 + index) * 0.012,
  };
}

/** Decorative, non-game Pirate Island built from locally packaged Kenney models. */
export class PirateArt {
  readonly root = new THREE.Group();
  private readonly assets = new PirateAssets();
  private readonly imported = new THREE.Group();
  private readonly ships: THREE.Group[] = [];
  private elapsed = 0;
  private ready = false;
  constructor() {
    this.root.name = "Pirate Island";
    this.sea();
    this.shore();
    this.root.add(this.imported);
  }
  async load() {
    await this.assets.load();
    if (this.ready) return;
    this.ready = true;
    this.groundPatches();
    this.dock();
    this.landmarks();
    this.greenery();
    this.props();
    this.shipsAtSea();
  }
  status() {
    return this.ready ? "ready" : "loading";
  }
  update(dt: number, reduced: boolean) {
    this.elapsed += Math.min(Math.max(dt, 0), 0.1);
    this.ships.forEach((ship, index) => {
      const pose = pirateShipPose(this.elapsed, index, reduced);
      ship.position.y = pose.y;
      ship.rotation.z = pose.roll;
      ship.rotation.x = pose.pitch;
    });
  }
  dispose() {
    this.imported.removeFromParent();
    this.assets.dispose();
  }
  private mesh(
    geometry: THREE.BufferGeometry,
    color: THREE.ColorRepresentation,
    x: number,
    y: number,
    z: number,
  ) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.root.add(mesh);
    return mesh;
  }
  private shape(
    points: readonly { x: number; z: number }[],
    color: THREE.ColorRepresentation,
    y: number,
  ) {
    const outline = new THREE.Shape();
    points.forEach((point, index) =>
      index
        ? outline.lineTo(point.x, -point.z)
        : outline.moveTo(point.x, -point.z),
    );
    outline.closePath();
    const mesh = this.mesh(new THREE.ShapeGeometry(outline), color, 0, y, 0);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }
  private sea() {
    const sea = this.mesh(
      new THREE.PlaneGeometry(62, 52),
      0x4da6bd,
      PIRATE_ISLAND.center.x,
      -0.08,
      PIRATE_ISLAND.center.z,
    );
    sea.rotation.x = -Math.PI / 2;
    [
      [2, 3],
      [7, 23],
      [28, 3],
      [33, 17],
      [0, 13],
      [24, 24],
    ].forEach(([x, z], index) => {
      const point = pirateExpandedPoint(x, z);
      const inner = 0.8 + (index % 2) * 0.35;
      const ring = this.mesh(
        new THREE.RingGeometry(inner, inner + 0.1, 28, 1, 0.3, Math.PI * 1.35),
        0x91d8dc,
        point.x,
        -0.065,
        point.z,
      );
      ring.rotation.x = -Math.PI / 2;
      ring.rotation.z = index * 0.8;
    });
  }
  private shore() {
    const center = PIRATE_ISLAND.center;
    const shallows = PIRATE_COAST.map((point) => ({
      x: center.x + (point.x - center.x) * 1.075,
      z: center.z + (point.z - center.z) * 1.075,
    }));
    this.shape(shallows, 0x78c9c1, -0.055);
    this.shape(PIRATE_COAST, 0xf0c66f, -0.03);
  }
  private placeGround(
    key: PirateAssetKey,
    x: number,
    z: number,
    width: number,
    depth: number,
    turn: number,
    y: number,
    alignTop = false,
  ) {
    const point = pirateExpandedPoint(x, z);
    const model = this.assets.createFootprint(
      key,
      width * PIRATE_AREA_SCALE,
      depth * PIRATE_AREA_SCALE,
      alignTop,
    );
    model.position.set(point.x, y, point.z);
    model.rotation.y = turn;
    this.imported.add(model);
  }
  private groundPatches() {
    this.placeGround("patch-sand", 15.5, 12.5, 12.5, 8.5, -0.12, 0.012, true);
    this.placeGround("patch-sand-foliage", 7.5, 13.8, 5.8, 4.2, 0.35, -0.018);
    this.placeGround("patch-grass", 16.2, 10.8, 10.5, 7.5, -0.18, 0.014, true);
    this.placeGround("patch-grass-foliage", 9.2, 15.3, 5.8, 4.2, 0.25, -0.01);
  }
  private place(
    key: PirateAssetKey,
    x: number,
    z: number,
    height: number,
    turn = 0,
    y = 0,
  ) {
    const point = pirateExpandedPoint(x, z);
    const model = this.assets.create(key, height);
    model.position.set(point.x, y, point.z);
    model.rotation.y = turn;
    this.imported.add(model);
    return model;
  }
  private dock() {
    this.place("structure-platform-dock", 15, 21, 1.1, Math.PI);
    this.place("structure-platform-dock-small", 15, 19.3, 0.95, Math.PI);
    this.place("mast-ropes", 15, 16, 3.5, Math.PI);
    for (const x of [13.1, 16.9])
      this.place("platform-planks", x, 18, 0.42, Math.PI / 2);
  }
  private landmarks() {
    this.place("tower-complete-large", 8.3, 8.4, 5.2, -0.2);
    this.place("flag-pirate-high", 8.3, 8.4, 6, -0.2);
    this.place("castle-gate", 8.5, 15.5, 3.2, Math.PI / 2);
    this.place("castle-wall", 6.5, 15.2, 2.7, Math.PI / 2);
    this.place("castle-wall", 10.6, 15.7, 2.7, Math.PI / 2);
    this.place("structure", 17, 6, 2.8, 0.15);
    this.place("tower-watch", 21.2, 10.5, 3.05, 0.1);
    this.place("flag-pirate", 21.2, 10.5, 3.5, 0.1);
    this.place("tower-complete-small", 22.5, 16, 3.7, 0.2);
  }
  private greenery() {
    [
      [5.5, 7],
      [11.7, 4.7],
      [24.2, 7.8],
      [19.8, 18.7],
      [5.8, 17.5],
    ].forEach(([x, z], index) =>
      this.place(
        index % 2 ? "palm-bend" : "palm-detailed-straight",
        x,
        z,
        index % 2 ? 3.5 : 4.1,
        index * 0.75,
      ),
    );
    [
      [4.7, 10.2],
      [11.5, 18.8],
      [20.5, 3.9],
      [25, 13.5],
      [6.8, 5.2],
    ].forEach(([x, z], index) =>
      this.place(
        index % 2 ? "rocks-sand-b" : "rocks-sand-a",
        x,
        z,
        1 + index * 0.07,
        index,
      ),
    );
    this.place("rocks-sand-c", 23.7, 19.1, 1.1, 2.2);
    [
      [11, 10.2],
      [18.7, 11.8],
      [14, 6.7],
      [18, 16.2],
      [8.5, 13],
    ].forEach(([x, z], index) =>
      this.place(index % 2 ? "grass-plant" : "grass-patch", x, z, 0.45),
    );
  }
  private props() {
    this.place("chest", 13.2, 11.8, 0.82, -0.45);
    this.place("barrel", 12.3, 12.4, 0.66);
    this.place("crate-bottles", 14.2, 12.5, 0.7, 0.3);
    this.place("cannon-mobile", 5.7, 12.8, 1.2, 0.7);
    this.place("cannon-mobile", 23.6, 7.2, 1.2, -0.65);
    this.place("ship-wreck", 5.2, 5.1, 2.8, -0.2);
    this.place("boat-row-small", 27.5, 17.5, 0.75, 0.4, 0.02);
  }
  private shipsAtSea() {
    PIRATE_ISLAND.ships.forEach((definition, index) => {
      const ship = this.assets.create(
        index ? "ship-pirate-medium" : "ship-pirate-large",
        (index ? 5 : 6.5) * definition.scale,
      );
      ship.position.set(definition.x, 0.1, definition.z);
      ship.rotation.y = definition.turn;
      this.imported.add(ship);
      this.ships.push(ship);
    });
  }
}
