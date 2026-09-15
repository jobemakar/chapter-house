# Cube Pets trial verification

2026-09-15

Chapter House now uses locally packaged Kenney Cube Pets for the three implemented
pet identities: Clover the cat, Pip the bunny and Fig the fox. Their IDs, names,
starter choices, prices, ownership, active state and saved profile data are
unchanged. Player avatars continue to use the rounded procedural `AnimalRig`.

## Implementation

- Added the three Cube Pets 2.0 GLBs, one shared palette texture, catalog previews
  and the supplied CC0 license under `public/assets/pets/`.
- Added one application-owned `PetAssets` loader. It loads the bounded catalog
  once, validates required clips, safely clones skinned scenes, shares imported
  render resources and gives every visible `PetRig` an independent animation
  mixer.
- Mapped idle/walk to roaming and following, `eat` to bowl use, `dance` to
  trampoline play and `gesture-positive` to petting. The established procedural
  trampoline arc and reaction bubbles remain intact.
- The clubhouse and Willowbrook initially remain usable with the old procedural
  stand-ins, then replace them after local models load. A failed load leaves those
  stand-ins in place and produces a readable notice.
- Packaged preview images keep starter, Pets and Shop panels synchronous. An
  invisible per-instance touch target enlarges pet raycasting without changing
  the visible model scale.
- Imported pet clones are detached before generic scene disposal so only
  `PetAssets` releases their shared geometry, materials and texture.

## Validation

- `npm test`: 64 passing tests. New coverage includes load-once behavior,
  skeleton-safe independent rigs with shared render resources, clip validation,
  activity transitions, positive-gesture return, touch-target raycasting, late
  disposal and partial-failure cleanup.
- `npm run build`: TypeScript and Vite production build passed. The existing
  bundle-size advisory remains (about 875 kB JavaScript before gzip); no
  performance claim is made from this check.
- Desktop browser: inspected starter cards and Pets panel; confirmed a live Cube
  Pet in the clubhouse, roaming/following transitions and saved reload.
- Feeding browser check: Clover routed to the placed bowl, switched from authored
  `walk` to authored `eat`, and retained the established reaction/food lifecycle.
- Willowbrook browser check: the imported pet loaded locally, followed the avatar
  across the square, returned to idle and remained visually distinct from the
  avatar and Kenney scenery.
- Narrow portrait 390×844: clubhouse, pet model, action controls and Pets panel
  remained visible and reachable. The temporary viewport override was restored.

## Limits

This is a three-pet asset-pipeline trial, not selection of the final 15-plus pet
roster. Fox ownership was not earned during manual browser QA, though its model is
covered by the same load/clip validation and local package as cat and bunny.
Physical-device performance and touch precision were not measured. The provided
128-pixel catalog previews are clear at card size but are less crisp when enlarged
in the desktop starter modal. No Firebase, account, multiplayer or publication
work was included.
