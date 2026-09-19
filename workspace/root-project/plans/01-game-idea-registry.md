# Game idea registry

## META-001 workspace package migration — implementing 2026-09-19

Jobe authorized moving Wishbone Fling into the independent workspace-package
structure proven by Dig & Douse, then integrating the other canonical games
through the same process. This is architecture and delivery work, not a mechanic
redesign: each game retains its recorded mechanic signature, canonical source,
standalone launch, saves, archives, and distinct presentation. Chapter House
adds the shared lifecycle, active-play currency, durable progress, and scoped
keepsake boundary without iframes or `postMessage`.

Eight additional canonical games have implemented TypeScript sources:
Stormglide, Pocket Funhouse, Arctic Duet, Moonlight Munch Run, Gummy Nook,
Bureau After Dark, Contraption, and Veda's Great Escape. On 2026-09-19 Jobe
selected Veda as the canonical *The Elephant in the Room* game, superseding the
proposal-only Sanctuary Seasons concept. Its five-puzzle JavaScript study was
ported to a strict TypeScript/OOP workspace package and integrated through the
shared registry. Requirements and sequence are in
[plan 47](47-workspace-game-package-migrations.md). Local only; no publication.

## BOB-007 visual refinement — implemented 2026-09-17

Jobe authorized [plan 45](45-bureau-illustrated-collectibles-and-rooms.md) after
phone feedback. Richly illustrated final record cards, generated search objects
and restrained nighttime floor richness replace bland presentation. Existing
two-floor search/reveal/riddle/sequence signature stays unchanged. Baseball/card
game references inspire presentation only; trading/battles/rarity are not added.

## Moonlight Munch Run evolution — discussion only 2026-09-17

Source research/comic gameplay mockup now prepared with Jobe's go-ahead:
[plan 41](41-shooter-source-and-art-mockup.md). Candidate source is MIT Space Patrol
for actual wave/weapon/health modules; bosses and retained progression need authored
adaptation. Current playable remains unchanged pending mockup feedback.

Detailed confirmed answers and unsettled defaults:
[plan 40](40-moonlight-shooter-discussion.md). Food supply damage/restocking,
persistent switching/upgradable shot types, additive rapid fire, automatic food
shots, progressively richer waves and stopped-road bosses are discussed there.
No implementation authorized. Generated animated art is the requested direction.

Jobe likes endless travel and shooting, asks about adapting a licensed existing
arcade shooter (Galaga or another suitable source), and is open to exploring lives.
First preference: keep traveling, with richer attack waves. Candidate direction:
scrolling journey with authored formations, dive attacks, distinct waves and bosses.
No source selected or implementation authorized. Food supplies serve as health;
restocking continues the journey and preserves weapon/boss progress.
Jobe confirmed shooting means shooting food: a fed creature disappears or leaves.
This feeding theme is retained even if movement/waves/lives adopt arcade-shooter
logic. Unfed creatures reaching/passing the truck cost supplies. Preserve current
Moonlight Munch Run until separately authorized implementation.

## Phone walkthrough concepts — implemented trials 2026-09-16

BOB-002-ALT2 Door Atelier is rejected by Jobe as confusing and visually
unsatisfactory. Preserve source/save history; remove it from the active menu.
Pocket Funhouse remains available, with celebration delayed until spark arrival.

BOB-002-ALT3 Luminous Locks: **rejected and completely removed locally by Jobe
on 2026-09-17**. Historical concept below is retained only as design history,
not an active proposal. Source/assets/playables and packaged preview removed.
No publication authorized. Pocket Funhouse remains the selected game.

Historical concept: mysterious/eerie illustrated puzzle-box mansion.
Tap mirrors to rotate them, observe light routes, align receivers, open a door.
Authored stationary rooms, freely reversible moves and free hints/reset; no
quizzes/timers or lost progress. Generated cartoony room art plus functional
separate interactive pieces. Same-book light-routing overlap is intentional;
unlike Contraption this is not free machine construction. Distinct from cooking,
matching, flight, music, photography, sliding and tending. Mansion/secret-passage
anchor retained; mirror conservatory and mechanisms are invented.

BOB-005-ALT1 Moonlight Munch Run: top-down endless food-truck drive. Left thumb
steers vertically, right thumb tosses snacks; mouse Y steers and click tosses.
Scrolling road, approaching hungry folklore-inspired creatures, happy feeding
departures, harmless collisions and no game over. Separate from retained
Merienda cooking. Jobe explicitly chooses continuous steering overlap with
Stormglide; feeding moving targets replaces free flight/dash. Truck/family and
folklore are verified book anchors; feeding and routes/creatures are invented.
Source: https://schol.ca/our-books/book/mabuhay-9781338738643 . Side-view jumping
runner deferred in favor of top-down. Kindness errands and market photography
rejected in discussion; time-loop hotel deferred in favor of mansion puzzles.

Requirements/ownership/checks: [plan 36](36-phone-walkthrough-revision.md).

## BOB-002-ALT2 / collection feedback — implemented standalone trial 2026-09-16

User requests a separate Doors: Paradox-inspired experiment while preserving
Pocket Funhouse. Door Atelier uses orbit/inspect/collect/use and linked physical
mechanisms in three miniature door scenes. No typed answers, timers or lost
progress; free help. Signature: inspect a spatial diorama → find a useful part →
operate a socket/mechanism → open a passage. Different from the original track
routing and deferred wandering-key construction, and from other games' flight,
projectiles, rhythm, cooking, matching, stealth, sliding, tending and photography.
Reference format inspiration only; original scenes/puzzles/art. Funhouse/secret
passages anchor the book connection; mechanisms are invented. User-selected
same-book comparison, not a production replacement or gameplay integration.
Other feedback refines Veda touch controls, fixed/movable Contraption cues,
Gummy hover, Merienda generated food art, and town windmill/well/organic water.
Requirements: `application/docs/collection-feedback-06-plan.md`. Publication of
world plus all standalone previews to ChatGPT Sites is explicitly authorized.

## META-001 standalone preview menu — 2026-09-16

