import type { GameHostServices, GameSession } from "@chapter-house/game-host";
import {
  loadWishboneProgress,
  WISHBONE_REWARD_REQUEST_IDS,
  type WishboneProgress,
} from "@chapter-house/game-wishbone-fling/progress";
import { wishboneFlingManifest } from "@chapter-house/game-wishbone-fling/manifest";
import {
  DIG_AND_DOUSE_REWARD_ID,
  loadDigAndDouseProgress,
  type DigAndDouseProgress,
} from "@chapter-house/game-dig-and-douse/progress";
import { digAndDouseManifest } from "@chapter-house/game-dig-and-douse/manifest";
import {
  loadKeyfallProgress,
  type KeyfallProgress,
} from "@chapter-house/game-keyfall/progress";
import {
  keyfallManifest,
  KEYFALL_REWARD_ID,
} from "@chapter-house/game-keyfall/manifest";
import {
  ARCTIC_DUET_REWARDS,
  loadArcticDuetProgress,
  type ArcticDuetProgress,
} from "@chapter-house/game-arctic-duet/progress";
import { arcticDuetManifest } from "@chapter-house/game-arctic-duet/manifest";
import {
  GUMMY_NOOK_REWARD_IDS,
  loadGummyNookProgress,
  type GummyNookProgress,
} from "@chapter-house/game-gummy-nook/progress";
import { gummyNookManifest } from "@chapter-house/game-gummy-nook/manifest";
import {
  CONTRAPTION_REWARD_IDS,
  loadContraptionProgress,
  type ContraptionProgress,
} from "@chapter-house/game-contraption/progress";
import { contraptionManifest } from "@chapter-house/game-contraption/manifest";
import {
  BUREAU_REWARD_REQUEST_IDS,
  loadBureauAfterDarkProgress,
  type BureauAfterDarkProgress,
} from "@chapter-house/game-bureau-after-dark/progress";
import { bureauAfterDarkManifest } from "@chapter-house/game-bureau-after-dark/manifest";
import {
  STORMGLIDE_REWARDS,
  loadStormglideProgress,
  type StormglideProgress,
} from "@chapter-house/game-stormglide/progress";
import { stormglideManifest } from "@chapter-house/game-stormglide/manifest";
import {
  MOONLIGHT_REWARD_REQUEST_IDS,
  loadMoonlightMunchRunProgress,
  type MoonlightMunchRunProgress,
} from "@chapter-house/game-moonlight-munch-run/progress";
import { moonlightMunchRunManifest } from "@chapter-house/game-moonlight-munch-run/manifest";
import {
  loadVedaProgress,
  VEDA_REWARD_IDS,
  type VedaProgress,
} from "@chapter-house/game-vedas-great-escape/progress";
import { vedasGreatEscapeManifest } from "@chapter-house/game-vedas-great-escape/manifest";

export type IntegratedGameId =
  | "wishbone-fling"
  | "dig-and-douse"
  | "keyfall"
  | "arctic-duet"
  | "gummy-nook"
  | "contraption"
  | "bureau-after-dark"
  | "stormglide"
  | "moonlight-munch-run"
  | "vedas-great-escape";

export interface IntegratedRewardDefinition {
  rewardId: string;
  catalogId: string;
  /** Retains historical Chapter House instance IDs without duplicating items. */
  legacyInstanceId?: string;
}

export interface IntegratedGameDefinition {
  id: IntegratedGameId;
  book: string;
  title: string;
  heading: string;
  description: string;
  cardArtUrl: string;
  cardArtAlt: string;
  rewards: readonly IntegratedRewardDefinition[];
}

export interface RuntimeHostServices {
  readonly progress: unknown;
  readonly muted: boolean;
  readonly reducedMotion: boolean;
  readonly activePlaySeconds: number;
  exit(): void;
  notify(message: string): void;
  saveProgress(progress: unknown): void;
  creditActivePlay(totalSeconds: number): number;
  awardReward(rewardId: string): boolean;
}
export type GameFactory = (
  target: HTMLElement,
  services: RuntimeHostServices,
) => GameSession;

export interface IntegratedGameAdapter {
  definition: IntegratedGameDefinition;
  normalize(raw: unknown): unknown;
  summarize(raw: unknown): string;
  ownedRewardIds(raw: unknown): readonly string[];
  addReward(raw: unknown, rewardId: string): unknown | null;
  load(): Promise<GameFactory>;
}

