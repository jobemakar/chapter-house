# Gummy Nook 0.1.0
Selected 2026-09-12 under the user's instruction to choose an unbuilt demo.

## Connection and boundaries
Scholastic's 2024 Gold brochure shows a gummy-bear cover and describes Willa's sensory processing differences and changing family relationships: https://kids.scholastic.com/content/dam/scholastic/kids/pdf/scholastic-gold/Scholastic_GoldBrochure2024.pdf . The candy imagery anchors the shapes; choosing a comfortable nook is our thematic interpretation. Merging, characters, furniture and music are original inventions, not novel events. No condition, treatment, symptom or anxiety mechanic. No spoilers or quizzes.

## Mechanic signature and comparison
Pointer/touch drag or two taps: place, move, merge, scoop. Combine equal gummies, then cascade through adjacent equal shapes; manage a 5×5 tray and preview three upcoming pieces. Crowding is reversible with free scoop and undo; discoveries persist. Progress is seven forms and four placeable keepsakes. This is distinct from all nine other directions: Stormglide steers/dashes, Funhouse constructs routes, Fetch launches/collapses, Snow Jam times musical input (Arctic Duet catches notes), Merienda schedules stations, Bureau sneaks around agents, Sanctuary builds habitats, Emberwatch contains pressure, Picture Day frames photos. Popcorn's separate experiment constructs machines. No reserved loop is reused.

## Numbered requirements
1. [User] Touch-first offline entertainment game, without questions or forced restarts.
2. [Designer] 5×5 tray; drag a supply into an empty cell or equal gummy. Two equal forms become the next form. Matching adjacent forms cascade in fixed up/right/down/left order. Maximum form pairs remain movable, never delete each other.
3. [Designer] Existing pieces move freely; unequal occupied cells swap. Supply rejects occupied unequal cells without consuming it. Three upcoming supplies visible; higher base forms gradually join the supply. Opening layout demonstrates a cascade.
4. [User/Designer] Full tray never ends play. Free scoop, undo of last 30 board actions, no loss of discovered shapes or keepsakes. Voluntary pause; no timers.
5. [Designer] Seven identifiable silhouettes, shape labels and tier dots; pointer-following squish ghost and clear valid targets. Large cell buttons support tap source/tap target and native keyboard activation.
6. [User/Designer] Original mint-and-peach confectionery illustration with candy-glass gummies, warm tabletop, small cozy shelf and restrained celebrations. Responsive iPad, desktop and phone.
7. [User] Gesture-unlocked original synthesized music and tactile effects, accessible mute. [Designer] Separate music, reduced-motion and matte-texture settings saved locally.
8. [User/Designer] Versioned local save `bob-gummy-nook-v1`: board, queue, discoveries, total merges, settings and owned keepsakes. Corrupt/unavailable storage falls back safely. Undo never retracts collection discoveries.
9. [Designer] Guaranteed keepsakes at discovery tiers 2/3/4/6: Candy jar, Gummy lamp, Soft sock cushion, Gummy-bear beanbag. Original candy/comfort forms. Metadata includes stable IDs, mount, dimensions, footprint, clearance, support surfaces and thematic rationale. Shelf shows ownership; actual clubhouse integration deferred.
10. [User] Readable source, dependency-free reproducible build, standalone and dist outputs, Git revisions, manifest/catalog/shared summary updates.
11. [Designer] Acceptance: core tests for merge cascade, invalid placement, full-board recovery, undo and save validation. Browser tests exercise real input, saved reload, pause/settings and responsive layout; inspect screenshots. Report physical-iPad and audio-listening limits honestly.

12. [User, 2026-09-13] Animate swaps and merges with a fast ease so their movement is readable. Both swapped pieces travel; each cascade neighbor visibly joins the destination before the next upgrade. Honor reduced motion and preserve saves, undo and pause.


## 0.2.0 match-3 revision — 2026-09-13
User selected a traditional match-3 pass while retaining the existing visual feel and eased animation.
13. Start with a filled 6×6 board of five candy types, without pre-existing matches and with at least one legal move.
14. Swipe/drag one cell toward an orthogonal neighbor, or tap two neighboring cells. Swap only adjacent pieces. Runs of three or more identical pieces in a row/column clear; intersecting runs count each cell once. A non-matching swap visibly returns, without penalty.
15. Animate the swap, a short clear/squish, downward gravity and fresh gummies arriving from above. Resolve repeat cascades sequentially until stable. Keep fast easing and sound synced to clears.
16. Provide free hints and shuffle, plus undo. Automatically refresh an immovable board. No timer, lives, move limit or forced reset. Preserve discoveries and keepsakes through mistakes and undo.
17. Replace the supply tray with matched-candy progress and concise swap instructions. Candy clears unlock the two remaining silhouettes and four keepsakes at guaranteed milestones; retain existing ownership.
18. Use a version-2 local save, migrating version-1 settings/discoveries/keepsakes without deleting the old save. Replace the incompatible sparse merge board with a new match-3 layout. Keep a Git tag of 0.1.1.
19. Verify matching intersections, adjacency, rejected swaps, gravity, cascades, stable playable boards and migration. Browser-test tap, swipe, animation, cancellation, reload, hint/shuffle, reduced motion and phone/iPad layouts.

