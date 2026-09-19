# Contraption Club 0.2.0 — level campaign
2026-09-13 · BOB-010-R3 · User-selected revision.

## Core change
The machine is a puzzle now. Each level offers a limited set of tools, movable pieces and bolted fixtures. Fix the route so an entire proof batch reaches Good Pops. No life loss, consumable ammunition, forced reset or game-over screen. Misses return visibly and another batch follows. Collected identities retire immediately, with a decorative pile accumulating in the bucket; they never enter the return conveyor.

Clear requires twelve released kernels, all twelve resolved as collected, zero spills, no earlier in-flight strays, and two seconds since any ground spill. Multi-inlet levels alternate their releases evenly. Stalls are rescued as spills after 17 seconds; not emitting or trapping particles cannot pass. Any layout edit starts a new proof generation and invalidates old captures. Completion is saved immediately and latched permanently. The nonblocking Next level button never auto-navigates. The current machine continues running and remains editable after clear.

## Campaign
1. Special Delivery: position one conveyor under a different inlet.
2. The Missing Link: add a conveyor between fixed ramp and trampoline.
3. Over the Wall: aim a movable trampoline over a solid bolted wall.
4. A Little Breeze: position and angle a fan to steer a falling stream toward a fixed funnel.
5. Meet in the Middle: two simultaneous streams converge through a movable funnel.
6. Switchboard Symphony: alternating inlet releases hit two movable, prewired switches. Each sets both fixed belts to one direction. Successful routing therefore needs automatic reversal as the inlet changes.

Switches are directional commands rather than blind toggles, avoiding repeated-contact chatter. Their colored wires show affected belts and a passing kernel lights the button. Belt arrows animate the effective runtime direction. Manual Press switch is available when selected. Runtime direction changes are not layout edits and are not persisted into the authored baseline.

Fixed pieces are marked BOLTED, protected by all editor controls and reconstructed from canonical level definitions on load. Each level defines its inventory capacity. Returned parts can be placed again; undo affects layouts only. Hints display ghost positions; Show a working setup is a free optional assist and still requires the physics batch to finish.

## Persistence and compatibility
New key: `popcorn-contraption.levels.v2`, schema 2. Layouts, clears, totals, ownership and preferences are saved. If absent, v1 totals, rewards and preferences are imported. The original `popcorn-contraption.v1` key and its machine layouts are untouched. Archived `playable/popcorn-contraption-club-sandbox-v1.html` can still open that earlier sandbox. Picture Day is untouched. Undo and live particle state remain session-only.

## Verification
11 core checks pass. All six suggested solutions clear with zero spills across 15 seeds each (90 simulations), and all six starting arrangements remain uncleared. Tests cover collection identity removal, spill-only returns, incomplete/failed proofs, edit generations, old strays, latched clears, automatic two-direction switches, two-sided wall collision, migration, fixture restoration and build parity.

Actual Edge browser checks pass for a real first-level clean batch, post-clear broken edits and reload, Next level, locked fixtures, inventory limits, undo, automatic switches, touch-emulated dragging, and layouts from 320 to 1440 px, with no page errors. Desktop, switch scene and phone screenshots visually inspected. No physical iPad/Safari test or subjective audio-listening session. No public deployment.