function servicesFor<P>(
  services: RuntimeHostServices,
  normalize: (raw: unknown) => P,
): GameHostServices<P> {
  return {
    ...services,
    progress: normalize(services.progress),
    saveProgress: (progress) => services.saveProgress(progress),
  };
}

const wishboneRewardByRequest = new Map(
  Object.entries(WISHBONE_REWARD_REQUEST_IDS).map(([legacyId, rewardId]) => [
    rewardId as string,
    legacyId,
  ]),
);
const wishboneRewards: readonly IntegratedRewardDefinition[] =
  wishboneFlingManifest.rewards.map((reward) => ({
    rewardId: reward.rewardId,
    catalogId: reward.catalogId,
    legacyInstanceId: `reward-${reward.legacyId}`,
  }));

const wishbone: IntegratedGameAdapter = {
  definition: {
    ...wishboneFlingManifest,
    rewards: wishboneRewards,
  },
  normalize: loadWishboneProgress,
  summarize(raw) {
    const progress = loadWishboneProgress(raw);
    return `${Math.min(14, progress.throws)} / 14 throws toward your Patchwork dog bed.`;
  },
  ownedRewardIds(raw) {
    const progress = loadWishboneProgress(raw);
    return progress.owned
      .map(
        (legacyId) =>
          WISHBONE_REWARD_REQUEST_IDS[
            legacyId as keyof typeof WISHBONE_REWARD_REQUEST_IDS
          ],
      )
      .filter((id): id is NonNullable<typeof id> => typeof id === "string");
  },
  addReward(raw, rewardId) {
    const legacyId = wishboneRewardByRequest.get(rewardId);
    if (!legacyId) return null;
    const progress = loadWishboneProgress(raw);
    if (progress.owned.includes(legacyId)) return null;
    return { ...progress, owned: [...progress.owned, legacyId] };
  },
  async load() {
    const { loadWishboneFling } = await import(
      "@chapter-house/game-wishbone-fling"
    );
    const { WishboneGame } = await loadWishboneFling(
      new URL(`${import.meta.env.BASE_URL}game-data/wishbone-fling/levels/`, window.location.href),
    );
    return (target, services) =>
      new WishboneGame(
        target,
        servicesFor<WishboneProgress>(services, loadWishboneProgress),
      );
  },
};

const douse: IntegratedGameAdapter = {
  definition: {
    ...digAndDouseManifest,
    rewards: digAndDouseManifest.rewards.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: reward.catalogId,
    })),
  },
  normalize: loadDigAndDouseProgress,
  summarize(raw) {
    const progress = loadDigAndDouseProgress(raw);
    return progress.firesExtinguished
      ? `${progress.firesExtinguished} fire${progress.firesExtinguished === 1 ? "" : "s"} out · best ${progress.bestCanteens} canteens.`
      : "Put out your first fire to bring home a Camp Lantern.";
  },
  ownedRewardIds(raw) {
    return loadDigAndDouseProgress(raw).ownedRewardIds;
  },
  addReward(raw, rewardId) {
    if (rewardId !== DIG_AND_DOUSE_REWARD_ID) return null;
    const progress = loadDigAndDouseProgress(raw);
    if (progress.ownedRewardIds.includes(rewardId)) return null;
    return {
      ...progress,
      ownedRewardIds: [...progress.ownedRewardIds, rewardId],
    };
  },
  async load() {
    const { DigAndDouseGame } = await import(
      "@chapter-house/game-dig-and-douse"
    );
    return (target, services) =>
      new DigAndDouseGame(
        target,
        servicesFor<DigAndDouseProgress>(services, loadDigAndDouseProgress),
      );
  },
};

