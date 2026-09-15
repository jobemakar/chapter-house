# Willowbrook stream activities plan

Date: 2026-09-15  
Status: selected for implementation by Jobe

## Mechanic signature

- Input: tap a world-anchored action bubble; tap **Reel** after a cast; two-finger pinch to zoom.
- Verbs: dig, cast, wait, reel, discover, collect.
- Loop: explore Willowbrook → use the contextual action → watch a short tactile animation → receive a harmless result → build a persistent collection.
- Space: digging is available on any walkable ground; fishing is available only from a walkable stream bank, never at the fountain.
- Challenge and recovery: there is no timing failure or resource cost. Reel remains available until selected. A miss is a brief playful result and the next attempt is immediate.
- Progression: duplicate fish and finds stack as counts. Common, uncommon, and rare entries share one Collection view with separate Fish and Finds sections. Undiscovered entries remain visible as silhouettes with rarity hints.
- Distinctness: these are small shared-world discovery activities, not a new book-game score loop and not a replacement for Wishbone Fling.

## Numbered requirements

1. A bobbing, lightly sparkling action bubble follows the avatar in screen space and is visually part of the world rather than the permanent control bars.
2. On ordinary walkable ground the bubble offers **Dig**. At a valid stream bank it offers both **Fish** and **Dig**.
3. Fishing is unavailable at the fountain and elsewhere away from the authored stream.
4. Fishing uses the sequence cast → ripple/wait → persistent Reel prompt → result. Reel has no deadline. Each reel has an approximately 30 percent chance to catch a fish.
5. Digging plays a short two-to-three-scoop action and temporary mound/hole treatment that fully disappears within about two seconds.
6. Fishing and digging pause avatar travel while active. The rod and shovel are posed in the avatar's paws as a reversible procedural-animation trial.
7. Fish and finds use stable IDs, display names, rarity, and weighted outcomes. Duplicates increment persistent counts rather than becoming one-time unlocks.
8. One Collection view presents Fish and Finds separately. Undiscovered entries show silhouettes plus rarity; discoveries show art, names, and counts.
9. Collection data loads additively for existing version-1 profiles. Missing or malformed collection data falls back safely without deleting established currency, avatar, pet, or furnishing progress.
10. Fishing uses cartoony cast, plop, ripple, reel, miss, catch, and rarity sounds. Digging uses cartoony scrape, thump, crumble, and rarity sounds. All audio follows existing mute, hidden-page, and disposal behavior.
11. The existing town ambience continues under the new actions. Stream-related sounds remain spatially associated with the stream.
12. Both the clubhouse and town accept a true two-pointer pinch gesture. Zoom follows the fingers' midpoint, remains clamped, suppresses accidental pan/tap during the gesture, and preserves mouse drag/wheel/buttons.
13. The clubhouse starts somewhat closer on narrow mobile screens. Existing zoom controls remain available.
14. Reduced-motion mode shortens or removes bobbing, sparkles, tool flourishes, ripple repetition, and camera easing without removing state feedback.
15. Buttons retain at least 44-pixel touch targets, keyboard focus, explicit labels, and live textual results. Collection silhouettes are not the sole indication of locked state or rarity.
16. All random mechanics accept injected randomness in core logic so catch odds, rarity selection, and recovery states can be tested deterministically.
17. The implementation adds focused tests for stream-bank eligibility, the non-expiring Reel state, catch odds thresholds, rarity selection, collection stacking/migration, pinch gesture state, and audio lifecycle.

## Authored content defaults

- Fish catalog: six species across common, uncommon, and rare tiers.
- Finds catalog: eight small bones, keepsakes, natural curios, and artifacts across the same tiers.
- Digging: a forgiving 60 percent discovery chance; an empty dig is a soft soil result, never a penalty.
- Fishing: 30 percent catch chance resolved only when Reel is selected. The pre-reel wait varies slightly for liveliness but does not affect success.
- Discovery art may use appropriately licensed Kenney 2D art for collection cards and catch callouts. Simple 3D tools, line, ripples, and soil effects remain procedural so they align with the current avatar and world.

## Asset and provenance policy

Only CC0 Kenney assets that materially improve readability will be packaged. Candidate official sources are Fish Pack, Survival Kit, Graveyard Kit, Pirate Kit, and Nature Kit. Every shipped external file will be listed in `docs/provenance.md` with source URL, license, and local path. If a pack does not provide a clean fit, the feature will use original procedural geometry instead of forcing mismatched art.

## Ownership and sequence

1. Record this selected meta-world activity in the parent idea registry.
2. Add typed, deterministic collection/activity logic and profile migration.
3. Add stream-bank queries, world action state, procedural props/effects, and the world-anchored prompt.
4. Add the Collection view and persistent count rendering.
5. Extend town audio with cartoony cues and wire mute/reduced-motion behavior.
6. Add shared two-pointer gesture handling to town and clubhouse cameras.
7. Run type checking, unit tests, production build, and served desktop/mobile interaction checks; document what is automated versus visually inspected.
8. Commit locally. Publication is out of scope unless separately requested.

## Acceptance

The slice is ready for review when a new and an existing profile can dig anywhere walkable, fish only beside the stream, leave Reel waiting indefinitely, collect stacked common-to-rare results, inspect both collection sections, hear/mute distinct cartoony cues, and pinch-zoom both scenes without accidental walking. The procedural held-tool pose is explicitly a visual trial and may be revised after Jobe's review.
