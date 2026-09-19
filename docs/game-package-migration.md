# Game package migration recipe

Use the Dig & Douse pilot as the reference for moving another book game into
Chapter House while preserving a standalone development target. The integrated
and standalone builds must instantiate the same gameplay source; adapters may
provide different host services, but must not fork the game implementation.

## 1. Inventory before copying

- Record the source repository, revision/state, runtime dependencies, asset
  licenses, save keys, input methods, audio, pause/visibility behavior, and
  existing tests.
- Identify the game-owned board, HUD, simulation, and transient state. Identify
  the shell-owned navigation, fullscreen, mute, profile, rewards, and currency.
- Leave the source repository and its save keys untouched. Copy only the files
  required by the package, preserving third-party notices.
- Decide the stable game ID, progress shape/version, and namespaced reward IDs
  before wiring the host.

## 2. Create a workspace package

Add `packages/game-<id>/package.json` with a unique
`@chapter-house/game-<id>` name. Declare every direct runtime dependency in that
package, even though the repository uses one root lockfile and npm may hoist the
installed module. Keep test/build tools aligned with the root versions.

Recommended layout:

```text
packages/game-<id>/
  index.html                 # standalone shell
  package.json
  src/
    game.ts                  # one authored gameplay implementation
    index.ts                 # integrated factory/export
    standalone.ts            # standalone host adapter
    progress.ts              # versioned validation/migration, no DOM imports
    style.css                # selectors scoped to the game root
    assets/                  # package-owned URLs/imports
  tests/
  third-party/               # required license notices
```

Export the integrated entry as `.` and expose a DOM-free progress module as
`./progress` when the Chapter House profile or Node tests need it. Add root
scripts such as `dev:<short-name>`, `build:<short-name>`, and
`test:<short-name>` for discoverability.

## 3. Implement the shared host boundary

Depend on `@chapter-house/game-host`. The integrated factory receives
`GameHostServices<TProgress>` and returns a `GameSession`:

- `GameSession`: pause/resume, mute, flush durable progress, and dispose all
  frames/listeners/observers/physics/audio. `status()` is optional diagnostics.
- Host services: initial validated progress, current mute/reduced-motion state,
  account-wide active-play seconds, exit, notification, progress save, monotonic
  active-play credit, and reward award.

Do not import the Chapter House profile, navigation, or DOM shell from the game.
The package reports domain events through the host contract; the application
decides how they affect its durable profile and UI.

## 4. Keep two thin adapters

- **Standalone:** mount the game into its own page and implement host services
  with a game-specific local-storage key. It must run with
  `npm run dev -w @chapter-house/game-<id>` and support direct testing.
- **Integrated:** export a factory from the package and lazy-import it when its
  Games card is selected. Mount into the common game host; do not use an iframe
  or `postMessage`. Chapter House keeps its top bar, exit, fullscreen, mute,
  profile, reward, and currency responsibilities.

Both adapters call the same game constructor. Adapter code can differ only in
service ownership and surrounding shell.

## 5. Version progress defensively

- Define a serializable, versioned progress type and a validator/migrator that
  accepts `unknown`, supplies defaults, clamps invalid values, and preserves
  only recognized fields.
- Add the game progress to the Chapter House profile additively so old profiles
  load with defaults. Do not read, rename, or delete the original game's save.
- Save at meaningful checkpoints, on reset/victory as appropriate, on explicit
  flush, and on dispose. Make repeated flushes and reward synchronization
  idempotent.
- Test a fresh profile, malformed/older payloads, reload, cumulative counters,
  best values, and repeated saves.

## 6. Credit only active play

Games submit an account-wide monotonic active-play total, never a replayable
coin delta. Count only interaction and its short, bounded consequence window.
Do not count loading, idle time, hidden tabs, pauses, menus, victory overlays, or
elapsed-time catch-up after resuming. Stop timers during `setPaused(true)` and
dispose. Test that repeated snapshots cannot pay twice.

## 7. Scope rewards

Use `<game-id>:<reward-id>` (for example,
`wildfire:camp-lantern`). The game requests the stable ID when its condition is
met; Chapter House validates the allowed ID, records ownership, synchronizes the
corresponding catalog item, and returns whether the award was new. Test repeat
completion, reload, and repeated synchronization so a keepsake cannot duplicate.

## 8. Isolate presentation and assets

- Scope every CSS rule below one package root class so a game cannot restyle the
  application shell or another game.
- Import assets as package URLs so both Vite entry points emit them correctly.
  Preserve exact visual/gameplay assets unless a separately reviewed change is
  intended, and retain all licenses/provenance.
- Respect the host's reduced-motion and mute values. A game with no audio may
  still retain mute state for a stable contract.

## 9. Update discovery once

Add stable integrated-game metadata and an integrated card to the Games panel,
then lazy-load by ID. Remove the same title from the standalone preview catalog
so the menu does not show two cards for one game. Keep its original repository
and independent package target; only the duplicate Chapter House preview entry
is removed.

## 10. Verification checklist

- Package typecheck, unit tests, and production build pass.
- Standalone page loads its real assets/dependencies, accepts pointer/touch and
  keyboard input, pauses when hidden, reloads its own progress, and has no
  unexpected browser errors.
- Integrated card lazy-loads the package without an iframe; Chapter House exit,
  mute, fullscreen, pause/visibility, and top-bar rules still work.
- Integrated progress survives reload; active-play credit is monotonic and idle
  time earns nothing; every reward is one-time and placeable if applicable.
- Exiting and re-entering leaves no duplicate callbacks, listeners, audio,
  observers, or physics loops.
- Root typecheck, tests, production build, and standalone-preview byte
  verification pass. Confirm the build emits the migrated game as a lazy chunk.
- Compare the original repository status with the pre-migration baseline and
  confirm its source and save key are unchanged.
- Record source provenance, copied assets/licenses, commands run, browser sizes,
  limitations, and any physical-device/listening work still pending.

For the concrete pilot requirements and ownership decisions, see
[Dig & Douse workspace integration](dig-and-douse-integration-plan.md).
