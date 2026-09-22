const cardArtUrl = new URL("./assets/cartoon-funhouse.png", import.meta.url).href;

export const KEYFALL_REWARD_ID = "keyfall:velvet-key-plaque" as const;

export const keyfallManifest = {
  id: "keyfall",
  book: "The Mystery of Locked Rooms",
  title: "Keyfall",
  heading: "Cut the cord. Find the passage.",
  description:
    "Guide a brass key through a velvet funhouse with gentle physics and no penalty for trying again.",
  cardArtUrl,
  cardArtAlt: "A cartoon brass key suspended in a teal and raspberry funhouse",
  rewards: [
    {
      rewardId: KEYFALL_REWARD_ID,
      catalogId: "keyfall-velvet-key-plaque",
    },
  ],
} as const;
