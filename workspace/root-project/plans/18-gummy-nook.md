# Gummy Nook — seventh book demo
2026-09-13 · BOB-006-R2 · local 0.1.0

Not If I Can Help It now has a playable demo. Drag or tap matching gummies to merge through seven shapes, set up adjacent cascades and decorate a little ownership shelf with four saved keepsakes. Unlimited rearrangement, free scoop and undo support continuous play. Candy/comfort links are original thematic extensions of verified cover imagery, not a simulation of Willa's condition or events from the novel.

Source: not-if-i-can-help-it/src. Build: node build.mjs from that book folder. Standalone: not-if-i-can-help-it/playable/Gummy-Nook.html. Requirements/design/verification/change log are in its plans folder. Stable game ID gummy-galaxy retained. Seven core tests plus browser gameplay, keyboard, touch emulation, save and responsive checks pass. Physical iPad and child playtesting remain pending. No publication or shared progression.

Seven books now have demos. Remaining unbuilt: Amari and the Night Brothers, The Elephant in the Room, Wildfire.

## Gummy Nook 0.1.1 — 2026-09-13
Added user-requested quick eased swaps and sequential merge animation. Mechanics and save identity unchanged. Browser/touch acceptance and dedicated animation/interruption checks pass. Local outputs rebuilt; no publication.

## BOB-006-R3 implemented — 2026-09-13
User selected a traditional match-3 pass while retaining Gummy Nook art and quick eased animation. Full 6×6 board, adjacent swaps, straight-line clears, gravity/refill and cascades; invalid swaps return. Free hint, mix, undo and automatic no-move refresh. Existing discoveries/keepsakes/settings migrate from v1 without deleting it. All-ten distinctness remains: this is the sole matching board. Numbered requirements preceded implementation; details in not-if-i-can-help-it/plans/match3-design.md. Eight core tests (including 250 complete turns), responsive browser/touch/standalone migration checks and animation-interruption checks pass. Local 0.2.0, no publication.

## Gummy Nook 0.3.0 — 2026-09-13
User-selected diagonal swaps, swap swish, escalating cascade audio and landing-blink fix. Added experimental row/column/3×3 power gummies with chain reactions and periodic refill delivery. Matching remains straight-line; the core match-3 signature remains distinct. Saves and earned keepsakes preserved. 13 core/audio-recipe tests and browser touch/motion/power/landing checks pass. Local outputs rebuilt; no publication.

## Gummy Nook 0.4.0 — 2026-09-13
User-requested specialized power overlays implemented: row/column projectiles, radial sugar explosion and new Frost Flake X-freeze/crack/shard effect. Fourth periodic power delivery; saves and prior rewards retained. Match-3 signature unchanged. 14 core tests, browser regression and dedicated overlay/cancellation checks pass. Local demo only.

## Gummy Nook 0.4.1 — 2026-09-13
Amplified power overlays and added distinct row/column/burst/freeze/shatter audio at user request. Rules/saves unchanged. Overlay/interruption and rendered-audio checks pass; local outputs updated without publication.

Gummy Nook 0.4.2 (2026-09-13): user-selected progress-driven tray color drift, with saved progress and reduced-motion support. Local only; mechanic unchanged.

## Gummy Nook 0.5.0 — 2026-09-19

The canonical match-3 implementation is now strict TypeScript and object-oriented
without changing its board encodings, power interactions, animation behavior or
`bob-gummy-nook-v2` migration from the retained v1 key. Builds and automated
production-module tests are reproducible. Browser visual review, physical iPad
testing and subjective audio listening remain pending; no publication occurred.
