# Fountain controls and Wishbone depth verification

2026-09-16

## Implemented

- Removed the fixed Toss a coin control, its delegated action case and its
  availability callback. Direct fountain taps retain proximity checks, cooldown,
  cosmetic coin flight, audio and wish reaction. Updated canvas instructions.
- Preserved the original painting unchanged and sampled only its upper 66.5%,
  excluding the baked-in fence. Added an authored warm-ivory canvas picket fence
  and sage verge as an independent layer behind the playable objects.
- Fence zoom and vertical movement share the physical floor anchor. Horizontal
  camera movement uses a 0.96 near factor versus the mountains' 0.20 factor.
  Reduced motion locks the fence horizontally to the yard. Mountains retain
  mild scale response and horizon alignment without separate fence drift.
- The foreground lawn fills the viewport below the physical floor, including
  wide overview, instead of ending at the physics world's rectangle.
- Physics, progression, save formats and assets remain unchanged.

## Validation

- Full automated suite: 86 passing tests. Added layout regressions across
  0.5–1.8 zoom, vertical pan extremes, fence/floor alignment, near/far travel
  ratios and background/fence overscan. Existing physics, launch input,
  pinch-cancel and camera-only currency tests remain passing.
- Strict TypeScript and Vite production build pass. Existing approximately
  900 kB uncompressed JavaScript chunk advisory remains; no performance claim.
- Served browser at normal 820×938 dimensions: inspected classic yard and
  The Long Walk Home at overview, detail zoom and diagonal pan. Ground remained
  below fence; fence followed the near layer and scenery covered exposed edges.
- 390×844 responsive viewport: inspected wide-yard overview without fence/ground
  overlap and with reachable zoom controls. This is a layout check, not a
  physical-phone or multi-touch playtest. Restored the viewport afterward.
- Narrow town viewport: no Toss a coin control in the accessibility tree.
  Distant fountain tap reported “Come a little closer to the fountain.” After
  walking closer, a fountain tap reported “A little wish for the village.”
  Wallet remained at 25 coins throughout those town interactions.

No publication or new audio listening was performed. The local served build is
ready for user review; the previously published site is not updated by this pass.
