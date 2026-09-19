# Wishbone Fling — next mechanics
2026-09-11 · Proposed, not implemented

The new animations are implemented in 0.1.2. The systems below are proposals for a later playable revision.

## Three bankable powerups
1. **Bounce Biscuit** — Arm before throwing. The next toss gets three extra-springy surface bounces, opening bank shots and shots under bridges. Show three biscuit crumbs disappearing as bounces are spent.
2. **Magnet Bandana** — Arm before throwing. For that flight, draw nearby loose toys toward Wishbone within a clearly shown small radius. It helps finish scattered toys without pulling entire towers apart.
3. **Tailwind Pinwheel** — Arm before throwing, then tap a large Gust button during flight for one forward-and-upward push. A forgiving second chance to reach a high perch; auto-trigger near the apex if the player prefers one-touch play.

Earn one charge from a clearly pictured level-clear reward, or bank a floating pickup by hitting it with any dog body part during flight. Pickup means stored, never automatically activated. Save immediately; keep charges across recalls, misses, level changes and reloads. Use the same local save with additive validated inventory fields; old saves default to zero charges.

Show three large inventory buttons with counts. Tapping arms a powerup; tapping again cancels. Consume on an actual launch (for the pinwheel, on gust activation); cancelled drags and unavailable actions cost nothing. One armed powerup per toss. A clear rewards once per completed run; restacking starts a new run. Airborne pickups have stable IDs within each run and cannot award twice from multiple body parts, recalls or reloads. Default each new level to playable without spending anything. Never require consumables to finish a yard. Reward schedule should be deterministic and previewed, with no paid or random loot system.

The pinwheel survives in inventory if the flight ends without firing it. Banked charges are consumable resources; the first discovery also unlocks one permanent decorative keepsake so using charges never deletes clubhouse ownership.

## Three world interactions
1. **Whack-a-lever gate** — Dog or loose prop knocks a big paddle; a visible connecting rod lifts a gate, releasing a supported toy pile. Latch open for the run, with a clear gate animation. A low shot can set up a later high shot.
2. **Polarity button** — Hit a large +/- button to flip a marked magnetic zone from attraction to repulsion. Only striped metal props and the dog's visible collar respond. Moving arrows show force direction; use contact debounce so a resting body cannot flicker the switch. This affects a fixed part of the yard; the Bandana is a temporary toy-collection aid centered on the dog.
3. **Bellows blast** — Land on a squashy garden bellows to send a short, visible gust through a fabric windsock. Lift toys or push a plank into a cascade. It resets after two seconds, inviting repeat shots and chain reactions. Wind has a bounded radius and duration rather than blowing the whole scene indefinitely.

Introduce one mechanism per yard, then combine them: hit the lever to expose the bellows, land on it to lift the dog into a magnetic zone. Effects come from collision and forces, with readable silhouettes, sound and generous triggering surfaces. All have visual feedback in mute mode; gentle motion suppresses decorative shaking. No injuries, lives, forced resets or lost pickups.

## Fit with the collection
Original pet/playyard inventions loosely tied to Wishbone's companionship theme; none is claimed to be an object or event from the novel. Signature remains drag/release, launch/bounce/collapse/collect, discrete fixed-yard shots, forgiving cumulative destruction, yard and keepsake progression. Mechanisms are authored and triggered by impacts; players do not build routes or machines. This preserves separation from Funhouse construction and Stormglide continuous flight; the other seven reserved loops remain unaffected.

Future keepsake forms (dimensions in meters; no placement implementation): biscuit tin 0.18 x 0.18 x 0.12, tabletop; bandana stand 0.18 x 0.12 x 0.25, tabletop; pinwheel pot 0.16 x 0.16 x 0.35, tabletop. Their support footprints equal their first two dimensions, their clearance volumes equal their full dimensions, and they have no walk-blocking footprint when supported on furniture. All have pet-play thematic provenance and stable IDs distinct from consumable charge balances.

## Acceptance for a future implementation
- Clear rewards and airborne contact bank exactly one charge per reward ID, including collisions with multiple limbs.
- Switch levels and reload with unused charges; counts persist and old saves load.
- Cancel a drag or arm/disarm: no charge lost. A launch consumes only the selected applicable powerup.
- Finish every yard without powerups. Misses preserve banked pickups and existing destruction.
- Each mechanism works by dog and prop contact, has bounded forces, readable state and stable debouncing.
- Verify touch controls on iPad, pause, gentle motion, mute, repeated clears and save-denied fallback.

## Implementation note — 2026-09-11
User selected these proposals for trial implementation. They now ship in Fling 0.2.0; see README.md for final mechanics, saving and verification. Changes from the proposal: the gate guards a bonus pinwheel instead of a new target pile, preserving the same four targets per yard. Clear rewards rotate across all three powerups on fresh runs. Metal means the existing striped buckets and Wishbone's collar. A dedicated in-yard Gust button keeps touch activation visible without scrolling. A source tag and offline 0.1.2 build preserve rollback.
