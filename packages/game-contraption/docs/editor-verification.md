# Machine Workshop — 2026-09-22

Implemented locally from root plan 61. Root owned shared schemas, file loading,
game/engine/renderer changes, stable-ID save migration and final review. Two
`gpt-6-luna` implementation agents owned the editor UI/history and local file
store respectively; the storage agent also wrote bounded regression tests.
Their code was reviewed and corrected during integration/browser verification.

## Requirements and resulting behavior

PCED-01–13 in root plan 61 govern this pass. There is one authored JSON document
per level, a separate ordered index, explicit draft saves and inclusion, and a
fixed-size production board. Initial fixtures no longer depend on a solution.
Movable placed pieces and additional spares define the actual inventory.
Each spare stores its own identity/options; the UI edits quantities and individual
spare options. New controls use one target, distinct popcorn-button/human-lever
activation, toggle/latch modes, initial fan state and belt direction.

Normal gameplay uses the same production engine in standalone, Chapter House
and editor testing. Test services discard persistence/reward/activity effects
even during flush/dispose. Authored objects are cloned before simulation.
The existing six puzzles retain their original layouts, IDs, assists and legacy
finale switching behavior. New levels expose no solution capture or assist.

## Verification

- Package `npm run check` passed: TypeScript, regression tests and standalone
  game/editor build. Node reports 21 passing tests and one platform skip, with
  six additional editor model assertions in its passing test-file wrapper.
- All six original solution arrangements clear a full 12-kernel batch across
  three seeds each. Original starters do not clear automatically in those
  starter checks. Fixed fixtures restore from authored data.
- Tests cover physical button-contact debouncing and separation, source-specific
  activation, lever immunity to kernels, fan force state, conveyor reversal,
  latch/restart, draft validation, copied IDs/links, catalog ordering/error/empty
  handling, revision invalidation and idempotent v2/v3 history preservation.
- Local storage tests cover reopen/list/order, invalid inclusion, origins,
  traversal, body limits and failed atomic writes. Symlink creation is skipped
  on this Windows host without Developer Mode; rejection code was reviewed.
- Application TypeScript/build passed; all 152 application tests passed.
- Actual in-app-browser walkthrough: blank level, placed/fixed objects, two
  inlets, independently linked button/conveyor and latch lever/fan, fan initially
  off, two spare conveyors, explicit save and reopen, Play/Stop/Restart, manual
  inclusion/reorder/save, standalone selection, and Chapter House selection.
  Clicking the lever produced the latched state and disabled further pulls;
  fan airflow/state feedback was visibly inspected. Pause overlay was inspected.
- Stop returned to a clean Saved authoring document. The production test uses
  no-op host effects by construction; no claim of a browser-storage diff is made.
- Normal gameplay was visually inspected at 390×844. Sidebar overflow and
  hidden-element CSS were corrected. This was viewport emulation, not a physical
  phone/iPad test. No subjective audio listening was performed.
- A saved disposable walkthrough level was removed from the playable list and
  moved to `tests/fixtures/editor-roundtrip.json`. The six original levels remain
  the included campaign. No test content was published.

## Integration corrections and limits

Review caught and fixed PUT response handling, normalized-document dirty state,
select/input event ordering, spare quantity focus, playtest visibility selectors,
and draft/test state separation. Because Vite ignores authored-file changes to
protect editor drafts from HMR, a read-only development asset route explicitly
serves newly created level files instead of depending on Vite's public-file cache.

Build warnings remain for future Vite native config-loader extension conventions,
the application's existing large chunks and its separate LiquidFun imports.
There is no publication, account integration change, performance/capacity claim,
new reward or physical-device certification in this pass.

## Change log

2026-09-22: Added file-based authoring, isolated production tests, stable campaign
identities, separate buttons/levers and controllable fans. Retained independent
standalone/application persistence and the owner-private Site unchanged.

2026-09-22 workspace follow-up: Removed the 700px board cap and centered maximum
page width, compacted chrome, added independent tools/inspector toggles, and
collapsed file controls, level details, spares, validation help and playable list
by default. Save/status remain visible in a sticky footer. Sidebars scroll on
desktop; narrow screens show the board first. Panel state is UI-only.

Verified in browser at 1662x1248: board 1132x679 with both rails, 1642x985
with both hidden (previous width cap 700). Verified disclosures, drag to x680
and undo to original x640/Saved, playtest/stop, and 390x844 layout without
horizontal overflow. Restored viewport and left the original saved level intact.
No browser console errors. Package TypeScript check and production build passed;
existing Vite future-native-loader warning remains. Local only.

2026-09-22 visual/shortcut trial: Shared renderer now draws four slotted metal
mounting bolts for fixed parts and a six-dot grip for movable parts, retaining
solid muted versus warm dashed outlines. Editor selection shows an upright
Fixed/Movable badge. Ctrl/Command+D duplicates selected placed pieces through
existing history; text fields and playtests retain their input behavior, and
held-key repeats do not create extra copies. Footer/button hint document it.
Typecheck and package build passed. Browser verified Ctrl+D offset selection,
fixed and movable visuals side by side, and four-step undo restoring Saved.
No console errors; verification made no file saves. Existing Vite warning remains.

2026-09-22 direct manipulation: Buttons/levers now have Pick target on board,
with highlighted placed conveyors/fans, crosshair cursor and Escape cancellation.
Picking preserves the control selection and changes only its target binding;
the existing dropdown still supports spare devices. Q/E rotate the selected part
by -/+15 degrees, ignoring input fields and key repeats. Inspector buttons and
footer advertise shortcuts. Browser verified lever-to-conveyor click binding,
E to 15 degrees, Q back to zero, Escape cancellation, and undo back to Saved.
No test files saved or console errors. Typecheck and production build passed.

2026-09-22 hidden gameplay wiring: Control connection lines now require an
explicit renderer flag, enabled only by EditorPreview. Production gameplay,
editor playtests and exported pictures retain the default hidden wiring.
Reviewed all renderer call sites; TypeScript and production build passed.
No binding, simulation or saved-level changes. No browser playtest for this
small rendering-only follow-up; existing Vite config warning remains.