Implemented at Jobe's request: nine other book demos and three comparison
versions can be opened from Chapter House Games as standalone previews. This
does not integrate games, add mechanics or grant shared rewards; all prior
mechanic signatures and variant history remain. See plan 34 and
`application/docs/game-previews-verification.md` for artifact inventory and
actual verification. Local only, not a publication.

## META-001 / Wishbone depth refinement — 2026-09-16

Selected feedback: remove the fixed fountain coin button, retain direct
proximity-bound fountain taps, and separate the Fling fence from mountains.
Fence/ground share zoom and vertical anchoring; near horizontal parallax is
almost world-speed and faster than the mountains. Presentation-only refinement
of the unchanged launch/topple/retrieve signature; no competing mechanic or
progression change. Requirements and verification reside in
`application/docs/feedback-05-plan.md` and `feedback-05-verification.md`.

## META-001-R3 — social ten-game clubhouse, consolidated 2026-09-14

Status: selected product direction, planning complete for the application brief; implementation not performed here. [Brief](19-application-brief.md) · [Requirements](20-application-requirements.md) · [Build plan](21-application-plan.md).

- Input: touch navigation/placement, PC equivalents and menu-based game selection.
- Verbs: play, earn, decorate, customize, walk, visit, jump, wave and interact with pets.
- Loop: play a distinct book game, save durable progress, earn currency/keepsakes, personalize the room and visit friends.
- Space: full-size fixed-isometric clubhouse, separate game UI, floor/wall placement, no tabletop nesting in first release.
- Challenge/recovery: optional per-game challenges; no death, consequential countdowns or lost ownership; invitations temporarily pause play immediately.
- Progression: exclusive game keepsakes plus active-play currency for shop furnishings/outfits/pets; no overall level. At least 15 pet kinds, one of each owned, one chosen free starter and one mystery pet from trying all ten games.
- Social: credentialed members only, automatic friends, anytime visits, online notices and invitations, live owner decorating, no chat/gifts. Visitors may summon one following pet.
- Distinctness: this connects existing game mechanics rather than reskinning them or making every game multiplayer.
- Delivery: shared space plus Wishbone Fling (BOB-003-ALT1, confirmed first integration game) first; expand to the other nine only after that connected experience is sound. Connect current behavior first via a TypeScript/object-oriented game port, then iterate on mechanics. Preserve comparison builds and stable progress interfaces; every integrated game must meet the same language/design rule.

Animal avatars, the economy, floor/wall scope and pet/cosmetic display exemptions are selected. Shared rounded rig, exact animal roster, activity thresholds, reward prices beyond the entry targets and Firestore/RTDB split remain design/technical choices. The guaranteed mystery-pet exploration reward is selected; random acquisition is not. Visitor keepsake source/unlock popups are rejected. R2 stacking is deferred; historical prototype/source/save data is retained.

## BOB-SLICE-01A — selected first coding task, 2026-09-14

[Task definition and acceptance](22-first-coding-task.md): local isometric clubhouse plus a fresh TypeScript/object-oriented Wishbone Fling implementation preserving current behavior, durable progress, active-play currency and a placeable dog-bed reward. Firebase accounts/live rooms follow as checkpoint B of the same slice. No code implemented by this planning entry.

## Historical game and prototype inventory

The dated inventory below is retained for comparison. It predates newer build tasks; reconcile artifacts and variants before claiming a current count or integrating games. No readiness audit is implied by this consolidation.
Updated: 2026-09-13

Every substantive idea is logged before implementation. New game pitches remain proposed; their mechanics are reserved for comparison, not approved for production. Changing a skin or collectible does not make a new mechanic. Retain superseded and rejected ideas with reasons.

## Canonical TypeScript port decisions — 2026-09-19

Jobe selected Wishbone Fling for Wish, Arctic Duet for The Very, Very Far North,
and Moonlight Munch Run for Mabuhay. Backyard Ruckus, Midnight Snow Jam and
Midnight Merienda are preserved as complete runnable versioned archives.
Wishbone Fling's standalone JavaScript port is intentionally deferred to avoid a
conflict with active Fling work in Chapter House; neither that implementation nor
the application repository was changed.

Stormglide 0.3.0, Pocket Funhouse 0.1.1, Arctic Duet 0.1.0 and Gummy Nook 0.5.0
now have strict TypeScript/object-oriented canonical source and reproducible
standalone builds. Moonlight Munch Run 0.4.0 and Bureau After Dark 0.3.0 already
had typed class-based source; this pass promoted Moonlight and made both projects'
tooling repository-local. Existing save keys remain stable. Sanctuary Seasons is
still only a proposed concept, so there was no implementation to port. No game or
Chapter House build was published.

## Revision index — historical snapshot, 2026-09-13

The original concepts and implemented demos are retained below for history. The dated count in this snapshot predates later builds; newer revision rows document current work. Only Stormglide had been published at the time of the snapshot.

