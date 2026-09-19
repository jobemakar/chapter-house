# Battle of the Books application brief

2026-09-14 · META-001-R3 · Consolidated after voice planning.

This is the current product direction. Read with [functional requirements](20-application-requirements.md), [build plan](21-application-plan.md) and [persistent project rules](../AGENTS.md). Earlier revisions are design history; Git retains the superseded discussion drafts. This pass produces planning documents, not game code or a deployment.

## Product and audience

A free, cozy environment for a few dozen players, bringing together ten distinct entertainment games, one per Battle of the Books book. Each player has a customizable isometric clubhouse, an animal avatar and collectible pets. The existing library/Chapter House treatment is the visual starting point; the theme can evolve. Games are fun experiences inspired by books, not quizzes or study exercises.

The main loop is: choose a game from the interface, play, earn progress and currency, return to decorate or customize, and visit friends. All ten games are accessible through UI without walking to a portal or paying to unlock access. Multiplayer belongs to the shared clubhouses; it is not a requirement for the individual games.

## Entry, identity and saves

Anyone can play as a guest, receiving a generated cute name such as arctic-squirrel. Guest progress persists in the same browser/device. Guests do not participate in member social spaces. Proposed entry experience: let guests use the same games and a locally saved personal room, avatar and starter choices, without requiring credentials.

Jobe creates member usernames and passwords through a simple private admin page. There is no public registration, email requirement or player password-reset flow. Members appear everywhere under the username Jobe assigns, without a separate editable display name. Returning members enter their own space with their avatar. The implementation will persist member data across devices without adding player-facing account complexity.

On an account's first login, if local guest progress exists, offer a choice to import it or start the account fresh. Do not import automatically or offer import on subsequent account logins. The import must be safe to retry and preserve the guest save until success.

Save earned currency, unlocks, completed milestones, applicable game experience and other durable progression when leaving a game. Restoring every piece of an unfinished puzzle or transient physics state is not required. Each game defines its normal return/checkpoint behavior. A temporary pause, including dismissing an invitation, resumes the existing in-memory session. Preserve existing demo saves and migration history.

## Games and shared principles

- Low stress and little friction. Avoid consequential countdowns; timing a musical beat, action or puzzle sequence is allowed. No dying that forces restarting. Voluntary puzzle resets are allowed while preserving earned progress.
- Distinct mechanics and coherent art for each book. Cute/cozy presentation is preferred, with intentional audio and an accessible mute control.
- Touch-first and mobile-first, with PC support. The clubhouse works in both phone portrait and landscape; iPad remains a primary test device. Per-game orientation needs are documented individually.
- Offer fullscreen where supported and a usable responsive fallback. Instructions can collapse on small screens, but help stays recoverable.
- Book connections may be very loose, but must be explained honestly. Separate verified book details from invented mechanics and objects; avoid spoilers by default.
- No lost collection progress, mandatory streaks or random-only signature rewards. No overall player level in the first version.
- All authored application and game code in the integrated product is TypeScript and object-oriented, with reusable substantial shared systems. Maintain editable source, reproducible builds, stable IDs, asset provenance and versioned saves.
- Write each game brief, numbered requirements and implementation plan before modifying its implementation. Existing prototypes are not automatically compliant or production-ready.

## Clubhouse, furniture and avatars

The room starts at its full size with a few free furnishings the player can rearrange. Floors and walls have fixed finishes; customization means arranging furniture and decorations. Floor placement and wall decorations are in scope. Placing objects on furniture and carrying supported objects with a table are deferred. Existing tabletop collectibles keep their ownership and need suitable floor/wall display forms before integration; do not discard saved rewards.

Owners can place, move and store furniture, including multiple owned copies of the same type. Visitors cannot edit. Owners can decorate during visits and other players see the changes live. Proposed behavior is to share committed placements while keeping drag previews local, with safe collision/path updates and undo/cancel support.

The view is fixed-orientation isometric 3D with panning/zoom as needed. Animal avatars walk with eight-direction animation and can jump and wave, or use a species-appropriate equivalent. Correct occlusion around wide and tall furniture is required; the reported prototype z-sort bug is not considered fixed by this plan. Navigation must account for obstacles and entry clearance.

Players can switch avatar species whenever they want. Basic colors and accessories are free; additional outfits cost earned currency. Proposed implementation: free species switching and a shared rounded animal body/rig with compatible accessory attachment points. The exact species, rig/renderer and outfit catalog remain design choices. Wearables do not require separate room-display versions.

## Friends, visits and invitations

All credentialed members are automatically friends. Show a roster and general online status. Online includes playing any of the ten games, not just being in a clubhouse. Do not expose detailed room activity elsewhere in the UI; players see it when they visit.

Friends can visit anytime, including when the owner is offline. Players occupying the same room see one another walking and expressing themselves live. Visiting a room does not move its owner there. No chat, notes, stickers, gifts or content left behind by visitors. Do not show visitors a keepsake popup explaining its source game or how to earn it.

