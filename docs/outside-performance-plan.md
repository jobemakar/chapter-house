# Outside fullscreen performance pass

## Goal

Improve the perceived smoothness of Willowbrook camera movement and mouse-wheel
zoom at fullscreen sizes without removing scenery, animation, interaction,
audio, shadows, or UI.

## Requirements

1. Mouse-wheel zoom eases toward its requested scale and must not resize the
   WebGL drawing buffer for every wheel event.
2. The renderer continues at the display's existing pixel ratio and retains
   the current antialiasing, tone mapping, animated water, waterfall, windmill,
   avatar, pet, and shadow presentation.
3. Shadow maps refresh at a bounded 30 Hz while the scene itself remains free
   to render at the browser's animation-frame rate.
4. Hidden town context/discovery HTML must not be rewritten every frame. Visible
   overlays still follow the avatar and update when their content changes.
5. Avoid transient vector allocation in the main render loop and skip redundant
   activity-art synchronization when its inputs are unchanged.
6. Add focused unit coverage for zoom easing, bounds, and shadow cadence, then
   run the full application checks and browser-playtest the fullscreen outside
   scene.

## Implementation

1. Add a typed `TownRenderPerformance` controller for zoom interpolation and
   shadow scheduling.
2. Split drawing-buffer resize from projection-only zoom updates in
   `TownWorld`.
3. Cache projection vectors and the last published overlay views.
4. Short-circuit repeated identical `TownActivityArt.setState` calls.
5. Verify behavior, layout, console state, and fullscreen interaction locally.