| Revision           | Direction                                                                                                                       | State                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| BOB-002-R2         | Pocket Funhouse: The Wandering Key — Rearrange platforms and mechanisms to guide an autonomous wind-up key to a lock            | redesign-planned                                                                                   |
| BOB-003-R2         | Wishbone’s Big Fetch: Backyard Ruckus — Aim a toy projectile to trigger dog pursuit and physics collapse of authored structures | Implemented local 0.2.0 prototype, 2026-09-11                                                      |
| BOB-003-ALT1       | Wishbone Fling — Launch the dog directly into authored physics structures, with optional banked powerups                        | Implemented local experiment 0.2.0, 2026-09-11; compare before selecting winner                    |
| BOB-004-R2         | Midnight Snow Jam — Forgiving rhythm performance with an Arctic animal ensemble                                                 | Implemented local 0.1.0, 2026-09-11                                                                |
| BOB-004-ALT1       | Arctic Duet — Independently slide two Arctic friends to catch falling musical snacks                                            | Implemented local experiment 0.1.0, 2026-09-12; Snow Jam retained                                  |
| BOB-005            | Midnight Merienda — Two-pan cooking, topping and pictured-order service                                                         | Implemented local 0.1.1, 2026-09-13                                                                |
| BOB-006-R2         | Gummy Nook — Squishy merge-and-shape discovery board                                                                            | Implemented local 0.1.1 and retained as the pre-match-3 revision, 2026-09-13                       |
| BOB-006-R3         | Gummy Nook — Adjacent match-3 swaps, line clears, falling refills and cascades                                                  | Implemented local 0.2.0; current catalog revision, 2026-09-13                                      |
| BOB-009-R2         | Dig & Douse — Excavate channels to route finite simulated water into a fire-hose intake                                      | Implemented local visual prototype; current Wildfire direction, 2026-09-18                         |
| BOB-010-R2         | Picture Day Parade — Frame and time snapshots of playful animated photo scenes                                                  | Implemented local 0.1.0, 2026-09-12                                                                |
| BOB-010 experiment | Popcorn Contraption Club — Build and adjust machines carrying circulating popcorn                                               | Implemented local experiment 0.1.0, 2026-09-12; historical                                        |
| BOB-010-R3         | Contraption — Six authored, forgiving popcorn-routing puzzles with fixed fixtures and switches                                  | Implemented local canonical 0.3.0, 2026-09-19; Picture Day archived intact                         |
| META-001-R2        | Isometric 3D clubhouse with placeable collectibles and parented support surfaces                                                | Production placement system remains planned and unbuilt                                            |
| META-001-EXP1      | The Book Nook Clubhouse — Fixed-isometric scrolling island with Pip, a pathfinding pet                                          | Implemented as standalone Terra prototype, 2026-09-12                                              |
| META-001-EXP2      | The Chapter House — Fixed-isometric interior and terrace with click-to-walk readers, Fig and furniture-aware pathfinding        | Implemented as separate standalone Astra prototype, 2026-09-12; compare before selecting direction |

[Full mechanic signatures and all-ten overlap check](10-redesign-direction.md) · [Items](11-collectible-catalog.md) · [Clubhouse](12-isometric-clubhouse.md)

### Original concept / demo index

| Idea | Book | Game | Primary mechanic | State |
| --- | --- | --- | --- | --- |
| BOB-001 | The Miscalculations of Lightning Girl | Stormglide | Free-flight collection and timed dash | Implemented; touch revision |
| BOB-002 | The Mystery of Locked Rooms | Pocket Funhouse | Tactile mechanical room puzzles | Implemented local demo 0.1.0 |
| BOB-003 | Wish | Wishbone’s Big Fetch | Slingshot-style trick throws | Implemented local demo 0.1.0 |
| BOB-004 | The Very, Very Far North | Midnight Snow Jam | Forgiving rhythm performance | Implemented local 0.1.0; separate Arctic Duet experiment retained |
| BOB-005 | Mabuhay! | Midnight Merienda | Food-truck assembly and station juggling | Implemented local 0.1.1 |
| BOB-006 | Not If I Can Help It | Gummy Galaxy | Squishy merge-and-shape sandbox | Original pitch superseded; BOB-006-R3 Gummy Nook 0.2.0 is current |
| BOB-007 | Amari and the Night Brothers | Bureau After Dark | Hidden sigils, tactile riddle reveal and archive ordering | Implemented local 0.2.0; user-selected riddle revision |
| BOB-008 | The Elephant in the Room | Sanctuary Seasons | Habitat-building simulation | Proposed |
| BOB-009 | Wildfire | Emberwatch | Real-time containment strategy | Superseded proposal; BOB-009-R2 Dig & Douse is current |
| BOB-010 | Popcorn | Popcorn Contraption Club | Build-and-tinker chain-reaction machines | Implemented as local comparison experiment 0.1.0; BOB-010-R2 Picture Day is the leading catalog entry |

## BOB-001 — Stormglide

Date: 2026-09-10 · Status: implemented; iPad control refinement selected
Book: The Miscalculations of Lightning Girl

- Input: Relative thumb steering plus a second-thumb dash; keyboard and mouse remain optional.
- Verbs: steer, collect, dodge, dash.
- Loop: Choose an approaching path → steer → collect or dash → continue through changing skies.
- Space: Continuous 2D scrolling flight.
- Challenge/recovery: Brief slowdown and combo friction; score and discoveries remain.
- Progression: 12 pups, five trails, score, recurring chapters.
- Visual treatment: Twilight gouache, soft cream type, mint and rose light.
- Comparison: Existing baseline. No new candidate uses its scrolling steer/collect/dash loop.
- Plan: [Requirements](../the-miscalculations-of-lightning-girl/plans/requirements.md).

## BOB-002 — Pocket Funhouse

Date: 2026-09-10 · Status: implemented local demo 0.1.0; original pitch retained
Book: The Mystery of Locked Rooms

- Input: Drag room parts; rotate with a large on-screen handle; tap mechanisms.
- Verbs: slide, rotate, connect, reveal.
- Loop: Manipulate room geometry → trigger physical mechanisms → reveal a route or treasure → explore another room.
- Space: A dollhouse of connected, inspectable rooms.
- Challenge/recovery: Misaligned parts are freely reversible; alternate open rooms and optional mechanism nudges prevent forced stalls.
- Progression: Mechanical curios, expanding funhouse wings, alternate routes.
- Visual treatment: Cut-paper theatrical dioramas, jewel colors, brass machinery.
- Comparison: Different from Popcorn's machine construction: these are authored mechanisms to manipulate and uncover, not player-built production chains. No riddles, trivia, or typed answers.
- Plan: [Pitch](../the-mystery-of-locked-rooms/plans/pitch.md).

## BOB-003 — Wishbone’s Big Fetch

Date: 2026-09-10 · Status: implemented local demo 0.1.0; original pitch retained
Book: Wish

- Input: Drag to aim and set power; release to throw.
- Verbs: aim, launch, bounce, fetch.
- Loop: Choose a target path → make a throw → watch the ricochets and dog chase → immediately throw again.
- Space: One playful yard diorama at a time; discrete projectiles.
- Challenge/recovery: Misses become goofy fetch animations; the disc always returns, with no lives or reload screen.
- Progression: New discs, yards, trick-shot badges, dog accessories.
- Visual treatment: Warm watercolor summer, chalk trails, paper-textured gardens.
- Comparison: Unlike Stormglide, movement is not continuously steered. Unlike Popcorn, the player directly launches each projectile rather than constructs a machine.
- Plan: [Pitch](../wish/plans/pitch.md).

