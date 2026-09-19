# Battle of the Books — persistent project rules

Latest Bureau feedback — 2026-09-17: Jobe authorized illustrated reward cards,
generated searchable object artwork and restrained nighttime richness after his
phone walkthrough. [Plan 45](plans/45-bureau-illustrated-collectibles-and-rooms.md)
records revision 0.3.0, verification and publication receipt. Preserve puzzle
logic, reward IDs, save formats, dark atmosphere and the owner-private Site.
Trading-card references concern presentation only, not trading/card gameplay.

Latest publication authorization — 2026-09-17: Jobe requested publishing the
latest Chapter House and games to the existing ChatGPT Site for remote phone
testing. This supersedes earlier local-only holds for this publication only.
Preserve owner-private access, separate saves/repositories, rejected-trial
removals and existing mechanics. See [plan 44](plans/44-latest-phone-sites-publication.md)
for current publication evidence and status; older hosted-version-two notes below
are historical after this publication completes.

Latest Moonlight feedback — 2026-09-17: Jobe enjoyed it but requested more
challenge, true sprite-frame animation and unshootable creature-dropped road
hazards with a one-second firing interruption. See [plan 43](plans/43-moonlight-road-hazards-and-frame-animation.md).
Implement locally; preserve progression and the unchanged private Site.

2026-09-17 implementation authorization: Jobe said "ok proceed" to the local
Moonlight shooter slice in [plan 42](plans/42-local-moonlight-shooter-slice.md).
This supersedes earlier discussion-only holds. Keep local; preserve original
repositories/saves and the private Site. Wider illustrated road, automatic food
fire, persistent pickups, supply/restock progression, bosses and special burst.

Latest removal — 2026-09-17: [plan 39](plans/39-remove-luminous-locks.md).
Jobe rejected Luminous Locks and requested complete local removal. Do not restore
or propose it. Active local menu has thirteen standalone previews plus Wishbone.
Prior fourteen-preview counts are historical/hosted. Moonlight discussion-only
hold was superseded by the 2026-09-17 implementation authorization above.

Latest local trial — 2026-09-17: [plan 38](plans/38-local-treehouse-trial.md).
Jobe authorized trying the treehouse room shell and may roll it back. Read
application/docs/treehouse-trial.md for requirements/evidence. Original shell is
retained behind the `RoomArt.environment` style parameter. Keep local, preserve
saves/furniture and the approved waterfall, and await feedback.

Updated 2026-09-14 after consolidated product planning. Applies to this directory and every book folder below it. Follow the user's current instructions when they change a rule.

## Current specification and scope

Read [application brief](plans/19-application-brief.md), [functional requirements](plans/20-application-requirements.md) and [build plan](plans/21-application-plan.md) before application/meta work. They contain the settled product direction and supersede older meta-layer scope. Development starts with the shared space plus one game together; validate that integrated experience before bringing in the other nine. The user authorized coding on 2026-09-14. Local checkpoint A is implemented in application/; see plans/23-local-slice-implementation.md and application/docs/verification.md. Firebase, accounts and live visits remain checkpoint B. Do not deploy without an authorized publication request.

Confirmed: Firebase direction; simple Jobe-provisioned credentials through a private admin page; persistent local guests without social access; optional guest import on first account login only; assigned member names; automatic member friendship; anytime visits; in-app online notices; invitations that immediately pause a game; owner-only live decorating; animal avatars; interactive pets and one summoned following pet when visiting. Consult the specification for exact behavior instead of re-asking resolved questions.

Rooms start full-size with free movable furnishings. Floor furniture and wall decorations are supported; tabletop stacking is deferred. Floor/wall finishes are fixed. Avatar cosmetics and living pets are exempt from separate room display forms. One pet of each kind may be owned, with no separate home active-pet gameplay cap; duplicate furniture is allowed. Preserve legacy tabletop rewards and map them before integration.

Game-exclusive keepsakes come only from that game's progress. Shared currency comes from active game play, never idle time, and buys ordinary furnishings, outfits and pets. The cheapest additional pet targets about ten active minutes; small decorations take a few minutes. One free starter pet is chosen from a small selection; all ordinary pet identities are visible from the start and one mystery pet is guaranteed for trying all ten games. No overall player level. Save durable progression on departure; exact unfinished-session restoration is not required.

