# Stormglide — design and implementation notes

## Core loop
Read approaching spark paths, rings, and pups; choose a route; steer and time a dash; collect feedback and companions; keep moving into the next sky. The challenge comes from motion and choices, with brief recovery instead of run failure.

## Visual treatment
Cozy storybook gouache sky with paper texture, indigo/turquoise/lilac clouds, peach horizon, and warm town windows. Foreground sprites and geometric effects are drawn on canvas. Titles use Fraunces; UI uses DM Sans. Cream text and mint controls sit against translucent dark panels.

There is one original background asset. Six chapters use hue treatments: Lantern Town, Cloudberry Gardens, The Moonlit Sea, Apricot Skies, Starfall Valley, and Aurora Way. This is not six unique scene illustrations.

## Audio
Web Audio oscillators generate soft arpeggios, chords, bass, and quiet percussion. Action sounds use short pitched sequences. No external sound files or streaming are required. Audio begins on a user gesture and pauses when gameplay pauses. Mute and music preference are separate.

## Source map
- `src/index.html`: title/start state, HUD, pause/collection panel, attribution.
- `src/styles.css`: fonts, palette, responsive breakpoints, panels and controls.
- `src/game.ts`: typed model/persistence/input/audio/renderer composition → saves and viewport → UI/actions/input → spawning/update/collisions → drawing → animation loop → optional page tool.
- `scripts/build.cjs`: inline source and fonts for hosted output; also embed the sky for the standalone file.
- `scripts/serve.cjs`: local static preview, bound to loopback.
- `tests/game.test.cjs`: VM simulation using mocked browser/canvas APIs. It is not a browser.

## Current tuning values
These describe implementation, not immutable collection-wide rules. Update requirements if the intended experience changes.

| Area | Current value |
| --- | --- |
| Chapter duration | 65 seconds; six chapters repeat |
| Events | Start after 22 seconds; repeat every 27 seconds; nominal duration 11 seconds |
| Dash | 0.85 seconds; 100 charge required |
| Charge recovery | 25 units/second normally; 80 during supercharge |
| Bump friction | 0.9 seconds of slowdown/wobble |
| Post-bump protection | 2.2 seconds |
| Spark magnet | 11 seconds |
| Supercharge | 9 seconds, 4× spark score, hazard clearing |
| Spark | 10 × current multiplier |
| Ring | 100 score and 35 charge |
| Pup | 200 score, one rescue, permanent discovery |
| Dash/supercharge hazard clearing | 50 score |
| Spark flow | Multiplier grows each 15 flow units, capped at 4× |
| Base scroll speed | 165 + min(70, elapsed seconds × 0.12); narrower screens apply 0.78 factor |
| Trail unlocks | Mint initially; rose/honey/lilac/ice at 5/10/15/20 total rescues |
| Visible followers | Up to 5; collection can retain all 12 |
| Simulation | Fixed 60 Hz update; capped animation-frame delta |

## Pups
Pi, Biscuit, Mochi, Pepper, Clover, Waffles, Nimbus, Fig, Cricket, Maple, Pip, Comet.

## Storage contract
Key: `stormglide-v1`.

Fields: `muted`, `music`, `gentle`, `trail`, `total`, `found`, `best`. The `found` array stores stable dog indices 0–11. `total` means lifetime collected pups, not number of unique discoveries. Unlocked trails derive from total rescues. Do not reorder the DOGS array without a save migration.

The flight's current score, time, location, entities, and followers are session-only. Automatic persistence runs periodically and when preferences/collection change. Saving uses localStorage best-effort handling; storage restrictions may prevent persistence while play continues.

## Build and verification
Both releases come from the same editable files. Hosted output has inline CSS/JS/fonts and a separate sky PNG. Offline output embeds the sky too. There is no runtime package dependency.

The existing behavioral simulation injects a temporary test interface into the compiled script in memory; it does not ship test hooks. It exercises collision/recovery, collection, powers, pause, and a long flight. The optional `pause_stormglide` page tool is feature-detected; only its simulated registration/behavior has been tested.

## Iteration opportunities to assess through play
Steering comfort, ring alignment, pace of unlocks, later-flight variety, touch controls, and music balance. These are observation topics, not approved new features. Log concrete ideas before building them.

## Touch-first revision
See [touch-design.md](touch-design.md) for the iPad input model, larger controls, rotation cleanup, and cached sky rendering. The current source version is 0.3.0; core tuning values above remain unchanged.
