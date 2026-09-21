import { ARCTIC_DUET_REWARDS } from "./progress";

const cardArtUrl = new URL("./assets/arctic-duet-option-a-card.png", import.meta.url).href;

/** Static discovery data: safe to load for a menu card without mounting game code or CSS. */
export const arcticDuetManifest = {
  id: "arctic-duet",
  title: "Arctic Duet",
  bookTitle: "The Very, Very Far North",
  subtitle: "A two-friend musical playground",
  description: "Slide Duane and Major Puff beneath falling Arctic sweets. Misses never stop the groove.",
  cardArtUrl,
  rewards: ARCTIC_DUET_REWARDS.map((reward) => ({
    id: reward.rewardId,
    legacyId: reward.legacyId,
    name: reward.name,
    kind: reward.kind,
    threshold: reward.threshold,
    description: reward.description,
  })),
} as const;

export type ArcticDuetManifest = typeof arcticDuetManifest;
