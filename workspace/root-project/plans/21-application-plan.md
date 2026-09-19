# Application build plan

2026-09-14 · META-001-R3 · Consolidated before coding.

[Brief](19-application-brief.md) · [Functional requirements](20-application-requirements.md). Product decisions are recorded there; engineering choices below are proposed implementation details unless explicitly identified as user-selected.

The [first coding task](22-first-coding-task.md) defines checkpoint A: the local clubhouse/Wishbone loop with TypeScript game parity, saves, a placeable reward and currency/shop proof. Checkpoint B adds accounts and live social behavior to that same slice before any other game integration.

## Delivery strategy: shared space plus one game first

Jobe explicitly selected this sequence: build the shared space and one game together, get the complete experience right, then bring in the other nine games. The first slice must prove the real connection among game play, progression, currency, a usable room item, saves and social visits. It must not become ten partly integrated games or a separate room demo with no reward/save connection.

The small renderer/network experiments below are steps within that slice. The final requirement of at least 15 pet kinds applies to the completed collection; first-slice validation uses representative pets and starter choices before producing the whole roster. No application code, service provisioning or deployment is part of this documentation consolidation.

## Phase 0: select the game and define the slice

Read the current project rules, idea registry, catalog and relevant per-game requirements/source history. Reconcile actual artifacts for all ten books sufficiently to identify the intended variants; inspect newer Bureau After Dark, Sanctuary Seasons and Emberwatch builds instead of trusting historical demo counts. Preserve alternative Wish, Snow Jam and Popcorn experiments and existing public/source identities.

Confirmed first game: Wishbone Fling, the Angry Birds-style experiment that launches Wishbone himself into towers. Use wish/experiments/floppy-fetch as the selected integration source; preserve Backyard Ruckus (the sock-launching comparison). Jobe explicitly expects further mechanic iteration. Confirmed sequence: connect the current demo behavior first, then iterate on game mechanics. The integrated game must be a TypeScript/object-oriented port from the outset, not unchanged JavaScript behind a typed wrapper. Preserve comparison builds and keep physics, levels and transient state behind a narrow shared progression/activity/lifecycle interface. Do not freeze current powerups or reward thresholds as permanent hub assumptions.

Select one game with a stable, representative loop, comprehensible save state and a useful early keepsake. Prefer manageable integration risk rather than inventing a replacement game. Record its brief, numbered requirements and change plan, including the updated low-stress, touch and persistence rules. Choose its floor/wall reward representation without deleting previous tabletop ownership.

Write a small integration matrix for that game: source/build entry, device controls, durable save fields, pause behavior, milestone reward, activity signals, returning/checkpoint behavior, audio shutdown and legacy migration. Do not require an exact transient-session snapshot. Collect physical target devices/browser versions and define measured performance/latency goals before making capacity claims.

Deliverable: selected first game, its integration requirements, a concrete slice backlog and a per-game inventory with readiness gaps. If variant selection is materially ambiguous, present the relevant alternatives; do not reopen settled product questions.

## Phase 1: validate rendering, movement and data boundaries

Start the shared room with a floor, wall, broad table, tall bookcase, animal avatar and representative pet. Use the library prototype as visual reference, not proof of correct z-sorting. The initial rendering candidate is a fixed orthographic 3D scene with a shared animal rig; validate current renderer choices before adopting a dependency. If sprites are chosen, wide/tall objects require footprint-aware occlusion or split rendering, not a naive sort of whole images by screen Y.

Verify eight-direction movement/idle, jump ground anchor versus visual height, wave, accessory attachment, obstacle routing and all sides of tall/wide furniture. Include owner edits near actors and room entrances. Demonstrate usable touch selection, pan/zoom and decoration controls in portrait and landscape on phones and on iPad. Validate PC controls too.

Candidate actor approach: shared body/rig and accessory sockets, with a few distinct silhouettes/species. Keep the pet behavior reusable: home roaming, visitor following and interaction response. Choose rendering/asset pipeline after animation and depth evidence, before producing a wardrobe and full pet roster.

## Phase 2: build the shell and first game together

Implement the TypeScript shell, room, game-selector UI, guest identity/local persistence, avatar settings, starter furniture/pet choices, inventory and help/audio/fullscreen controls. Expose only the integrated game as playable in the development slice; stable metadata anticipates all ten without pretending unfinished integrations work.

Connect the chosen game's milestone to an owned placeable reward. Add active-play currency independent of score and demonstrate a shop purchase of a small decoration or additional pet. Tune the cheapest pet toward ten minutes and small decorations toward a few minutes, using recorded active-play scenarios rather than a ticking product timer.

### Shared boundaries

