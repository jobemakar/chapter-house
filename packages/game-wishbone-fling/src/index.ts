export type { WishboneProgress } from "./progress";
export {
  loadWishboneProgress,
  WISHBONE_REWARD_REQUEST_IDS,
  type WishboneRewardId,
} from "./progress";
export const wishboneFlingCardArt = new URL(
  "./assets/backdrop.png",
  import.meta.url,
).href;
/** Lazy entry keeps Matter and the DOM session out of the host startup chunk. */
export async function loadWishboneFling(levelsBaseUrl?: URL) {
  await import("./style.css");
  const [game, loader] = await Promise.all([
    import("./game"),
    import("./level-loader"),
  ]);
  const catalog = await loader.loadLevelCatalog(levelsBaseUrl);
  game.configureWishboneLevels(catalog.levels, catalog.diagnostics);
  return game;
}