const keyfall: IntegratedGameAdapter = {
  definition: {
    ...keyfallManifest,
    rewards: keyfallManifest.rewards.map((reward) => ({ ...reward })),
  },
  normalize: loadKeyfallProgress,
  summarize(raw) {
    const progress = loadKeyfallProgress(raw);
    const tickets = progress.bestTickets["campaign-06-soft-rebound"] ?? 0;
    return progress.completed.includes("campaign-06-soft-rebound")
      ? `Soft Rebound complete · best ${tickets} / 3 clue tickets.`
      : "Guide the brass key through Soft Rebound to bring home a Velvet Key Plaque.";
  },
  ownedRewardIds(raw) {
    return loadKeyfallProgress(raw).completed.includes("campaign-06-soft-rebound")
      ? [KEYFALL_REWARD_ID]
      : [];
  },
  addReward(raw, rewardId) {
    if (rewardId !== KEYFALL_REWARD_ID) return null;
    const progress = loadKeyfallProgress(raw);
    if (progress.completed.includes("campaign-06-soft-rebound")) return null;
    return {
      ...progress,
      completed: [...progress.completed, "campaign-06-soft-rebound"],
    };
  },
  async load() {
    const { KeyfallGame, loadLevelFiles, CampaignCatalog, RoomValidator, GAME_VIEWPORT } = await import("@chapter-house/game-keyfall");
    const loaded = await loadLevelFiles(
      new URL(`${import.meta.env.BASE_URL}game-data/keyfall/levels/`, window.location.href),
    );
    if (!loaded.rooms.length) throw new Error("Keyfall has no playable level files.");
    const catalog = new CampaignCatalog(loaded.rooms, new RoomValidator(GAME_VIEWPORT), false);
    return (target, services) => new KeyfallGame(
      target,
      servicesFor<KeyfallProgress>(services, loadKeyfallProgress),
      catalog,
      { showStandaloneControls: false },
    );
  },
};

const arcticRewardByRequest = new Map(
  ARCTIC_DUET_REWARDS.map((reward) => [
    reward.rewardId as string,
    reward.legacyId,
  ]),
);
const arctic: IntegratedGameAdapter = {
  definition: {
    id: "arctic-duet",
    book: arcticDuetManifest.bookTitle,
    title: arcticDuetManifest.title,
    heading: arcticDuetManifest.subtitle,
    description: arcticDuetManifest.description,
    cardArtUrl: arcticDuetManifest.cardArtUrl,
    cardArtAlt: "Duane and Major Puff sharing an Arctic musical duet",
    rewards: ARCTIC_DUET_REWARDS.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: `arctic-${reward.legacyId}`,
    })),
  },
  normalize: loadArcticDuetProgress,
  summarize(raw) {
    const progress = loadArcticDuetProgress(raw);
    return progress.total
      ? `${progress.total} catches · best level ${progress.bestLevel}.`
      : "Catch twelve treats together to earn the first Arctic keepsake.";
  },
  ownedRewardIds(raw) {
    const progress = loadArcticDuetProgress(raw);
    return progress.keepsakes
      .map(
        (legacyId) =>
          ARCTIC_DUET_REWARDS.find((reward) => reward.legacyId === legacyId)
            ?.rewardId,
      )
      .filter((id): id is NonNullable<typeof id> => typeof id === "string");
  },
  addReward(raw, rewardId) {
    const legacyId = arcticRewardByRequest.get(rewardId);
    if (!legacyId) return null;
    const progress = loadArcticDuetProgress(raw);
    if (progress.keepsakes.includes(legacyId)) return null;
    return { ...progress, keepsakes: [...progress.keepsakes, legacyId] };
  },
  async load() {
    const { ArcticDuetGame } = await import(
      "@chapter-house/game-arctic-duet"
    );
    return (target, services) =>
      new ArcticDuetGame(
        target,
        servicesFor<ArcticDuetProgress>(services, loadArcticDuetProgress),
      );
  },
};

const gummyRewardByRequest = new Map(
  gummyNookManifest.rewards.map((reward) => [
    reward.rewardId as string,
    reward.legacyId,
  ]),
);
const gummy: IntegratedGameAdapter = {
  definition: {
    id: "gummy-nook",
    book: gummyNookManifest.book,
    title: gummyNookManifest.title,
    heading: gummyNookManifest.heading,
    description: gummyNookManifest.description,
    cardArtUrl: gummyNookManifest.cardArtUrl,
    cardArtAlt: gummyNookManifest.cardArtAlt,
    rewards: gummyNookManifest.rewards.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: reward.legacyId,
    })),
  },
  normalize: loadGummyNookProgress,
  summarize(raw) {
    const progress = loadGummyNookProgress(raw);
    return progress.moves
      ? `${progress.cleared} gummies cleared in ${progress.moves} moves · best cascade ${progress.bestCascade}.`
      : "Make your first match to begin filling the nook.";
  },
  ownedRewardIds(raw) {
    const progress = loadGummyNookProgress(raw);
    return progress.owned
      .map((legacyId) =>
        gummyNookManifest.rewards.find((reward) => reward.legacyId === legacyId)
          ?.rewardId,
      )
      .filter((id): id is NonNullable<typeof id> => typeof id === "string");
  },
  addReward(raw, rewardId) {
    if (!(Object.values(GUMMY_NOOK_REWARD_IDS) as readonly string[]).includes(rewardId))
      return null;
    const legacyId = gummyRewardByRequest.get(rewardId);
    if (!legacyId) return null;
    const progress = loadGummyNookProgress(raw);
    if (progress.owned.includes(legacyId)) return null;
    return { ...progress, owned: [...progress.owned, legacyId] };
  },
  async load() {
    const { createGummyNookGame } = await import(
      "@chapter-house/game-gummy-nook"
    );
    return (target, services) =>
      createGummyNookGame(
        target,
        servicesFor<GummyNookProgress>(services, loadGummyNookProgress),
      );
  },
};

