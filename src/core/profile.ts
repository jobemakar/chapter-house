import { record, count, finite, strings, parse } from "./validation";
import { getFurniture, getPet, furniture } from "./catalog";
import {
  WishboneProgression,
  type WishboneProgress,
} from "../games/wishbone/progression";
import { FISH, FINDS, type DiscoveryKind } from "../town/activities";
export interface Point {
  x: number;
  z: number;
}
export interface Placement extends Point {
  rotation: number;
}
export interface OwnedItem {
  id: string;
  definitionId: string;
  placement: Placement | null;
  /** Optional additive v1 field: old saves start with lamps off. */
  lampOn?: boolean;
  filled?: boolean;
}
export interface Profile {
  version: 1;
  name: string;
  currency: number;
  activeSeconds: number;
  creditedUnits: number;
  avatar: { color: string; accessory: string };
  pets: string[];
  activePets: string[];
  starterChosen: boolean;
  items: OwnedItem[];
  /** Additive v1 collection counts. A positive count also means discovered. */
  collection: Record<DiscoveryKind, Record<string, number>>;
  wishbone: WishboneProgress;
  muted: boolean;
  reduced: boolean;
  legacyImported: boolean;
  processedPurchases: string[];
  legacySnapshot?: unknown;
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const PROFILE_KEY = "chapter-house-profile-v1";
export const ACTIVITY_POLICY = {
  secondsPerCoin: 10,
  recentActionSeconds: 5,
  shotObservationSeconds: 8,
  maxFrameSeconds: 0.1,
} as const;
const adjectives = [
  "mossy",
  "arctic",
  "gentle",
  "golden",
  "sleepy",
  "sunny",
  "little",
  "velvet",
];
const nouns = [
  "squirrel",
  "otter",
  "panda",
  "badger",
  "fox",
  "bunny",
  "finch",
  "hedgehog",
];
function fresh(): Profile {
  return {
    version: 1,
    name: `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}`,
    currency: 0,
    activeSeconds: 0,
    creditedUnits: 0,
    avatar: { color: "#cc8957", accessory: "scarf" },
    pets: [],
    activePets: [],
    starterChosen: false,
    items: [
      {
        id: "starter-shelf",
        definitionId: "library-shelf",
        placement: { x: 2, z: 0.7, rotation: 0 },
      },
      {
        id: "starter-sofa",
        definitionId: "sage-sofa",
        placement: { x: 7.8, z: 1.4, rotation: 0 },
      },
      {
        id: "starter-table",
        definitionId: "reading-table",
        placement: { x: 6.4, z: 3.5, rotation: 0 },
      },
      {
        id: "starter-chair",
        definitionId: "cozy-chair",
        placement: { x: 4.8, z: 3.5, rotation: 0 },
      },
      {
        id: "starter-lamp",
        definitionId: "reading-lamp",
        placement: { x: 8.9, z: 3.6, rotation: 0 },
      },
      {
        id: "starter-fern",
        definitionId: "little-fern",
        placement: { x: 0.65, z: 3.5, rotation: 0 },
      },
    ],
    collection: { fish: {}, finds: {} },
    wishbone: WishboneProgression.load(null),
    muted: false,
    reduced: false,
    legacyImported: false,
    processedPurchases: [],
  };
}
export class ProfileRepository {
  readonly state: Profile;
  saved = true;
  private listeners = new Set<() => void>();
  constructor(private storage: StoragePort | null) {
    const initial = fresh();
    let raw: unknown = null;
    try {
      raw = parse(storage?.getItem(PROFILE_KEY) ?? null);
    } catch {
      this.saved = false;
    }
    const data = record(raw);
    if (data.version === 1) {
      initial.name =
        typeof data.name === "string" && /^[a-z]+-[a-z]+$/.test(data.name)
          ? data.name
          : initial.name;
      initial.processedPurchases = strings(data.processedPurchases).slice(
        -1000,
      );
      initial.currency = count(data.currency);
      initial.activeSeconds = Math.max(0, finite(data.activeSeconds));
      initial.creditedUnits = count(data.creditedUnits);
      const avatar = record(data.avatar);
      initial.avatar = {
        color: ["#cc8957", "#8e9eae", "#d3ad85", "#af96b3"].includes(
          String(avatar.color),
        )
          ? String(avatar.color)
          : initial.avatar.color,
        accessory: ["scarf", "bow", "none"].includes(String(avatar.accessory))
          ? String(avatar.accessory)
          : "scarf",
      };
      initial.pets = strings(data.pets).filter((id) => getPet(id));
      initial.activePets = strings(data.activePets).filter((id) =>
        initial.pets.includes(id),
      );
      initial.starterChosen =
        data.starterChosen === true || initial.pets.length > 0;
      if (Array.isArray(data.items)) {
        const seen = new Set<string>();
        initial.items = data.items
          .map(record)
          .filter(
            (item) =>
              typeof item.id === "string" &&
              !seen.has(item.id) &&
              (seen.add(item.id), true) &&
              typeof item.definitionId === "string" &&
              !!getFurniture(item.definitionId),
          )
          .map((item) => {
            const p = record(item.placement);
            return {
              id: String(item.id),
              definitionId: String(item.definitionId),
              ...(getFurniture(String(item.definitionId))?.kind === "lamp"
                ? { lampOn: item.lampOn === true }
                : {}),
              ...(getFurniture(String(item.definitionId))?.kind === "bowl"
                ? { filled: item.filled === true }
                : {}),
              placement:
                item.placement &&
                typeof p.x === "number" &&
                typeof p.z === "number"
                  ? {
                      x: finite(p.x),
                      z: finite(p.z),
                      rotation: count(p.rotation, 3),
                    }
                  : null,
            };
          });
      }
      const collection = record(data.collection);
      for (const [kind, catalog] of [
        ["fish", FISH],
        ["finds", FINDS],
      ] as const) {
        const saved = record(collection[kind]);
        for (const definition of catalog) {
          const value = count(saved[definition.id]);
          if (value > 0) initial.collection[kind][definition.id] = value;
        }
      }
      initial.wishbone = WishboneProgression.load(data.wishbone);
      initial.muted = data.muted === true;
      initial.reduced = data.reduced === true;
      initial.legacyImported = data.legacyImported === true;
      initial.legacySnapshot = data.legacySnapshot;
    }
    this.state = initial;
    if (!initial.legacyImported) {
      try {
        const old = storage?.getItem("wishbone-floppy-fetch-v1");
        if (old && !initial.wishbone.throws) {
          initial.legacySnapshot = parse(old);
          initial.wishbone = WishboneProgression.load(initial.legacySnapshot);
          initial.muted = initial.wishbone.muted;
          initial.reduced = initial.wishbone.reduced;
        }
        initial.legacyImported = true;
      } catch {}
    }
    this.syncKeepsakes(false);
    // One local preview set, granted by stable instance ID without disturbing layout.
    for (const definitionId of ["pet-bowl", "fish-tank", "pet-trampoline"]) {
      const id = `starter-${definitionId}`;
      if (!initial.items.some((item) => item.id === id))
        initial.items.push({ id, definitionId, placement: null });
    }
    this.save();
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  save(notify = true): boolean {
    try {
      if (!this.storage) throw new Error("Storage unavailable");
      this.storage.setItem(PROFILE_KEY, JSON.stringify(this.state));
      this.saved = true;
    } catch {
      this.saved = false;
    }
    if (notify) for (const listener of this.listeners) listener();
    return this.saved;
  }
  toggleLamp(id: string): boolean | null {
    const item = this.state.items.find((item) => item.id === id);
    if (!item?.placement || getFurniture(item.definitionId)?.kind !== "lamp")
      return null;
    item.lampOn = !item.lampOn;
    this.save();
    return item.lampOn;
  }
  fillBowl(id: string): boolean {
    const item = this.state.items.find((item) => item.id === id);
    if (!item?.placement || getFurniture(item.definitionId)?.kind !== "bowl")
      return false;
    item.filled = true;
    this.save();
    return true;
  }
  /** Food only leaves durable bowl state after a room interaction finishes. */
  emptyBowl(id: string): boolean {
    const item = this.state.items.find((item) => item.id === id);
    if (
      !item?.placement ||
      getFurniture(item.definitionId)?.kind !== "bowl" ||
      item.filled !== true
    )
      return false;
    item.filled = false;
    this.save();
    return true;
  }
  syncKeepsakes(notify = true): void {
    for (const item of furniture) {
      if (
        item.gameReward &&
        this.state.wishbone.owned.includes(item.gameReward) &&
        !this.state.items.some((i) => i.id === "reward-" + item.gameReward)
      )
        this.state.items.push({
          id: "reward-" + item.gameReward,
          definitionId: item.id,
          placement: null,
        });
    }
    if (notify) this.save();
  }
  addDiscovery(kind: DiscoveryKind, id: string): number {
    const catalog = kind === "fish" ? FISH : FINDS;
    if (!catalog.some((definition) => definition.id === id)) return 0;
    const next = (this.state.collection[kind][id] ?? 0) + 1;
    this.state.collection[kind][id] = next;
    this.save();
    return next;
  }
  chooseStarter(id: string): boolean {
    if (this.state.starterChosen || !getPet(id)?.starter) return false;
    this.state.pets.push(id);
    this.state.activePets.push(id);
    this.state.starterChosen = true;
    this.save();
    return true;
  }
  buyFurniture(id: string, requestId: string = crypto.randomUUID()): boolean {
    if (this.state.processedPurchases.includes(requestId)) return false;
    const item = getFurniture(id);
    if (
      !item ||
      item.price === undefined ||
      item.gameReward ||
      this.state.currency < item.price
    )
      return false;
    this.state.processedPurchases.push(requestId);
    this.state.processedPurchases = this.state.processedPurchases.slice(-1000);
    this.state.currency -= item.price;
    this.state.items.push({
      id: crypto.randomUUID(),
      definitionId: id,
      placement: null,
    });
    this.save();
    return true;
  }
  buyPet(id: string, requestId: string = crypto.randomUUID()): boolean {
    if (this.state.processedPurchases.includes(requestId)) return false;
    const pet = getPet(id);
    if (!pet || this.state.pets.includes(id) || this.state.currency < pet.price)
      return false;
    this.state.processedPurchases.push(requestId);
    this.state.processedPurchases = this.state.processedPurchases.slice(-1000);
    this.state.currency -= pet.price;
    this.state.pets.push(id);
    this.state.activePets.push(id);
    this.save();
    return true;
  }
  setPetActive(id: string, active: boolean): void {
    if (!this.state.pets.includes(id)) return;
    this.state.activePets = this.state.activePets.filter((p) => p !== id);
    if (active) this.state.activePets.push(id);
    this.save();
  }
  /** A monotonic total makes a repeated credit snapshot idempotent. One coin per ten active seconds. */
  creditActivity(totalSeconds: number): number {
    this.state.activeSeconds = Math.max(
      this.state.activeSeconds,
      finite(totalSeconds),
    );
    const units = Math.floor(
      this.state.activeSeconds / ACTIVITY_POLICY.secondsPerCoin,
    );
    const delta = Math.max(0, units - this.state.creditedUnits);
    this.state.creditedUnits = Math.max(units, this.state.creditedUnits);
    this.state.currency += delta;
    if (delta) this.save();
    return delta;
  }
}
/** Only recent meaningful actions and bounded shot observation count. No wall-clock catch-up. */
export class ActivityClock {
  private lastAction = -Infinity;
  private clock = 0;
  total: number;
  constructor(start = 0) {
    this.total = start;
  }
  interact(): void {
    this.lastAction = this.clock;
  }
  step(dt: number, paused: boolean, observingShot: boolean): number {
    const elapsed = Math.max(0, Math.min(ACTIVITY_POLICY.maxFrameSeconds, dt));
    this.clock += elapsed;
    if (
      !paused &&
      (this.clock - this.lastAction <= ACTIVITY_POLICY.recentActionSeconds ||
        (observingShot &&
          this.clock - this.lastAction <=
            ACTIVITY_POLICY.shotObservationSeconds))
    )
      this.total += elapsed;
    return this.total;
  }
  suspend(): void {
    this.lastAction = -Infinity;
  }
}
export function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
