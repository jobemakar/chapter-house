# Editor verification — 2026-09-22

## Implemented and reviewed

The primary agent implemented/reviewed physics, save migration, campaign/runtime integration and mobile layout. Three GPT-5.6 Sol subagents implemented the content/server, desktop editor and static obstacle art; the art agent also added editor-model tests and performed an independent runtime review. Reports were followed by primary-agent source review and actual tests.

Review corrections included duplicate collision fixtures, intake sensor/body overlap, rotation-aware decoy feedback, tiny fills that generated no particles, shape movement deformation at boundaries, bottom-edge pipe snapping, save-in-flight dirty-state races, authoring locks during Play, asynchronous Stop/readiness handling, and a single-cell brush initially landing between cells.

## Automated checks

- `npm run check -w @chapter-house/game-dig-and-douse`: PASS after integration. Strict TypeScript, seven test entrypoints, and the standalone/editor production build.
- Original physics: reservoir containment, existing winning routes, three original canteens, capped intake behavior, intake drainage, rocks and repeated reset.
- Authored physics: two independent finite sources, intact outlet containment, side/bottom release, percentage quota fixed to starting particles, indestructible pipe obstacles, zero-filled source and repeated reset/dispose.
- Content: ordered terrain rasterization, legacy geometry fidelity, pipe joins/orientations, intake transforms, campaign/document validation, effective-water validation and runtime JSON loader behavior.
- Local server: incomplete draft persistence, separate campaign inclusion, campaign order generation, rejection of invalid listed levels, missing file handling, filename/ID mismatch, traversal and foreign-origin write rejection.
- Editor model: independent undo/redo snapshots, shape/vertex movement, snap bounds, pipe rotation, deep duplication/stable IDs, required-object retention and explicit legacy conversion.
- Progress: idempotent v1-to-v2 migration, zero/many canteens, completion by stable ID, sequential unlock, replay access, reordering/removal and retained rewards.
- Application profile integration: 14 focused profile tests PASS.
- `npx vite build` in `application/`: PASS, including emitted `douse-levels/` JSON assets. This is the bundler build, not a claim that the combined application typecheck passed.

## Browser checks

Primary-agent automated interactions ran in real headless Microsoft Edge through Playwright on Windows. Screenshots were visually inspected. These are browser/viewport checks, not physical phone/iPad use or audio listening.

1. Desktop editor at 1440 × 1000: paint/erase, rectangle, polygon, optional canteen, rotated T pipe, Undo/Redo, manual save and file readback.
2. Draft save leaves campaign unchanged. Explicitly add an unplayed draft and save the campaign. A fresh game reads it as a locked next level. Save/campaign operations do not reload the editor or lose its state.
3. Unsaved changes enter Play. Restart resets the simulation. Stop restores the exact pre-test authoring canvas and history; disk content and localStorage remain untouched.
4. Direct test-mode lifecycle exercised win, persistence flush, restart and dispose against instrumented host services: zero save, reward and coin callbacks.
5. Delayed Save followed by another edit: the snapshot reaches disk, newer edits remain visibly dirty. Authoring/library controls are inert while playing; Escape restores editing. Static-server HTML fallback reports an editor-server error.
6. Minimum-size brush click changes exactly one terrain cell.
7. Gameplay renders at 1366 × 900, 390 × 844 portrait and 844 × 390 landscape. Short landscape was corrected to place controls beside a usable board. Authored two-source water/barrier rendering was inspected.
8. Built standalone game served beneath `/chapter-house/` successfully fetches `douse-levels/campaign.json` and the listed `painted-hillside.json` (HTTP 200), loads WASM/art and reaches ready state with no page errors. No file-writing server is required for production play.

Screenshots: `editor-workflow.png`, `authored-game.png`, `game-desktop.png`, `game-390.png`, `game-844.png`. Temporary QA drafts/campaign entries were removed and the original campaign restored.

## Broader workspace limitations

The full application typecheck currently reports optional-value errors in the separate Wishbone lifecycle tests (`tests/lifecycle.test.ts`). The full application test run also fails in those Wishbone lifecycle cases and a Wishbone checkpoint case in `tests/wishbone-levels.test.ts`. Those files/implementation were already being changed outside this task; this task did not alter them. The focused Dig & Douse suite, profile integration tests and bundler builds above passed. No physical device, audio-listening or hosted publication verification is claimed.

## Delivered state

Source files are in the existing application repository, independent original book repositories are untouched, and the local editor server runs at `http://127.0.0.1:5192/editor.html`. Only the original level remains in the delivered campaign. No new authored campaign levels or publication were requested by this editor implementation.

## 2026-09-22 follow-up
- `npm run check`: passed typecheck, seven test entrypoints and production build. Existing Vite native-config / LiquidFun browser externalization warnings remain.
- CUA browser verification: board 480 × 599.5 at 1280 × 720; 618 × 772 at 1440 × 900. Stop/Restart visible within viewport.
- Saved the user’s current custom draft before source refresh. Fresh editor restored the saved drawn paths. Dug a route from its reservoir to the corrected intake; reached Fire out / 100%. Restart reset to 0%; Escape returned to Saved authoring state.
- Regression assertions cover open space above working pipe in all four rotations, solid barrel, open mouth, solid capped dome and original campaign fixtures matching shared geometry. Original winning-route physics still passes.
- User-authored `levels/new-level.json` remains local and outside the campaign/source commit. No publication.
