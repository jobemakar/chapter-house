> Current version: [0.2.0 levels design and verification](levels-design.md). The 0.1.0 record below is historical.

# Design and verification — 2026-09-12

## Implemented
The original concept is implemented as a separate trial for comparison with Picture Day Parade. Three freely available, editable starter machines; six physics devices (bumper unlocked after five deliveries); persistent per-workshop layouts; undo for drag, rotation, reverse, duplicate, remove, starter replacement and clear; sustained recirculation; deliveries and unique-part chain tracking; original drawn artwork and synthesized soundtrack/effects; gesture-unlocked sound, mute, slow motion, pause, trails and machine PNG export.

Physics uses a fixed 1/120-second timestep with gravity, directional fans and circle-to-segment contact. Conveyors set tangent motion; trampolines launch along the surface normal; funnels apply guided inward/downward velocity; bumpers launch radially. These are predictable arcade responses rather than a general rigid-body simulation. Kernels do not collide with one another. Parts can overlap intentionally, with their effects resolved in placement order. Spills and particles older than 17 seconds visibly enter the return conveyor and restart at the source. Saved progress is unaffected.

## Checks completed
- Seven passing core tests: all three starters deliver through at least four parts, each device changes actual velocity, particles leave belt/ramp ends, spills recirculate within the 42-kernel bound, reverse changes belt direction, layouts and ownership survive save roundtrips, generated builds match and script parses.
- Initial simulation uncovered an endpoint clamping issue that trapped particles on ramps, and the trampoline launch orientation needed correction. Both fixed and covered by tests.
- Automated real Edge browser: waits for actual deliveries/unlock; verifies pause, placement, rotation, pointer dragging, duplicate/remove, undo, clear recovery, switching workshops and restoring edited layouts, PNG download event, saved mute and reload. No page errors.
- Touch-emulated browser verifies tap-to-add and touch drag through CDP touch events, with persisted coordinate assertions.
- Responsive render and overflow checks: 1440×1000, 1024×768, 768×1024, 390×844 and 320×720. Visually inspected desktop, landscape and phone screenshots. Refined landscape height and enlarged toolbox illustrations after inspection.
- At the time of this historical check, Picture Day Parade remained the primary game and Contraption was a separate experiment. On 2026-09-19, Contraption became canonical and Picture Day moved intact to the archive described below.

## Limits
No physical iPad/Safari test or subjective audio listening session. Audio synthesis is implemented and error-free in browser checks, but sound balance and child playtesting remain for review. No publication, multiplayer, real-world device control, novel scene reenactment or clubhouse implementation. All artwork, music and machine keepsakes are original; thematic link is intentionally loose and explicitly chosen by the user.

## Canonical port verification — 2026-09-19

- `npm run check` verifies the strict TypeScript project and pinned compiler.
- `npm test` rebuilds both Contraption HTML outputs and runs all eleven deterministic simulation, migration, fixture-normalization, and parity tests.
- `dist/index.html` and `playable/popcorn-contraption-club.html` are byte-identical after build.
- The Picture Day archive records the pre-promotion SHA-256 for its generated HTML and retains its independent build/test commands and `picture-day-parade.v1` key.
- The v1 Contraption sandbox file is preserved unchanged at `playable/popcorn-contraption-club-sandbox-v1.html`.