const contraption: IntegratedGameAdapter = {
  definition: {
    ...contraptionManifest,
    rewards: contraptionManifest.rewards.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: reward.catalogId,
    })),
  },
  normalize: loadContraptionProgress,
  summarize(raw) {
    const progress = loadContraptionProgress(raw);
    return progress.delivered
      ? `${progress.delivered} deliveries · ${progress.clearedIds.length} machines cleared.`
      : "Deliver five kernels to earn a spring ornament.";
  },
  ownedRewardIds(raw) {
    return loadContraptionProgress(raw).ownedRewardIds;
  },
  addReward(raw, rewardId) {
    if (!(CONTRAPTION_REWARD_IDS as readonly string[]).includes(rewardId))
      return null;
    const progress = loadContraptionProgress(raw);
    if (progress.ownedRewardIds.includes(rewardId)) return null;
    return {
      ...progress,
      ownedRewardIds: [...progress.ownedRewardIds, rewardId],
    };
  },
  async load() {
    const { createContraptionSession, loadLevelCatalog } = await import(
      "@chapter-house/game-contraption"
    );
    const catalog = await loadLevelCatalog(new URL("./contraption-levels/", document.baseURI));
    return (target, services) =>
      createContraptionSession(
        target,
        servicesFor<ContraptionProgress>(services, loadContraptionProgress),
        catalog,
      );
  },
};

const bureau: IntegratedGameAdapter = {
  definition: {
    ...bureauAfterDarkManifest,
    rewards: bureauAfterDarkManifest.rewards.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: reward.catalogId,
    })),
  },
  normalize: loadBureauAfterDarkProgress,
  summarize(raw) {
    const progress = loadBureauAfterDarkProgress(raw);
    const sigils = progress.found["0"].length + progress.found["1"].length;
    return sigils
      ? `${sigils} / 6 sigils found · ${progress.rewards.length} / 2 archives restored.`
      : "Find three hidden sigils to restore the first archive.";
  },
  ownedRewardIds(raw) {
    return loadBureauAfterDarkProgress(raw).ownedRewardIds;
  },
  addReward(raw, rewardId) {
    if (!(Object.values(BUREAU_REWARD_REQUEST_IDS) as readonly string[]).includes(rewardId))
      return null;
    const progress = loadBureauAfterDarkProgress(raw);
    if (progress.ownedRewardIds.includes(rewardId)) return null;
    return {
      ...progress,
      ownedRewardIds: [...progress.ownedRewardIds, rewardId],
    };
  },
  async load() {
    const { loadBureauAfterDark } = await import(
      "@chapter-house/game-bureau-after-dark"
    );
    const { BureauAfterDarkGame } = await loadBureauAfterDark();
    return (target, services) =>
      new BureauAfterDarkGame(
        target,
        servicesFor<BureauAfterDarkProgress>(
          services,
          loadBureauAfterDarkProgress,
        ),
      );
  },
};

const stormglide: IntegratedGameAdapter = {
  definition: {
    id: "stormglide",
    book: stormglideManifest.book,
    title: stormglideManifest.title,
    heading: stormglideManifest.heading,
    description: stormglideManifest.description,
    cardArtUrl: stormglideManifest.cardArtUrl,
    cardArtAlt: stormglideManifest.cardArtAlt,
    rewards: STORMGLIDE_REWARDS.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: `storm-${reward.legacyId}`,
    })),
  },
  normalize: loadStormglideProgress,
  summarize(raw) {
    const progress = loadStormglideProgress(raw);
    return progress.total
      ? `${progress.total} sparks · ${progress.found.length} / 12 pups found.`
      : "Catch sparks and find your first rescue pup.";
  },
  ownedRewardIds(raw) {
    return loadStormglideProgress(raw).ownedRewardIds;
  },
  addReward(raw, rewardId) {
    if (!STORMGLIDE_REWARDS.some((reward) => reward.rewardId === rewardId))
      return null;
    const progress = loadStormglideProgress(raw);
    if (progress.ownedRewardIds.includes(rewardId)) return null;
    return {
      ...progress,
      ownedRewardIds: [...progress.ownedRewardIds, rewardId],
    };
  },
  async load() {
    const { createStormglideGame } = await import(
      "@chapter-house/game-stormglide"
    );
    return (target, services) =>
      createStormglideGame(
        target,
        servicesFor<StormglideProgress>(services, loadStormglideProgress),
      );
  },
};

