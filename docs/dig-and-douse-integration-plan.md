# Dig & Douse workspace integration

Date: 2026-09-19

## Goal

Use Wildfire: Dig & Douse to prove that a book game can remain independently
runnable while sharing the Chapter House lifecycle, progression, currency, and
navigation systems without an iframe or duplicated gameplay implementation.

The canonical source at `../wildfire/` remains untouched and runnable. This is
a local integration; it does not authorize publication.

## Functional requirements

1. Preserve the selected BOB-009-R2 mechanic and current level: continuous
   excavation, finite LiquidFun water, immutable bedrock, working and capped
   intakes, three optional canteens, hint, voluntary reset, and fire-out result.
2. Preserve touch, mouse, and keyboard input, the bounded fixed-step simulation,
   hidden/paused suspension, and the existing illustrated assets.
3. Create a workspace game package with its own direct dependencies and a
   single authored TypeScript gameplay implementation.
4. Provide two adapters over that implementation:
   - a standalone Vite entry with a game-specific local save;
   - an integrated Chapter House entry using the shared typed game-host contract.
5. Chapter House owns its application bar, exit, mute, fullscreen, durable
   profile, active-play currency, and one-time keepsake awards. The game package
   owns its board, HUD, simulation, and transient session.
6. The integrated game records fires extinguished, best canteens in one run,
   cumulative canteens, and its owned reward IDs without changing or importing
   the original standalone save.
7. Only meaningful digging and the resulting water observation count as active
   play. Pause, hidden time, loading, victory overlays, and idle time do not earn
   currency or catch up later.
8. The first completed fire awards a placeable Camp Lantern exactly once. The
   three-canteen tally remains persistent and ready for later progression rules.
9. Games UI distinguishes both integrated games from the retained standalone
   preview catalog. Selecting either game closes the panel and mounts it in the
   common game host.
10. Add unit, build, standalone-browser, and integrated-browser verification and
    document the reusable migration procedure for later games.

## Architecture

1. Add `packages/game-host` for framework-neutral lifecycle and host-service
   types.
2. Add `packages/game-dig-and-douse` containing the migrated runtime, assets,
   LiquidFun boundary, package tests, and standalone shell.
3. Make the application root an npm workspace and lazy-load Dig & Douse from
   the Games panel. Wishbone remains behaviorally unchanged and continues to
   satisfy the same structural `GameSession` lifecycle.
4. Extend the version-1 profile additively with validated Dig & Douse progress;
   old saves receive defaults and retain every existing field.
5. Keep reward IDs scoped (`wildfire:camp-lantern`) so later games cannot collide
   with Wishbone's historical unscoped reward IDs.

## Acceptance

- Root install has one lockfile and resolves each package's declared direct
  dependencies.
- `npm run dev:douse` runs the game by itself.
- Chapter House mounts the same game package without an iframe.
- Exit, pause, mute, fullscreen, profile save, coins, cumulative canteens, and
  one-time Camp Lantern award work in the integrated session.
- Original Wildfire files and saves are unchanged.
- Existing Chapter House tests, build, and preview-byte verification still pass.

## Completion record

Completed locally on 2026-09-19.

- Added `packages/game-host` and `packages/game-dig-and-douse`; the latter owns
  its `liquidfun-wasm` dependency, exact referenced Wildfire art, Zlib license,
  tests, standalone shell, and integrated export.
- Added a stable `dig-and-douse` integrated-game entry and lazy import. The old
  Dig & Douse preview card was removed, while the original Wildfire repository
  and its pre-existing working-tree changes were left untouched.
- Added validated profile progress for fires extinguished, best and cumulative
  canteens, and scoped reward ownership. The first fire grants the placeable
  `wildfire:camp-lantern` reward idempotently.
- Active-play accounting is driven by actual excavation with an eight-second
  bounded observation window for the resulting water motion; pause, hidden,
  loading, victory, and idle time are excluded.
- Game mode hides destination and avatar-action controls, keeps Exit on the
  left, and retains name, currency, mute, fullscreen, and help on the right.

Verification performed:

- `npm test`: 109/109 Chapter House tests pass.
- `npm run build`: production build passes and emits Dig & Douse CSS/JS/WASM
  as lazy assets.
- `npm run check -w @chapter-house/game-dig-and-douse`: package typecheck,
  simulation, renderer, progress tests, and standalone build pass.
- `npm run verify:previews`: 8 previews / 11 files match source, build, served
  bytes, MIME types, and unknown-route behavior.
- Standalone browser at `127.0.0.1:5192`: real art and LiquidFun load; hint,
  reset, and drag-to-dig work; no console warnings or errors.
- Integrated browser at `127.0.0.1:5191`: card, lazy mount, game-only control
  shell, assets, and HUD load without console warnings or errors.

The reusable steps for the remaining games are in
[Game package migration recipe](game-package-migration.md).
