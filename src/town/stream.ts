import { TOWN } from "./layout";

/** One channel definition for water geometry, bank props, fishing and collision. */
export class TownStream {
  static bounds(x: number) {
    const distance = Math.abs(x - TOWN.bridge.x);
    // Leave a flat bridge approach; ease into broad bends, rather than tile corners.
    const t = Math.max(0, Math.min(1, (distance - 3) / 6));
    const ease = t * t * (3 - 2 * t);
    const bend = Math.sin(((x - TOWN.bridge.x) * Math.PI) / 20) * 1.5 * ease;
    return { minZ: TOWN.stream.minZ + bend, maxZ: TOWN.stream.maxZ + bend };
  }

  static contains(p: { x: number; z: number }, clearance = 0) {
    const { minZ, maxZ } = this.bounds(p.x);
    return p.z > minZ - clearance && p.z < maxZ + clearance;
  }

  static bank(x: number, side: -1 | 1) {
    const b = this.bounds(x);
    return side === -1 ? b.minZ : b.maxZ;
  }
}
