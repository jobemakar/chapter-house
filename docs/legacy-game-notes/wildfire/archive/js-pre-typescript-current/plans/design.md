# Dig & Douse design specification

## Selected concept

`Dig & Douse` captures the tactile idea of carving a route for water without copying the characters, level layouts, interface, art, or story of another game. In this Wildfire interpretation, a hillside reservoir feeds an emergency water relay. The player clears soil around immovable bedrock, guides the finite water supply into the correct intake, and watches a linked hose extinguish a remote campsite fire.

The book connection is thematic rather than a literal reenactment: *Wildfire* places Sam and Delphy in a dangerous forest fire. Reservoir infrastructure, canteen buddies, pipe equipment, and this particular campsite are invented game abstractions.

## Mechanic signature

- Input: continuous mouse, finger, or keyboard clearing.
- Verbs: inspect, clear, route, collect, douse.
- Loop: read terrain → carve a channel → watch the finite flow → adapt or reset → extinguish the fire.
- Spatial structure: a tall cutaway puzzle plus a small, deliberately separate hose/fire vignette.
- Recoverable friction: wasted route length or blocked water can be corrected while water remains; reset is instant and carries no penalty.
- Progression opportunity: collected canteen buddies will contribute to persistent player progression in the production game. New intake directions, side sources, multiple sources and targets, valves, movable gates, dummy equipment, and optional collectible paths can expand level challenge.

## Visual hierarchy

1. Cyan water and warm ochre diggable earth carry the highest gameplay contrast.
2. Bedrock, open/capped intakes, and gold canteens use bold silhouettes and localized highlights.
3. The campsite vignette is readable at a glance but compact.
4. The evergreen frame is dark, low-contrast, and decorative only.

Earth is authored modularly but does not display a grid. Organic borders, grass lips, roots, pebbles, and transition shapes make the board feel illustrated rather than assembled from square tiles.

## Current demonstration level

- One finite top reservoir.
- One working left-facing intake near the lower center. Only its large mouth collects water; its pipe body is a solid obstacle.
- One upward-facing dummy with an unmistakable sealed cap and no collection behavior.
- Three optional canteen buddies. Contact triggers a fill burst, upward drift, and fade; the tally remains credited after the sprite disappears.
- Several bedrock clusters whose visible and physical footprints agree.
- Solid side walls and a solid campsite inset that prevent off-board shortcuts.
- One compact lower-right campsite vignette with a matched blue-drop hose.

## Authoring model

Level data describes soil polygons, permanent protected strips, carved pockets, solid fixtures, rock footprints, canteens, oriented intakes, intake sensors, reservoir geometry, target-vignette placement, and an optional hint polyline. A board may use the whole width or only a portion. Intake/hose endpoints need not share a literal continuous route, provided color, iconography, animation, and first-level feedback teach the connection.

## Fairness rules

- A visual opening that accepts water must have a matching sensor and no hidden solid area across it.
- A pipe body must be solid everywhere except its mouth.
- A side-facing intake may apply a short-range draw for readable drainage, but its scoring sensor remains circular and confined to the illustrated mouth.
- A non-working opening must be visibly blocked, broken beyond use, or otherwise unambiguous before water reaches it.
- Invisible collision padding around rocks is not acceptable.
- Water cannot leave the designed simulation area or pass behind narrative scenery.
- An untouched reservoir must remain sealed by the diggable terrain beneath its frame; decorative corner seams must not leak.

## Future level sketches

- A narrow side-fed board where the correct intake sits above the source and requires a gate-assisted detour.
- Two working intakes that must each receive part of the finite reservoir.
- One real and two capped intakes with route lengths that make the visual evidence—not guessing—the key decision.
- Disconnected soil islands joined by short bridge channels or movable transition pieces.
