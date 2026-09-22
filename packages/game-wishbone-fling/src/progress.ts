import { LEGACY_LEVEL_IDS, LEGACY_LEVEL_REVISIONS } from "./legacy-levels";
import { count, finite, parse, record, strings } from "./validation";

/** Pure persisted model: no DOM, renderer, audio, or Matter runtime imports. */
export type PowerId = "bounce" | "magnet" | "wind";
export interface PowerState {
  counts: Record<PowerId, number>;
  clears: number;
  discovered: PowerId[];
  autoGust: boolean;
}
export type { Checkpoint } from "./types";
import type { Checkpoint } from "./types";
export interface WishboneProgress {
  version: 3;
  selectedLevelId: string;
  throws: number;
  rescued: string[];
  owned: string[];
  bestCascade: number;
  yard: number;
  muted: boolean;
  reduced: boolean;
  checkpoints: Record<string, Checkpoint>;
  powers: PowerState;
}

export const keepsakes = [
  {
    id: "sock",
    name: "Lucky sock",
    at: 1,
    metric: "throws",
    detail: "Make your first throw",
  },
  {
    id: "squeaker",
    name: "Squeaky friend",
    at: 1,
    metric: "rescued",
    detail: "Free your first toy",
  },
  {
    id: "bandana",
    name: "Bandana display",
    at: 6,
    metric: "throws",
    detail: "Make six throws",
  },
  {
    id: "basket",
    name: "Ball basket",
    at: 4,
    metric: "rescued",
    detail: "Free four different toys",
  },
  {
    id: "bed",
    name: "Patchwork dog bed",
    at: 14,
    metric: "throws",
    detail: "Make fourteen throws",
  },
  {
    id: "table",
    name: "Doghouse table",
    at: 8,
    metric: "rescued",
    detail: "Free eight different toys",
  },
  {
    id: "power-bounce",
    name: "Bounce Biscuit display",
    at: 0,
    metric: "power",
    detail: "Archived discovery",
  },
  {
    id: "power-magnet",
    name: "Magnet Bandana display",
    at: 0,
    metric: "power",
    detail: "Archived discovery",
  },
  {
    id: "power-wind",
    name: "Tailwind Pinwheel display",
    at: 0,
    metric: "power",
    detail: "Archived discovery",
  },
] as const;

export const WISHBONE_REWARD_REQUEST_IDS = {
  sock: "wishbone-fling:keepsake:sock",
  squeaker: "wishbone-fling:keepsake:squeaker",
  bandana: "wishbone-fling:keepsake:bandana",
  basket: "wishbone-fling:keepsake:basket",
  bed: "wishbone-fling:keepsake:bed",
  table: "wishbone-fling:keepsake:table",
  "power-bounce": "wishbone-fling:archive:power-bounce",
  "power-magnet": "wishbone-fling:archive:power-magnet",
  "power-wind": "wishbone-fling:archive:power-wind",
} as const;
export type WishboneRewardId = keyof typeof WISHBONE_REWARD_REQUEST_IDS;

function validPower(id: unknown): id is PowerId {
  return id === "bounce" || id === "magnet" || id === "wind";
}
function loadPowers(raw: unknown): PowerState {
  const data = record(raw);
  const counts = record(data.counts);
  return {
    counts: {
      bounce: count(counts.bounce, 9999),
      magnet: count(counts.magnet, 9999),
      wind: count(counts.wind, 9999),
    },
    clears: count(data.clears, 999999),
    discovered: [
      ...new Set(
        Array.isArray(data.discovered)
          ? data.discovered.filter(validPower)
          : [],
      ),
    ],
    autoGust: data.autoGust === true,
  };
}