## Purpose and experience

- Build ten distinct entertainment games inspired by the known fourth-grade Battle of the Books list in catalog.json. No educational exercises, quizzes or comprehension questions.
- Prefer cute/cozy, coherent art and intentional audio with readily available mute. Avoid spoilers by default.
- Low stress and little friction: avoid consequential countdowns; intentional rhythm/action/puzzle timing is allowed. Mistakes must not kill a run, force restarting or erase earned progress. Voluntary puzzle resets are allowed. Keep pause/resume understandable.
- Mobile/touch first, including iPad and phones, with PC support. The clubhouse supports portrait and landscape. Provide fullscreen where supported, a usable fallback and recoverable instructions.
- Preserve each game's distinct mechanic. Continuous play does not require every game to use Stormglide's scrolling, dogs, sparks or dash.
- No chat, visitor gifts/notes/stickers, real-money purchases, external device push, room expansions or global level gates in first release. A leaderboard was an example of reusable infrastructure, not a requested feature.

## Before proposing or implementing a game

1. Read this file, the current application documents, plans/00-project-overview.md and plans/01-game-idea-registry.md. For an existing game, also read its requirements, design and change log.
2. Log substantive concepts in the shared idea registry, including discarded/deferred alternatives. Label proposed, selected, implemented, deferred or rejected and retain history.
3. Record a mechanic signature: input, verbs, repeating loop, spatial structure, challenge, mistake consequences and progression.
4. Compare against selected, implemented and still-proposed games. Different art or rewards do not make identical mechanics distinct. Redesign overlap unless the user explicitly chooses it, and document that decision.
5. Write a brief, concrete numbered functional requirements and an implementation plan before code. Cover controls, challenge/recovery, progression, audio/art, accessibility, technical deliverables and acceptance. Separate user decisions from designer defaults. Creative freedom permits routine choices; it does not remove the planning step or require repeated permission.
6. Use stable book-title folders and game IDs, updating catalog.json and manifests consistently. All ten books are already identified.

## Book connections and collectibles

Before implementation, identify sourced spoiler-light details anchoring the game. Very loose visual/gameplay connections are explicitly allowed. Separate verified book details, interpretation and invented mechanics/art/objects; never imply an invented reward is a literal novel object. See plans/08-book-connections.md and plans/11-collectible-catalog.md.

Game keepsakes need thematic rationale and a usable floor/wall display form in this release. Badges can become plaques; non-wearable game effects can gain display equivalents. Avatar cosmetics and living pets are explicit exceptions. Scores/currency/XP are accounting values, not collectible objects. Preserve item IDs, ownership and original asset/support metadata when adapting old rewards; do not silently erase progress or make game-exclusive rewards purchasable.

## Planning, delegation and review workflow

Latest local clubhouse feedback is recorded in [plan 24](plans/24-clubhouse-feedback.md), with requirements and verification in application/docs. Preserve per-instance lamp state, stable arrival direction and cancel-without-leaving decorating. Larger/connected rooms and a broader avatar wardrobe are future design considerations, not additions to the current coding scope.

User preference confirmed 2026-09-14: use a stronger model for planning and final review, and delegate suitable, well-defined implementation work to a less expensive coding model. This is standing authorization to use implementation sub-agents for this project; do not ask again for each suitable task.

- Before handing work off, specify scope, architecture, constraints, relevant files, ownership boundaries and concrete acceptance checks. A vague instruction to implement the plan is not enough.
- Prefer delegation for bounded features such as the shop, inventory or settings. Keep physics changes, room navigation, save migration and multiplayer architecture with the stronger model initially because their assumptions interact more heavily.
- The stronger model remains responsible for integration, code review, appropriate tests and observable verification. Planning does not replace review; do not accept an implementation solely because a sub-agent reports success.
- Choose an available less expensive model suited to the task. Use sub-agents within the current task rather than creating separate user-facing tasks unless the user requests those. Follow the active tools' delegation constraints, and avoid delegation overhead for trivial edits or work without a useful independent boundary.
- Report material delegation and verification accurately. This workflow is the default for future work, not a claim that the initial local build was delegated.

