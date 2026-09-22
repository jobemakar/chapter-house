/**
 * Immutable version-two migration metadata. This is deliberately independent
 * of editable level files: changing an authored file must never rewrite which
 * old numeric index or physics revision an existing save originally meant.
 */
export const LEGACY_LEVELS = [
  { id: "teeter", revision: "v1-b49d4692" },
  { id: "domino", revision: "v1-dd8c475d" },
  { id: "bridge-nudge", revision: "v1-67fa563d" },
  { id: "domino-run", revision: "v1-59a424f4" },
  { id: "gate-release", revision: "v1-7404c48f" },
  { id: "bellows-hop", revision: "v1-3afa7ca4" },
  { id: "magnet-picnic", revision: "v1-ddc112ee" },
  { id: "long-yard", revision: "v1-bc065585" },
  { id: "cushion-corner", revision: "v1-7ba7b89a" },
  { id: "bucket-steps", revision: "v1-a1ca9eaa" },
  { id: "seesaw-orchard", revision: "v1-e9b17623" },
  { id: "twin-towers", revision: "v1-fa7b7172" },
  { id: "garden-gatehouse", revision: "v1-eedf1215" },
  { id: "spring-clean", revision: "v1-a30c933f" },
  { id: "horseshoe-huddle", revision: "v1-f36fffd6" },
  { id: "porch-parade", revision: "v1-a314fc00" },
  { id: "picnic-arch", revision: "v1-3eaa4570" },
  { id: "lantern-lever", revision: "v1-f8dd75ae" },
  { id: "cushion-cascade", revision: "v1-75004fdb" },
  { id: "springboard-lane", revision: "v1-137783f3" },
  { id: "magnet-maze", revision: "v1-a81b6c4e" },
  { id: "double-decker", revision: "v1-5691bb4b" },
  { id: "hedge-gate", revision: "v1-c6744151" },
  { id: "breezy-buckets", revision: "v1-b538eeb6" },
  { id: "iron-orchard", revision: "v1-deceaaa1" },
  { id: "three-towers", revision: "v1-46dc7796" },
  { id: "meadow-mile", revision: "v1-c335f4c8" },
  { id: "grand-garden", revision: "v1-a2c31180" },
] as const;

export const LEGACY_LEVEL_IDS = LEGACY_LEVELS.map(({ id }) => id);
export const LEGACY_LEVEL_REVISIONS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(LEGACY_LEVELS.map(({ id, revision }) => [id, revision])),
);
