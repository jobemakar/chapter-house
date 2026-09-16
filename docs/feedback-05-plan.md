# Fountain controls and Wishbone depth — 2026-09-16

Selected from direct playtest feedback; local implementation only.

## Requirements

1. Remove the persistent Toss a coin button. Fountain taps remain the only toss input, with the existing proximity hint, cooldown, cosmetic coin arc and sound. Do not change saves or economy.
2. Separate the fence from the distant painting. Draw only the painting's sky/mountain region, retaining the original asset unchanged, and author a canvas fence layer behind playable objects.
3. Anchor fence and lawn vertically to the playable ground during zoom and pan. Fence horizontal parallax tracks the yard closely (0.96 versus the mountains' 0.20). Its size follows world zoom so zooming out cannot lift the ground over it.
4. Extend the lawn to the viewport bottom and edges, avoiding exposed scenery or a floating platform below the collision floor at wide overview.
5. Preserve physics, aiming mapping, flight follow, controls, reduced motion, progression and asset provenance. This refines the unchanged pull/release → collide/topple → retrieve loop, not a new mechanic.

## Implementation and acceptance

Root owns renderer/layer math, integration and final review. This tightly coupled presentation fix and trivial button removal do not need independent delegation. Add testable layer-layout calculations and regression checks for overview/detail, horizontal depth ordering and ground coverage. Run full tests, production build and desktop/narrow browser inspection with overview, detail and pan. Record actual verification; do not publish without a new publication request.
