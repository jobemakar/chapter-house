import { WISHBONE_REWARD_REQUEST_IDS } from "./progress";

const cardArtUrl = new URL("./assets/backdrop.png", import.meta.url).href;

const reward = (legacyId: keyof typeof WISHBONE_REWARD_REQUEST_IDS) => ({
  rewardId: WISHBONE_REWARD_REQUEST_IDS[legacyId],
  legacyId,
  catalogId: `wish-${legacyId}`,
});

/** Menu/reward metadata that does not import CSS, Matter, audio, or the game. */
export const wishboneFlingManifest = {
  id: "wishbone-fling",
  book: "Wish",
  title: "Wishbone Fling",
  heading: "Big tumbles. Happy little dog.",
  description: "Pull back, let go, and see what wobbles.",
  cardArtUrl,
  cardArtAlt: "A sunny backyard full of playful Wishbone contraptions",
  rewards: [
    reward("sock"),
    reward("squeaker"),
    reward("bandana"),
    reward("basket"),
    reward("bed"),
    reward("table"),
    reward("power-bounce"),
    reward("power-magnet"),
    reward("power-wind"),
  ],
} as const;