export function loadWishboneProgress(raw: unknown): WishboneProgress {
  const data = record(typeof raw === "string" ? parse(raw) : raw);
  const checkpoints: Record<string, Checkpoint> = Object.create(null);
  for (const id of Object.keys(record(data.checkpoints)).slice(0, 1000)) {
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) continue;
    const candidate = record(record(data.checkpoints)[id]);
    if (!Array.isArray(candidate.pieces)) continue;
    const pieces = candidate.pieces
      .slice(0, 500)
      .map(record)
      .filter(
        (piece) =>
          typeof piece.id === "number" &&
          typeof piece.x === "number" &&
          typeof piece.y === "number" &&
          typeof piece.angle === "number",
      )
      .map((piece) => ({
        id: count(piece.id, 2147483647),
        x: finite(piece.x),
        y: finite(piece.y),
        angle: finite(piece.angle),
      }));
    const checkpoint: Checkpoint = {
      pieces,
      revision:
        typeof candidate.revision === "string"
          ? candidate.revision.slice(0, 100)
          : ((data.version !== 3 ? LEGACY_LEVEL_REVISIONS[id] : undefined) ??
            "unknown"),
      removed: Array.isArray(candidate.removed)
        ? candidate.removed
            .filter(
              (v): v is number =>
                typeof v === "number" &&
                Number.isInteger(v) &&
                v >= 0 &&
                v <= 2147483647,
            )
            .slice(0, 500)
        : [],
      devices: Object.fromEntries(
        Object.entries(record(candidate.devices))
          .slice(0, 500)
          .filter(([id]) => /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(id))
          .map(([id, value]) => {
            const d = record(value);
            return [
              id,
              {
                open: d.open === true,
                polarity: d.polarity === 1 ? 1 : d.polarity === -1 ? -1 : 0,
              },
            ];
          }),
      ),
      rescued: Array.isArray(candidate.rescued)
        ? candidate.rescued.filter(
            (value): value is number =>
              typeof value === "number" &&
              Number.isInteger(value) &&
              value >= 0 &&
              value <= 2147483647,
          )
        : [],
    };
    const gadgets = record(candidate.gadgets);
    if (candidate.gadgets) {
      const ids: PowerId[] = ["bounce", "magnet", "wind"];
      checkpoint.gadgets = {
        claimed: ids.filter((power) =>
          strings(gadgets.claimed).includes(power),
        ),
        clearPaid: gadgets.clearPaid === true,
        reward: ids.find((power) => gadgets.reward === power) ?? "bounce",
        gateOpen: gadgets.gateOpen === true,
        polarity: gadgets.polarity === -1 ? -1 : gadgets.polarity === 1 ? 1 : 0,
      };
    }
    checkpoints[id] = checkpoint;
  }
  const progress: WishboneProgress = {
    version: 3,
    selectedLevelId:
      typeof data.selectedLevelId === "string" &&
      /^[a-z0-9][a-z0-9-]{0,79}$/.test(data.selectedLevelId)
        ? data.selectedLevelId
        : (LEGACY_LEVEL_IDS[
            typeof data.yard === "number" && Number.isInteger(data.yard)
              ? data.yard
              : 2
          ] ?? "bridge-nudge"),
    throws: count(data.throws),
    rescued: strings(data.rescued).filter((value) => {
      const [yardId, pieceId] = value.split(":");
      return (
        /^[a-z0-9][a-z0-9-]{0,79}$/.test(yardId) && /^\d+$/.test(pieceId ?? "")
      );
    }),
    owned: strings(data.owned).filter((id) =>
      keepsakes.some((keepsake) => keepsake.id === id),
    ),
    bestCascade: count(data.bestCascade, 100),
    yard:
      typeof data.yard === "number" &&
      Number.isInteger(data.yard) &&
      LEGACY_LEVEL_IDS[data.yard]
        ? data.yard
        : 2,
    muted: data.muted === true,
    reduced: data.reduced === true,
    checkpoints,
    powers: loadPowers(data.powers),
  };
  WishboneProgression.award(progress);
  return progress;
}

export class WishboneProgression {
  static load = loadWishboneProgress;
  static award(state: WishboneProgress): string[] {
    const earned: string[] = [];
    for (const keepsake of keepsakes) {
      const qualifies =
        keepsake.metric !== "power" &&
        (keepsake.metric === "rescued" ? state.rescued.length : state.throws) >=
          keepsake.at;
      if (qualifies && !state.owned.includes(keepsake.id)) {
        state.owned.push(keepsake.id);
        earned.push(keepsake.id);
      }
    }
    return earned;
  }
}