## BOB-004 — Midnight Snow Jam

Date: 2026-09-10 · Status: implemented local 0.1.0; separate ALT1 experiment also implemented
Book: The Very, Very Far North

- Input: Tap broad beat pads and make short directional swipes; generous timing windows.
- Verbs: tap, swipe, layer, perform.
- Loop: Play a musical phrase → add an instrument or flourish → flow into the next arrangement.
- Space: A stationary musical stage; timed patterns rather than navigation.
- Challenge/recovery: Misses soften a flourish without stopping the song or removing prior rewards; optional relaxed tempo.
- Progression: Band members, instruments, arrangements, stage lights.
- Visual treatment: Felt-and-paper Arctic theater, pale blues and gentle aurora ribbons.
- Comparison: The only rhythm-led candidate. It shares audio with the other games but makes musical timing its primary input.
- Plan: [Pitch](../the-very-very-far-north/plans/pitch.md).

## BOB-005 — Midnight Merienda

Date: 2026-09-10 · Status: implemented local 0.1.1
Book: Mabuhay!

- Input: Drag ingredients to stations and plates; tap/short swipe to finish actions.
- Verbs: assemble, cook, plate, serve.
- Loop: Read pictured orders → coordinate stations → finish and serve dishes → unlock festival bustle and new combinations.
- Space: A compact multi-station food truck counter.
- Challenge/recovery: Orders wait or can be remade; missed timing reduces a bonus, not the run. No impatient-customer failure meter.
- Progression: Recipes, truck customizations, friendly customers, festival locations.
- Visual treatment: Vivid graphic-novel color, warm market lights, appetizing hand-drawn food.
- Comparison: Unique resource scheduling and assembly loop. Unlike Gummy Galaxy, ingredients form orders rather than merge through a combinatorial board.
- Plan: [Pitch](../mabuhay/plans/pitch.md).

## BOB-006 — Gummy Galaxy

Date: 2026-09-10 · Status: original pitch superseded; BOB-006-R3 Gummy Nook 0.2.0 is current
Book: Not If I Can Help It

- Input: Drag and drop shapes; pull large stretch handles; tap a free scoop tool.
- Verbs: place, squish, merge, discover.
- Loop: Position shapes → trigger a merge chain → discover a new form → rearrange and continue.
- Space: A contained soft-body board with reversible cleanup.
- Challenge/recovery: Crowding can be cleared with a free scoop/rearrangement; earned discoveries remain.
- Progression: Shape collection, palettes, board themes, gentle texture effects.
- Visual treatment: Translucent candy glass, clean aqua and peach palette, calm optional sound.
- Comparison: The only merge/discovery board. It does not model sensory processing differences as a defect, challenge meter, or thing to cure; the candy inspiration is a loose cover motif.
- Plan: [Pitch](../not-if-i-can-help-it/plans/pitch.md).

## BOB-007 — Bureau After Dark

Current: 2026-09-17 · Implemented local 0.2.0. User explicitly chose riddles: search neutral spots → tap/rub silver parchment → answer → collect illustrated sigil and journal order clue → unseal archive → keep record/unlock next floor. Two floors, six generated sigils, two persistent standalone records. This supersedes the original stealth proposal below. Riddles and records are invented game content; no shared-world reward integration or hosted update. [Current requirements](../amari-and-the-night-brothers/plans/requirements.md).

Original proposal: 2026-09-10
Book: Amari and the Night Brothers

- Input: Tap a destination; tap large disguise buttons; drag a distraction into place.
- Verbs: sneak, disguise, distract, retrieve.
- Loop: Observe patrols → choose a disguise/path → retrieve an object → adapt to the next room.
- Space: Connected top-down rooms with patrol routes and hiding spots.
- Challenge/recovery: Detection causes a short, recoverable disguise mishap or detour; recovered objects stay recovered.
- Progression: Disguises, enchanted artifacts, bureau departments.
- Visual treatment: Luminous indigo graphic novel, gold seals, whimsical magical silhouettes.
- Comparison: Unlike Pocket Funhouse, the challenge is timing around agents and choosing disguises, not manipulating room geometry. No scrolling flight/dash loop.
- Plan: [Pitch](../amari-and-the-night-brothers/plans/pitch.md).

## BOB-008 — Sanctuary Seasons

Date: 2026-09-10 · Status: proposed; awaiting design selection
Book: The Elephant in the Room

- Input: Brush terrain/water, drag habitat pieces, tap to observe interactions.
- Verbs: shape, plant, connect, observe.
- Loop: Create a habitat feature → watch animal/environment interactions → improve the arrangement → unlock new features.
- Space: An evolving overhead sanctuary with functional terrain and paths.
- Challenge/recovery: A poor arrangement is freely movable; dry areas and blocked routes can be repaired, with no animal injury or permanent losses.
- Progression: Habitat features, visitors, enrichment toys, expanded sanctuary areas.
- Visual treatment: Clay-and-watercolor miniature landscape, lush greens and warm terracotta.
- Comparison: Overlaps intentionally with the meta layer's placement interface only. This game's core challenge is a responding habitat system; clubhouse decoration is cosmetic expression. Different from Wildfire's excavation-and-water-routing puzzle.
- Plan: [Pitch](../the-elephant-in-the-room/plans/pitch.md).

## BOB-009 — Emberwatch

Date: 2026-09-10 · Status: superseded historical proposal
Book: Wildfire

- Input: Tap hotspots to assign water crews; drag broad protective lines and safe routes.
- Verbs: prioritize, contain, redirect, restore.
- Loop: Read changing hotspots → allocate a few active tools → create breathing room → adapt as the wind changes.
- Space: An evolving top-down map with spreading environmental pressure.
- Challenge/recovery: Smoke temporarily blocks an area; tools replenish and the forest can recover. No playable child faces a death state.
- Progression: Crew tools, forest regions, restored groves, rescue badges.
- Visual treatment: Stylized papercraft forest, ember orange against teal water, clear readable map.
- Comparison: Unique pressure-containment and resource-priority loop. Unlike Sanctuary Seasons, success depends on reacting to a moving situation, not long-term habitat construction. Fictional arcade abstraction, not survival instruction.
- Plan: [Pitch](../wildfire/plans/pitch.md).

