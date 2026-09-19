# First coding task: clubhouse + Wishbone Fling local loop

2026-09-14 · BOB-SLICE-01A · Local checkpoint implemented; see [implementation status](23-local-slice-implementation.md).

[Application brief](19-application-brief.md) · [Requirements](20-application-requirements.md) · [Build plan](21-application-plan.md).

## Outcome

Deliver a locally playable application where a player enters a small furnished library clubhouse, walks an animal avatar around obstacles, interacts with a roaming pet, opens Wishbone Fling from the UI, plays its current mechanics, earns durable progress/currency and a room reward, returns to place that reward, and reloads with saved state intact.

All authored runtime application and game logic is TypeScript and object-oriented. This is a fresh integrated implementation that preserves the demo's behavior; gameplay redesign follows integration. Reuse appropriate art, level data, physics tuning and existing verification scenarios. Do not wrap the old JavaScript game in an iframe or merely rename JavaScript files to TypeScript.

Confirmed during task definition: this checkpoint is locally playable through a development server/browser, with device-local saves. No Firebase project, credentials or service connection is needed to run it.

This task is the first local checkpoint within the larger shared-space-plus-one-game slice. Real accounts, Firebase persistence, online friends and live room visits are the next checkpoint of that same slice, not removed product requirements. No other book game is integrated until the complete one-game/shared-room experience is validated.

## Player-visible scope

1. **Local entry and room:** automatic cute guest name; one full-size starter library room; fixed wall/floor finish; a few free movable furnishings. Persist the guest's room, appearance, inventory and progression in this browser.
2. **Avatar:** one representative animal avatar with a small color/accessory choice; idle/walk in eight directions, click/tap-to-walk, wave and jump. Correct occlusion around a tall bookcase and broad table. One species in this checkpoint is a development subset; the final multi-species system remains required.
3. **Pets:** representative starter choice using a small reusable set, one chosen free pet, home roaming and simple petting/call-over interaction. Empty collection slots show that more pets can be collected. Include one additional ordinary purchasable pet to prove unique ownership and multiple home pets. The 15-kind final roster and mystery-pet unlock are later content in the same product plan, not required art production before this checkpoint works.
4. **Editing:** place/move/store floor furniture with valid previews, cancel and undo. Keep entrance/navigation clear; furniture cannot trap the avatar or pets. Support duplicate instances for an ordinary furniture item. No table-on-table or lamp-on-table placement.
5. **Wishbone Fling:** open from a game-selector control, preserving the current two-yard play, articulated launch/return, unlimited attempts, optional restack, existing powerups/mechanisms, controls and rewards. No new mechanics or levels in this task.
6. **Connected rewards:** preserve the game's unlocks and expose at least the existing Patchwork dog bed as a usable floor item, earned at its existing fourteen-throw threshold. Return to the room, place/store/move it and reload. Other existing reward ownership stays intact in inventory even when a new room asset is still pending. Do not sell the dog bed or other game-exclusive keepsakes in the shop.
7. **Currency proof:** active Wishbone play earns shared currency independently of score; idle/paused/backgrounded play does not. A compact shop with a low-price ordinary decoration and an entry-price pet demonstrates once-only spending and ownership. Tune toward a few minutes for the decoration and about ten active minutes for the cheapest additional pet. Exact unit values remain developer tuning, not a new question for Jobe.
8. **Settings and lifecycle:** touch-first room in phone portrait/landscape, iPad/PC use, accessible help/mute, fullscreen where supported and responsive fallback. Leaving the game saves durable progression. Temporary pause resumes the in-memory session; departed partial-board restoration is not a new requirement.

This is a coherent playable integration, not merely scaffolding. It does not include Firebase setup, admin/member UI, guest-to-account import, real invitations, realtime synchronization, full wardrobe/pet catalog, world expansions, other games or a deployment. Those features remain explicitly scheduled in checkpoint B below.

## Verified baseline and reuse map

Read-only source inspection identifies the selected baseline as wish source repository commit dd3f939, titled Trial saved powerups and collision-driven yard mechanisms in Wishbone Fling. The working tree was clean when inspected. Requirements/README describe experiment 0.2.0 with two yards and all six powerup/mechanism systems. The historical report says 31 checks passed; this task-definition pass has not rerun or visually certified them.

