# Wishbone Fling
0.1.1 experiment · 2026-09-11 · BOB-003-ALT1

Pull the plush Wishbone backward and release him into the same Teeter Tower and Domino Picnic structures used in Backyard Ruckus. His torso, head, four paws, two ears and tail are nine linked physical bodies. The painted dog sprite is replaced by a stitched plush drawn from those bodies. Contact makes the ears and paws flop independently. He unfolds from the tumble into an animated foreground trot, then hops back onto his cushion.

Normal return takes 1.2 seconds after settling (or a 4.2-second flight timeout). Call Wishbone shortens the return to 0.62 seconds at any time. Return animation uses a foreground lane without solid tower contact; flight and collapse use real collision. One plush returns between launches. This is intentionally a different pacing experiment from the independently refilling socks in 0.2.

## Play and build
- Current local route: http://127.0.0.1:4322/floppy.html
- Standalone: `../../playable/Wishbone-Fling.html`
- Sock-and-chase comparison: `../../playable/Wishbones-Big-Fetch.html`
- Preserved 0.2 snapshot: `../../playable/Wishbones-Big-Fetch-v0.2.html`
- Run `npm ci`, `npm run build:floppy`, then `npm start` from the wish folder.

The experiment's renderer, controller and HTML are isolated in `src/`. Its `floppy-core.js` subclasses the existing yard/target solver. `plush.js` owns joints, ready/return poses and physical-part drawing. Both demos share the exact authored `wish/src/levels.js`, reward thresholds, storage helpers, assets and pinned Matter.js dependency. `scripts/build-floppy.cjs` resolves these shared modules and produces hosted and fully embedded offline files. Change authored files and rebuild; never edit generated HTML alone.

The independent key `wishbone-floppy-fetch-v1` stores the experiment using the existing version-2 progress schema. Neither `wishbones-big-fetch-v1` nor `wishbones-big-fetch-v2` is written or automatically imported. All six keepsakes remain loosely related to pets and retain their future placement footprints; no new collectible or clubhouse implementation.

## Verification
19 tests pass: six new checks cover articulated joints, collapse, twelve poor throws, bounded automatic/quick recovery, no return-lane collision, duplicate awards, frame-rate equivalence, touch ownership/cancellation, resize, pause, restack and separate saving. The original 13 game checks still pass. Worst measured joint separation stayed below three world units in the tested launch sequence; the acceptance test allows 15. Body and constraint counts stay bounded. Built inline scripts pass syntax checks.

The real browser preview was inspected and a pull/release launched the plush and updated keepsakes. No physical iPad/Safari playtest or independent audio listening has been performed. User feedback should decide which mechanic is more fun; passing physics tests cannot decide that. Two yards remain the full comparison scope.

## Book link
Wishbone is Charlie’s dog friend in *Wish*. Plush styling, tossing, towers and keepsakes are original playful inventions. No injury, pain, lives, forced failure reset, quiz or story spoiler.

## 0.1.1 — ears, contrast and title
Renamed the game Wishbone Fling at Jobe’s request. Ear roots now sit behind and above the eye with matched joint offsets. Opaque cream panels support the yard title, completion notice, target count and floating feedback; redundant small lawn captions were removed. Existing experiment ID, save key and floppy.html route remain stable, as does the old standalone filename alias. All 19 tests pass after the joint change; the actual browser view confirms readable panels and a clear eye/ear silhouette.

The dog’s name is Wishbone, as confirmed by the publisher: https://us.macmillan.com/books/9780374302733/wish/

## 0.1.2 — responsive dog and toys
2026-09-11. Separated renderer pause from aiming physics freeze. While held, Wishbone now paddles paws, wags his tail with pull strength, tilts his head toward the shot and trails his ears with pointer movement. Blinks and a playful tongue add expression. Toys have offset blink/ear cycles, look toward Wishbone, and widen their eyes on approach. Solid bodies and save formats are unchanged. Gentle motion removes added periodic animation; pause freezes the animation clock.

20 automated physics and simulated-browser checks pass, including held animation, non-mutating rendering, cancel and pause. Standard isolated test launch was blocked by the environment; the same suite passed with Node's --test-isolation=none. Browser security blocked opening the staged file; this revision has not had actual visual playtesting or physical iPad testing. The bankable powerups and world interactions in next-mechanics.md remain proposals only.

## 0.2.0 — bankable powerups and impact mechanisms (2026-09-11)
Implemented the selected six-system experiment. Bounce Biscuit adds up to three collision bounces; Magnet Bandana attracts loose targets within 170 world units; Tailwind Pinwheel offers one forward/upward gust, with a large in-yard touch button and optional automatic apex activation. All are banked via any-limb airborne pickup contact or rotating yard-clear rewards. Tap a saved item to arm/unarm. Bounce/magnet spend only on an accepted toss; pinwheel spends only on gust activation. Restack starts a new reward run; switching/reloading preserves claimed pickups and paid clear state.

The lever opens a gate guarding a bonus pinwheel; the polarity button cycles a local bucket/collar field; the bellows sends an upward jet for 0.8 seconds and recharges after two seconds. Both existing yards remain clearable without powers. Physical effects are confined to the Fling experiment; base sock-and-chase remains unchanged.

Added powers.counts, powers.discovered, powers.clears and powers.autoGust to the existing version-2 payload under wishbone-floppy-fetch-v1. Old saves default to zero charges. Each checkpoint adds gadgets.claimed/clearPaid/reward/gateOpen/polarity. Existing completed old checkpoints do not retroactively mint rewards; restack to earn them. Three permanent tabletop display discoveries join the six existing keepsakes; consuming charges does not remove display ownership. Save-denied mode remains playable with a visible unsaved notice.

Validation: 31 checks pass (old suite plus new physics, inventory, reward deduplication, migration, reload, cross-yard state, cancel/pause and trigger tests). Browser play: mid-air pickup banked, unpowered yard cleared, gate opened and magnetic field activated, inventory carried across yards/reload, biscuit armed and launched. Current visuals inspected. Manual/automatic gust, bellows force, polarity reversal and magnet range are tested in the simulation; no physical iPad or audible listening claim.

Rollback: tag wishbone-fling-before-powerups (eab83d8) records the complete 0.1.2 animation baseline. The current systems revision is a separate commit. Revert that systems commit to remove this trial while retaining the dog/toy animation changes. Before rollback, back up the browser save if retaining experimental charges matters: 0.1.2 ignores new power fields and rewrites only its known fields. The offline before-powerups copy is also retained in this task's outputs. No deployment or remote push.
