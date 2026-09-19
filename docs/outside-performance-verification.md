# Outside fullscreen performance verification

Date: 2026-09-19

## Implemented

- Mouse-wheel zoom now eases through a typed render-performance controller and
  updates only the camera projection instead of resizing the WebGL drawing
  buffer on every wheel event.
- The renderer requests the high-performance GPU path while retaining the
  existing antialiasing, tone mapping, display pixel ratio, and complete scene.
- The existing 2048-pixel PCF shadow map remains enabled and refreshes at a
  bounded 30 Hz instead of being regenerated for every rendered frame.
- Hidden context and discovery overlays no longer read layout, project points,
  or write DOM state every animation frame. Visible overlays remain positioned
  with pixel-rounded coordinates and publish only changed views.
- Main-loop projection vectors are reused, and unchanged activity-art state is
  no longer reapplied every frame.
- All scenery, water/waterfall/windmill animation, avatar and pet movement,
  interactions, audio, UI, and shadows remain present.

## Automated checks

- `npm run typecheck`: passed.
- `npm test`: 107/107 passed, including new zoom bounds/easing, immediate pinch,
  and 30 Hz shadow-cadence coverage.
- `npm run build`: passed.
- `npm run verify:previews`: 13 previews / 19 files passed.
- `git diff --check`: no whitespace errors; only existing Windows line-ending
  notices were reported.

## Browser verification

- Tested the local Vite app at `http://127.0.0.1:5191/`.
- Entered Willowbrook, entered fullscreen, and exercised mouse-wheel zoom on a
  3440 × 1440 WebGL canvas.
- Confirmed the scene retained its full artwork, water, shadows, avatar, pet,
  transparent top bar, and action controls after zooming.
- Browser diagnostics contained Vite debug connection messages only; no errors
  or warnings were present.
- Left the local browser in Willowbrook for continued user testing.