## Maintainable implementation

- All authored application and game code in the integrated product must be TypeScript and object-oriented. Port each game as it is integrated; a TypeScript shell around unchanged JavaScript gameplay does not satisfy this requirement. Prefer focused responsibilities, composition and typed boundaries; reuse substantial shared account/save/reward/inventory/room/invitation systems. Trivial local controls need not be abstracted.
- Authored source is the source of truth. Keep source, assets, documentation, generated hosted output and standalone playables in clear locations. Use reproducible builds; never make opaque generated HTML the only editable source.
- Change source and rebuild deliverables, not generated output alone. For Wishbone Fling, connect the current mechanics first with a behavior-preserving TypeScript/object-oriented port, then iterate on mechanics. Preserve legacy demos separately; do not convert the other nine before the first integrated slice is right.
- Preserve saved-player-data keys/formats or supply a versioned, idempotent migration. Distinguish durable progression from transient game sessions. Protect confirmed rewards against retry/double grants.
- Keep code readable, with meaningful modules and documented tuning. Track dependencies with a lockfile, retain asset provenance/local required assets, and never store secrets in source/manifests/documentation.
- Use version control; preserve existing source history and Sites identity. New Firebase hosting does not require deleting prior deployments or creating replacement Sites during reorganization.
- Validate appropriately; distinguish simulation/static checks from browser playtesting, visual inspection, physical-device use and listening to audio. No unsupported capacity/performance claims.

## Iteration, publication and repository boundaries

Update requirements and dated change logs when intended behavior changes. Keep registry, summaries, manifests and catalog consistent; preserve alternatives until a production variant is selected. Historical demo counts are not a current readiness inventory.

Root Git tracks shared planning/catalog; book folders retain their own source repositories and are intentionally ignored by the root. Preserve those boundaries and stable game paths. Record local changes without silently publishing. Existing authorized public audience does not need reconfirmation solely to retain it during an authorized publication; documentation or folder changes are not publication instructions.

Make routine reversible design decisions and log them. Ask only when a missing choice materially affects work, and do not re-ask settled requirements. In voice planning, ask one question at a time, continue after an answer, and explicitly announce actual saving/checking pauses. Respect requests to pause for real-life conversation.

Latest feedback: [plan 25](plans/25-interactive-furnishings-and-fling.md). Preserve the five new focused yards plus classic IDs, per-instance bowl/lamp state, and independent aquarium controllers. Currency is coins. Bigger scrolling/parallax levels remain deferred pending playtest.

Latest implementation: [plan 26](plans/26-camera-and-pet-feeding.md). Camera parallax/zoom/pan is now implemented, superseding prior deferral. User clarified bellows as a familiar spring pad metaphor; preserve internal IDs. Bowl tap alternates fill and pet feeding, emptying only on completed eating.

Latest scope: [plan 27](plans/27-village-and-simpler-fling.md) authorizes the outdoor village, superseding the earlier outdoor deferral. Keep pocket powers inactive and preserve archived saves/owned displays. Willowbrook is a local walkable area with free cosmetic fountain coins, spatial water and distinct avatar/pet reactions. The Long Walk Home is a genuinely wide spring-only Fling yard.

Latest visual pass: [plan 28](plans/28-woodland-village-assets.md) replaces all five old village houses with imported Kenney scenery, a clubhouse entrance, reading tent and garden. Outdoor GLBs are locally packaged with CC0 provenance. Keep source asset ownership/disposal in TownAssets, matching collision footprints in town/layout, and avoid restoring the superseded box/cone houses. Room/game art is unchanged by this pass.

Latest pet trial: [plan 29](plans/29-cube-pets-trial.md) replaces the three implemented pet visuals with locally packaged animated Kenney Cube Pets while preserving `cat`, `bunny` and `fox` IDs, saves, interactions and economy. Keep the rounded procedural `AnimalRig` for player avatars. PetAssets owns shared imported resources; PetRig clones have independent mixers. This validates the pipeline only and does not settle the final 15-plus-species roster.

