# Change log

## 0.1.1 — 2026-09-19
Ported the canonical 0.1.0 gameplay to strict TypeScript without changing its twelve authored route puzzles, key, save key or forgiving interaction rules. Typed level definitions, puzzle/progress model, storage/audio support, renderer/input and controller are source-of-truth classes/modules. Builds bundle emitted CommonJS modules into self-contained hosted/offline HTML; tests now run emitted production exports and include valid, malformed and forward-compatible save fixtures. Door Atelier and the rejected Luminous Locks removal were not changed.

## 0.1.0 — 2026-09-10
Jobe selected the original pitch for a playable demo alongside Stormglide. Wrote numbered requirements first, implemented independent readable source, generated original assets, added local progression, iPad-first pointer controls, audio/mute/pause and reproducible portable builds.

After Jobe questioned the book connection, replaced unrelated magical collectibles with original escape-room mementos. Retained “Pocket” as a format description.

Eight automated checks pass. No actual browser playthrough, physical iPad benchmark or audio listening performed. No publication or backend provisioning.

## Planned revision 2 — 2026-09-10
Recorded Jobe's play feedback and planned rearrange platforms and mechanisms to guide an autonomous wind-up key to a lock. No source, build, save or migration changed. See redesign.md and requirements-next.md. Earlier automated tests do not establish this new mechanic's playability.
