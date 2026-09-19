# Candidate 01 — Stormglide

Book: *The Miscalculations of Lightning Girl*  
Author: Stacy McAnulty  
Game: **Lightning Girl: Stormglide**  
Idea ID: BOB-001  
Game ID: stormglide  
Initial creation and public release: 2026-09-10  
Collection registration: 2026-09-10

## Location and publication
Canonical book folder: `../the-miscalculations-of-lightning-girl/`  
[Book README](../the-miscalculations-of-lightning-girl/README.md)  
[Detailed requirements](../the-miscalculations-of-lightning-girl/plans/requirements.md)  
[Design and implementation notes](../the-miscalculations-of-lightning-girl/plans/design.md)  
[Change log](../the-miscalculations-of-lightning-girl/plans/changelog.md)  
[Public game](https://lightning-girl-stormglide.mowgliworf.chatgpt.site)

The original projectless checkout was copied into this book folder with its Git history and Sites identity retained. Future source edits should happen here. The earlier conversation workspace remains a historical copy; its original standalone HTML was also retained there.

The published release remains Sites version 1, from source commit `7934b664f3863c7442f1f0357de21102933047ae`. Access is public, as explicitly requested by Jobe. The maintainability reorganization is a local revision and has not been republished.

## Experience
The player rides a small cloud through a painted twilight sky, collects curved paths of sparks, glides through rings, discovers named rescue pups, and uses a rechargeable lightning dash to pass through grumpy clouds. Companions follow behind the player.

This is an unofficial, spoiler-light fantasy inspired by the book. Cloud surfing and game powers are invented gameplay, not claims about the novel's plot. There are no quizzes or reading questions.

## Mechanics and longevity
- Free movement in two dimensions: arrows/WASD, mouse, or touch.
- Dash: Space or the onscreen button; approximately four seconds to recharge normally.
- Sparks increase score and a temporary collection multiplier. Rings add points and recharge.
- Pups join the flying pack; up to five companions are shown at once.
- Temporary spark magnets and supercharged flight add variety.
- A bump briefly slows/wobbles the rider and slightly reduces the current combo. It does not deduct score, erase discoveries, kill the player, or end/reset the flight.
- The flight is endless. Six sky chapters repeat, changing every 65 seconds; these use color treatments of one original background rather than six separately painted scenes.
- Timed star showers, tailwinds, and pup parades recur. Difficulty increases gradually and is capped.
- Twelve dog discoveries and five trail colors provide collection goals. Flight continues after completing them.
- Pause is voluntary or triggered when the window loses focus.

## Art and audio
Original generated gouache twilight backdrop; canvas-drawn rider, clouds, dogs, and effects; cream Fraunces titles with DM Sans UI; mint, rose, honey, lilac, and ice trail colors.

Original synthesized Web Audio music combines gentle arpeggios, chords, bass, and quiet percussion. Collection, dashes, rescues, and bumps have sound effects. Audio starts after a user gesture; mute and music controls are available. Gentle motion can be enabled.

## Persistence and limits
Browser-local key: `stormglide-v1`. Saves dog discoveries, lifetime rescue count, unlocked/selected trails, best score, and audio/motion preferences. Current flight position, distance, score, entities, and active followers do **not** resume after reloading. Hosted and downloaded playables may use different browser storage origins; their progress is not synchronized.

The current implementation is single-player and has no account, server-side progress, shared lobby, or cross-device sync. Only the first five current companions are displayed; all discovered dogs remain in the collection.

## Verification record
Before the workspace reorganization, JavaScript syntax and asset checks passed; a simulated 7.5-minute flight covered sparks, rings, dog collection, preserving score on bumps, dash collisions, powers, pause/resume, collection completion, and bounded object counts.

The migration adds reproducible build verification and repeats the behavioral simulation. This is not a claim of actual browser playtesting, visual QA of the whole UI, or listening to the soundtrack. Playtest feedback from Jobe and his daughter is the next input for design iteration.

## Future iteration notes
No new mechanics are approved or scheduled. Potential feedback areas to observe: collection pace, feel of steering, variety after all pups are found, touch comfort, soundtrack balance, and similarity to future game ideas. Log any substantive new design idea in the shared registry before implementing it.

## 2026-09-10 — iPad local revision
Version 0.2.0 adds relative thumb steering, a visible pad, immediate lift-to-stop, a large simultaneous second-thumb dash, larger targets, and rotation/interruption cleanup. See [touch design](../the-miscalculations-of-lightning-girl/plans/touch-design.md). The existing public release remains unchanged. All ten books are now identified; their proposed mechanics are recorded in 03-ten-game-pitches.md.

## 2026-09-19 — strict TypeScript port

Local version 0.3.0 preserves the 0.2.0 behavior and `stormglide-v1` data in a
strict TypeScript, object-oriented source architecture. The hosted Site identity
and published revision remain unchanged; this local port was not published.
Automated checks use freshly compiled production code. Browser visual review,
physical iPad testing and subjective audio listening remain pending.
