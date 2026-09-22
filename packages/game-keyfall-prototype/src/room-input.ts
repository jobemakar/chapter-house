import { distance, swipePathCutPolyline } from "./geometry";
import { bellowsDirection, puff, removeCord, type KeyfallWorld } from "./physics";
import type { InteractionGesture } from "./interaction";
import type { RoomDefinition } from "./types";

/** Shared by normal play and editor tests; a tap can never also cut a cord. */
export function applyRoomGesture(room: RoomDefinition, world: KeyfallWorld, gesture: InteractionGesture): { cuts: number; activated: boolean } {
  let cuts = 0;
  if (gesture.kind === "slash") {
    for (const definition of room.cords) {
      const cord = world.cords.get(definition.id);
      if (!cord?.intact) continue;
      const cut = swipePathCutPolyline(gesture.path, cord.points);
      if (cut && removeCord(world, definition.id, cut.segmentIndex)) cuts += 1;
    }
    return { cuts, activated: false };
  }
  if (gesture.kind !== "tap") return { cuts: 0, activated: false };
  if (world.handleTap(gesture.point)) return { cuts: 0, activated: true };
  const bellows = room.props.find((prop) => prop.kind === "bellows" && distance(gesture.point, prop.position) < prop.radius * .9);
  if (bellows) puff(world, bellowsDirection(bellows.angle), bellows.power ?? 1);
  return { cuts: 0, activated: Boolean(bellows) };
}
