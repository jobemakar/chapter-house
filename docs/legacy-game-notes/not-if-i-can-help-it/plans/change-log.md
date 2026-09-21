# Change log

## 2026-09-21 — refill origin and integrated landscape fit

Fresh gummies now render from true virtual rows above their own columns instead
of wrapping negative indices onto visible middle/bottom cells. Incoming falls
use a readable 480ms ease while ordinary gravity remains 210ms. The integrated
844×390 layout fits the complete board, essential tools and a scroll-contained
nook. Rules, powers, saves, rewards and audio are unchanged. Local only.

## 0.5.0 — 2026-09-19

Ported the active Gummy Nook runtime to strict, object-oriented TypeScript.
The typed production source replaces—not wraps—the prior core, art, audio,
motion and controller JavaScript. Added a pinned TypeScript compiler and lockfile,
compiled production-export tests, reproducible self-contained build, save codec
hardening and documentation. Rules, visuals, save keys/encodings, legacy v1
import and collection identities are preserved. No publication or asset change.

## Mouseover feedback — 2026-09-16

User requested grid-icon hover feedback. Fine-pointer candy icons lift/highlight without changing matches, powers or saves. OS reduced motion and the in-game Motion-off preference retain a static highlight. Built both outputs; fourteen pure-state checks pass. Original screenshot files are unrelated and untouched.

## 0.1.0 — 2026-09-13
Implemented the selected Gummy Nook discovery-board direction: seven forms, deliberate pair merges and neighboring cascades, supply preview, unlimited rearrangement, free scoop, undo, four placeable keepsakes with a cozy ownership shelf, saved progress and comfort settings. Original SVG art and synthesized music/effects. Touch-first responsive layouts and keyboard alternative. Added requirements, design/provenance, core/browser checks and reproducible standalone build. Seven core tests and browser acceptance checks pass; physical iPad, listening and family playtesting remain pending. No publication.

## 0.1.1 — 2026-09-13
User found instantaneous swaps and merges difficult to follow. Added quick eased movement for both swapped gummies, drag-release settling and sequential merge flights/squishes with synchronized sounds. Saved-state format and rules unchanged. Browser acceptance and dedicated motion checks pass, including intermediate forms, undo/pause interruption and reduced motion.


## 0.2.0 — 2026-09-13
Replaced the user-confusing supply-drag/merge loop with the requested full-board match-3. Neighbor swaps, invalid-swap return, line clears, falling refill, sequential cascades, hints and mix. Preserved quick easing, original art/audio and earned keepsakes through v1-to-v2 migration. Eight core tests, four browser layouts with touch/keyboard play, standalone migration and interruption checks pass. See match3-design.md. Prior version tagged gummy-nook-before-match3.

## 0.3.0 — 2026-09-13
Added user-requested diagonal swaps and a short filtered-noise swish. Cascade sound now climbs through eight pitches with increasing harmony/sparkle at bounded gain. Fixed landing blink: flights previously disappeared independently at 210 ms while incoming candy ran for 280 ms, leaving a gap before the board repaint. All flights now remain until destination paint, with matching content geometry and persistent unchanged SVGs.

Powerup experiment: Row Ribbon clears its row; Column Ribbon clears its column; Sugar Burst clears a 3×3 patch. Swap a marked candy with any of eight neighbors to trigger it without a line match; matching it also triggers it. Effects chain, clear unique cells once, and show a sweep/burst. First refill of moves 1/4/7/etc. delivers one, cycling row/column/burst. It may trigger immediately in a cascade. Gold borders, arrow/burst badges, labels and a compact guide explain the effects. Powers survive gravity, mixing, undo and saves.

## 0.4.0 — 2026-09-13
Replaced generic power flashes with dedicated overlays: row/column split projectiles and glowing trails (360 ms), Sugar Burst shock ring and radial candy particles (390 ms), and new Frost Flake. Frost Flake marks a candy with a blue snowflake badge, freezes both diagonals through its activated position for 580 ms, then cracks/fizzles into ice shards for 240 ms before clearing/refill. All overlays are board-clipped, chain-compatible and cancelled cleanly by pause/undo. Reduced motion bypasses them.

Fourth power delivery joins the existing three-move cadence: moves 1/4/7/10 cycle row/column/burst/frost, then repeat. Freeze uses values 25–29, keeping the version-2 save key and all prior encodings compatible. Powers remain consumable board effects; existing keepsakes are untouched.

## 0.4.1 — 2026-09-13
User requested more dramatic power animation and custom sound. Added a 140 ms charge and single shared board tint, larger projectile heads/150 px trails with endpoint spark showers, layered burst rings with 28 larger particles, and stronger frost/glow/shatter (650 ms freeze, 340 ms shards). Rules, save keys and earned progress unchanged.

Original synthesized cues: descending row blast, rising column blast, low candy-pop explosion with glitter, icy charging swell and crystalline noise/chime shatter. Same-kind simultaneous sounds are gated for 90 ms to keep chains controlled. Power voice nodes stop on cancellation/pause; mute routes through the existing master gain. Reduced motion retains power sound without overlay playback.

## 0.4.2 — 2026-09-13
User experiment: tray, rim and light tile wells gradually blend mint → sky blue → lavender → rose → apricot → mint. One color chapter per 120 cumulative clears, continuous RGB interpolation, six-second CSS easing on progress updates. Candy art/colors and game rules unchanged. No new save fields; palette resumes from saved cleared count. Reduced motion disables easing. Browser smoke check passed five distinct colors, cycle wrap, duration, unchanged board/SVG identity and reduced-motion handling; inspected lavender iPad screenshot.
