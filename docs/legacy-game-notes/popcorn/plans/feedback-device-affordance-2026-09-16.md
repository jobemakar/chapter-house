# Contraption Club — device affordance feedback plan

2026-09-16. This pass follows the campaign requirements and level design: fixed fixtures remain immutable and movable tools remain physics-identical.

1. Bolted fixtures must read as anchored at a glance through a cool, solid mounting treatment and explicit lock label.
2. Movable devices must read as draggable through a contrasting warm outline/grip treatment, a clear selection state, and pointer cursor feedback.
3. The canvas cursor must distinguish a draggable device, a fixed fixture, and a neutral board before a drag begins.
4. No hit areas, editor permissions, device dimensions, physics, save schema, or level solutions may change.
5. Rebuild both canonical standalone outputs and run the focused core/build checks.

Implementation plan: render visual affordances only in the canvas renderer, calculate hover affordance from the existing hit test in the app, add a small explanatory selection label, then build and test.
