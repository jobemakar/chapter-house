# Icon shell, scalable reactions, and shared pet motion — 2026-09-19

## Requested behavior

1. Replace text in the top application navigation and bottom avatar actions with
   recognizable icons while retaining accessible names, tooltips, focus states,
   and at least 44px touch targets.
2. Keep the current direct Clubhouse and Outside destinations for this pass, but
   treat them as the first entries in a future Places picker rather than adding
   one permanent top-bar button for every future store, island, or room.
3. Make the top bar visibly translucent over the active world. The world must
   render beneath the 0.7-opacity, blurred bar rather than an opaque page layer.
4. Attach the reaction picker directly to React. Show emoji only, with accessible
   labels, and provide exactly 50 choices in a compact scrollable grid that can
   grow without changing shell markup.
5. Apply avatar appearance changes immediately in Willowbrook as well as in the
   clubhouse, preserving movement, reactions, and activity props.
6. Replace duplicated indoor/outdoor pet timing with one reusable typed roaming
   policy/controller. Use the same calm movement speed and near-avatar radius in
   both spaces while preserving obstacle-aware routing and furniture activities.
7. Preserve saves, game behavior, contextual town actions, direct fountain
   interaction, reduced motion, and the local-only publication boundary.

## Acceptance

- Build, application tests, and standalone preview verification pass.
- Top and bottom visible controls contain icons only; accessible names remain.
- The world is visibly detectable through the top bar in Willowbrook.
- React opens next to its button; 50 emoji-only options are keyboard/touch
  accessible, scroll within the picker, apply a bubble, and close on selection.
- Changing fur color or accessory while outside updates the visible avatar before
  the appearance panel closes.
- Indoor and outdoor pets use the same controller speed/radius and remain routed
  on walkable ground near the avatar.
- Desktop, 390x844 portrait, and 844x390 landscape have no document overflow or
  captured browser errors.

