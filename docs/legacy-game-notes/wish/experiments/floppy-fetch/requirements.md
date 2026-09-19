# Floppy Fetch — controlled experiment
2026-09-11 · BOB-003-ALT1 · selected by Jobe after the animation/ragdoll discussion.

Visual thesis: a stitched, caramel-and-cream plush Wishbone with an orange bandana, floppy paws and ears, tumbling through the existing watercolor yard. The dog is visibly a toy; no injury, pain or failure state.

| ID | Requirement |
| --- | --- |
| FF-01 | Preserve sock-and-chase 0.2, its playable and save; build this as a separately named HTML and local route. |
| FF-02 | Use the exact same two data-authored yards, targets and reward thresholds for comparison. |
| FF-03 | Pull back and release the plush dog itself. Torso, head, paws, ears and tail have real joints and collisions; no rigid sprite merely spinning as a substitute. |
| FF-04 | Hold a friendly ready pose; visibly flop during flight, squish on impact, then recover into a happy trot along the foreground back to the launch pad. |
| FF-05 | Unlimited attempts; damage and earned toys persist. Automatic recovery is bounded, and Call Wishbone accelerates recovery whenever desired. A return uses the foreground lane rather than passing through towers. |
| FF-06 | Keep touch ownership/cancel, resize safety, pause, mute, gesture audio and gentle motion. No keyboard or questions required. |
| FF-07 | Reuse pet-themed keepsakes with placement metadata. Use a separate experiment save; no automatic import or overwrite of either previous save. |
| FF-08 | Retain readable source and reproducible builds. Test joint stability, actual collision collapse, bounded recovery, missed/repeated throws, target deduplication and the existing game regression suite. |

Mechanic: touch pull/release → launch a jointed plush → collapse structures → return/toss again. It is the already-logged direct-dog alternative to BOB-003-R2, not another book's game. Compared against all ten: still distinct from flight steering, construction/routing, rhythm, cooking, merging, stealth, habitat building, containment and photography. No new lobby or online services. Both prototypes remain candidates pending family feedback.

Tradeoff to assess: one animated dog returns between launches instead of refilling an independent sock. Keep that brief and provide quick recall. The same two yards avoid confusing added content with better mechanics.

## Revision 0.1.1 — user feedback
- FF-09: Rename the player-facing game Wishbone Fling; preserve existing saves and links.
- FF-10: Place ear roots at the back/top of the head, clear of the button eye, retaining physical joints.
- FF-11: Place persistent scenery overlays on opaque high-contrast panels. Remove redundant small canvas captions; keep the readable controls below the yard. Floating feedback gets a solid backing.

## Revision 0.1.2 — life and proposed mechanics (2026-09-11)
- FF-12 (user): Dog reacts continuously while dragging. Draw-only articulated paw paddles, ear lag, tail wag, head anticipation and expression track pull strength/direction; do not alter launch physics or checkpoints.
- FF-13 (user): Toys show individual blinks/ear wiggles and an approaching-dog expression. Keep solid silhouettes at physical positions and retain existing rescue audio.
- FF-14 (designer): Pause freezes animation; gentle motion suppresses periodic movement while preserving direct pull feedback. Existing touch cancel, resize, recall and saves remain valid.
- FF-15 (user, proposals only): Document three bankable consumables and three world mechanisms, earned on clear or airborne contact; no implementation of these systems in this animation revision.

## Revision 0.2.0 — playable powerup/mechanism experiment
2026-09-11, user selected all six proposals for implementation; rollback baseline tag: wishbone-fling-before-powerups.
- FF-16: Three bankable consumables, awarded on each fresh-run clear and by airborne dog contact; all limbs deduplicate one pickup. Inventory persists across yards, recall, restack and reload. Old saves receive zero charges without losing existing progress.
- FF-17: Touch inventory buttons arm one consumable. Cancel does not consume. Bounce and magnet consume on launch; pinwheel consumes only on Gust, with optional automatic apex activation. Unused pinwheel stays banked.
- FF-18: Three spring bounces per biscuit, bounded loose-target attraction for bandana, one up/forward gust for pinwheel. Unlimited unpowered throws remain viable.
- FF-19: Collision-triggered lever opens a gate guarding a bonus pickup, polarity switch controls a visible local metal/collar field, bellows sends a bounded upward gust. Dog and dynamic prop contact can activate each; contact debounce prevents repeated resting triggers.
- FF-20: Keep old levels and four targets each, introduce mechanisms in unused yard space, show pickup icons and labels, persistent inventory counts, next clear reward and concise mechanism instructions. Retain pause/mute/gentle motion.
- FF-21: Add permanent tabletop display keepsakes for first powerup discovery. Consumable use does not remove discovery ownership; save new fields additively under existing key. Keep an offline 0.1.2 comparison in outputs.
- FF-22: Test reward deduplication/reload, arming/consumption/cancel, actual collisions for all mechanisms, force bounds, free clearability, old saves and touch flow. Browser QA for the served HTTP game, and document physical iPad limitations.