| Existing source, relative to collection root | Role in the new implementation |
| --- | --- |
| wish/experiments/floppy-fetch/src/game.js | Replace global/DOM-owned loop with typed WishboneGame lifecycle, controls and integration events |
| wish/experiments/floppy-fetch/src/floppy-core.js | Preserve launch/flight/return behavior and constants in a typed game model |
| wish/experiments/floppy-fetch/src/plush.js | Port articulated plush bodies, joints, poses and draw behavior |
| wish/experiments/floppy-fetch/src/powerups.js | Port banked inventory, consumption rules, mechanisms and permanent discoveries |
| wish/experiments/floppy-fetch/src/render.js | Port the current game renderer and responsive expressive feedback |
| wish/src/core.js and wish/src/levels.js | Preserve shared yard solver/materials/two authored layouts needed by Fling; do not accidentally substitute sock-chase behavior |
| wish/src/progress.js and wish/src/support.js | Migrate saves/reward definitions and original audio; replace direct/global storage coupling with typed services |
| wish/assets and wish/plans/assets.md | Reuse appropriate local watercolor/fonts with original provenance and licenses |

The legacy script loader mutates global FetchCore/FetchProgress APIs and the Fling save key. Replace this implicit script-order coupling with explicit modules and constructor dependencies. Authored runtime code must not depend on loading those legacy global scripts.

Matter.js 0.20.0 is the inspected baseline dependency, not a claim about the newest release. Retain physics behavior and licensed dependencies through typed boundaries; do not rewrite a third-party physics engine merely because its distributed bundle is JavaScript. Authored gameplay, app logic and verification code are TypeScript; HTML/CSS/assets remain their natural formats.

The Chapter House study is an orthographic Canvas renderer with world coordinates and footprint-center sorting. Its README explicitly notes limitations with large intersecting objects. Use its visual layout and navigation lessons as reference. The new room should use a real orthographic 3D scene/depth handling, with the specific library verified against current documentation at coding preflight. The game's existing 2D yard does not need to become 3D.

## Source and implementation organization

Proposed new source repository: collection-root/application/, which is already excluded by the root repository's wildcard directory rule. Initialize it during implementation, not during this planning task. Root Git continues to own shared plans/catalog; wish/ retains the original game repository and comparisons. Record baseline commit and provenance when porting into application/src/games/wishbone-fling/. Do not make the old demo depend on the new application's build.

Suggested TypeScript responsibilities:

- Application and GameHost own navigation, coordinated pause, frame lifecycle and teardown.
- GameAdapter defines mount, pause, resume, flushProgress and dispose, plus typed progress/activity/reward signals. No universal board/physics snapshot contract.
- WishboneGame coordinates YardPhysics, PlushRig, PowerupSystem, WishboneRenderer and input/audio components. Use focused objects and explicit dependencies, not a giant controller or speculative universal engine.
- LocalProfileRepository and ProgressRepository implement local versioned persistence behind interfaces suitable for a later Firebase repository.
- RewardService, ActivityService and InventoryService own currency/reward identity and atomic local state changes; the game cannot directly modify room storage.
- RoomScene, RoomEditor, NavigationService, AvatarController and PetController separate world geometry, editing and actor behavior. Placement uses world footprints, not screen pixels.

Strict type checking, typed runtime validation of persisted data, a lockfile, documented scripts and reproducible builds are required. Select/verify tooling at implementation preflight; do not require the user to choose routine bundler or renderer details. Keep tuning values in named configuration records.

## Save and reward contract

Legacy Fling uses wishbone-floppy-fetch-v1 with a version-2 payload. It includes throws, rescued target IDs, best cascade, owned keepsakes, selected yard, preferences, checkpoints and powers (counts/discovered/clears/autoGust). Power mechanisms also attach checkpoint gadget state. Preserve the old key and source data; the integrated app uses its own versioned namespace and an idempotent migration marker.

Migrate confirmed durable values and discoveries without duplicate awards. Preserve the original full payload as a recoverable legacy snapshot, even if the new lifecycle does not restore transient partial-board state. Keep consumable charge ownership separate from permanent display ownership. Do not turn reload/restack into duplicate clear rewards or erase banked charges. Existing saved progress from another browser origin is not automatically readable; document the import boundary rather than promising cross-origin recovery.