Latest town pass: [plan 30](plans/30-willowbrook-expansion.md) expands Willowbrook to four times its former area. Preserve the stream as non-walkable terrain with the timber bridge as its only crossing, route outdoor pets to a walkable shoulder position, keep fountain coins proximity-bound and cosmetic, and retain global procedural nature ambience alongside spatial water. Saved profile/economy data is unchanged.

Latest publication: user authorized a public phone-accessible build on 2026-09-15. The static checkpoint is hosted at `https://jobemakar.github.io/chapter-house/` from the application's `gh-pages` branch. Keep runtime public-asset URLs compatible with sub-path hosting. This publication does not add Firebase, accounts, shared visits or server-side saves.

Latest feedback: [plan 33](plans/33-fountain-and-fling-depth.md) removes the fixed coin button; toss by tapping the nearby fountain only. Wishbone's fence is now a separate canvas layer almost at world-speed, with fence/ground sharing vertical zoom anchoring and slower mountains behind. Preserve viewport-filling lawn at wide overview. This pass is local, not a publication.

Latest menu scope: [plan 34](plans/34-standalone-preview-menu.md) authorizes opening existing other-game demos and comparison variants from Games as clearly labeled standalone previews in new tabs. They retain separate saves/rewards and are not gameplay integrations. Preserve the typed allowlist, exact standalone build artifacts and provenance; original game repositories remain untouched. Wishbone is still the only integrated game. No hosted update was authorized by this menu request.

Latest authorized pass: [plan 35](plans/35-collection-feedback-and-sites.md) updates selected standalone source demos and adds Door Atelier without replacing Pocket Funhouse. All thirteen previews/dependencies are packaged inside the application for reproducible hosting. Preserve separate saves/rewards and original repositories. Willowbrook now includes a rotating-sail Kenney windmill, comparison fountain and waterfall; rendering/fishing/navigation share TownStream's curved banks. User explicitly authorizes publishing world plus standalone previews to ChatGPT Sites. Reuse the application .openai/hosting.json identity for subsequent Sites updates and preserve its audience. Static local persistence only; no cross-origin save transfer or multiplayer is implied.

Current combined Sites checkpoint: `https://chapter-house-jm.mowgliworf.chatgpt.site`, successful owner-private publication on 2026-09-16. Preserve that audience unless Jobe explicitly requests changing it. Version 2 includes fourteen separate standalone previews plus integrated Fling. Original standalone Sites and the earlier GitHub Pages checkpoint remain unchanged.

Latest authorized revision: [plan 36](plans/36-phone-walkthrough-revision.md). Remove the comparison fountain, move the signless windmill across the stream, and preserve the blocked raised waterfall source/downhill channel. Fishing's cast-to-Reel delay is doubled with unchanged 30% completed-reel odds. Wishbone uses icon-only accessible chrome and eased launch zoom. Original standalone phone layouts/audio/spark celebration are rebuilt, not gameplay integrations. Door Atelier is archived/rejected in favor of the additional Luminous Locks illustrated puzzle trial; retain Pocket Funhouse. Moonlight Munch Run is a separate endless steering/feeding Mabuhay experiment alongside Merienda, with intentional user-selected scrolling-mechanic overlap. The active menu now has fourteen standalone previews plus integrated Fling. Reuse the same owner-private Site; browser-local saves and separate original repositories remain unchanged.

Latest approved local state: [plan 37 / session handoff](plans/37-local-waterfall-and-session-handoff.md). The version-two rectangular waterfall is replaced locally with natural pale cliffs/uprights, asymmetric planted shelves, a winding supported brook and animated drop/foam. Read application/docs/waterfall-redesign.md and woodland-assets.md before town changes. Jobe approved the result and explicitly said "keep local"; the hosted version is unchanged. Do not publish or automatically continue iteration. Local implementation commit 410f5f4 has 100 passing application checks. Resume from the approved local source after fresh user feedback, not the stale hosted waterfall.
