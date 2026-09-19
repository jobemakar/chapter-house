import { STORMGLIDE_REWARDS } from "./progress";
const cardArtUrl = new URL("./assets/sky.png", import.meta.url).href;
/** Static metadata: importing it cannot mount the game or load its CSS. */
export const stormglideManifest = { id: "stormglide", book: "The Miscalculations of Lightning Girl", title: "Stormglide", heading: "Ride the sky. Find every pup.", description: "Steer a little cloud through a twilight sky, catch sparks, and dash past grumpy clouds.", cardArtUrl, cardArtAlt: "A painted twilight sky with layered clouds and a warm distant town", rewards: STORMGLIDE_REWARDS.map((reward) => ({ rewardId: reward.rewardId, legacyId: reward.legacyId, name: reward.name, display: { surface: reward.legacyId.startsWith("pup") ? "floor" : "wall", kind: reward.legacyId.startsWith("pup") ? "figurine" : "light", width: .22, depth: .18 }, rationale: "An original Stormglide collection keepsake." })) } as const;
export type StormglideManifest = typeof stormglideManifest;
