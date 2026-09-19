# Unified shell and space controls — 2026-09-19

## Requested behavior

1. Use one persistent Chapter House top bar throughout the application. Retain
   the brand and existing identity, coins, sound, fullscreen, and help utilities;
   use a 0.7-opacity bar background.
2. Move Outside, Clubhouse, Collection, Games, Decorate, Pets, Your look, and
   Shop into that bar. Keep the current space indicated. Disable and visually
   dim Decorate outside the clubhouse.
3. Replace the separate clubhouse introduction and Willowbrook title with one
   reusable space descriptor. It restarts on every space entry, uses identical
   styling/timing everywhere, then fades and becomes non-interactive. Its data
   shape must allow future stores, islands, and other spaces.
4. Remove the Fountain square shortcut and explicit recenter/zoom buttons. Keep
   pointer drag, mouse-wheel zoom, and pinch zoom.
5. Show React, Wave, Jump, and Call pet in every avatar space. React opens a
   small attached choice list on the first tap; choosing a reaction applies it
   and closes the list on the second tap. It is not a full options panel.
6. Pets wander in both the clubhouse and Willowbrook while remaining in a
   bounded radius around the avatar. Calling routes them immediately nearby.
7. Preserve contextual Willowbrook Dig/Fish/Reel controls, room decorating,
   game behavior, local saves, accessibility labels, reduced motion, and the
   existing hosted site. This pass is local only.

## Implementation boundaries

- `src/main.ts` owns shared shell markup, contextual routing, descriptor data,
  reaction-list state, and app/game transitions.
- `src/styles.css` owns the responsive single-bar layout, shared descriptor and
  shared avatar actions. Phone layouts may horizontally scroll the navigation
  row while preserving 44px targets.
- `src/town/world.ts` owns bounded Willowbrook pet wandering and call behavior;
  `src/town/navigation.ts` supplies reachable nearby targets.
- Wishbone retains its title, pause, level, stage, and camera controls, but its
  duplicate app navigation/wallet/settings controls are removed.

## Acceptance checks

1. Typecheck/build and all application tests pass; preview packaging remains
   exact for the standalone games.
2. At desktop, phone portrait, and phone landscape, the single bar remains
   reachable without covering the world; its nav is keyboard accessible.
3. Clubhouse and Willowbrook each show the same descriptor treatment on entry
   and it fades away under normal and reduced-motion preferences.
4. Shared actions operate in both avatar spaces; reactions require open then
   choose, and the list closes after selection, navigation, or space change.
5. Willowbrook pet movement stays walkable and close to the avatar, and Call pet
   promptly routes it to a shoulder position.
6. No Fountain square, recenter, or explicit +/- world controls remain. Wheel,
   pinch, walking, Dig/Fish/Reel, and direct fountain interaction still work.