A milestone maps to a stable game/reward ID. Each owned furniture copy has an instance ID; each pet kind has at most one ownership record. Replaying a milestone or purchase request must not duplicate its effect. All confirmed changes flush on exit and at meaningful events; handle storage-denied mode visibly.

Activity detection is a configurable policy based on meaningful input plus bounded active shot/return observation. Pointer presence or a running animation loop alone must not generate indefinite currency. Define explicit idle expiry, stop counting on pause/hidden state, and use monotonic elapsed time rather than frame count. Manual playtests tune the generous window without turning currency into a tapping exercise. Real-time/shared-account anti-duplication is implemented with accounts in checkpoint B; local tests still reject replayed credits.

## Implementation order

1. Establish strict TypeScript source/build and typed profile/game lifecycle records; record baseline assets/behavior. Verify chosen tool/library versions before installation.
2. Build the basic orthographic room and a typed Wishbone controller in parallel development order within the same source repository; no subagent delegation is implied. Establish working room-to-game-to-room navigation early.
3. Port the current game mechanics and save validation, including powerups and permanent discovery ownership. Compare against known baseline scenarios before changing tuning.
4. Add the dog-bed reward mapping and local inventory/placement save. This is the first full observable loop to demonstrate.
5. Add active-play currency, the small shop/pet proof, starter/avatar controls, pet interaction and placement polish.
6. Complete lifecycle, responsive/fullscreen behavior and recovery checks; record visual/audio/device evidence and remaining limitations.

Do not change Wishbone's aiming, towers, powerup balance or reward thresholds as part of the parity port unless fixing a verified integration defect; record any such correction separately. Mechanical experiments begin after the current loop is connected and validated.

## Acceptance checks

| ID | Observable result |
| --- | --- |
| SL-A01 | From a new local profile, enter the room, walk around both tall and wide furniture, wave/jump and interact with the chosen starter pet. Correct depth survives pan/zoom and movement on every side. |
| SL-A02 | Open Wishbone Fling from UI; launch the dog into both existing yards; automatic/quick return, ragdoll articulation, target rescue, restack and all existing powerup/mechanism behaviors remain functional. |
| SL-A03 | Earn Patchwork dog bed at fourteen throws, return to the clubhouse, place/move/store it, reload and retain its ownership and placement without duplicate awards. |
| SL-A04 | Meaningful low-scoring play can earn currency; idle, paused or hidden game cannot keep earning. Buy a small decoration and one additional pet; repeated purchase/grant attempts cannot duplicate or overspend. |
| SL-A05 | Furniture copies have independent placements; invalid drops preserve owned items and walkable entry. Pets navigate around edited obstacles. |
| SL-A06 | Save/reload retains game progress, consumables, discoveries, room, avatar and settings; old Fling keys stay untouched. Corrupt/missing or denied storage is handled without crashing or claiming a save succeeded. |
| SL-A07 | Pause during aim/flight/return and cancel touch safely. Leaving clears listeners, animation loops and audio; repeated game entry never creates double physics or duplicate rewards. |
| SL-A08 | Phone portrait/landscape, iPad and PC layouts are usable; supported fullscreen and fallback work. Actual visual and audio checks are distinguished from automation. |
| SL-A09 | All authored app/game runtime is typed TypeScript with readable object responsibilities, no legacy JavaScript iframe/script wrapper, and documented typecheck/build/test commands pass. |

Use meaningful tests for progression migration, award/consumption replay, activity clocks, lifecycle disposal, joint/physics behavior, placement and navigation. Preserve baseline regression scenarios; do not write tests merely mirroring constants. Document any physical-device checks unavailable locally instead of declaring them passed.

## Next checkpoint B — same space and same game

Add Firebase hosting configuration and member persistence, private admin provisioning, assigned identities, first-login guest import, automatic friend roster and in-app online notices. Then add live room membership/avatars, owner-offline pets, live decorating, visitor interaction and one summoned following pet, and immediate pausing invitations into Wishbone. Validate two actual clients, disconnect/reconnect, transaction safety and measured usage. Use the first task's local interfaces without rewriting game mechanics or pretending simulated friends are real networking.

Only after A and B satisfy the larger [first-slice acceptance gate](21-application-plan.md) should the other nine games be integrated. The planning definition preceded code. The user subsequently authorized the local build; no Firebase service has been provisioned.
