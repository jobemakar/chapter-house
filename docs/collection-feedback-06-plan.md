# Collection feedback and Sites publication — 2026-09-16

## Scope / user decisions

Update standalone demos without integrating them into the Chapter House economy.
Preserve Pocket Funhouse and add an original Doors: Paradox-inspired comparison.
Publish the complete local world and every standalone preview to ChatGPT Sites.
Existing save identities and optional local-only guest state remain unchanged;
changing origin does not transfer existing browser saves.

## Numbered requirements

1. Veda supports a clear tap-select / tap-destination loop, visible legal moves,
   touch-sized controls, portrait layout and existing keyboard controls.
2. Contraption Club distinguishes fixed bolted equipment from draggable devices
   without changing physics, puzzle solvability or saved layouts.
3. Gummy Nook grid icons receive a subtle hover cue without corrupting animated
   transforms, selections, touch input or reduced-motion behavior.
4. Merienda keeps its night-market aesthetic and cooking rules; replace drawn pan
   and food/topping imagery with original generated transparent bitmap assets.
   Embed them reproducibly in offline standalone builds with provenance.
5. Add a separate original miniature-door puzzle concept with touch/mouse orbit,
   inspect / collect / use interactions, three small authored scenes, free help,
   no countdown or destructive failure, pause/mute and separate durable progress.
   Preserve Pocket Funhouse and its save. No quiz/typed answer. Mechanic signature:
   rotate/inspect → collect piece → operate linked physical mechanisms → open door;
   spatial close inspection rather than track routing or machine construction.
   This differs from flight, projectiles, rhythm, cooking, match-3, stealth,
   elephant sliding puzzles, lantern tending and photography. Deliberate thematic
   overlap with the same book is user-selected; do not copy reference artwork,
   characters or levels. Book's funhouse/secret passages are the sourced anchor
   (shared book-connection audit); these scenes and props are invented.
6. Town adds a locally packaged Kenney Fantasy Town windmill with genuinely
   rotating sails (not spinning the entire building), plus a well/fountain beside
   the retained original for comparison. Match navigation footprints.
7. Audit Nature Kit, improve stream to organic curves and a visible animated
   waterfall, with planted/rock banks. Rendering, fishing and collision must use
   the same channel boundary. Bridge stays the only legal water crossing.
8. Package every standalone preview and dependency into a self-contained build;
   retain clear separate save/reward labels and working phone navigation.
9. Register/reuse one Sites identity, publish the exact reviewed build, preserve
   intended access audience and confirm successful publication before returning
   the actual deployed URL. No Firebase/multiplayer added.

## Plan / boundaries

Root owns Site checkout, town navigation/animation/layout, asset selection,
Merienda integration, preview packaging, review and Sites lifecycle. Cheaper
implementation agents may change only original standalone source repositories
outside the Site checkout; an asset-only agent generates Merienda candidates
outside the checkout. Root copies reviewed builds/assets afterward. Agents never
invoke Sites, edit hosting configuration or publish. Read per-game requirements,
design and changelogs first; each game records its focused feedback plan.

Run existing game checks, app tests/build and exact preview dependency verifier.
Inspect desktop and narrow portrait behavior, the new concept's full solvable
loop, town sails/water/bridge and new food images. Distinguish browser simulation,
screenshots and automated checks from physical-device testing/audio listening.
