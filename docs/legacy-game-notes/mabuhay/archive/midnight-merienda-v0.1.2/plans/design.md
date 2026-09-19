# Midnight Merienda — design 0.1.0
2026-09-12. Stationary illustrated counter, two independent pans, one assembly plate, patient customers and pictured food/topping orders. First-side times are 2.6/3.2/2.9 seconds for bun/skewer/cake; second side is 75% of first. Flip and plating each have 3.5 seconds of bonus leeway. Missing a window removes only the fresh bonus; food remains usable. A full plate never deletes a ready pan.

## Decisions
Tap-select/tap-target is the main iPad path. Pointer-captured drags also support snack → pan, ready pan → plate, topping → plate and plate → customer. Tab/Enter/Space work through semantic buttons. Pause freezes game time; hiding the tab pauses automatically. No customer timeouts, lives or forced restart.

At 3 serves a second food and third customer unlock; at 8 the third food unlocks. Chapters advance every 6 serves, with orders continuing indefinitely. One market backdrop and six repeating original regulars are the demo's scope. Four guaranteed keepsakes at 3/8/15/25 serves have stable IDs, dimensions, mounts, clearance, walking footprints and counter support surface in src/core.js. The viewer shows ownership; clubhouse placement integration remains deferred.

Original flat comic illustrations, coral awning, teal stove, indigo sky and warm lanterns. Original Web Audio pentatonic melody and bass, cooking cues and service flourish; optional audio starts only from a gesture. All food names, customer designs and furniture are invented, loosely inspired by the publisher-confirmed family food truck and supernatural premise. Not claimed traditional recipes or folklore creatures. Source and full all-ten mechanic comparison are in requirements.md.

## Architecture and saves
core.js owns the pure kitchen state machine and progression; art.js original SVG; audio.js synthesis; app.js input/rendering/persistence. index.html and style.css provide responsive semantic controls. `node build.mjs` embeds source into dist/index.html and playable/Midnight-Merienda.html using replacement callbacks that preserve source characters exactly.

`midnight-merienda-v1`: version, served/fresh totals and known owned reward IDs. Counts are nonnegative safe integers; fresh cannot exceed served; prior valid ownership is retained. Unlocks derive from served total. In-progress pans, plate and orders reset on refresh, while progression remains. `midnight-merienda-settings-v1`: mute/reduced motion. Blocked storage permits session play and displays a save warning. No network or personal data.

## 0.1.1 customer feedback
Service now replaces a customer in the same core array position, choosing a face absent from current customers and different from the departing guest. The renderer keeps the old disabled guest for a 0.95-second happy departure measured in kitchen time, then inserts the new guest with a 0.55-second entrance. Other guest nodes persist. Reduced motion uses a short 0.15-second acknowledgement without travel. Mismatched/invalid dragged plates use a 240-ms Web Animation return and preserve the source plate. No collectible, book anchor or primary mechanic changes.