Mechanic signature: adjacent swaps → straight-line matches → clearing/gravity/refill → cascades on a full board. The user explicitly selected this revision of BOB-006. Compared with all nine other games and the Popcorn/Fling/Duet alternatives, only Gummy Nook uses match-3 board resolution; rhythm, navigation, station scheduling, construction, stealth and habitat/containment loops remain distinct. Book connection and original-invention boundaries are unchanged.

## 0.3.0 requested iteration — 2026-09-13
20. Allow swaps to all eight neighboring cells, including diagonal swipes/taps. Matches remain horizontal/vertical runs. Hints and dead-board checks include diagonal moves.
21. Add a gesture-unlocked short swish for each animated swap; raise pitch, harmony and sparkle with cascade depth, bounded in volume and respecting mute/pause.
22. Fix the landing blink by retaining all moving candy visuals until stationary destination art is painted in the same rendering turn. Match moving and stationary dimensions; preserve unchanged SVGs.
23. Designer-selected powerup experiment: Row Ribbon clears its row; Column Ribbon clears its column; Sugar Burst clears a 3×3 neighborhood. Swap a marked candy with any neighbor to activate it, even without a match. Matching a marked candy also activates it; effects can chain into other marked candies. First refill of every third successful move starting with the first delivers one cycling powerup. Badges and short on-screen instructions explain activation. No random purchase, inventory or loss of earned keepsakes.
24. Encode powerup and underlying candy together; preserve them through gravity, saves, undo and mixing. Extend version-2 validation compatibly. These are consumable board effects, not newly awarded collectible objects; no new clubhouse item is implied. Original candy-themed mechanics remain distinct from other games' core loops.
25. Verify diagonal input, powerup creation/activation/chains, saves, sound escalation, and continuous visibility across staggered landings. Preserve existing browser/touch acceptance checks.

## 0.4.0 power overlays — 2026-09-13
26. User requests unmistakable overlays: row/column effects shoot across their lanes; 3×3 effects explode/pop outward. Keep the effects clipped to the board, short, and cancel-safe.
27. Add Frost Flake, an original snowflake-marked board power. It affects both full diagonals through the activated cell (an X): frost grows, holds briefly, cracks and fizzles into shards before those candies clear and refill. It can chain with other powers. Include it as the fourth cycling refill delivery; preserve existing saves and powers.
28. Honor reduced-motion bypass and mute. Verify effect-specific overlays, X coverage and chaining, save/undo/mix persistence, cancellation, and settled board visibility.

29. [User, 2026-09-13] Amplify powerup animation drama and add custom sounds. Use a brief charge/focus, larger projectile trails and impact showers, layered burst shockwaves, and stronger frost/shatter. Give row, column, burst, freeze onset and ice break distinct synthesized cues, bounded during chains and respecting mute/pause/reduced motion. Preserve rules and saves.


30. [User experiment, 2026-09-13] Slowly shift the background behind the tiles with progress. Blend mint, sky blue, lavender, rose and apricot over 120 cleared gummies per color chapter; ease each update over six seconds. Keep candy colors fixed and tile wells light for readability. Derive the palette from saved cleared count; reduced motion skips transitions.

# Feedback addendum — 2026-09-16

Grid candy icons have fine-pointer hover feedback. Touch remains tap/swipe-first. Respect both OS reduced motion and the in-game Motion preference; preserve all board/power/save behavior. See feedback-hover-2026-09-16.md.

## 0.5.0 TypeScript maintenance revision — 2026-09-19

31. Replace active authored gameplay JavaScript with strict TypeScript classes,
not a TypeScript wrapper. Separate the typed board/power engine, save
codec/store, renderer/art, audio, motion queue and controller while preserving
the exact 6×6 rules and visual outputs.
32. Keep `bob-gummy-nook-v2` and idempotent import from undeleted
`bob-gummy-nook-v1`. Validate only 36-cell 0–4/10–29 boards, recover malformed
or future fields safely, and keep undo transient/session-only.
33. Pin the compiler and lockfile. Build reproducible self-contained `dist` and
standalone HTML from compiled production TypeScript; tests must consume compiled
production exports, including migration, 250 turns, powers and interruption
state.
