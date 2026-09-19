# Contraption — canonical 0.3.0
2026-09-19. User selected the authored BOB-010-R3 Contraption campaign as Popcorn's canonical local game. Picture Day Parade is preserved intact in the archive; the v1 sandbox remains independently playable.

## Connection and distinctness
This is an intentionally loose, title-inspired popcorn toy, not a scene from the novel. The previously verified publisher description uses a heating popcorn kernel as an anxiety metaphor (https://www.penguinrandomhouse.com/books/736977/popcorn-by-rob-harrell/, checked in the parent task). All machines, workshops and keepsakes are invented; anxiety is not modeled or joked about.

Signature: place / drag / rotate devices while a stream of kernels circulates; watch physics; adjust the chain to deliver popcorn; unlock a bonus device and a miniature machine. Open side-view construction board, no direct projectile aiming. Spills return automatically. The original overlap with Funhouse route construction is explicitly accepted by this request to try the original concept. Here many particles and reusable free placement replace Funhouse's autonomous key and authored route goals. Distinct from Wish's aimed destructive throws and Picture Day's timed photos, and from flight, rhythm, cooking, merge, stealth, habitat and containment loops elsewhere in the collection.

| ID | Requirement | Origin / acceptance |
| --- | --- | --- |
| CC-01 | Continuous physics-driven popcorn stream; no quizzes, lives, forced restart or resource loss. | User/original pitch; spills visibly recirculate. |
| CC-02 | Fans accelerate kernels, belts carry them, ramps guide, trampolines launch, funnels collect and redirect. | Original pitch/designer; each must change real particle motion. |
| CC-03 | Touch-first: tap device then tap board to place, drag placed parts directly, large rotate / flip / duplicate / remove controls; undo layout edits. | Collection; editing works while running and paused. |
| CC-04 | Start with a working, editable machine; three free workshops with different source/target positions and saved layouts. | Designer; no empty-board onboarding or blocked progression. |
| CC-05 | Count bowl deliveries and longest unique-device chain. Five deliveries unlock a radial bumper; twenty unlock the miniature machine display. | Designer; progress never disappears on layout undo or workshop changes. |
| CC-06 | Show device effects, popcorn trails, bounce squash and delivery celebrations using buttery yellow / blue ink mechanical doodles. | Original pitch; native canvas art is original. |
| CC-07 | Original synth audio, immediate mute, pause, slower simulation and reduced-motion default. Hidden tabs suspend play. | Collection; touch gesture unlocks sound. |
| CC-08 | Save versioned layouts, deliveries, best chain and preferences in `popcorn-contraption.v1`; tolerate malformed/unavailable storage. | Collection; never touch Picture Day save. |
| CC-09 | Standalone offline HTML plus readable source and reproducible dependency-free build, local Git history, no publication. | Collection. |
| CC-10 | Verify device forces/collision response, real starter delivery, recirculation, bounded particles, saved layouts, undo and touch controls in a browser. | Collection; document physical iPad and audio-listening limitations. |

## Placeable rewards
Five-delivery bumper is also a tabletop spring ornament: `cc-spring-ornament`, size .18×.18×.22 m, tabletop footprint .18×.18 m, no floor blocking. Twenty-delivery miniature machine: `cc-mini-machine`, size .45×.24×.48 m, tabletop footprint .45×.24 m, no floor blocking. Both are original title/game-action keepsakes; neither is a literal novel object. No new clubhouse implementation.

The machine kit is an unlimited editing tool, not a set of collectible inventory objects. Limit 32 placed parts per board and 42 active kernels for predictable browser work. Clearing or loading the starter changes layout only and is undoable.

## Level revision requirements — 2026-09-13
User selects a puzzle campaign, preserves playful physics, no loss state, and persistent completion while continuing to edit. Replaces open workshops as the default; legacy standalone and save retained.
- CC-11: Collected kernels exit simulation into the bucket, never the spill conveyor. Only missed kernels visibly return.
- CC-12: Six authored levels, different inlets, fixed bolted structures, movable pieces and limited per-level tools. Fixed objects cannot be dragged, rotated, reversed, duplicated or removed. A usable suggested arrangement is available without penalty.
- CC-13: Completion requires a clean batch of 12 kernels, balanced across all inlets, with all delivered and no unresolved/stalled/spilled particles. Every edit cancels the current proof; queued old particles cannot clear a new arrangement. A miss restarts proof automatically, no failure screen.
- CC-14: Clear is latched in saved data. Next level becomes available without auto-navigation or blocking the machine. Continued tinkering, including breaking the route, never revokes clear. Replay and free level selection allowed.
- CC-15: Corn-triggered switches set linked conveyor directions, show wires and direction feedback, and can be pressed manually. Final challenge uses alternating inlets requiring automatic reversal.
- CC-16: Version 2 uses popcorn-contraption.levels.v2, importing only totals, rewards and preferences from untouched v1. Legacy machine layouts remain accessible in the archived sandbox file. Save level layouts and clears; transient direction changes excluded.
- CC-17: Verify every authored solution with multiple simulation seeds, uncleared starter challenges, collected identity removal, proof invalidation, switch direction changes, immutable fixtures, save/reload and post-clear play in browser. Retain original art/audio and touch-first controls.

Mechanic comparison: user-selected authored machine routing intentionally overlaps Funhouse construction but differs through continuous many-particle streams and corn-driven switches. Other nine signatures remain distinct. Existing reward definitions unchanged; no additional collectible designs.
# Feedback addendum — 2026-09-16

Distinguish fixed and movable devices visually with mounting outlines/screws/BOLTED labels versus warm dashed grips/DRAG labels, plus pointer cursor affordances. Preserve all physics/editor/save behavior. See feedback-device-affordance-2026-09-16.md.
