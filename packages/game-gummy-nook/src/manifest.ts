import { GUMMY_NOOK_REWARD_IDS } from "./progress";

const cardArtUrl = new URL("./card-art.svg", import.meta.url).href;

/** Runtime-free discovery metadata; root catalog mapping is intentionally deferred. */
export const gummyNookManifest = {
  id: "gummy-nook",
  legacyGameId: "gummy-galaxy",
  book: "Not If I Can Help It",
  title: "Gummy Nook",
  heading: "Make a little lovely match.",
  description: "Swap neighboring gummies, make lines of three, and let cozy candy cascades fill your nook.",
  cardArtUrl,
  cardArtAlt: "Colorful gummy candies on a mint match-three board",
  rewards: [
    { rewardId: GUMMY_NOOK_REWARD_IDS.candyJar, legacyId: "gn-candy-jar", catalogId: null, name: "Candy jar", display: { surface: "wall", kind: "shelf-plaque", width: 0.28, height: 0.22 }, rationale: "Wall-shelf display for the original candy container." },
    { rewardId: GUMMY_NOOK_REWARD_IDS.gummyLamp, legacyId: "gn-gummy-lamp", catalogId: null, name: "Gummy lamp", display: { surface: "wall", kind: "sconce-shelf", width: 0.3, height: 0.42 }, rationale: "Wall-shelf display for the original candy-glass light." },
    { rewardId: GUMMY_NOOK_REWARD_IDS.sockCushion, legacyId: "gn-sock-cushion", catalogId: null, name: "Soft sock cushion", display: { surface: "floor", kind: "floor-object", width: 0.55, depth: 0.4 }, rationale: "Original soft-texture floor comfort object; no medical claim." },
    { rewardId: GUMMY_NOOK_REWARD_IDS.bearBeanbag, legacyId: "gn-bear-beanbag", catalogId: null, name: "Gummy-bear beanbag", display: { surface: "floor", kind: "floor-object", width: 0.8, depth: 0.75 }, rationale: "Original gummy-bear-cover-inspired floor seat." },
  ],
} as const;
