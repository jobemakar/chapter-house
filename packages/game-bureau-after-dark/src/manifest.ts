import { BUREAU_REWARD_REQUEST_IDS } from "./progress";

const cardArtUrl = new URL("./assets/night-garden.webp", import.meta.url).href;

export const bureauAfterDarkManifest = {
  id: "bureau-after-dark",
  book: "Amari and the Night Brothers",
  title: "Bureau After Dark",
  heading: "Search the shelves. Unseal the archive.",
  description: "Reveal enchanted riddles, collect sigils, and restore two Bureau records.",
  cardArtUrl,
  cardArtAlt: "Moonlit silver flowers in the Night Garden case file",
  rewards: Object.entries(BUREAU_REWARD_REQUEST_IDS).map(([legacyId, rewardId]) => ({ rewardId, legacyId, catalogId: `bureau-${legacyId}` })),
} as const;
