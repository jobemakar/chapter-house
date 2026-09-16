/**
 * The durable identifiers and deterministic rules behind Willowbrook's small
 * discovery activities. Rendering, sound, persistence, and stream-bank
 * eligibility intentionally live outside this module.
 */
export type DiscoveryKind = "fish" | "finds";
export type DiscoveryRarity = "common" | "uncommon" | "rare";

export interface DiscoveryDefinition {
  readonly id: string;
  readonly kind: DiscoveryKind;
  readonly name: string;
  readonly rarity: DiscoveryRarity;
  /** A lightweight fallback for result callouts before card art is packaged. */
  readonly icon: string;
  /** Optional packaged collection art path, relative to the public asset root. */
  readonly image?: string;
}

export const FISH: readonly DiscoveryDefinition[] = [
  {
    id: "brook-trout",
    kind: "fish",
    name: "Brook Trout",
    rarity: "common",
    icon: "🐟",
    image: "collections/fish/fish-blue.png",
  },
  {
    id: "sunny-perch",
    kind: "fish",
    name: "Sunny Perch",
    rarity: "common",
    icon: "🐠",
    image: "collections/fish/fish-orange.png",
  },
  {
    id: "silver-minnow",
    kind: "fish",
    name: "Silver Minnow",
    rarity: "common",
    icon: "🐟",
    image: "collections/fish/fish-grey-long-a.png",
  },
  {
    id: "willow-darter",
    kind: "fish",
    name: "Willow Darter",
    rarity: "uncommon",
    icon: "🐡",
    image: "collections/fish/fish-green.png",
  },
  {
    id: "moon-koi",
    kind: "fish",
    name: "Moon Koi",
    rarity: "uncommon",
    icon: "🐠",
    image: "collections/fish/fish-pink.png",
  },
  {
    id: "mossback-sturgeon",
    kind: "fish",
    name: "Mossback Sturgeon",
    rarity: "rare",
    icon: "🐉",
    image: "collections/fish/fish-grey-long-b.png",
  },
];

export const FINDS: readonly DiscoveryDefinition[] = [
  {
    id: "little-fossil",
    kind: "finds",
    name: "Little Fossil",
    rarity: "common",
    icon: "🦴",
    image: "collections/finds/little-fossil.svg",
  },
  {
    id: "acorn-charm",
    kind: "finds",
    name: "Acorn Charm",
    rarity: "common",
    icon: "🌰",
    image: "collections/finds/acorn-charm.svg",
  },
  {
    id: "river-glass",
    kind: "finds",
    name: "River Glass",
    rarity: "common",
    icon: "💠",
    image: "collections/finds/river-glass.svg",
  },
  {
    id: "button-bone",
    kind: "finds",
    name: "Button Bone",
    rarity: "common",
    icon: "🦴",
    image: "collections/finds/button-bone.svg",
  },
  {
    id: "brass-bookmark",
    kind: "finds",
    name: "Brass Bookmark",
    rarity: "uncommon",
    icon: "🔖",
    image: "collections/finds/brass-bookmark.svg",
  },
  {
    id: "pocket-compass",
    kind: "finds",
    name: "Pocket Compass",
    rarity: "uncommon",
    icon: "🧭",
    image: "collections/finds/pocket-compass.svg",
  },
  {
    id: "carved-feather",
    kind: "finds",
    name: "Carved Feather",
    rarity: "uncommon",
    icon: "🪶",
    image: "collections/finds/carved-feather.svg",
  },
  {
    id: "star-map-shard",
    kind: "finds",
    name: "Star Map Shard",
    rarity: "rare",
    icon: "✨",
    image: "collections/finds/star-map-shard.svg",
  },
];

const rarityWeight: Record<DiscoveryRarity, number> = {
  common: 18,
  uncommon: 7,
  rare: 2,
};

export type RandomSource = () => number;

/** Selects a definition by rarity, retaining a predictable order for tests. */
export const selectWeighted = <T extends DiscoveryDefinition>(
  definitions: readonly T[],
  random: RandomSource,
): T => {
  if (!definitions.length)
    throw new Error("Cannot select from an empty discovery catalog.");
  const total = definitions.reduce(
    (sum, item) => sum + rarityWeight[item.rarity],
    0,
  );
  const roll = Math.min(0.999999999, Math.max(0, finiteRandom(random))) * total;
  let cursor = 0;
  for (const item of definitions) {
    cursor += rarityWeight[item.rarity];
    if (roll < cursor) return item;
  }
  return definitions.at(-1)!;
};

export type TownActivityState =
  | "idle"
  | "digging"
  | "casting"
  | "waiting"
  | "reelReady"
  | "reeling"
  | "result";

export type ActivityAction = "dig" | "fish";

export interface ActivityOutcome {
  readonly action: ActivityAction;
  readonly success: boolean;
  readonly discovery?: DiscoveryDefinition;
  readonly message: string;
}

