# Midnight Merienda demo requirements
Selected 2026-09-12 by Codex under Jobe's request to choose an unbuilt game. BOB-005, version 0.1.0.

## Book and invention boundary
Verified: JJ and Althea help with their family's food truck; Filipino folklore and supernatural creatures are part of the premise. Source inspected 2026-09-12: https://www.scholastic.ca/our-books/book/mabuhay-9781338738643 .
Interpretation: a welcoming night-market food truck is a playful extension of family, food and magic. This is not a reenacted scene.
Invented: all customer designs, dishes (Moon bun, Sun skewer, Star cake), toppings, music, setting and keepsakes. Do not label these as traditional Filipino recipes or creatures from folklore. No quiz or story spoilers.

## Numbered acceptance requirements
- MM-001 (user): A playable, original food-truck demo with continuous service; no questions, lives, forced restart or lost collection progress.
- MM-002 (designer): Two independent pans. Choose a pictured food, start a pan, flip after its first cooking interval, and collect when ready. Waiting beyond ideal timing loses only a fresh bonus. Food never burns beyond use.
- MM-003 (designer): One assembly plate; add one pictured topping, then serve a matching customer. Wrong orders stay intact with helpful feedback; clear plate freely if desired.
- MM-004 (user/designer): Fully touch-first with tap-select/tap-target and direct drag between meaningful targets. All actions also possible through focusable keyboard buttons. Large targets; no hover-only instruction.
- MM-005 (designer): Begin with two customers and one food; unlock second food/third customer at 3 served, third food at 8. Alternating order combinations and night-market chapters continue indefinitely. No impatient customers.
- MM-006 (user): Intentional graphic-novel night market: indigo sky, glowing lanterns, coral/teal truck, original illustrated expressive customers and appetizing food, visible sizzling/steam, service celebrations.
- MM-007 (user): Original gesture-unlocked music and action audio, visible mute, voluntary pause. Pause on hidden tab. Reduced-motion option; cooking remains understandable without animation or audio.
- MM-008 (designer): Persist versioned served total, fresh total and keepsake ownership in `midnight-merienda-v1`. In-progress kitchen/orders are session-only; reload resumes progression with a fresh counter. Tolerate malformed or blocked storage.
- MM-009 (user): Placeable themed rewards: snack tray at 3 serves, menu sign at 8, miniature food truck at 15, serving counter at 25. Record stable IDs, dimensions, mounts, support surfaces, walk footprint and clearance. Collection viewer in demo; actual clubhouse placement deferred.
- MM-010 (user): Readable source, dependency-free reproducible standalone/hosted build, manifest, docs, asset provenance and local Git revision. No publication requested.
- MM-011 (designer): Verify cooking transitions, wrong-order recovery, infinite order generation, unlocks, save sanitation and pause. Browser-check complete serving loop, touch/drag, desktop/iPad/phone layouts, no JS errors and save reload. Report emulation versus physical-device/listening limits.

## Mechanic comparison
Input: choose/drag food, flip pans, plate, dress, serve. Loop: observe pictured orders → schedule two cooking stations → assemble → serve → receive new orders. Space: stationary multitasking counter. Challenge: timing overlaps and matching visible compositions, with patient waiting and free recovery. Progression: foods, customers, chapters and guaranteed keepsakes.
Distinct from all reserved/implemented concepts: Stormglide steers in flight; Funhouse constructs mover routes; Wish/Fetch/Fling launches projectiles at structures; Snow Jam/Duet performs/catches to musical timing; Gummy Nook merges board pieces; Bureau uses disguises and patrols; Sanctuary shapes habitats; Emberwatch contains spreading pressure; Picture Day frames timed photos; Popcorn's alternate builds a circulating machine. Merienda schedules independent food preparation and serves pictured combinations. No mechanical overlap requires a change or approval.

## 0.1.1 — requested 2026-09-13
- MM-012 (user): A mismatched dragged plate visibly returns to its source in roughly 240 ms, retaining food and topping. Reduced motion returns immediately.
- MM-013 (user): Served customers celebrate, depart offscreen, then a visibly different customer enters that same position. Other customers remain in place; departing customers cannot be served twice. Pause freezes customer transition progress; saved rewards remain immediate.

# Visual feedback addendum — 2026-09-16

The pan, three foods and three toppings use original transparent generated PNG artwork, locally retained and embedded by the reproducible build. Keep the night-market palette, customer/keepsake artwork and all existing gameplay/save behavior. See generated-food-plan.md.
