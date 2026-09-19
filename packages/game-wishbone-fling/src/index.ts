export type { WishboneProgress } from "./progress";
export { loadWishboneProgress, WISHBONE_REWARD_REQUEST_IDS, type WishboneRewardId } from "./progress";
export const wishboneFlingCardArt = new URL(
  "./assets/backdrop.png",
  import.meta.url,
).href;
/** Lazy entry keeps Matter and the DOM session out of the host startup chunk. */
export async function loadWishboneFling() {
  await import("./style.css");
  return import("./game");
}