const moonlight: IntegratedGameAdapter = {
  definition: {
    ...moonlightMunchRunManifest,
    rewards: moonlightMunchRunManifest.rewards.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: reward.catalogId,
    })),
  },
  normalize: loadMoonlightMunchRunProgress,
  summarize(raw) {
    const progress = loadMoonlightMunchRunProgress(raw);
    return progress.fed
      ? `${progress.fed} guests fed · stage ${progress.stage}, wave ${progress.wave}.`
      : "Feed ten moonlit guests to earn a lantern token.";
  },
  ownedRewardIds(raw) {
    return loadMoonlightMunchRunProgress(raw).ownedRewardIds;
  },
  addReward(raw, rewardId) {
    if (!(Object.values(MOONLIGHT_REWARD_REQUEST_IDS) as readonly string[]).includes(rewardId))
      return null;
    const progress = loadMoonlightMunchRunProgress(raw);
    if (progress.ownedRewardIds.includes(rewardId as never)) return null;
    return {
      ...progress,
      ownedRewardIds: [...progress.ownedRewardIds, rewardId],
    };
  },
  async load() {
    const { loadMoonlightMunchRun } = await import(
      "@chapter-house/game-moonlight-munch-run"
    );
    const { MoonlightMunchRunGame } = await loadMoonlightMunchRun();
    return (target, services) =>
      new MoonlightMunchRunGame(
        target,
        servicesFor<MoonlightMunchRunProgress>(
          services,
          loadMoonlightMunchRunProgress,
        ),
      );
  },
};

const veda: IntegratedGameAdapter = {
  definition: {
    ...vedasGreatEscapeManifest,
    rewards: vedasGreatEscapeManifest.rewards.map((reward) => ({
      rewardId: reward.rewardId,
      catalogId: reward.catalogId,
    })),
  },
  normalize: loadVedaProgress,
  summarize(raw) {
    const progress = loadVedaProgress(raw);
    return progress.completed.length
      ? `${progress.completed.length} / 5 paths cleared · ${progress.bestPeaches.reduce((total, count) => total + count, 0)} peaches found.`
      : "Clear two paths to bring home Veda’s leafy bench.";
  },
  ownedRewardIds(raw) {
    return loadVedaProgress(raw).ownedRewardIds;
  },
  addReward(raw, rewardId) {
    if (!(VEDA_REWARD_IDS as readonly string[]).includes(rewardId)) return null;
    const progress = loadVedaProgress(raw);
    if (progress.ownedRewardIds.includes(rewardId)) return null;
    return { ...progress, ownedRewardIds: [...progress.ownedRewardIds, rewardId] };
  },
  async load() {
    const { VedasGreatEscapeGame } = await import(
      "@chapter-house/game-vedas-great-escape"
    );
    return (target, services) =>
      new VedasGreatEscapeGame(
        target,
        servicesFor<VedaProgress>(services, loadVedaProgress),
      );
  },
};

/** Stable application-owned registry; game runtimes remain lazy. */
export class IntegratedGames {
  static readonly adapters: readonly IntegratedGameAdapter[] = [
    wishbone,
    douse,
    keyfall,
    arctic,
    gummy,
    contraption,
    bureau,
    stormglide,
    moonlight,
    veda,
  ];
  static readonly entries = this.adapters.map((adapter) => adapter.definition);

  static get(id: string): IntegratedGameAdapter | undefined {
    return this.adapters.find((adapter) => adapter.definition.id === id);
  }

  static fresh(): Record<IntegratedGameId, unknown> {
    return Object.fromEntries(
      this.adapters.map((adapter) => [
        adapter.definition.id,
        adapter.normalize(null),
      ]),
    ) as Record<IntegratedGameId, unknown>;
  }
}
