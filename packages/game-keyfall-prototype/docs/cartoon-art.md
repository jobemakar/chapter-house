# Approved cartoon art direction

2026-09-22. Jobe selected the cartoon option over the realistic miniature
theater and asked to update Keyfall. This local presentation pass preserves
all room data, physics, save keys and controls. No publication is authorized.

The palette is teal scenery, raspberry velvet, warm wood and chunky gold
objects. The background stays quieter than playable objects. All key, cord,
ticket, goal and world-element art remains live and separate; the reference
screenshot is never used as the playfield texture.

## Local artwork and provenance

- `art/approved-cartoon-direction.png`: approved generated concept, a reference
  only; its example layout is not an implemented/verified level.
- `../src/assets/cartoon-funhouse.png`: generated background-only derivative,
  produced with the built-in image-generation tool from that approved reference.
  Packaged through Vite so it works with sub-path hosting.
- Live shapes and deformed velvet cords: original TypeScript canvas drawing.
- No reference-game assets, external runtime URLs, custom-image upload system,
  or additional dependencies are introduced.

Both raster images were generated with the built-in image tool on 2026-09-22.
They are invented funhouse scenery, not literal illustrations of book events.

## Final background prompt

Edit this approved cartoon Keyfall game concept into a production
BACKGROUND-ONLY game asset. Preserve its polished hand-painted cartoon style,
bright muted teal / blue-green palette, raspberry-purple corner curtains and
warm simple wood. Remove ALL gameplay pieces: remove key, ropes, anchors,
tickets, bubble, bumper, bellows, entire goal/lock/door. Remove ALL text and UI
including KEYFALL title, subtitle, ticket meter, buttons and the FUNHOUSE
lettering. Fill removed areas seamlessly with background scenery. Output a
portrait 7:10 game board, edge to edge artwork. Dramatically reduce decorative
frame to a very thin border (about 2% width), keep draped curtains in only upper
corners, no thick posts, no objects/platforms in foreground, floor only a thin
strip at the bottom. Simplify and soften the background silhouettes of funhouse
arches/stairs/Ferris wheel so they are quiet, low contrast, monochromatic tonal
teal with a large clear open middle. No lights/dots that resemble collectibles,
no moon disk resembling an interactive bubble. Keep attractive softly painted
dimension and storybook atmosphere, not flat blank fill. This is a reusable
static background behind moving gameplay sprites; gameplay can occupy the
entire board so no obstruction or heavy decorative inset. No text, no characters,
no gold objects, no icons, no UI, no ropes, no tickets, no watermark. Preserve
exactly the cartoon style, not realism.

## Verification

Integration reviewed on 2026-09-22. TypeScript checking and production build
pass, along with the existing deterministic gameplay/completion traces. Actual
browser inspection covered desktop and a 390x844 phone viewport, live advanced
objects, the classic keyhole silhouette and editor/play board proportions.
See `editor-verification.md` for file authoring checks. Physical phone use and
audio listening were not performed.