## BOB-009-R2 — Dig & Douse

Date: 2026-09-18 · Status: implemented local visual prototype; selected Wildfire direction
Book: Wildfire

- Input: Drag or use one finger to clear continuous soil; keyboard clearing remains available.
- Verbs: inspect, clear, route, collect, douse.
- Loop: Read the terrain → carve a channel → watch the finite water flow → adapt or reset → extinguish the remote fire.
- Space: A portrait cutaway puzzle assembled modularly but rendered as continuous earth, plus a compact and deliberately separate hose/fire vignette.
- Challenge/recovery: Immutable bedrock, limited water, intake orientation and fair capped decoys shape the route. No timer, death state or permanent loss; reset is immediate.
- Progression: Future levels can vary board footprint, source direction, number and orientation of intakes, fair dummy equipment, gates and optional canteen paths.
- Visual treatment: High-contrast ochre soil and cyan water over a quiet evergreen frame. Working mouths, solid pipe bodies, capped dummies and rock collision must match their visible silhouettes.
- Comparison: Unlike Emberwatch's real-time resource allocation, this is a tactile terrain-editing and finite-fluid-routing puzzle. Unlike Sanctuary Seasons, there is no habitat economy or long-term simulation.
- Plan: [Design](../wildfire/plans/design.md) · [Requirements](../wildfire/plans/requirements.md) · [Verification](../wildfire/plans/verification.md).

## BOB-010 — Popcorn Contraption Club

Date: 2026-09-10 · Status: implemented as separate local experiment 0.1.0; BOB-010-R2 Picture Day Parade remains the leading catalog entry
Book: Popcorn

- Input: Drag machine parts; tap to rotate; move pieces while the simulation runs.
- Verbs: build, route, trigger, tinker.
- Loop: Place a device → watch moving popcorn → adjust the chain → unlock another ridiculous component.
- Space: A side-view construction sandbox with continuous circulating projectiles.
- Challenge/recovery: Spills automatically recirculate; unlimited editing and undo, with no destruction of collected rewards.
- Progression: Machine parts, chain-reaction discoveries, themed workshops.
- Visual treatment: Loose comic ink, buttery yellow, blue doodles, elastic cartoon motion.
- Comparison: Unlike Wish's direct trick shots, the player designs a reusable machine; unlike Pocket Funhouse, the player assembles new mechanisms rather than solves an authored room. Anxiety is not represented as a failure meter or joke.
- Plan: [Pitch](../popcorn/plans/pitch.md).

## Historical decisions retained

- BOB-001 was logged retrospectively after the original game was built. Jobe then requested requirements-first generation for future games.
- On 2026-09-10, relative thumb steering and simultaneous second-thumb dash were selected as BOB-001 refinements (SG-017–SG-022). The core flight mechanic is unchanged.
- At the initial 2026-09-10 review, no concepts had been rejected and none of the nine photo-derived concepts had yet been selected. Later selections and implementations are recorded below; no concept has been formally rejected as of 2026-09-13.
- Shared-world alternatives META-001–003 are logged in [the meta-game concept file](04-meta-game.md). They are a cross-game layer, not additional book games.

## Selection and book-anchor review — 2026-09-10
- Jobe selected BOB-002 and BOB-003 for demos. Their pre-existing mechanic signatures remain distinct from BOB-001 and BOB-004–010; numbered requirements were saved before implementation.
- BOB-002 implements authored track routing and reversible shutters. Whole-room rotation/platform traversal are deferred. Its original fantasy curios were replaced with original escape-room keepsakes after Jobe asked about book connections. No claim that these are literal book objects.
- BOB-003 implements discrete frisbee throws, ricochets and dog retrieval; rewards persist and misses cost nothing. Wishbone is verified as the source-book dog.
- BOB-004 and BOB-006 need stronger story anchors before implementation. BOB-010's popcorn-machine concept is particularly weak as an adaptation and should be reconsidered; retained as proposed history, no replacement selected.
- See [book connection audit](08-book-connections.md). Further games and meta-game implementation are deferred until the three-demo review.

## Revision 2 decisions
Jobe accepts very loose collectible-to-book links if the connection is explainable. Every named collectible gets a placeable form. The old Popcorn machine is retired as the leading proposal because it overlaps the new Funhouse construction loop; retain it as BOB-010 history. Funhouse constructs routes; Fetch collapses authored structures; Picture Day captures scenes. These share neither the same input nor the same goal. See the all-ten comparison in 10-redesign-direction.md.

## BOB-003-R2 implementation — 2026-09-11
User selected the replacement for implementation. Two repeatable physics yards, a rolled sock projectile, physical dog pursuit, persistent partial destruction, unlimited attempts and six placeable pet-themed keepsakes. Source, numbered requirements, tests and the 0.1 standalone are preserved in wish/. No overlap change: this is still aim-and-collapse, distinct from Funhouse’s proposed construction-and-routing loop. No additional games or clubhouse built.

## BOB-003-ALT1 selected experiment — 2026-09-11
Jobe selected the recommendation to build Floppy Fetch separately: launch plush-style ragdoll Wishbone into the exact same two yards. Preserve sock-and-chase for direct comparison. Jointed ears/paws/tail, floppy impact and a happy foreground return; unlimited attempts with quick recall. This direct-launch alternative was previously deferred. Full numbered requirements: wish/experiments/floppy-fetch/requirements.md. The intermediate idea of animated pursuit with occasional ragdoll impacts is recorded as deferred; selected experiment tests direct tossing first. No other book mechanic changes.

### BOB-003-ALT1 implemented
Floppy Fetch 0.1.0 is implemented as an independent local comparison with the same two yards, articulated plush physics and a separate save. Nineteen checks pass including the original game suite. BOB-003-R2 remains available and the leading catalog entry until family play feedback selects a winner. See 13-floppy-fetch.md.

