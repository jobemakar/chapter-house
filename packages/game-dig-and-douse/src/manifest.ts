import { DIG_AND_DOUSE_REWARD_ID } from "./progress";

const cardArtUrl = new URL("./assets/campsite-target.png", import.meta.url).href;

/** Menu metadata that does not import CSS, LiquidFun, or the game runtime. */
export const digAndDouseManifest = {
  id: "dig-and-douse",
  book: "Wildfire",
  title: "Dig & Douse",
  heading: "Carve a path. Bring the water.",
  description:
    "Clear a channel through the hillside and guide the reservoir to the fire hose.",
  cardArtUrl,
  cardArtAlt: "A campsite fire waiting for water from the forest hillside",
  rewards: [
    {
      rewardId: DIG_AND_DOUSE_REWARD_ID,
      legacyId: null,
      catalogId: "wildfire-camp-lantern",
    },
  ],
} as const;
