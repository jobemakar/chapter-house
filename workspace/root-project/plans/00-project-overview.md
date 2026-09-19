# Collection overview

## Current application direction — consolidated 2026-09-14

2026-09-17 update: [Luminous Locks removal](39-remove-luminous-locks.md).
Rejected trial removed completely from local source/assets/catalog and packaged
menu; thirteen standalone previews remain. Hosted checkpoint is unchanged.
Moonlight Munch Run shooter evolution was authorized 2026-09-17; see
[local shooter slice](42-local-moonlight-shooter-slice.md). Standalone only,
generated comic art, supply/restock recovery and retained upgrades/boss progress.

A cozy ten-game collection with customizable animal avatars, interactive pets and shared isometric rooms for a small credentialed member group. Guests play locally with saved progress. The current source of product truth is the [brief](19-application-brief.md), [numbered requirements](20-application-requirements.md) and [build plan](21-application-plan.md).

Core conflicts are resolved: floor/wall placement first, no tabletop stacking; pets/wearables exempt from display forms; full-size furnished rooms; anytime visits; immediate invitation pauses; game-exclusive keepsakes and active-play currency; no overall player level. Firebase is the hosting direction. Build the shared space and one game together and get the complete loop right before integrating the other nine.

## Current session handoff — 2026-09-16

[Plan 37](37-local-waterfall-and-session-handoff.md) records the approved local
waterfall redesign, verification and next-session entry checklist. Jobe explicitly
said keep local: private hosted version 2 is unchanged. The active application has
14 standalone previews plus integrated Wishbone, not 14 gameplay integrations.
Read the handoff and latest application documents before resuming; await fresh
feedback rather than automatically starting another feature.

## Historical project log

Latest local appearance trial: [plan 38](38-local-treehouse-trial.md), authorized
2026-09-17 after a generated concept review. Clubhouse floor/walls use timber,
branch supports and canopy foliage. Original shell is retained for rollback;
saves, town and hosted Site remain unchanged. Trial awaits Jobe's feedback.

The dated notes below describe earlier decisions/builds and are preserved as history. They do not override the consolidated specification or establish a current playable count.
Created: 2026-09-10  
Owner: Jobe Makar  
Audience: his daughter, starting fourth-grade Battle of the Books

## User direction
She is beginning a ten-book reading list. Jobe is considering one game per book, with ongoing iteration and a possible unified game lobby later. Games should be fun rather than educational. The original request explicitly excluded questions in the game, requested audio and an intentional attractive art style, and preferred challenge that causes friction without stopping or resetting play.

On 2026-09-10, Jobe requested this persistent workspace, shared idea logging, distinct mechanics across books, editable/rebuildable source, and requirements that guide generation even when the designer invents the concept.

## Initial decisions — historical
- Stormglide is candidate 01 and already has a working public release.
- All ten books are identified from the 2026-09-10 photo. See catalog.json and 03-ten-game-pitches.md; three games have demos, with revision plans for two; seven games remain unbuilt.
- Each known book gets its own folder.
- Shared planning and cross-game comparisons live in `plans/`.
- Per-game requirements, visual decisions, source, assets, and playable belong in the corresponding book folder.
- Author games from explicit requirements, then verify the relevant acceptance checks.
- No common engine or universal game format is mandated. Maintainability and genuinely different play matter more.
- A lobby remains an idea for later. Keep stable metadata now; do not implement accounts, shared saves, or cross-game rewards.

## Initial collection — historical
| Candidate | Book | Game | Primary mechanic | State |
| --- | --- | --- | --- | --- |
| 01 | The Miscalculations of Lightning Girl | Stormglide | Continuous free-flight collection, obstacle avoidance, and timed dash | Implemented; public; initial candidate for iteration |

## Next time a book is added
Read the registry, record concepts and their mechanic comparisons, select a direction, and write the numbered requirements before building. Use `game-requirements-template.md` as a starting point. Update the catalog and add a concise shared game summary.

## Optional information to collect later
Playtest feedback and any book-specific spoiler boundaries. The primary device is now confirmed as iPad. None is needed to establish this workspace.

## 2026-09-10 update
All ten book folders and concepts are recorded. Stormglide has a local touch-first revision. Shared-world concepts and multiplayer feasibility are discussion-only. See 03-ten-game-pitches.md, 04-meta-game.md, and 05-multiplayer-feasibility.md. The current Sites audience restriction must be addressed through suitable hosting before a child-facing connected collection is implemented.

## Three-demo build update — 2026-09-10
Jobe selected Pocket Funhouse and Wishbone’s Big Fetch. Both now have local 0.1.0 demos, requirements, readable source, art, audio and tests. Three games are playable; seven remain concepts. Pause further game production after this build for review. Hosting comparisons and factual book anchors are recorded in 07-hosting-comparison.md and 08-book-connections.md.

## Revision 2 planning — 2026-09-10
User feedback selected new Funhouse route-construction and Fetch physics-collapse directions. The meta-layer should be isometric 3D, support objects on furniture, and keep spatial geometry suitable for later walking without planning an avatar. All named collectibles need placeable, thematically related forms; very loose links are allowed. Planning documents 10–12 govern this direction. No runnable game was changed in this planning pass.