Friend-online notices appear only while using the app and include the assigned name plus a Visit action. Visit opens that friend's clubhouse even if the friend is in a game. From there, the visitor can invite the friend to join them; invitations to one's own clubhouse are also supported.

An invitation received while playing appears immediately over the game, even mid-level, and pauses it. Join preserves earned progression and enters the invited room. Later/dismiss resumes the paused game. There is no automatic acceptance or countdown. Proposed engineering behavior: deduplicate repeated invitations, preserve other pause reasons, and handle unavailable rooms without losing progress. General online notices do not need to pause play.

## Pets

At least 15 pet kinds are planned. A player owns at most one of each kind but may display all their different owned pets at home. No three-pet limit or earned expansion of pet slots. Empty personal slots are available immediately and stay visually empty until filled; make multiple-pet ownership apparent without a paragraph of instructions. The slot UI must not imply an artificial cap. Crowded rooms need performance and navigation testing.

Each player chooses one free pet from a small starter selection. All ordinary pet identities are visible in the shop from the beginning, so players can choose favorites to save for. Exactly one mystery pet is an exception: show an egg or silhouette with a clear condition, trying all ten games. Its identity is hidden, but acquisition is guaranteed, not random or purchasable. Proposed qualification: a small meaningful interaction in each game, without requiring victory or high scores. Exact qualifying actions remain to be specified.

Pets roam at home and support interaction by owners and visitors. Petting and calling them over are the proposed first actions; exact controls and species responses remain design work. When visiting, a player can summon one owned pet after arrival. That companion follows the visitor. Proposed controls allow swapping or dismissing it; it leaves with its owner rather than becoming a gift. Ownership stays unchanged.

Living pets do not need separate figurine/display versions. No pet-care chores or absence penalties are proposed. A squeak is a possible extra expression, subject to audio settings.

## Rewards and economy

| Reward | How it is obtained | Purpose |
| --- | --- | --- |
| Special game keepsakes | Exclusive progression in their own game; awarded directly, never purchased | Record play and personalize the clubhouse |
| Shared virtual currency | Active game play independent of score or performance; no idle earnings | Buy ordinary furniture/decorations, outfits and additional pets |
| Free starter items | Initial furnishings, basic avatar cosmetics and one chosen starter pet | Make the first session welcoming |
| Mystery pet | Try all ten games; guaranteed once | Celebrate exploring the collection |

Pet prices vary. The cheapest additional pet should be affordable after about ten minutes of active play. Some small decorations cost less, becoming affordable after a few minutes. Other pet prices offer longer saving goals; exact denominations and prices are tuning details. No real-money purchases or overall XP/level track.

Proposed currency policy: roughly comparable earnings per active minute across games, generous allowance for puzzle thinking and watching a contraption, and no earnings while paused, backgrounded or genuinely idle. Do not use constant tapping as the only measure of engagement. Game scores may remain where fun, but do not determine shared currency. Prevent duplicate rewards or double earning from simultaneous account sessions.

Keep the themed item families in [the collectible catalog](11-collectible-catalog.md), adapted to floor/wall display. A candidate ordinary pet roster retained for design is dog, cat, fox, rabbit, squirrel, hedgehog, raccoon, otter, red panda, capybara, turtle, frog, duck, penguin and owl. These are proposals, not an approved species list or claims about the books. The mystery species and whether it adds to or occupies one of the minimum 15 types remain content decisions.

## Technology and remaining design work

Build the shared space and Wishbone Fling together first. Connect its current behavior through a TypeScript/object-oriented port before iterating on mechanics. Validate the connected play, reward, save and social experience before integrating the other nine games. Each game must meet the same language/design requirement as it is integrated; preserve old demos separately. This is the confirmed implementation sequence.

Firebase is the hosting direction. Evaluate Firestore alone for saved data and sparse movement/action updates before adding Realtime Database. Exact backend/authentication, presence, pet synchronization and rendering choices belong in the [build plan](21-application-plan.md); capacity and cost must be tested rather than assumed.

Core product conflicts are resolved. Remaining work is bounded design and technical validation: select each game's production variant, map its saves/rewards, define active-play detection and mystery qualification, choose art/animation assets and reward prices, and measure mobile performance plus room concurrency. These are not reasons to re-ask settled questions.

The first version excludes chat, visitor gifts/notes, player-chosen display names, wall/floor recoloring, tabletop stacking, room expansions, overall levels, device push notifications and real-money purchasing. Leaderboards, trading, multiple rooms and multiplayer inside individual games are not requested.

## Existing-work boundary

The canonical repository contains shared planning and a catalog, while book folders retain independent source repositories. Separate Chapter House and Book Nook studies are visual/navigation references, not a production connected app. Recent build tasks include Bureau After Dark, Sanctuary Seasons and Emberwatch, but the historical registry still contains older counts. Reconcile actual artifacts before claiming a current build count or choosing production variants. This consolidation validates documents, not gameplay or backend readiness.
