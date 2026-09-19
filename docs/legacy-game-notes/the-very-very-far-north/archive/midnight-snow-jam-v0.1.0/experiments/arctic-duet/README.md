# Arctic Duet 0.1.0

A separate, playable Duet Cats-inspired alternative to Midnight Snow Jam. Two independently sliding Arctic friends catch original musical ice-cream notes. Original Snow Jam remains the main entry and its source/save is unchanged.

## Play
Open http://127.0.0.1:4323/duet.html with `npm start` running from this repository, or open `playable/Arctic-Duet.html` offline. `npm run build` rebuilds both games; `npm test` checks both.

Touch/drag anywhere within each half. A pointer owns its initial half until released, even if dragged across the dividing line. Use two thumbs on iPad. Keyboard: A/D and left/right arrows. With One hand enabled, the unselected friend follows the next snack automatically; manual touches always take precedence. Mute, pause, Gentle pace and Less motion are available during play. Gentle pace changes unspawned notes and caps difficulty at 2 while visible notes finish unchanged.

## Progression and design
78 BPM transport, four-beat opening, then 32-beat verses (~24.6 seconds) without breaks. Level 1 has centered alternating catches every two beats; level 2 small offsets; level 3 wider motion with 1.5-beat spacing; level 4 introduces paired catches; level 5 one-beat spacing; level 6 more pairs. Fall lead gradually shrinks from 4 to 2.62 beats. Difficulty caps at 8; later level numbers continue with palette/pattern variations. Early catch tolerance is wide; later tolerance remains generous. A stationary opening intentionally succeeds so the child learns where snacks land before coordination is required. Levels follow musical time, not a perfect-play gate.

Both friends track snacks with their eyes, bob, blink, open their mouths, chew and celebrate catches. Snow splashes mark misses. Score never decreases and there is no failed run. Original code-native paper shapes, warm ice-cream colors and aurora backdrop. Original backing/chirps share the tested Snow Jam synthesizer; no Duet Cats art, recordings or melodies used. Fonts are existing local DM Sans/Fraunces with licenses embedded in the standalone. No network runtime dependencies.

Save `arctic-duet-v1` validates and stores total catches, highest level and settings. Each fresh visit starts easy at level 1. No account, inventory or named collectible items in this experiment; falling snacks are transient musical cues. This does not touch `midnight-snow-jam-v1`.

## Verification — 2026-09-12
21 automated tests pass (15 existing, 6 new), including progression/difficulty caps, paired catch deduplication, harmless misses, independent pointer ownership/cancellation, malformed and denied saving, runtime multi-pointer/keyboard/settings integration, continuous levels and pause/resume. Shared audio tests cover valid scheduling, cancellation and unsupported-audio fallback. Browser inspected at narrow layout: start, visible falling snacks, drag movement, one-hand toggle, saved progress on reload, and progressing score/level. Physical iPad multi-touch and audio listening remain unverified. Nothing published.
