import { MOONLIGHT_LEGACY_REWARD_MAP } from "./progress";

const cardArtUrl = new URL("./assets/comic-road.png", import.meta.url).href;

/** Metadata remains usable by profile code and Node tools without the DOM game runtime. */
export const moonlightMunchRunManifest = {
  id: "moonlight-munch-run",
  book: "Mabuhay!",
  title: "Moonlight Munch Run",
  heading: "Guide the snack truck through the moonlit market.",
  description: "Steer, catch retained food upgrades, feed three waves and a boss, and avoid road hazards that jam the kitchen.",
  cardArtUrl,
  cardArtAlt: "Illustrated moonlit market road from Moonlight Munch Run",
  rewards: Object.entries(MOONLIGHT_LEGACY_REWARD_MAP).map(([legacyId, rewardId]) => ({ rewardId, legacyId, catalogId: `mabuhay-${legacyId}` })),
} as const;
