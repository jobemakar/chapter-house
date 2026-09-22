# Local editor verification — 2026-09-22

Implemented separate `editor.html`, shared cartoon rendering, file-backed
standalone campaign loading, and a local-development-only write API. All 23
original levels remain in their original order, with stable room IDs and player
save format. No publication or Chapter House integration was performed.

## Automated checks

- `npm test -w @chapter-house/game-keyfall-prototype`: 47 passing runner checks,
  no failures, one skip. The editor-model file additionally exercises six
  assertions/scenarios. Existing completion and mastery traces still pass.
- `npm run build -w @chapter-house/game-keyfall-prototype`: TypeScript and
  production Vite build pass. Both browser entry points and JSON data packaged.
- Coverage includes draft parsing, shared play/save validation, safe IDs and
  paths, write request boundaries, ordering, loader diagnostics, fixed rotating
  platform collision, fixed-force bellows direction, history and save races.
- Symlink rejection test skipped because this Windows configuration cannot
  create symlinks without Developer Mode. The rejection guard remains present.

## Actual browser checks

Used the local server at `http://127.0.0.1:5198/` and its `/editor.html` page.

1. Created and saved an incomplete blank draft. Confirmed JSON on disk, three
   structure issues, disabled Play, and absence from the campaign index.
2. Added key, goal, anchor, three tickets and flat platforms. Edited title,
   numeric position (420,610), and rotation (35 degrees). Inspected the written
   JSON and reopened the file. Values persisted.
3. Exercised undo/redo and duplicate/delete. Fixed field input commit and active
   numeric typing bugs discovered during verification.
4. Played a test level through goal completion, stopped back to editing, and
   saved the informational playtested flag. Layout remained unchanged. Tested
   Pause, Reset and Stop with an existing advanced-mechanic room.
5. Explicitly added the saved test level, moved it up, and saved order. Confirmed
   the 24-entry index on disk and that the game rendered the same order.
6. Removed only that temporary campaign entry, saved the original 23-entry
   order, and removed the temporary verification JSON. Rebuilt clean output.
7. Visually inspected cartoon game/editor rendering, corrected the editor
   aspect ratio to 7:10, and placed play controls outside the board.

Browser tests used the desktop environment, including phone viewport emulation;
no physical-device testing or audio listening is claimed. File-writing features
require the local development server; a static production server has no writer.

## Selection layout correction — 2026-09-22

User reported the inspector appearing could shift the board under the pointer.
Reserve inspector height, constrain numeric inputs to their grid columns and
keep the viewport scrollbar gutter stable. Browser selection check confirmed
identical board bounds before/after selection and the document remained Saved.
The CSS updates live without reloading or discarding the current draft.

## Directional fan revision — 2026-09-22

Bellows now appear as animated cartoon fans with rotating impellers, a cage,
directional outlet and traveling airflow chevrons. The palette and inspector
say Fan. Rotation describes airflow (0° right, 90° down); stored legacy bellows
angles are converted at the UI boundary so old trajectories stay unchanged.
The fixed-strength tap action and JSON kind remain compatible. Tap air-jet
devices use the same fan artwork. Pause/completion freeze decorative animation;
reduced-motion mode stops it in gameplay and system reduced motion stops it in
the editor/playtest.

Browser checked new fan placement and 0°/90° orientation, with animated blades
and no console errors. No test edits were saved. Full suite: 48 pass, one Windows
symlink skip; production build and TypeScript pass. A regression check compares
editor/visual heading with actual force at cardinal and oblique angles, while
the existing completion traces verify legacy behavior.

## Power, length and ambient motion — 2026-09-22

Ctrl/Cmd+D duplicates the selected object outside text fields. Fan Power × is
adjustable from 0.25–3 and scales both the production push and blade/airflow
animation speed. Platform Length px is adjustable from 40–280; collider,
artwork, hit testing and selection outline use the same length. Legacy missing
values preserve 1× power and 104px length. The inspector reserves enough space
for either new field. Numeric edits and duplication retain undo/redo behavior.

Tickets now sway approximately ±3.2 degrees and bob ±1.6 world pixels on a slow,
offset sine cycle. This is decorative only; authored collection positions do
not move. Pause/completion freeze it, and reduced motion disables it.

Browser verification added a 2× fan and a 220px platform, duplicated both via
Ctrl+D, and confirmed the visible duplicated artwork and retained length.
No existing level files were saved during this check. Automated tests verify
power/length JSON round-trip, rejected out-of-range values, actual doubled
force, rotated 220×20 collider geometry, editor defaults and duplicate values.
Full suite passes (49 runner checks, one Windows symlink skip); build/typecheck
passes. Original gameplay traces continue to pass.

## Bubble lift reduction — 2026-09-22

User requested 10% balloon acceleration. Shared BUBBLE_TUNING.accelerationScale
is now 0.1, scaling net upward lift after gravity without rewriting level files.
Existing capture/rise/pop/gravity tests and every zero-ticket completion trace
pass. Full suite: 48 pass, 1 skip, 1 failure in the old timed mastery recordings
(Draft Gallery tap at tick 120 no longer hits the slower bubble). These recordings
need retiming for the new physics; no claim that old mastery timings still work.

## Walls and rotation shortcuts — 2026-09-22

Added Q/E counterclockwise/clockwise 15-degree rotation via undoable edits for
all rotatable selections. Text entry, modified shortcuts and playtest are excluded.
Walls use the platform length control and thickness but distinct wood artwork.
Wall contacts force zero restitution without changing the key's normal bounce.
Browser checked 240px wall artwork, Q=-15 degrees, E=0 and Undo=-15. Runtime
checks pass for JSON round-trip, collider width, resting without rebound and
unchanged key restitution. Typecheck/build pass. Prior bubble mastery timing
failure remains as recorded above; it is unrelated to walls or shortcuts.
