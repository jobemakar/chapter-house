# Wishbone level editor — implementation verification

Date: 2026-09-22
Scope: local implementation authorized by Jobe after plan 60's interview. No publication, Firebase/account work, cross-origin save transfer or other game integration is included.

## Implemented contract

A separate desktop editor writes version-one per-level JSON and a separately saved ordered manifest in `packages/game-wishbone-fling/public/levels/`. All 28 original yards are converted; their original piece identities and initial visible picker order remain. The application and standalone consume the same file source. Invalid included files produce diagnostics and are omitted; an empty catalog renders an explanatory state.

Authoring includes blank/open/copy, explicit draft Save, manual inclusion/order, selection/drag/numeric transforms, rotation, terrain resize, adjustable world dimensions, undo/redo, snapping, pan/zoom and linked repeated devices. No general force/material tuning is exposed. Production physics supplies rotated terrain, elevated bidirectional launcher/support, immediate return, gaps, once-only falling-toy rescue, ordinary-piece removal, fixed-strength directional springs and independent linked gates/magnets.

Preview constructs an unstepped production yard; Play clones the document into `WishboneGame` with `playtest:true` and a no-effect host. Stop disposes it without copying simulated coordinates back. Production session guards independently block save, reward, notification and active-time callbacks. Startup falling toys are diagnosed without reward events.

Progress version three uses stable selected level, piece and device identities. Migration uses immutable old-index/revision metadata, not editable current files. Reordering cannot remap earned rescues; changed layout revisions reset only transient state. Removed-level history and archived rewards remain.

The local standalone development API validates origin, safe IDs, finite/bounded data, link structure for inclusion, payload size and regular-file paths. Writes use temporary-file replacement. Chapter House receives only read-only asset packaging, under a namespaced path compatible with sub-path hosting. Existing standalone/application save ownership and original repositories remain separate.

## Automated evidence completed by runtime/review agent

- Package `npm run typecheck --workspace @chapter-house/game-wishbone-fling`: passed after runtime/editor interface integration.
- Package `npm test --workspace @chapter-house/game-wishbone-fling`: passed at the runtime checkpoint (basic camera/physics/scenery/progress scripts; editor history tests; nine new runtime/migration assertions). Final expanded schema/storage run is recorded below when complete.
- `npx tsx --test tests/physics.test.ts tests/wishbone-levels.test.ts tests/feedback-02.test.ts`: existing fixed-step/recovery, campaign idle/reload, legal-shot and mechanism behavior passed after file-catalog setup. Structural assertions were updated only for explicit file dimensions/device arrays; the rescue-checkpoint fixture now begins an actual throw, matching the no-startup-reward requirement.
- `npm run build --workspace @chapter-house/game-wishbone-fling`: standalone/editor production build passed.

New runtime regressions cover both launch directions from an elevated origin, zero-velocity recall/fall return, rotated collision geometry without hidden floor, startup diagnostics, fall rescues/removal/restack, checkpoint revision invalidation, stable IDs across reordered arrays, independent explicit device links, directional spring force, plush metadata IDs overlapping earned rescue IDs, and tall-world overview.

New migration regressions prove version-two selection/revisions remain anchored to original metadata even when the current catalog is reordered/edited, migration is idempotent, and inactive history/device states survive.

## Independent review

Runtime/review agent inspected editor/controller/model/playtest and schema/storage. Concrete editor follow-ups were sent to its owner: preserving unsaved new/copy documents, safe completion of a save after switching documents, rollback after failed Play, full applicable-device rotation, and library availability when the index is missing/invalid. Schema follow-ups: reject circle radius on nonround physics pieces and bound physically usable minimum dimensions. Root separately reported the input commit issue from browser interaction. Final resolutions and final test evidence belong in the completion section below.

No second physics engine, persistent storage access or unsafe dynamic execution was found in editor code. Test hosts have no-effect persistence/reward/activity callbacks, and the production playtest flag adds an independent guard.

## Browser acceptance receipt — completed by root

Root independently reran the complete Wishbone package check successfully and
performed the following local browser workflow after the input/canonical-save fixes:

- Inspected normal gameplay at desktop and a 390 × 844 viewport.
- Verified immediate field edits and saved an incomplete draft without adding it
  to the playable list.
- Authored a temporary 1800 × 1200 yard with an elevated launcher, 500 × 40 terrain
  rotated 12 degrees, a toy and two springs rotated ±90 degrees. Observed a left
  launch flying left and exercised Pause, Restart and Stop; Stop restored the
  authored arrangement. The startup settling warning was visible.
- Saved the valid draft cleanly, explicitly added it to the list and saved order.
  Moved it up, saved order again, and observed the new order in the normal game
  picker. Selected and loaded the saved test yard.
- Deleted its launcher and saved the now-invalid included draft. The normal game
  skipped it with a visible one-level diagnostic and loaded Wobbly Bridge. Undo
  restored the valid authored draft.
- Removed the temporary entry through the editor and deleted only the task's own
  `verification-gap-yard.json`. The final manifest has the original 28 entries;
  the source directory has the original 28 level files plus `index.json`.
- Opened Wishbone inside local Chapter House at port 5190. Saved Grand Garden
  selection was preserved; the picker contained all 28 levels in the expected
  order. Exited safely. No integrated-game launch was performed in this check.
- Rebuilt after removing the temporary QA file and served the packaged standalone
  output with Vite preview at port 5293. The production game loaded Wobbly Bridge
  from its packaged level files. Root also independently reran all 152 application
  tests successfully after cleanup.

These are desktop-browser observations, including a responsive viewport size;
no physical phone/iPad use or audio listening is claimed. The work remained local.

## Final integration evidence

- Full package `npm run check --workspace @chapter-house/game-wishbone-fling` passed: TypeScript, four baseline scripts, editor/model/runtime/migration/schema/storage tests (20 passing and one skipped), and standalone/editor production build. The skipped test requires Windows symlink creation, unavailable without Developer Mode; regular-file/safe-path validation remains implemented.
- Full application `npm test` passed all **152** tests. The new headless production-session lifecycle test launches, pauses, flushes, restarts and disposes with a normal effect-recording host, and observes exactly zero save, active-credit, reward and notification callbacks when `playtest:true`; player state stays identical.
- Full application `npm run build` and a separate `npx vite build --base /chapter-house/` were attempted. They were blocked by concurrent changes in `game-contraption` (incompatible Level/PartType APIs, then a missing `levels` export in its game/engine/renderer), not Wishbone errors. Those files were not modified by this task. A successful complete application bundle/subpath build cannot be claimed from these attempts.
- Applicable device rotation, new/copy unsaved status, failed-Play recovery and canonical save acceptance were corrected by the editor owner; its added rotation/high-water/canonicalization model tests pass. Schema now rejects circle radius on nonround pieces and physically negligible dimensions. Root browser acceptance is recorded above.

Hosted checkpoints and publication identities remain unchanged.


## Completion

Plan 60's local implementation and final review are complete. The package build,
automated tests and browser receipt establish the editor/runtime behavior described
above. The last complete-application build attempts remain limited by unrelated
concurrent Contraption changes. No publication or commit was performed by this task.
