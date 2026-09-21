# Bureau After Dark — parchment mysteries, revision 2

## Physical-phone layout repair — 2026-09-21

Jobe's portrait screenshot showed the transparent object hotspots inheriting
large rounded Chapter House button chrome and Archive colliding with the status
line. The integrated package now force-resets those six hotspots while retaining
54px touch targets and visible keyboard focus, separates Archive from the
topbar, fits the complete board in short landscape, and bounds all dialog types
to the viewport with internal scrolling. Puzzles, navigation, saves, rewards and
art remain unchanged. Local only; do not publish this pass.

## Authorized visual refinement — 2026-09-17

See parent [plan 45](../../plans/45-bureau-illustrated-collectibles-and-rooms.md).
Jobe requested richly illustrated Case File/Cryptid Record collectible cards,
actual searchable-object illustrations in place of labeled ovals, and restrained
environment richness preserving the eerie midnight mood. Root is implementing
this visual pass, preserving all mechanics, durable IDs/saves and separate rewards.
The Chapter House private Site will receive the refreshed standalone build.

## Toolchain migration — 2026-09-19

This repository is independently reproducible with its own pinned Node toolchain.
The migration must not use `../application/node_modules`, alter game source or
assets, change the two floors, duplicate-safe reward claims, archive prototype,
playable identity/size, or browser save keys `bureau-after-dark:progress:v2` and
`bureau-after-dark:muted`. It is validation and tooling work only; browser and
physical-device QA remain separate from static checks.

2026-09-17. User selected a riddle-based search game, explicitly superseding the earlier no-question principle for this game. Book anchors: Amari, the Bureau of Supernatural Affairs and supernatural investigations. Riddles, sigils, parchment magic and recovered items are original invented game content, not claimed book scenes.

## Brief and mechanic signature

Touch-first, unhurried top-down Bureau exploration. Search neutral spots, discover concealed parchment, tap or rub silver writing into focus, choose an answer, reveal an illustrated sigil, then consult its journal order clue. Use three sigils at an archive to claim a permanent collectible and unlock the next department.

Input: tap destination/search spot; tap or scrub parchment; tap answer/sigil/order slots. Verbs: search, reveal, solve, collect, sequence. Loop: explore → parchment → riddle → illustrated sigil → journal → archive → keepsake/new floor. Two authored rooms with shelves and automatic pathfinding. Mistakes offer another attempt without losses. Distinct from other selected games' flight, physics throws, matching, rhythm, cooking, photographs and machines. Prior disguise stealth is preserved as historical concept; this user-selected mystery supersedes it.

## Functional requirements

1. Exactly two authored levels, three hidden sigils each, plus empty searchable areas. Generic location and parchment labels must not expose answers; undiscovered sigil art/names stay hidden.
2. Each level automatically walks Amari clear of the elevator before accepting exploration input. Tap navigation routes around shelves; tap a spot walks there and then searches.
3. A successful search plays a pleasant original synthesized chime (with mute), and parchment animates into view. Empty areas give gentle feedback.
4. Silver writing initially blurred/veiled. A tap OR finger rubbing reveals it, with visible magical response. No ability cooldown or time pressure. Touch scraping prevents scroll only on the parchment.
5. Riddle choices appear once writing is readable. Neutral title; wrong answers retry without losing found sigils.
6. Correct answer reveals the matching generated sigil illustration with animated stardust. One tap dismisses the reveal and opens the journal, showing a small image, name and ordering clue.
7. Journal has three clearly readable slots per floor, conceals unearned identities, highlights new finds, and is always recoverable. Six generated illustrations are reused as large reveals and small icons.
8. Archive requires all three sigils. Tapping sigils builds the required order; clear/retry freely. Correct order grants the floor collectible exactly once, preserves it in collection, and unlocks level two after floor one.
9. Floor one: Moon, Feather, Key → Night Garden case file. Floor two: Star, Shell, Flame → Lanternwing cryptid record. These are invented Bureau records.
10. Durable browser-local save stores earned sigils, permanent collectibles and unlocks. Reload restores them; replay never erases collection. Storage-unavailable mode remains playable and reports session-only saving.
11. Preserve indigo/gold visual treatment; responsive phone portrait, landscape and iPad layouts; large touch targets, keyboard activation, dialog focus management, reduced-motion behavior, accessible help/mute/fullscreen fallback. No chase/health/timer.
12. Maintain readable TypeScript classes and reproducible self-contained HTML build. Preserve original prototype in archive. Update Chapter House's local standalone snapshot/provenance only for this game. No shared account/reward integration or publication.

## Implementation plan and ownership

Canonical source moves to this stable book folder. Domain subagent owns src/domain.ts and tests/domain.test.ts: two-level definitions, progression, saves and shelf-aware routing. Root owns src/game.ts, src/template.html, build.cjs, assets, browser verification and packaging. Build embeds generated raster assets and transpiled runtime into playable/Bureau-After-Dark.html. Package exact reviewed bytes into application/preview-sources/bureau-after-dark/index.html and update its manifest source/hash. Root reviews domain code and runs meaningful unlock/persistence/navigation tests, typecheck, production build, preview byte checks and browser tap/scrub playthrough at desktop and narrow viewport.