## Wishbone replacement implemented — 2026-09-11
Wishbone’s Big Fetch: Backyard Ruckus 0.2.0 is now the current local Fetch demo. Two physical tower yards replace hoops with a sock projectile, dog charges and persistent collapse. Six pet-themed keepsakes have future floor/tabletop forms. The original 0.1.0 standalone and save are preserved. See wish/plans/design.md and wish/plans/verification.md (relative to the collection root). Funhouse remains its original demo pending its planned replacement; the clubhouse remains unbuilt.

## Fourth playable — 2026-09-11
Midnight Snow Jam 0.1.0 is now implemented locally at the user's request to choose an unbuilt game. Four book games have playable demos (Stormglide, Pocket Funhouse, Wish/Fetch, Snow Jam); six remain unbuilt. Wish also retains its Fling experiment. Snow Jam adds the collection's distinct rhythm loop with original audio, expressive Arctic friends and five placeable keepsakes. See 14-midnight-snow-jam.md.

## Snow Jam alternative — 2026-09-12
Arctic Duet is a separate local two-character musical catching experiment requested by the user. Easy opening and continuous levels; original Snow Jam remains available. Four book games remain built, six unbuilt. See 14-midnight-snow-jam.md.

## Picture Day Parade implemented — 2026-09-12
Popcorn now has a local 0.1.0 camera game: three animated scenes, draggable crop, timed prop cues, burst, nine composition discoveries and an optional persistent album. No publication or shared progression. See popcorn/plans/requirements.md and popcorn/plans/verification.md.

## Original Popcorn concept revived — 2026-09-12
At Jobe’s explicit request, Popcorn Contraption Club is now a separate local physics-construction experiment. Picture Day Parade remains intact. See popcorn/experiments/contraption-club/README.md.

## Sixth book demo — 2026-09-12
Midnight Merienda (Mabuhay!) now has a local 0.1.0 demo. Six of ten books have demos: Lightning Girl, Locked Rooms, Wish, Very Very Far North, Popcorn and Mabuhay. Four remain unbuilt: Not If I Can Help It, Amari and the Night Brothers, The Elephant in the Room and Wildfire. See 17-midnight-merienda.md.

## Seventh book demo — 2026-09-13
Gummy Nook (Not If I Can Help It) now has a local 0.1.0 demo. Seven of ten books have demos. Amari and the Night Brothers, The Elephant in the Room and Wildfire remain unbuilt. See 18-gummy-nook.md.

## Contraption level campaign — 2026-09-13
Popcorn Contraption Club 0.2.0 now has six puzzle levels and persistent completion. The collected-popcorn recirculation bug is fixed. Legacy sandbox and save are retained; Picture Day remains unchanged.

## Moonlight challenge / animated frames — 2026-09-17

Jobe's feedback after the local shooter slice led to [plan43](43-moonlight-road-hazards-and-frame-animation.md):
harder approaches/bosses, avoid-only potholes/spore pods that jam firing for one
second, and actual generated four-frame actor animation. Source25/application100
checks and13 previews/19 exact-file verification pass; local browser reviewed.
Separate saves and other games/treehouse/waterfall remain intact. Keep local;
await playtest feedback. Hosted private version two remains unchanged.

## Wildfire Dig & Douse prototype — 2026-09-18

Jobe selected a new Wildfire direction: clear continuous channels to route a finite reservoir around bedrock and into a fire-hose intake. The local visual prototype includes smooth particle-based water, three optional canteen buddies, a fair capped dummy pipe, a mouth-only working intake, sealed board boundaries and a compact remote fire vignette. The earlier Emberwatch pitch remains as history. Current source, generated assets, exact prompts, requirements and verification live in `wildfire/`; this revision has not been published.

## Popcorn canonical Contraption port — 2026-09-19

Jobe selected the six-level Contraption campaign as Popcorn's canonical local game. It is now BOB-010-R3, version 0.3.0, with TypeScript source, fixed-fixture save normalization, v1 earned-progress import, and an append-only level catalog. Picture Day Parade v0.1.0 remains runnable only in `popcorn/archive/picture-day-parade-v0.1.0`; the legacy Contraption sandbox remains directly playable. No publication occurred.

## Remaining standalone TypeScript ports — 2026-09-19

Jobe selected Arctic Duet over Midnight Snow Jam and Moonlight Munch Run over
Midnight Merienda. The selected games are now canonical in their book
repositories; Snow Jam and Merienda remain complete runnable versioned archives.
Jobe also selected Wishbone Fling and archived Backyard Ruckus, but explicitly
deferred the standalone Fling TypeScript port because Fling is being revised in
Chapter House. The application repository and its packaged previews were not
changed by this pass.

Stormglide, Pocket Funhouse and Gummy Nook now use strict TypeScript and
object-oriented authored gameplay. Arctic Duet was promoted and ported the same
way. Moonlight Munch Run and Bureau After Dark already used strict TypeScript;
their canonical packaging/tooling is now independently reproducible within each
book repository. Save keys and archived playables were preserved. Sanctuary
Seasons remains a proposal with no programmed game to port. No publication
occurred; physical-device and subjective audio checks remain pending.
