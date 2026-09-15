import { record, count, finite, strings, parse } from "../../core/validation";
import { loadPowers, definitions } from "./powers";
import type { Checkpoint, PowerState } from "./types";
export interface WishboneProgress {
  version: 2;
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
    detail: "Free all eight toys",
  },
  ...definitions.map((p) => ({
    id: "power-" + p.id,
    name: p.name + " display",
    at: 0,
    metric: "power",
    detail: "Discover " + p.name,
  })),
];
/** Owns Wishbone's durable milestone schema, independent of the hub economy. */
export class WishboneProgression {
  static load(raw: unknown): WishboneProgress {
    const data = record(typeof raw === "string" ? parse(raw) : raw),
      checkpoints: Record<string, Checkpoint> = {};
    for (const id of ["teeter", "domino"]) {
      const c = record(record(data.checkpoints)[id]);
      if (!Array.isArray(c.pieces)) continue;
      const pieces = c.pieces
        .slice(0, 100)
        .map(record)
        .filter(
          (p) =>
            typeof p.id === "number" &&
            typeof p.x === "number" &&
            typeof p.y === "number" &&
            typeof p.angle === "number",
        )
        .map((p) => ({
          id: count(p.id, 100),
          x: finite(p.x),
          y: finite(p.y),
          angle: finite(p.angle),
        }));
      const cp: Checkpoint = {
        pieces,
        rescued: Array.isArray(c.rescued)
          ? c.rescued.filter(
              (n): n is number =>
                typeof n === "number" &&
                Number.isInteger(n) &&
                n >= 0 &&
                n < 100,
            )
          : [],
      };
      const g = record(c.gadgets),
        ids = ["bounce", "magnet", "wind"] as const;
      if (c.gadgets)
        cp.gadgets = {
          claimed: ids.filter((id) => strings(g.claimed).includes(id)),
          clearPaid: g.clearPaid === true,
          reward: ids.find((id) => g.reward === id) ?? "bounce",
          gateOpen: g.gateOpen === true,
          polarity: g.polarity === -1 ? -1 : g.polarity === 1 ? 1 : 0,
        };
      checkpoints[id] = cp;
    }
    const powers = loadPowers(data.powers);
    const state: WishboneProgress = {
      version: 2,
      throws: count(data.throws),
      rescued: strings(data.rescued).filter((id) =>
        /^(teeter|domino):\d+$/.test(id),
      ),
      owned: strings(data.owned).filter((id) =>
        keepsakes.some((k) => k.id === id),
      ),
      bestCascade: count(data.bestCascade, 100),
      yard: data.yard === 1 ? 1 : 0,
      muted: data.muted === true,
      reduced: data.reduced === true,
      checkpoints,
      powers,
    };
    for (const power of powers.discovered)
      if (!state.owned.includes("power-" + power))
        state.owned.push("power-" + power);
    this.award(state);
    return state;
  }
  static award(state: WishboneProgress): string[] {
    const earned: string[] = [];
    for (const k of keepsakes) {
      const qualifies =
        k.metric === "power"
          ? state.powers.discovered.some((p) => "power-" + p === k.id)
          : (k.metric === "rescued" ? state.rescued.length : state.throws) >=
            k.at;
      if (qualifies && !state.owned.includes(k.id)) {
        state.owned.push(k.id);
        earned.push(k.id);
      }
    }
    return earned;
  }
}
