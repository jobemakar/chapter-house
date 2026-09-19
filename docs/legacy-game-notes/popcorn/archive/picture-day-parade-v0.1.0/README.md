# Picture Day Parade

An original, unofficial game loosely inspired by **Popcorn** by Rob Harrell. Current implementation: BOB-010-R2, local version 0.1.0. The stable game ID `popcorn-contraption-club` is retained for compatibility; the original machine pitch is historical.

Open `playable/picture-day-parade.html` directly in a browser. No install or network needed.

- Drag the viewfinder to compose your photo; +/− changes zoom.
- Cue the fan, mascot or bubbles, then **Snap** at your favorite moment.
- Burst captures three successive moments and selects the strongest.
- Nine shot-list discoveries across three freely available scenes. Unlimited reshoots.
- Keep chosen photos, revisit the album, or download a framed PNG.
- Sound, slower motion and pause controls are always available. Keyboard: arrows / G / Space / B / P / + / −.

`node build.mjs` rebuilds `dist/index.html` and the standalone playable from `src/`. `node --test tests/core.test.cjs` checks composition, reachability, saves, ownership and build parity. No runtime or build dependencies.

Progress and up to 30 selected photos save to this browser under `picture-day-parade.v1`. Private browsing or storage denial can prevent persistence; the game reports storage failures. Photos contain only original illustrated game scenes, with no real camera, uploads or account. Opening a file and opening the local preview may use separate saves.

Framed game photo, camera lamp and backdrop screen ownership is ready for future integration; actual clubhouse placement is not part of this game. Source preserves spatial metadata and original thematic rationales. No public deployment was made.

[Requirements](plans/requirements.md) · [Design](plans/design.md) · [Verification](plans/verification.md) · [Changes](plans/change-log.md) · [Original pitch](plans/pitch.md)

## Try the original contraption concept
A separate [Popcorn Contraption Club](experiments/contraption-club/README.md) physics toy is available at experiments/contraption-club/playable/popcorn-contraption-club.html. It has its own source, build, tests and save. Picture Day remains unchanged.
