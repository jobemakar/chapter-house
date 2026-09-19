# Arctic Duet requirements

2026-09-12, promoted 2026-09-19 · BOB-004-ALT1 · *The Very, Very Far North*.

The publisher identifies Duane as a polar bear and Major Puff as a puffin within an Arctic friendship story. Arctic Duet uses only that high-level premise. Its sliding/catching play, snacks, canvas art, music, keepsakes and setting are original inventions; it does not reproduce book scenes, illustrations, Duet Cats assets, recordings, or melodies. Publisher source: https://www.simonandschuster.com/books/The-Very-Very-Far-North/Dan-Bar-el/The-Very-Very-Far-North/9781534433427 (checked 2026-09-11).

| ID | Requirement |
|---|---|
| AD-01 | Canonical root game is `arctic-duet` / BOB-004-ALT1; Midnight Snow Jam remains archived, playable in isolation, and never shares an active save. |
| AD-02 | Two characters slide horizontally in independently owned left/right screen halves. Two touches can act simultaneously; pointer ownership holds through crossing/cancel. Mouse, A/D, left/right, and one-hand partner assist work. |
| AD-03 | Music starts with a four-beat count-in at 78 BPM. 32-beat levels follow without clearing existing notes: centered/sparse first, offsets second, wider motion third, then pairs and density. |
| AD-04 | Levels are time-driven rather than gated by perfect play. Difficulty caps at 8, later levels keep varying visual/pattern timing. Gentle pace caps newly authored difficulty at 2 without changing level numbers. |
| AD-05 | Catches score once per note. Misses make responsive feedback but never remove score, catches, keepsakes, or continuity; no lives/restarts/questions. |
| AD-06 | Music and snacks share the transport. Pause and visibility stop the transport and queued sound; audio failure leaves a playable visual clock. Mute is accessible. |
| AD-07 | Canvas has a cool Arctic sweet-shop stage, split legible halves, clear catch horizon/trails, expressive eyes/mouths, reactions, snow/sweet particles, and readable HTML controls. |
| AD-08 | Touch-first responsive layout must retain one- and two-hand input, keyboard, mouse, one-hand assist, gentle pace, reduced-motion, pause and mute. No zoom-blocking viewport. |
| AD-09 | Only `arctic-duet-v1` persists validated catches, best level, mute/gentle/assist/reduced-motion and Duet keepsakes. New visits start at level 1. Denied storage remains playable. |
| AD-10 | Keepsakes are original stable `duet-*` IDs. They are idempotently awarded from `arctic-duet-v1.total` only: floor Duet Snow Cushion at 12, wall Puffin Window Star at 30, floor Aurora Wool Rug at 60, wall Together Pennant at 100. No Snow Jam progress or reward ID is imported/reused. |
| AD-11 | Active authored gameplay lives in strict TypeScript (`core`, `audio`, `render`, `game`) with composed model/input/audio/renderer runtime. Pinned lockfile, compiled tests, reproducible build, canonical hosted/offline output and compatibility alias are required. |
| AD-12 | Verify chart difficulty/catch dedup/miss safety/continuous level progression/touch input/save validation/keepsake idempotence/pause accessibility and generated output. State browser/device/audio QA limits honestly. |
