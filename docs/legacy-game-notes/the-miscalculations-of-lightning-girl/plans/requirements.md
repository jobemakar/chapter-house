# Stormglide — requirements baseline

Revision: 1.2 · 2026-09-10  
Game/idea IDs: stormglide / BOB-001  
Status: implemented game; first collection candidate; editable-source migration complete

This baseline is retrospective: it records the existing game created before Jobe requested the requirements-first collection workflow. Future design changes must amend requirements before implementation.

## Concept and distinctness
Continuously steer a cloud rider through a scrolling 2D sky, collect spark paths and pups, align with rings, and time a rechargeable dash through obstacles. This is the first registered mechanic. Future games must compare against this loop, not merely use a different setting.

## Requirements
| ID | Requirement | Origin | Acceptance check |
| --- | --- | --- | --- |
| SG-001 | Enter actual play from a game-native start screen with a single start action | Design | Start leads directly to movement and collection |
| SG-002 | Entertainment-only gameplay; no educational exercises, quizzes, or questions posed to the player | User | Review all visible copy and game flows |
| SG-003 | Provide responsive, continuous 2D steering using keyboard and pointer/touch | Design from user request | Verify steering and playfield bounds on intended devices |
| SG-004 | Provide a rechargeable dash with clear availability feedback | Design | Charged dash activates; empty dash cannot activate; charge recovers |
| SG-005 | Generate ongoing spark paths, rings, pups, hazards, and temporary powers | Design | Extended play continues to spawn bounded, collectible objects |
| SG-006 | Bumps cause short friction only: no death, forced restart, score deduction, or earned companion loss | User + design | Exercise a bump and verify score/discovery preservation and continued flight |
| SG-007 | Keep flight endless, with changing chapters/events and a cap on difficulty escalation | Design; confirmed to user | Simulate beyond a full chapter cycle; no ending/reset state |
| SG-008 | Include twelve discoverable pups and five unlockable trail colors, with local collection persistence | Design | Discover all pups; unlock trails; validate saved schema |
| SG-009 | Use the documented painterly twilight visual treatment with legible controls and bright collectibles | User + design | Inspect intended artwork/UI on actual target screens when playtesting is requested |
| SG-010 | Include original music and action sounds, starting after interaction; provide mute and music controls | User + design | Actual-browser check for gesture start, audible output, toggles, and pause |
| SG-011 | Provide voluntary pause/resume, focus-loss pause, and gentle-motion preference | Design | Pause preserves flight state; controls/preferences remain accessible |
| SG-012 | Keep the adventure spoiler-light and label it unofficial; distinguish invented fantasy from book plot | Design | Review attribution and game framing |
| SG-013 | Keep authored HTML/CSS/JavaScript and local assets separate from reproducible generated outputs | User, 2026-09-10 | Rebuild hosted and standalone versions from source |
| SG-014 | Preserve the existing public Site identity and existing player-data key during source migration | User continuity | Verify hosting manifest, stored key, and source history |
| SG-015 | Keep a stable catalog entry and independent playable for future lobby linking | User future direction | Validate catalog/manifest paths; no lobby required now |
| SG-016 | Record substantive new concepts, overlap checks, changed requirements, and dated revisions | User, 2026-09-10 | Review registry and change log before implementation |

## Scope
Single-player local simulation with no server game logic, accounts, cross-device saves, quizzes, combat deaths, forced level transitions, or lobby in this baseline.

## Verification status
Automated simulation covers SG-004/005/006/007 and collection/pause portions of SG-008/011. Build checks cover SG-013/014/015. Source/copy review supports SG-002/012. Actual-browser movement feel, visual presentation, touch usability, audio playback, and localStorage reload behavior still require real-device playtesting; do not claim the simulation proves them.

## Future changes
Retain SG IDs. Add or revise requirements with the reason and date before changing intended behavior. Changes to the primary mechanic must also update BOB-001 or create a linked candidate idea in the shared registry.

## 2026-09-10 — iPad touch-first revision (requirements before implementation)

User: daughter plays on iPad; assume no keyboard. Keyboard may remain supported.

| ID | Requirement | Acceptance check |
| --- | --- | --- |
| SG-017 | Relative thumb steering: touch down does not teleport or pull the rider beneath a finger; dragging selects direction/speed; releasing stops movement. Provide a visible thumb pad and allow dragging elsewhere in the playfield. | Pointer sequence tests, dead zone and release checks |
| SG-018 | One steering pointer owns movement; a second thumb can dash concurrently without replacing steering. Ignore unrelated releases and correctly clear on cancellation/lost capture. | Multi-pointer event tests |
| SG-019 | Make Dash prominent, respond on touch down, and suppress a duplicate synthetic click. No keyboard required to start, pause, resume, view collection, mute, or change settings. | Touch event tests and control/copy review |
| SG-020 | iPad controls use at least 48 CSS-pixel touch targets, safe-area spacing, and a reserved lower control band; support portrait and landscape without a forced orientation dialog. | Layout rule checks and viewport simulation |
| SG-021 | Rotation/viewport resize preserves progress and clears active steering. App interruption pauses and resuming requires a fresh drag. | Resize, pause, cancellation tests |
| SG-022 | Keep frame work modest on tablets: cap touch-device pixel ratio at 1.5 and cache the painted background/hue treatment between changes. | Source and cache invalidation checks; actual iPad performance remains to playtest |

Scope: local source and rebuilt playable only; no backend, multiplayer, lobby, or publication change.

## 2026-09-19 — TypeScript maintenance port

| ID | Requirement | Acceptance check |
| --- | --- | --- |
| SG-023 | Authored gameplay is TypeScript composed from focused model, persistence, input, audio, renderer, and game boundaries; generated JavaScript is build output only. | `npm run typecheck` passes and tests use the compiled bundle. |
| SG-024 | Keep `stormglide-v1` durable fields compatible and robust against malformed, future, or storage-denied values. Session flight remains transient. | Compiled-production save tests cover valid normalization, malformed JSON, and denied writes. |
