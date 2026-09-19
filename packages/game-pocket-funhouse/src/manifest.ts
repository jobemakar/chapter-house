/** Vite rewrites this static URL for the browser; Node can inspect it without loading PNG bytes. */
const cardArtUrl = new URL("./assets/backdrop.png", import.meta.url).href;

/** Declarative package discovery data; this module imports neither CSS nor game runtime code. */
export const pocketFunhouseManifest = {
  id: "pocket-funhouse",
  book: "The Mystery of Locked Rooms",
  title: "Pocket Funhouse",
  heading: "Turn the tracks. Follow the glow.",
  description:
    "Guide a golden glow through twelve tiny funhouse rooms of turning brass tracks and shutters.",
  cardArtUrl,
  cardArtAlt: "A jewel-toned cut-paper funhouse stage with brass mechanisms",
  rewards: [
    { rewardId: "pocket-funhouse:brass-key", legacyId: "brass-key", catalogId: null, name: "Brass key", display: { surface: "table", kind: "small-object", width: 0.18, depth: 0.08 }, rationale: "Original miniature escape-room key, displayed as a tabletop curio." },
    { rewardId: "pocket-funhouse:mirror-fragment", legacyId: "mirror-fragment", catalogId: null, name: "Mirror fragment", display: { surface: "wall", kind: "framed-object", width: 0.24, height: 0.3 }, rationale: "Original faceted-looking passage clue in a protective wall frame." },
    { rewardId: "pocket-funhouse:passage-lantern", legacyId: "passage-lantern", catalogId: null, name: "Passage lantern", display: { surface: "table", kind: "small-lantern", width: 0.22, depth: 0.22 }, rationale: "Original funhouse passage lantern for a shelf or table." },
    { rewardId: "pocket-funhouse:hidden-door-hinge", legacyId: "hidden-door-hinge", catalogId: null, name: "Hidden-door hinge", display: { surface: "wall", kind: "plaque", width: 0.24, height: 0.2 }, rationale: "Original brass hardware mounted as a small keepsake plaque." },
    { rewardId: "pocket-funhouse:curtain-pull", legacyId: "curtain-pull", catalogId: null, name: "Curtain pull", display: { surface: "wall", kind: "hanging-object", width: 0.16, height: 0.42 }, rationale: "Original theater-style pull displayed as a wall-hung funhouse memento." },
    { rewardId: "pocket-funhouse:sliding-panel", legacyId: "sliding-panel", catalogId: null, name: "Sliding panel", display: { surface: "wall", kind: "relief-panel", width: 0.42, height: 0.32 }, rationale: "Original miniature secret-panel motif as a shallow wall relief." },
    { rewardId: "pocket-funhouse:optical-prism", legacyId: "optical-prism", catalogId: null, name: "Optical prism", display: { surface: "table", kind: "small-object", width: 0.16, depth: 0.16 }, rationale: "Original optical trinket shown in a tabletop display stand." },
    { rewardId: "pocket-funhouse:secret-door-bookcase", legacyId: "secret-door-bookcase", catalogId: null, name: "Secret-door bookcase", display: { surface: "floor", kind: "shelving", width: 0.82, depth: 0.26 }, rationale: "Original miniature bookcase-style passage memento for a room wall." },
    { rewardId: "pocket-funhouse:funhouse-map", legacyId: "funhouse-map", catalogId: null, name: "Funhouse map", display: { surface: "wall", kind: "framed-object", width: 0.36, height: 0.28 }, rationale: "Original illustrated route map placed in a compact wall frame." },
    { rewardId: "pocket-funhouse:turning-lock", legacyId: "turning-lock", catalogId: null, name: "Turning lock", display: { surface: "wall", kind: "plaque", width: 0.22, height: 0.22 }, rationale: "Original rotating lock mechanism, preserved as a mounted plaque." },
    { rewardId: "pocket-funhouse:treasure-latch", legacyId: "treasure-latch", catalogId: null, name: "Treasure latch", display: { surface: "wall", kind: "plaque", width: 0.2, height: 0.16 }, rationale: "Original treasure-drawer latch mounted as a small brass keepsake." },
    { rewardId: "pocket-funhouse:miniature-funhouse", legacyId: "miniature-funhouse", catalogId: null, name: "Miniature funhouse", display: { surface: "table", kind: "tabletop-model", width: 0.48, depth: 0.32 }, rationale: "Original miniature-theater keepsake displayed as a tabletop model." },
  ],
} as const;

export type PocketFunhouseManifest = typeof pocketFunhouseManifest;
