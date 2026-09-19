# Workspace game-package migrations

Date: 2026-09-19

## Authorization and scope

Jobe requested migrating Chapter House's existing Wishbone implementation into
the workspace-package structure proven by Dig & Douse, then bringing the other
games into Chapter House through the same repeatable process. This supersedes
the earlier hold after the first integrated slice. Work remains local; no
publication is authorized by this request.

Original book repositories, save keys, archives, and pre-existing working-tree
changes remain untouched. The current working trees are the canonical sources
for copying because several TypeScript ports have not yet been committed.

## Selected sequence

1. Move Wishbone Fling from `application/src/games/wishbone` to
   `application/packages/game-wishbone-fling`, preserving its integrated save,
   rewards, physics, camera, audio, levels, and behavior while adding a
   standalone development entry.
2. Generalize the Chapter House integrated-game registry so menu presentation,
   lazy loading, progress codecs, profile access, reward routing, and launch
   lifecycle do not gain another hardcoded branch for every game.
3. Migrate the seven other canonical implemented TypeScript games in bounded
   batches: Pocket Funhouse, Arctic Duet, Gummy Nook, Contraption, Stormglide,
   Bureau After Dark, and Moonlight Munch Run.
4. Resolve the tenth-book choice separately. `Sanctuary Seasons` is proposal
   only; the current Chapter House menu instead contains the noncanonical
   JavaScript `Veda's Great Escape` preview. Integrating Veda requires an
   explicit TypeScript/OOP port and a product decision about whether it replaces
   Sanctuary Seasons.

## Requirements

1. Every integrated game is an npm workspace package with its own direct
   dependencies and package-owned assets/licenses, while the repository keeps
   one root lockfile.
2. Each package exposes one TypeScript/OOP gameplay implementation through two
   adapters: a standalone Vite entry and a lazy integrated entry. No iframe or
   `postMessage` integration is used.
3. Each package exposes a DOM-free versioned progress codec. Old standalone and
   Chapter House saves are never deleted; imports are additive and idempotent.
4. Chapter House owns the common top bar, exit, mute, fullscreen, profile,
   active-play currency, and reward inventory. Games own their board, HUD,
   simulation, transient session, and game-specific progress events.
5. Each game defines meaningful bounded active-play evidence. Loading, idle,
   paused, backgrounded, completed, and catch-up time cannot mint currency.
6. Each game receives stable scoped reward IDs and at least one placeable
   keepsake mapping without duplicating historical ownership.
7. Selecting an integrated game removes its duplicate standalone-preview card.
   Original standalone repositories and direct package launch commands remain.
8. CSS is rooted to the game package; runtime engines and large assets remain
   lazy and do not enter the Chapter House startup bundle.
9. Package and root typechecks, tests, builds, preview-byte verification, and
   real-browser standalone/integrated smoke checks must pass after each batch.
10. Record source paths, copied assets/licenses, save/reward mappings, commands,
    and known physical-device/audio limitations so later migrations remain
    repeatable and reviewable.

## Acceptance

- Wishbone runs standalone and integrated from the same package source, and the
  old in-app source directory is removed only after parity checks pass.
- The application launcher uses one generic adapter path for every integrated
  game and handles asynchronous loading/disposal without race leaks.
- All seven implemented canonical games appear as integrated cards, retain their
  mechanics/progress, run standalone, and no longer appear as duplicate
  previews.
- The Elephant/Veda choice is documented and implemented only after resolution.
- Original book repositories show no migration-created source changes.

Implementation details follow the application-level
`docs/game-package-migration.md` recipe and each book's existing requirements,
design, change log, and verification records.

## Completion record — 2026-09-19

Wishbone Fling was moved out of `application/src/games/wishbone` and all seven
remaining implemented canonical games were copied into independently runnable
workspace packages. Together with the Dig & Douse pilot, Chapter House now has
nine generic registry-driven integrated games. Every package check, all 110 root
tests, root production build, preview-byte verification, and representative
real-browser launches passed. Original repository HEADs and dirty-entry counts
exactly match the pre-migration baseline. See
`application/docs/workspace-game-package-migration-log.md`.

## Tenth-book resolution — completed 2026-09-19

Jobe selected Veda's Great Escape as the canonical *The Elephant in the Room*
game, superseding the proposal-only Sanctuary Seasons concept. The five-puzzle
JavaScript study was ported to `@chapter-house/game-vedas-great-escape` with a
strict TypeScript/OOP runtime, DOM-free v1 progress codec, scoped rewards,
bounded active-play credit, lifecycle cleanup, a standalone Vite target on port
5201, and the same lazy Chapter House adapter used by the other games. The
preview card was removed after integration. Chapter House therefore has ten
canonical game packages; historical Sanctuary and original preview provenance
records remain intact.
