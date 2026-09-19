# TypeScript/OOP canonical port — 2026-09-19

## Decision

Promote the six-level Contraption Club experiment as Popcorn's canonical local game (BOB-010-R3, version 0.3.0). Picture Day Parade v0.1.0 is archived intact at `archive/picture-day-parade-v0.1.0`; the root `pitch.md` remains the original Contraption pitch.

## Architecture

All active authored gameplay source uses `.ts`: `Engine` owns fixed-step particle simulation, proof batches, collision, switch direction state, and events; `LevelCatalog` owns append-only campaign identifiers. Rendering, audio, and workshop interaction remain separate focused browser subsystems. The small JavaScript build tool invokes the pinned TypeScript compiler and embeds emitted browser JavaScript into both output HTML files.

`LevelCatalog.ids` is stable and maps in order to immutable `legacyIndex` values 0 through 5. Existing v2 saves continue to store those numeric positions. New levels must be appended to both catalog arrays and never reorder old entries.

## Compatibility

The save key remains `popcorn-contraption.levels.v2`. v1 still imports only totals, keepsakes, and preferences; its layouts are deliberately not treated as authored level layouts. `normalize` restores locked fixtures from the authored solution, rejects duplicate/spoofed parts, and clamps movable geometry.

## Checks

Run `npm run check`, `npm test`, archive build/test commands, and compare the archive hashes recorded in `ARCHIVE.md`. Generated `dist/index.html` and direct-file `playable/popcorn-contraption-club.html` must remain byte-identical after a build.
