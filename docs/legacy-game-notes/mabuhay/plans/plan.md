# Implementation and port plan

## 2026-09-19 canonicalization

- Archive the complete runnable Midnight Merienda v0.1.2 closure before moving
  the Moonlight source. The archive is immutable by convention and its runnable
  artifacts are recorded and checked in `tests/archive-verification.cjs`.
- Promote this strict TypeScript/OOP implementation from the former experiment
  into the Mabuhay root without changing its model, input, rendering, audio or
  save sanitizer behavior. `dist/index.html` is the development output and
  `playable/moonlight-munch-run.html` is the self-contained offline output.
- Keep the Space Patrol MIT notice in assets, generated JavaScript and offline
  HTML. Rebuild all generated delivery artifacts from the canonical root.

## Historical implementation notes

2026-09-17 authorized local shooter slice, parent plan 42 (written before code).

- Root owns deterministic RunModel, legacy SaveStore migration, source audit,
  generated assets, builds, tests, integration and review.
- Delegated renderer and UI/input as bounded non-overlapping source tasks under
  standing AGENTS workflow; root reviews the combined result.
- arcade.ts contains MIT source adaptations; shooter-model.ts owns the new rules;
  model.ts preserves the public module entry. input.ts, renderer.ts, audio.ts and
  game.ts remain focused controls, scene, sound and lifecycle responsibilities.
- Build includes all authored modules, comic assets and MIT notice, producing
  hosted-entry files and an embedded standalone HTML with no CDN.
- Original two procedural/manual-toss iterations remain in Git history. Their
  requirements and harmless-bump behavior are superseded locally.
- Validate mechanics and migrations with simulation tests, then package exact
  bytes into Chapter House and review the served browser scene and controls.
  Physical-device performance and listened audio need Jobe's playtest.

2026-09-17 challenge/frame feedback, parent plan 43 (written before code):

- Root adds deterministic hazard drop/telegraph/contact/lifetime rules, one-second
  interruption covering automatic and special firing, plus measured difficulty
  tuning. No new durable save fields; transient road state clears on restock.
- Bounded renderer task delegated under standing AGENTS workflow: actual source
  frame selection, generated hazard art, warnings and lock feedback. Root owns UI,
  generated assets, crop review, tests/build/snapshot integration and final review.
- Wave count increases by one; guest travel speed .13→.17 at stage one, spawn
  interval 1.55→1.25 seconds. Actor crowd cap stays seven. Boss hunger 40→50 plus
  18 per later stage (bounded); projectile speed .24→.28 and attack steps become
  1.9/1.5/2.2 seconds after the unchanged first-attack warning. Free restock remains.
- Ordinary droppers release after 0.4–0.6 seconds if still hungry. Browser review
  superseded the initial 1.4–1.9-second draft: upgraded food was feeding arrivals
  before drops. Food now cannot feed offscreen guests; stage-three small guests
  take two hits. Hazards
  warn0.65 seconds, expire8 seconds, cap8 on travel/4 at boss, separated on drop.
  Boss periodically targets current truck position, including edge steering,
  with the same warning. Existing food keeps flying during a kitchen jam.
- Four artwork frames per actor replace whole-sprite squash/rotation/bob. Reduced
  motion selects frame zero; truck rests on its idle frame during stopped travel.
  Renderer crops generated uneven rows; original atlas still supplies bun/pickups.
