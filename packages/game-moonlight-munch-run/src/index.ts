export type { MoonlightMunchRunProgress, MoonlightLegacyRewardId, MoonlightRewardId } from "./progress";
export { loadMoonlightMunchRunProgress, MOONLIGHT_LEGACY_REWARD_MAP, MOONLIGHT_REWARD_REQUEST_IDS } from "./progress";
export { moonlightMunchRunManifest } from "./manifest";
export const moonlightMunchRunCardArt = new URL("./assets/comic-road.png", import.meta.url).href;

/** Lazy entry prevents the canvas, audio, and art assets from entering the shell startup chunk. */
export async function loadMoonlightMunchRun() {
  await import("./style.css");
  return import("./game");
}

/** Integrated host entry: Chapter House supplies profile, rewards, and navigation. */
export async function createMoonlightMunchRunGame(
  target: HTMLElement,
  services: import("@chapter-house/game-host").GameHostServices<import("./progress").MoonlightMunchRunProgress>,
) {
  const { MoonlightMunchRunGame } = await loadMoonlightMunchRun();
  return new MoonlightMunchRunGame(target, services);
}