export interface TownActivityView {
  readonly state: TownActivityState;
  readonly busy: boolean;
  readonly canDig: boolean;
  readonly canFish: boolean;
  readonly canReel: boolean;
  /** Seconds until the next automatic state, or null for an intentional wait. */
  readonly remaining: number | null;
  readonly outcome: ActivityOutcome | null;
}

export interface TownActivityTimings {
  readonly digging: number;
  readonly casting: number;
  readonly waitMin: number;
  readonly waitMax: number;
  readonly reeling: number;
  readonly result: number;
}

export interface TownActivitiesOptions {
  readonly random?: RandomSource;
  readonly timings?: Partial<TownActivityTimings>;
}

const defaultTimings: TownActivityTimings = {
  digging: 0.82,
  casting: 0.58,
  waitMin: 0.95,
  waitMax: 1.55,
  reeling: 0.52,
  result: 1.25,
};

const finiteRandom = (random: RandomSource) => {
  const value = random();
  return Number.isFinite(value) ? value : 0.5;
};

/**
 * A small finite-state controller for fish and dig interactions. It never
 * owns a timer, DOM node, or save record; callers tick it from their world
 * loop and persist an outcome once it becomes visible.
 */
export class TownActivities {
  private readonly random: RandomSource;
  private readonly timings: TownActivityTimings;
  private currentState: TownActivityState = "idle";
  private remainingSeconds: number | null = null;
  private pendingOutcome: ActivityOutcome | null = null;
  private visibleOutcome: ActivityOutcome | null = null;

  constructor(options: TownActivitiesOptions = {}) {
    this.random = options.random ?? Math.random;
    this.timings = { ...defaultTimings, ...options.timings };
    if (
      Object.values(this.timings).some(
        (value) => !Number.isFinite(value) || value < 0,
      ) ||
      this.timings.waitMax < this.timings.waitMin
    )
      throw new Error(
        "Town activity timings must be finite, non-negative, and ordered.",
      );
  }

  get state(): TownActivityState {
    return this.currentState;
  }

  get view(): TownActivityView {
    return {
      state: this.currentState,
      busy: this.currentState !== "idle",
      canDig: this.currentState === "idle",
      canFish: this.currentState === "idle",
      canReel: this.currentState === "reelReady",
      remaining: this.remainingSeconds,
      outcome: this.visibleOutcome,
    };
  }

  /** Starts a dig if the avatar is not already using another action. */
  dig(): boolean {
    if (this.currentState !== "idle") return false;
    this.enter("digging", this.timings.digging);
    return true;
  }

  /** Starts casting; the caller is responsible for confirming a stream bank. */
  cast(): boolean {
    if (this.currentState !== "idle") return false;
    this.enter("casting", this.timings.casting);
    return true;
  }

  /** Resolves a catch only after the player chooses the non-expiring Reel prompt. */
  reel(): boolean {
    if (this.currentState !== "reelReady") return false;
    this.pendingOutcome = this.fishOutcome();
    this.enter("reeling", this.timings.reeling);
    return true;
  }

  /**
   * Advances one automatic phase. Returns an outcome exactly when it becomes
   * visible, which is the point at which the application should save it.
   */
  update(deltaSeconds: number): ActivityOutcome | null {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return null;
    if (this.remainingSeconds === null) return null;
    this.remainingSeconds -= deltaSeconds;
    if (this.remainingSeconds > 0) return null;

    switch (this.currentState) {
      case "digging":
        return this.showOutcome(this.digOutcome());
      case "casting":
        this.enter(
          "waiting",
          this.timings.waitMin +
            (this.timings.waitMax - this.timings.waitMin) *
              finiteRandom(this.random),
        );
        return null;
      case "waiting":
        this.enter("reelReady", null);
        return null;
      case "reeling":
        return this.showOutcome(this.pendingOutcome ?? this.fishOutcome());
      case "result":
        this.enter("idle", null);
        return null;
      case "idle":
      case "reelReady":
        return null;
    }
  }

  private enter(state: TownActivityState, remaining: number | null) {
    this.currentState = state;
    this.remainingSeconds = remaining;
    if (state !== "result") this.visibleOutcome = null;
    if (state !== "reeling") this.pendingOutcome = null;
  }

  private showOutcome(outcome: ActivityOutcome): ActivityOutcome {
    this.pendingOutcome = null;
    this.visibleOutcome = outcome;
    this.currentState = "result";
    this.remainingSeconds = this.timings.result;
    return outcome;
  }

  private digOutcome(): ActivityOutcome {
    if (finiteRandom(this.random) >= 0.6)
      return {
        action: "dig",
        success: false,
        message: "Just soft soil this time.",
      };
    const discovery = selectWeighted(FINDS, this.random);
    return {
      action: "dig",
      success: true,
      discovery,
      message: `You found ${discovery.name}!`,
    };
  }

  private fishOutcome(): ActivityOutcome {
    if (finiteRandom(this.random) >= 0.3)
      return { action: "fish", success: false, message: "The fish got away!" };
    const discovery = selectWeighted(FISH, this.random);
    return {
      action: "fish",
      success: true,
      discovery,
      message: `You caught ${discovery.name}!`,
    };
  }
}
