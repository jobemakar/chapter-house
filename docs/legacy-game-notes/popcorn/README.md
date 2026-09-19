# Contraption

Contraption is an original, local six-level machine-puzzle game loosely inspired by *Popcorn* by Rob Harrell. It is BOB-010-R3, version 0.3.0, with stable ID `popcorn-contraption-club`.

Open `playable/popcorn-contraption-club.html` directly in a browser. Drag movable pieces, leave bolted fixtures in place, and land every twelve-kernel batch in Good Pops. Spills safely recycle; cleared levels remain clear while you keep tinkering.

The authored campaign has stable string IDs and immutable legacy indices 0–5. Future levels append to that catalog; they do not renumber existing saves. Progress uses `popcorn-contraption.levels.v2` and imports earned totals, keepsakes, and preferences from `popcorn-contraption.v1` without importing its sandbox layouts. The unchanged sandbox remains at `playable/popcorn-contraption-club-sandbox-v1.html`.

## Development

`npm run check` validates the strict TypeScript project. `npm test` compiles the TypeScript source, builds the hosted/offline HTML, then runs the 11 deterministic core/parity tests. Authored active gameplay lives in `src/*.ts`; browser packaging stays in `build.mjs`.

Picture Day Parade v0.1.0 is preserved intact—not replaced in place—under `archive/picture-day-parade-v0.1.0`, including source, tests, generated artifacts, offline playable, save key, and original documentation. See its `ARCHIVE.md` for provenance and SHA-256 values.

[Requirements](plans/requirements.md) · [Levels](plans/levels-design.md) · [Verification](plans/verification.md) · [TypeScript port](plans/typescript-port.md) · [Change log](plans/change-log.md) · [Original pitch](plans/pitch.md)
