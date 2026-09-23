export type { BureauAfterDarkProgress, BureauRewardLegacyId } from "./progress";
export { BUREAU_REWARD_REQUEST_IDS, loadBureauAfterDarkProgress, requestIdForLegacyReward } from "./progress";
export { bureauAfterDarkManifest } from "./manifest";
export const bureauAfterDarkCardArt = new URL(
  "./assets/night-garden.webp",
  import.meta.url,
).href;
/** Lazy entry avoids loading the canvas runtime and package CSS before launch. */
export async function loadBureauAfterDark() {
  return import("./game");
}
