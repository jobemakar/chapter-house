# Gummy Nook 0.2.0 — match-3 pass
2026-09-13 · BOB-006-R3 · user-selected revision

The user liked the feel and animations but found dragging supplies into the tray confusing. This version replaces that interaction with a full 6×6 match-3 board. Original art, audio, cozy corner and quick eased movement are retained. The earlier merge-board source is preserved at Git tag gummy-nook-before-match3.

## Rules and feedback
- Five distinct silhouettes occupy the board. Swipe toward an orthogonal neighbor or tap two neighboring cells; keyboard Tab/Enter also works.
- A successful swap makes a horizontal or vertical run of at least three. Intersecting runs count each cell once. Invalid swaps animate forward and back, with no penalty. Nonadjacent taps change the selection.
- Matched pieces squish and disappear; survivors fall down their columns and new candy enters from above. Cascades resolve one wave at a time. Swap/fall flights use 210 ms easing, incoming pieces 280 ms, and clears 190 ms. An overlay clipped to the tray keeps arrivals contained and tracks the tray when scrolling.
- A generated board starts without existing matches and with a legal move. No-move boards automatically get a fresh mix. A defensive 30-wave cap also refreshes the tray if a pathological random source cannot settle. The player can always use free Hint or Mix.
- Undo restores the prior full board. Cumulative matched count, accepted moves, best cascade, discoveries and owned keepsakes remain. No timer, lives, limited turns or failure screen.
- The final board/progress commits and saves before playback. Extra board input is gated while animation runs; Undo, pause or settings cancel the visual sequence and render committed state safely. Reduced-motion mode bypasses the transitions.

## Progress and collection
Five candy forms appear on the board. Bunny and bear are additional collection display discoveries at 40 and 100 matched gummies; they do not increase the board's type count. Candy jar is a welcome keepsake; Gummy lamp, Soft sock cushion and Gummy-bear beanbag unlock at 12, 40 and 100 matched gummies. Existing ownership always wins over these new milestones. Item IDs, dimensions, mounts, clearance and candy/comfort rationale remain in src/core.js. The shelf shows ownership; full clubhouse placement remains outside this game.

## Saves and migration
New key bob-gummy-nook-v2, version 2: 36-cell stable board, cleared count, cumulative accepted moves, best cascade, discovered forms, owned keepsakes and comfort/audio settings. Thirty undo boards remain session-only.

If v2 is absent, load bob-gummy-nook-v1 at the same browser origin. Preserve valid discoveries, owned keepsakes and settings. Replace the incompatible sparse board with a fresh match-3 tray. The original v1 save remains untouched, retaining its board, queue and historical merge count. A corrupt v2 board is regenerated; valid ownership and settings recover independently. No saves are synchronized across file/server origins or devices.

## Provenance and distinctness
Book/cover/comfort connection remains the same loose, original interpretation documented in requirements.md. No medical or literal-story mechanics. This remains the collection's only match-based board game: no other title's navigation, physics construction/collapse, rhythm, food-station scheduling, stealth, habitat or containment signature is reused. No additional game or public deployment was created.

## 0.3.0 — 2026-09-13
Added user-requested diagonal swaps and a short filtered-noise swish. Cascade sound now climbs through eight pitches with increasing harmony/sparkle at bounded gain. Fixed landing blink: flights previously disappeared independently at 210 ms while incoming candy ran for 280 ms, leaving a gap before the board repaint. All flights now remain until destination paint, with matching content geometry and persistent unchanged SVGs.

Powerup experiment: Row Ribbon clears its row; Column Ribbon clears its column; Sugar Burst clears a 3×3 patch. Swap a marked candy with any of eight neighbors to trigger it without a line match; matching it also triggers it. Effects chain, clear unique cells once, and show a sweep/burst. First refill of moves 1/4/7/etc. delivers one, cycling row/column/burst. It may trigger immediately in a cascade. Gold borders, arrow/burst badges, labels and a compact guide explain the effects. Powers survive gravity, mixing, undo and saves.

Save format remains version 2 and key bob-gummy-nook-v2. Ordinary candy values remain 0–4. A power encodes its base shape plus 10 (row), 15 (column) or 20 (burst); validation accepts only those ranges. Old v2 saves load unchanged. Existing collectible identities and ownership remain unchanged. These consumable board tokens are original candy-themed effects, not new inventory/clubhouse collectibles.

## 0.4.0 — 2026-09-13
Replaced generic power flashes with dedicated overlays: row/column split projectiles and glowing trails (360 ms), Sugar Burst shock ring and radial candy particles (390 ms), and new Frost Flake. Frost Flake marks a candy with a blue snowflake badge, freezes both diagonals through its activated position for 580 ms, then cracks/fizzles into ice shards for 240 ms before clearing/refill. All overlays are board-clipped, chain-compatible and cancelled cleanly by pause/undo. Reduced motion bypasses them.

Fourth power delivery joins the existing three-move cadence: moves 1/4/7/10 cycle row/column/burst/frost, then repeat. Freeze uses values 25–29, keeping the version-2 save key and all prior encodings compatible. Powers remain consumable board effects; existing keepsakes are untouched.

## 0.4.1 — 2026-09-13
User requested more dramatic power animation and custom sound. Added a 140 ms charge and single shared board tint, larger projectile heads/150 px trails with endpoint spark showers, layered burst rings with 28 larger particles, and stronger frost/glow/shatter (650 ms freeze, 340 ms shards). Rules, save keys and earned progress unchanged.

Original synthesized cues: descending row blast, rising column blast, low candy-pop explosion with glitter, icy charging swell and crystalline noise/chime shatter. Same-kind simultaneous sounds are gated for 90 ms to keep chains controlled. Power voice nodes stop on cancellation/pause; mute routes through the existing master gain. Reduced motion retains power sound without overlay playback.

## 0.4.2 — 2026-09-13
User experiment: tray, rim and light tile wells gradually blend mint → sky blue → lavender → rose → apricot → mint. One color chapter per 120 cumulative clears, continuous RGB interpolation, six-second CSS easing on progress updates. Candy art/colors and game rules unchanged. No new save fields; palette resumes from saved cleared count. Reduced motion disables easing. Browser smoke check passed five distinct colors, cycle wrap, duration, unchanged board/SVG identity and reduced-motion handling; inspected lavender iPad screenshot.

## 0.5.0 — 2026-09-19 TypeScript/OOP port

The canonical rules now live in strict TypeScript `BoardEngine`; `SaveStore`,
`GummyRenderer`, `GummyArt`, `GummyAudio`, `MotionQueue`, and
`GummyController` compose the browser runtime. This replaces source rather than
wrapping old JavaScript. The 6×6 board, diagonal swaps, reject-and-return,
line-only matching, gravity/refill/cascades, no-move mix, hint/mix/undo, four
chainable effects, motion cancellation, settings/reduced motion, and audio
behavior remain the gameplay contract.

The v2 codec accepts only stable 36-cell values 0–4 and 10–29. It independently
recovers valid counters, discoveries, owned rewards and Boolean settings from
otherwise malformed saves, ignores future fields, does not delete/write v1 on
fallback import, and keeps undo boards session-only.