| Module | Responsibility |
| --- | --- |
| GameHost / GameAdapter | Mount, temporary pause/resume, flush durable progress, exit/dispose and typed game events |
| SessionService / account repository | Guest/member/admin identities, first-login import eligibility and persistent profile |
| ProgressRepository | Versioned per-game saves and legacy migration |
| ActivityService / RewardService | Game-aware activity credit, exclusive milestones, currency and once-only rewards |
| InventoryService / catalog | Owned instances, unique pet kinds, cosmetics and separate acquisition categories |
| RoomService / PresenceService / InvitationService | Membership, shared state, presence and immediate invitation overlays |
| RoomEditor / NavigationService | Valid placement, committed layout revisions, obstacles and actor routing |
| AvatarController / PetController | Local motion, animation, remote playback and pet behaviors |

Use focused classes for stateful behavior, interfaces for boundaries and plain typed records for data. Prefer composition over deep inheritance. Small local audio-toggle UI is fine; the shared lifecycle must still coordinate pause/dispose and audio. A realtime leaderboard remains outside scope.

Game events describe durable progress, milestone claims, qualifying exploration and activity evidence using stable game/event IDs. They do not expose a universal physics/board state or make raw game scores comparable. Port the selected game's authored runtime modules to TypeScript and object-oriented responsibilities as part of first integration, preserving behavior, original playable builds and source history. Apply the same standard to every later game when integrated. Do not leave JavaScript gameplay behind a TypeScript adapter as the finished integration, and do not combine this first port with a mechanics redesign.

## Phase 3: add Firebase accounts and social behavior to the same slice

Firebase hosting is selected. Firestore is the initial candidate for persistent profiles, inventory, balances, room layouts and sparse shared commands. The username/password experience is fixed, but its Firebase-compatible authentication implementation is not: design and verify it with current official documentation before code. Use a trusted provisioning/authentication boundary, protected credential storage and server-checked admin/owner authorization. Do not invent email addresses as a product requirement or add player email/reset screens. Keep admin scope to creating accounts unless later expanded.

Implement optional first-account-login guest import as an account-scoped, transactional operation with an import marker. Preserve local data until success, handle an account first opened without guest data, and prevent a second device or replay from importing/granting starters twice. Member progression persists across devices; guest persistence remains local.

Add automatic friendship, general online roster, in-app online notices with Visit, anytime visits, and host-independent saved rooms. Invitations support both inviting someone to your room and inviting a host back to their room. The invitation immediately overlays/pauses a game; Later resumes its live in-memory state and Join saves durable progression before entering the room. Keep other pause reasons intact; no simulation or active-play currency accrues behind the overlay. If saving/navigation fails, retain recoverable progress and provide a clear recovery path.

### Firestore evaluation and presence