BOB-003-ALT1 is now named **Wishbone Fling**, at Jobe’s request (0.1.1). Ears and overlay contrast improved; mechanic and save identity unchanged.

## Wishbone Fling 0.1.2 — 2026-09-11
Implemented drag-responsive dog presentation and animated toy expressions in BOB-003-ALT1; same two yards, physics, saves and input loop. 20 automated checks pass; browser visual QA was blocked for the staged local file. See wish/experiments/floppy-fetch/README.md.

Proposed only: Bounce Biscuit (three springy bounces), Magnet Bandana (nearby loose toy attraction), Tailwind Pinwheel (one mid-air gust), all bankable through level clears or airborne pickup contact for use on later levels. Proposed authored collision mechanisms: whack-a-lever gate, polarity button and bellows blast. Full mechanics, thematic/clubhouse forms, save semantics and overlap comparison: wish/experiments/floppy-fetch/next-mechanics.md. No new powerup, inventory or world-mechanism code was implemented. The signature remains discrete pull/release physics collapse; no continuous steering or route construction.

## BOB-003-ALT1 systems experiment selected — 2026-09-11
User selected all three bankable powerups (Bounce Biscuit, Magnet Bandana, Tailwind Pinwheel) and three authored impact mechanisms (gate lever, polarity button, bellows gust) for trial implementation, possibly rollback. Details and numbered requirements in wish/experiments/floppy-fetch/next-mechanics.md and requirements.md. Signature remains fixed-yard drag/release physics collapse with cumulative damage and optional consumables; no machine construction or continuous free steering. All-ten comparison from the proposal remains valid. Baseline saved as wishbone-fling-before-powerups before changes.

## BOB-003-ALT1 systems implemented — 2026-09-11
Selected powerups and mechanisms are now playable in Fling experiment 0.2.0. Same two four-target yards, optional bankable effects, cumulative collapse and free throws. 31 automated checks pass plus served-browser gameplay/visual checks. Prior animation version is preserved with a rollback tag. Inventory/physics details and tested-versus-unverified limits are recorded in wish/experiments/floppy-fetch/README.md.

## BOB-004-R2 selected for a playable — 2026-09-11
User asked Codex to choose any unbuilt game and generate a playable. Selected Midnight Snow Jam: four-pad musical performance with Duane, Major Puff, Handsome and Boo, original synthesized tunes, continuous forgiving progression and optional aurora flourish. Publisher-confirmed character/setting connection, original concert fiction. Stationary rhythm loop remains distinct from all nine other reserved game signatures. Numbered requirements written first in the-very-very-far-north/plans/requirements.md. Three tunes, touch pads, free jam and persistent placeable rewards; no further games or lobby in scope.

## BOB-004-R2 implemented — 2026-09-11
Midnight Snow Jam 0.1.0 is now a local playable: four-pad timed performance/free jam, three original synthesized tunes, growing Arctic ensemble, Aurora flourish and five placeable keepsakes. User authorized choosing any uncreated game; this selection preserves all-ten mechanic distinctness. Publisher-backed friendship/species links and original-invention boundaries are recorded in the game requirements. 15 tests pass plus browser startup/visual/save-reload inspection. No physical iPad or audio-listening claim. Source: the-very-very-far-north; shared summary: 14-midnight-snow-jam.md.

## BOB-004-ALT1 selected — 2026-09-12
User requested a separate Duet Cats-inspired alternative to Snow Jam, starting easy with seamless levelling. Arctic Duet: drag two Arctic friends independently beneath falling musical snacks in split halves. Sparse central notes gradually become spread notes and pairs; endless verses, harmless misses, original art/music, separate save. Explicit overlap with the same book's rhythm game chosen by user. All-ten comparison and numbered requirements written before code in the-very-very-far-north/experiments/arctic-duet/requirements.md. Original Snow Jam remains available.

## BOB-004-ALT1 implemented — 2026-09-12
Arctic Duet 0.1.0 now playable as a separate experiment, with original Snow Jam retained. Selected sliding/catching signature implemented, seamless levels and gradual difficulty, no failures, independent save and original synthesized score/art. 21 checks pass across the two games; browser layout and drag/save checks completed. See the-very-very-far-north/experiments/arctic-duet/README.md. No additional book game or publication.

## BOB-010-R2 implementation — 2026-09-12
Selected by Jobe and implemented locally as Picture Day Parade 0.1.0. Signature: drag crop / cue gag / time shutter / keep a print; static studio with moving subjects, recover through unlimited reshoots. Three scenes and nine moments, no album economy. All-ten distinctness audit remains valid: timing/composition rather than music synchronization, flight, construction or projectiles. Original BOB-010 machine remains retired history.

## Original contraption selected again — 2026-09-12
Jobe explicitly requested trying BOB-010 after Picture Day Parade. Build as a separate contraption-club experiment, retaining Picture Day. Original machine/Funhouse construction overlap is accepted for this comparison; many circulating physics particles and free device assembly remain distinct from the key-routing game. Requirements recorded first at popcorn/experiments/contraption-club/plans/requirements.md. Status: selected for implementation.

## BOB-010 separate experiment built — 2026-09-12
Popcorn Contraption Club 0.1.0 is now implemented locally at popcorn/experiments/contraption-club. Three editable starter machines, six devices, physical circulating kernels, saved layouts and undo. BOB-010-R2 Picture Day remains intact for comparison. Seven core tests and browser/touch-emulation checks pass; physical iPad and child playtesting pending.

## META-001 standalone prototype expansion — 2026-09-12
User expanded the clubhouse exploration beyond the placement-first META-001-R2 slice: a fixed isometric view with a scrollable world, a wandering pet and possible avatars with pathfinding; screen rotation was explicitly unnecessary. This is a meta-layer interaction study, not an additional book game. It adds navigation and inhabited-world behavior to the comparison without superseding the planned collectible placement/support model.

### META-001-EXP1 — The Book Nook Clubhouse
Implemented as a standalone Terra prototype outside the collection repository at `C:/Users/jmakar/Documents/Codex/2026-09-12/in-x20/outputs/book-clubhouse/index.html`. A fixed-isometric island supports drag/scroll panning, a minimap and Pip, a wandering pet using a reusable walkable-grid pathfinder. Future readers could reuse the navigation system, but no player avatar, collectible placement, saved room layout or collection integration is implemented.

