# Asset provenance

## Sky
File: `assets/sky.png`  
1536 × 1024 PNG, generated on 2026-09-10 with the built-in image generation tool. Original asset was visually inspected before integration. It is not copied from the book cover.

Prompt:
> Use case: illustration-story. Asset type: original background artwork for a polished children's cloud-surfing arcade game. One wide landscape image, 1536x1024, cozy hand-painted storybook gouache illustration of a magical twilight sky above a tiny friendly town. Twilight indigo and purple sky, turquoise and lilac layered cumulus clouds around the lower margins, peach pink distant horizon. Tiny friendly town rooftops with warm glowing windows strictly confined to the bottom 20% of the image. Delicate scattered stars. A generous, continuous expanse of dark blue sky across the middle 70% is open and relatively quiet so bright gameplay objects remain highly visible. Cloud layers create depth chiefly along the lower edges without filling the central gameplay area. Town architecture is tiny, softly detailed, and secondary. Wide panoramic feeling. Beautiful atmospheric children's book gouache painting, rich painterly pigment, subtle paper grain, soft brushed shapes, thoughtful warm and cool color harmony. Calm, cozy, adventurous twilight, warm distant town lights below and expansive cool sky above. Exactly one complete background image. No characters, typography or text, UI, lightning, logos, watermark, or generic 3D rendering.

## Fonts
Fraunces and DM Sans were obtained from Google Fonts during initial game creation, then embedded in the original HTML. This migration extracts those exact bytes into `assets/fonts/`; the CSS retains family/weight declarations that map each numbered file.

Source stylesheet:
`https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght,SOFT,WONK@9..144,600,30,1;9..144,700,30,1&display=swap`

Font license notices are retained under `assets/fonts/`. The game does not need a font network request at runtime.

## Foreground and audio
Rider, dogs, cloud sprites, particles, rings, and controls are authored in source. Music and effects are original procedural oscillator compositions in `src/game.ts`, not downloaded recordings.

## Book reference
*The Miscalculations of Lightning Girl*, Stacy McAnulty. [Publisher page](https://www.penguinrandomhouse.com/books/557145/the-miscalculations-of-lightning-girl/).

The game is unofficial and inspired by the book. The cloud-riding fantasy is original gameplay, not a representation of the novel's literal events.