Firestore supports realtime snapshot listeners. Proposed movement payloads contain actor/room ID, start position, path or destination, start time, speed, sequence and layout revision. Each client animates locally rather than writing every rendered frame. Check late joins, new paths midway through walking, clock skew, stale commands, reconnect and jumps/waves. Suitability for this particular game is an engineering hypothesis to test. [Realtime queries](https://firebase.google.com/docs/firestore/real-time_queries_at_scale).

Online presence is separate from motion. Firestore lacks native presence detection; Firebase documents Realtime Database presence with optional Firestore mirroring. Evaluate approximate Firestore heartbeat/expiry first if adequate, and use a small RTDB presence layer if disconnect behavior warrants it. Clients can consume RTDB presence directly without requiring mirrored state. Final choice must record background/disconnect delay and implementation complexity. [Presence guidance](https://firebase.google.com/docs/firestore/solutions/presence).

Measure per-room writes and delivered listener reads with representative users, pets, reconnects and sessions before projecting usage/cost. Do not promise that the free tier suffices. [Listener billing](https://firebase.google.com/docs/firestore/pricing). These sources were checked during planning on 2026-09-14; validate again when choosing implementation versions.

### Shared pets, edits and reconnect

Use a defined room authority or deterministic simulation with synchronized seeds/start times and interaction events so clients agree on pets. Do not depend on the owner being online or write every pet's position every frame. Validate authority handoff/late joins, visitor petting/call-over actions and follow behavior for one summoned companion per visitor. Define whether a summoned pet's home representation remains visible as a presentation choice; ownership always remains one record per type/player.

Synchronize committed owner edits with room revisions. Replan routes after layout changes and reject or safely resolve collisions with occupants. Preserve entry clearance. Visitors can interact with pets but cannot edit/equip/remove them. Clean up companions and room membership on departure/disconnect; guest visits never leave permanent gifts. Prefer one active room actor per account to avoid duplicate avatars; record multi-device policy before implementation.

## Persistent and transient records

| Record | Content and rules |
| --- | --- |
| Profile | Stable member ID, assigned username, appearance, onboarding/import version; no overall level |
| Game progress | Versioned durable progression per stable game ID; no mandatory full transient session snapshot |
| Item definition / owned instance | Theme/provenance, acquisition category, asset, footprint/mount; distinct furniture copies |
| Pet definition / ownership | At least 15 final types; one ownership per player/type; one mystery acquisition route |
| Room layout | Full-size room, fixed finishes, placed instance transforms and active home pets; version/revision |
| Currency / reward ledger | Earned balance, credited activity intervals, milestone/purchase/import IDs; atomic/idempotent writes |
| Presence / membership / invitations | Expiring sessions, room actors, commands, invitation status and visitor companion; transient state |

Preserve legacy item metadata and backups. Floor/wall equivalents replace the need for stacking in this release; do not discard previously earned tabletop items. Cosmetic and living-pet ownership require no separate display forms. Distinguish purchasable furnishings from game-exclusive keepsakes; the duplicate-furniture rule cannot create a shop bypass for special game rewards.

## First-slice acceptance gate — before the other nine games

1. A guest enters, receives a name, chooses a starter animal/pet setup, plays the selected game and returns later with local progression intact.
2. Jobe creates a member through the private admin page. First login offers optional guest import; retry, decline and later login behave correctly.
3. Active play produces currency without dependence on success, earns the game's special keepsake, and allows a purchase. Idle, pause and duplicate requests do not mint rewards.
4. The reward can be placed in the room, moved/stored and restored after reload/member login on another device. Starter furniture and duplicates work without copying ownership.
5. Two members visit and see each other's walking, jump/wave and pet interactions. The room works with its owner offline.
6. Online notice visits the correct room even while the friend plays the game. A host invitation arrives immediately mid-level, pauses correctly, and Join/Later preserve the appropriate state.
7. Owner decorating replicates safely while a visitor and summoned following pet are present. Visitor edit attempts fail; departure/reconnect cleans up actors and companions.
8. Tall/wide furniture depth, eight-direction customization, room orientation changes and representative crowded-pet behavior pass actual visual/device checks.
9. Record playtest feedback on the combined game-to-room loop and address material failures or friction. Keep the first slice focused until this experience is sound; only then integrate further games.

Automated checks should target save/import migrations, reward and purchase replay, simultaneous sessions, ownership/admin authorization, pause state, collision changes and reconnect. Manual checks cover visual depth, feel, audio and actual mobile use. Passing static simulation alone does not satisfy visual/device acceptance.

## Phase 4: expand the proven integration to nine more games

For each remaining game, update its brief/requirements/plan, choose the production variant, port its authored game code to TypeScript and object-oriented design, document durable saves and activity signals, and adapt it to the established lifecycle. Add exclusive keepsakes and map old ownership. Configure the mystery pet's qualifying interaction per game; persist the ten-game exploration record and award exactly once. Do not turn exploration into a high-score or completion gate.

Produce the complete pet/outfit/furniture catalog only after the asset pipeline is proven. Keep personal slots empty until owned and ordinary pet identities visible in the shop, with one mystery exception. Test every pet's home roaming, visitor interaction and companion following; benchmark all different pets displayed together. Tune varied prices and maintain the ten-minute entry-pet target without adding room expansions or overall levels.

Proposed initial reward content: one early special keepsake and one later furnishing per game where that fits the existing progression. This is a starting content target, not permission to erase existing rewards or make all game loops identical.

## Phase 5: collection-wide release verification

Verify all ten selected integrations, meaningful idle detection, legacy saves, admin access, cross-device member data, guest import and error recovery. Test the measured concurrent-room target for the few-dozen-user audience, including repeated invitations, offline owners, late joins and mobile backgrounding. No external push or real-money path is needed.

Deliver a report listing actual devices/browsers, tests, asset provenance, usage estimates and limitations. Preserve original sources and deployment identities. Prepare the concrete Firebase release configuration separately; documentation changes alone do not publish anything.

## Design choices remaining

These are bounded design tasks, not unresolved conflicts with the user:

- First-game/variant selection based on source and playability evidence.
- Renderer, shared animal rig, exact species, outfits, mystery identity, starter selection and room artwork.
- Currency denomination, activity thresholds, game qualification signals and prices beyond agreed pacing.
- Firebase auth implementation, Firestore/RTDB split, presence expiry, room/pet authority and measured concurrency.
- Per-game checkpoint/return rules, reward forms and migration mappings.
- Avatar species switching is unrestricted; free switching remains the recommended pricing default.

Change a settled product decision only when new evidence requires a tradeoff and Jobe resolves it. No further questionnaire is needed for routine reversible implementation details.

## Consolidation verification

Current product decisions reside in the brief and numbered requirements; this plan references those outcomes without repeated chronological amendments. The rules, overview, registry and older meta/collectible documents are linked to this revision. Historical proposals remain labeled as history and in Git. Document validation covers local links, requirement IDs, stated first-slice sequence and absence of obsolete pending questions; it does not certify software behavior.