### META-001-EXP2 — The Chapter House
After requesting a distinct comparison while retaining EXP1, the user received a separate standalone Astra prototype at `C:/Users/jmakar/Documents/Codex/2026-09-12/in-x20/outputs/clubhouse-astra/index.html`. It is a warm open-roof interior and garden terrace with click-to-walk readers, Fig the wandering fox, furniture-aware A* paths, panning, zoom, camera follow and optional extra readers. It does not connect to collection accounts, progress, rewards or persistent customization. Both clubhouse prototypes remain comparison studies; neither selects or implements the production META-001-R2 placement system.

## BOB-005 selected — 2026-09-12
User authorized choosing an unbuilt game. Midnight Merienda selected: two-pan cooking, flipping, topping and pictured-order service. All-ten comparison, sourced food-truck premise and invention boundaries recorded before code in mabuhay/plans/requirements.md. Touch-first, forgiving continuous service, local demo only.


## BOB-005 implemented — 2026-09-12
Midnight Merienda 0.1.0 is a local playable: two independent pans, flip/plate/topping/service, three unlockable foods, six invented regulars and four saved placeable keepsakes. All-ten distinctness review remains as selected in mabuhay/plans/requirements.md. Six core tests and browser service/touch/drag/save/layout checks pass. Physical iPad and child playtesting pending. No publication.

## BOB-006-R2 selected — 2026-09-12
User authorized choosing an unbuilt game. Gummy Nook selected: move and merge equal candy forms on a 5×5 tray, adjacent merge cascades, free scoop/undo, persistent discoveries. All-ten distinctness and numbered requirements recorded before implementation in not-if-i-can-help-it/plans/requirements.md. Local demo only.


## BOB-006-R2 implemented — 2026-09-13
Gummy Nook 0.1.0 is a local playable: seven candy forms, move/merge/adjacent cascades, supply preview, free scoop and undo, four saved placeable keepsakes, original art/audio and comfort settings. All-ten distinctness remains as selected. Seven core tests plus browser gameplay/touch/keyboard/save/layout checks pass. Physical iPad and family playtesting pending. See 18-gummy-nook.md. No publication.


## Gummy Nook 0.1.1 — 2026-09-13
Added user-requested quick eased swaps and sequential merge animation. Mechanics and save identity unchanged. Browser/touch acceptance and dedicated animation/interruption checks pass. Local outputs rebuilt; no publication.

## BOB-005 feedback revision — 2026-09-13
Midnight Merienda 0.1.1 adds user-requested animated rejected-plate return and happy departures followed by different-looking arrivals in stable slots. Cooking/service signature and prior all-ten distinctness comparison unchanged; no new concept or collectible.

## BOB-006-R3 implemented — 2026-09-13
User selected a traditional match-3 pass while retaining Gummy Nook art and quick eased animation. Full 6×6 board, adjacent swaps, straight-line clears, gravity/refill and cascades; invalid swaps return. Free hint, mix, undo and automatic no-move refresh. Existing discoveries/keepsakes/settings migrate from v1 without deleting it. All-ten distinctness remains: this is the sole matching board. Numbered requirements preceded implementation; details in not-if-i-can-help-it/plans/match3-design.md. Eight core tests (including 250 complete turns), responsive browser/touch/standalone migration checks and animation-interruption checks pass. Local 0.2.0, no publication.

## Gummy Nook 0.3.0 — 2026-09-13
User-selected diagonal swaps, swap swish, escalating cascade audio and landing-blink fix. Added experimental row/column/3×3 power gummies with chain reactions and periodic refill delivery. Matching remains straight-line; the core match-3 signature remains distinct. Saves and earned keepsakes preserved. 13 core/audio-recipe tests and browser touch/motion/power/landing checks pass. Local outputs rebuilt; no publication.

## Gummy Nook 0.4.0 — 2026-09-13
User-requested specialized power overlays implemented: row/column projectiles, radial sugar explosion and new Frost Flake X-freeze/crack/shard effect. Fourth periodic power delivery; saves and prior rewards retained. Match-3 signature unchanged. 14 core tests, browser regression and dedicated overlay/cancellation checks pass. Local demo only.

## Gummy Nook 0.4.1 — 2026-09-13
Amplified power overlays and added distinct row/column/burst/freeze/shatter audio at user request. Rules/saves unchanged. Overlay/interruption and rendered-audio checks pass; local outputs updated without publication.

Gummy Nook 0.4.2 (2026-09-13): user-selected progress-driven tray color drift, with saved progress and reduced-motion support. Local only; mechanic unchanged.

## BOB-010-R3 — Contraption Club levels, 2026-09-13
User selected authored machine puzzles, permanent clears and corn-triggered switches. Implemented as 0.2.0: six levels, fixed/movable devices, restricted toolboxes, multi-inlet clean-batch proofs, a linked-conveyor switch finale and continued editing after completion. Construction overlap with Funhouse remains explicitly user-chosen. Original many-particle physics and forgiving experimentation retained. See popcorn/experiments/contraption-club/plans/levels-design.md.

## BOB-010-R3 canonical port — 2026-09-19

Jobe selected the Contraption campaign over Picture Day Parade. Contraption is now the local canonical Popcorn game at `popcorn/`, version 0.3.0, retaining the six authored levels and stable numeric save positions while adding stable string IDs for append-only growth. Picture Day is archived intact at `popcorn/archive/picture-day-parade-v0.1.0`; the earlier Contraption sandbox is retained at the canonical root. The already accepted construction overlap remains a user choice; no publication or integrated-game claim is made.


## META-001 local integration — 2026-09-14

User selected Wishbone Fling as the first integrated game and authorized a fresh TypeScript/object-oriented implementation before mechanical iteration. Implemented BOB-SLICE-01A in application/: true 3D library room, avatar/pets, floor editing, local progress/currency, and the behavior-preserving Fling port. The existing launch/physics signature is unchanged; this creates no new competing game concept. All other games and earlier comparison prototypes remain intact. See plans/23-local-slice-implementation.md for verification and checkpoint B.

