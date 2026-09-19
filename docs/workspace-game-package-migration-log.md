# Workspace game-package migration log

Date: 2026-09-19

This is the execution record for the repeatable process in
`docs/game-package-migration.md`. The original book repositories and their save
keys were preserved. Chapter House and each standalone target instantiate the
same package-owned TypeScript game class; no iframe or `postMessage` bridge is
used.

## Package and port ledger

| Book | Game | Workspace package | Standalone port | Chapter House progress | Reward namespace |
| --- | --- | --- | ---: | --- | --- |
| Wish | Wishbone Fling | `@chapter-house/game-wishbone-fling` | 5193 | package codec, including legacy Chapter House import | `wishbone-fling:*` |
| Wildfire | Dig & Douse | `@chapter-house/game-dig-and-douse` | 5192 | `version: 1` package codec | `wildfire:*` |
| The Mystery of Locked Rooms | Pocket Funhouse | `@chapter-house/game-pocket-funhouse` | 5194 | package codec | `pocket-funhouse:*` |
| The Very, Very Far North | Arctic Duet | `@chapter-house/game-arctic-duet` | 5195 | package codec | `arctic-duet:*` |
| Not If I Can Help It | Gummy Nook | `@chapter-house/game-gummy-nook` | 5196 | v2 codec with v1 import | `gummy-nook:*` |
| Popcorn | Contraption | `@chapter-house/game-contraption` | 5197 | v2 codec with v1 import | `popcorn:*` |
| The Miscalculations of Lightning Girl | Stormglide | `@chapter-house/game-stormglide` | 5198 | package codec with legacy import | `stormglide:*` |
| Amari and the Night Brothers | Bureau After Dark | `@chapter-house/game-bureau-after-dark` | 5199 | package codec with legacy v2 import | `bureau-after-dark:*` |
| Mabuhay! | Moonlight Munch Run | `@chapter-house/game-moonlight-munch-run` | 5200 | package codec with canonical v2 import | `moonlight-munch-run:*` |
| The Elephant in the Room | Veda's Great Escape | `@chapter-house/game-vedas-great-escape` | 5201 | `version: 1` package codec | `vedas-great-escape:*` |

## Root integration decisions

- `src/core/integrated-games.ts` is the only application discovery and adapter
  registry. The Games panel, profile, launch lifecycle, summary copy, allowlisted
  rewards, and lazy runtime imports consume it generically.
- Package manifests and progress modules are safe to import without game CSS,
  audio, canvas/WebGL engines, or DOM setup. Heavy runtime code is loaded only
  after a game card is selected.
- `Profile.games` is an additive record keyed by integrated game ID. Old
  profiles normalize missing entries to package defaults; the existing
  Wishbone save import remains additive and idempotent.
- Chapter House validates every scoped reward request before synchronizing a
  package-declared catalog item. Historical Wishbone instance IDs are retained
  to prevent duplicate furniture.
- A title is removed from `GamePreviews` only when its package is integrated.
  The independent standalone package target remains available.

## Verification record

- All ten game package checks passed: strict TypeScript, package tests, and
  standalone production builds.
- Root TypeScript, all 110 Chapter House tests, the production build, and exact
  preview-byte verification passed with all ten packages integrated and zero
  remaining legacy preview cards.
- Real-browser checks at `http://127.0.0.1:5191/` confirmed the integrated cards,
  representative earlier launches plus Veda's lazy launch, solver hint, movement,
  switch/exit logic and first-level progression; Chapter House top-right
  controls and shell exit remained present, with a clean browser console.
- Every original source repository retained its recorded HEAD and exact
  pre-migration status-entry count: Wish 6, Wildfire 23, Locked Rooms 51, Far
  North 20, Gummy 26, Popcorn 58, Stormglide 19, Bureau 9, and Mabuhay 124.

## Prior tenth-book decision context

The canonical catalog entry for *The Elephant in the Room* is Sanctuary
Seasons, which is proposal-only and has no implemented source. The current
Chapter House contains a noncanonical JavaScript preview, Veda's Great Escape.
It remains a preview until a product choice is made; integrating it would also
require a strict TypeScript/OOP port rather than copying it as-is.

## Resolved tenth book — 2026-09-19

Jobe selected Veda's Great Escape as canonical for *The Elephant in the Room*.
The original five-level JavaScript study was ported into the strict shared
package architecture while retaining its crate/switch puzzles, optional
peaches, tap/swipe/keyboard controls, undo/restart, solver-backed hint, sanctuary
art and optional tone feedback. The package adds:

- a standalone Vite adapter on port 5201 and the lazy Chapter House adapter;
- a DOM-free v1 progress codec for unlocked/completed levels, best moves,
  peaches, mute preference and scoped reward ownership;
- a leafy bench after two cleared paths and an elephant fountain after all five;
- bounded post-input active-play credit plus pause, mute, flush and disposal
  lifecycle behavior;
- pure puzzle/progress tests, including solver completion of all five levels.

The old preview card was removed only after package integration. Its exact
source snapshot and hashes remain in the provenance records. Sanctuary Seasons
is now a superseded proposal, preserved in dated historical documents rather
than represented as a second game.

## Legacy repository consolidation — 2026-09-19

After all ten packages were integrated and verified, the ten former top-level
book repositories were retired from the collection root. Their complete source,
assets, builds, standalone playables, Git histories, and then-current
working-tree states are preserved in the root-level
`archive/legacy-book-game-sources-2026-09-19.tar.gz`, with browsable recovery
copies under `archive/repositories/`; only reinstallable
`node_modules` and generated coverage caches were omitted. The archive SHA-256
is `B1F450BD8DEC591E456E31FD0A87780FD3DCF1C651F7B4596280CACE7B64B425`.

First-party Markdown and historical `game.json` files were also copied to
`docs/legacy-game-notes/` so design history, requirements, verification notes,
experiments, asset provenance, and prompts remain searchable without restoring
the source archive. Current iteration belongs in the package directories; these
copied notes are explicitly historical.