## META-001 / Wishbone Fling — 2026-09-15

Feedback 02 adds interactive bowl, aquarium and pet trampoline, clear coins, compact game overlays and five focused physics yards. Launch/topple/retrieve signature remains distinct; individual lever, bellows and magnet puzzles avoid stacking all devices. Old yard IDs/checkpoints retained. Larger scrolling/parallax deferred. See plans/25-interactive-furnishings-and-fling.md and application/docs/feedback-02-plan.md.

## META-001 / Wishbone Fling feedback 03 — selected 2026-09-15

User now authorizes parallax, zoom and camera movement (superseding the previous deferral), icon-only game actions, layered launcher, recognizable magnet/metal props, quieter classic yards, and a fill/feed/empty pet bowl cycle. Launch/topple/retrieve mechanics remain unchanged; this is presentation, camera and interaction refinement. Astra is writing application/docs/feedback-03-plan.md before implementation. No additional game concept or publication.

Feedback03 implemented: real camera parallax/pan/zoom, icon-only actions, layered launcher, simplified classics, horseshoe/metal blocks and completed pet-feeding cycle. Upward boost now uses a spring-pad metaphor following user clarification. Signature unchanged, saves preserved; see plan26 and application/docs/feedback-03-verification.md.

## META-001 / Wishbone Fling feedback 04 — implemented 2026-09-15

User selected a scrollable village, distinct character reactions, no collectible pocket powers, clear pouch/Y-fork launcher, collision audio and a wide parallax showcase. Implemented Willowbrook square and The Long Walk Home. Launch/topple/retrieve signature remains unchanged; town exploration is meta-space, not a new book game. Outdoor deferral is superseded; historical saves and owned displays preserved. See plan27 and application/docs/feedback-04-verification.md. Local only.

## META-001-ACT1 — Stream fishing and temporary digging, selected 2026-09-15

Jobe selected two forgiving Willowbrook activities for implementation. Input is a world-anchored contextual action plus a persistent Reel action; verbs are dig, cast, wait, reel, discover and collect. The loop is explore → use a context action → watch a short result → add a stacked discovery to the collection. Fishing works only at the stream and resolves an approximately 30 percent catch chance when reeling; digging works on walkable ground and leaves no permanent hole. Misses cost nothing and Reel has no timing failure. Fish and finds occupy separate sections of one persistent Collection view, with duplicate counts, rarity tiers and silhouettes for undiscovered entries. This is a shared-world collection layer rather than an additional book game and does not alter Wishbone Fling's launch/topple/retrieve signature. The same selected pass adds cartoony action audio and true mobile pinch zoom in town and clubhouse. Full numbered requirements: `application/docs/town-activities-plan.md`. Local implementation only unless publication is separately requested.

### META-001-ACT1 feedback revision — selected 2026-09-15

Direct playtest feedback changes the action presentation without changing the discovery mechanic: the persistent bubble is replaced by an avatar-toggled stationary radial menu that always shows Fish and Dig with unavailable actions disabled. Fishing receives stronger layered ripples; successful fish/finds receive a two-second illustrated name bubble; digging receives a new controlled scoop and temporary hole/mound treatment; the Willowbrook entry title now fades after orientation. Reel remains a non-expiring active prompt. Full requirements: `application/docs/town-activities-feedback-plan.md`.

### 2026-09-15 — Woodland village art pass (implemented)
[Plan 28](28-woodland-village-assets.md): selected Mini Forest timber/trees plus Nature Kit landscape accents for the outdoor world only. Replaces five rejected procedural houses with a clubhouse entrance, reading tent and flower garden; retains fountain, stream, pet and movement. Not a new book game or progression mechanic. Alternatives: mixing all tree styles rejected after visual review; large-world expansion deferred.

## BOB-005-ALT1 shooter evolution — local implementation 2026-09-17

Jobe authorized parent plan 42 after detailed discussion. Moonlight Munch Run
now uses free 2D steering, forward automatic food, catchable per-type upgrades,
additive rapid fire, increasingly patterned waves, supplies/free-restock recovery,
stopped-road bosses with projectiles/summons, and rechargeable special serving.
Durable upgrades, feeds/keepsakes and boss hunger survive continuation/reload.
Generated comic terrain/atlas replace procedural scenery; Beautiful Pig truck
cover anchors are verified, other characters/world are inventions. Real MIT
Space Patrol weapon/cadence/pattern routines are adapted with retained notice;
this is not a wholesale Galaga/source clone. See plan42 and original source
plans/source-adaptation.md. Scrolling/shooting overlap was explicitly selected;
Midnight Merienda remains a separate comparison. Local standalone snapshot only.

### Challenge and animation feedback — local implementation 2026-09-17

Jobe found the shooter fun but too easy. [Plan43](43-moonlight-road-hazards-and-frame-animation.md)
adds creature-dropped potholes/spore pods which food cannot clear; contact jams
automatic and special serving for one second. Warning/expiry/caps retain dodging
space. Tougher waves/bosses and later multi-hit small guests counter stationary
upgraded play. Generated four-frame truck/creature atlases replace whole-image
bob/squash animation. Reduced motion holds a stable frame. Mechanic still centers
traveling, feeding and retained progression; no other game or integrated reward
changes. First balance pass, local only, await Jobe's playtest.

## META-001 workspace package migration — completed 2026-09-19

Jobe selected direct shared-source packages rather than iframe/postMessage game
integration while retaining independent game launch targets. Wishbone Fling and
the eight other canonical games now join the Dig & Douse pilot as ten npm
workspace packages, each with one strict TypeScript/OOP runtime, a
standalone Vite adapter, a lazy Chapter House adapter, versioned progress,
bounded active-play credit, scoped rewards, and lifecycle cleanup. The generic
application registry replaces per-game launcher/profile branches. All packages
and root verification pass; original book repositories remain unchanged. Veda's
Great Escape is now canonical and integrated; Sanctuary Seasons remains a
superseded historical proposal. See plan 47 and the
application migration log. Local only; no publication.
