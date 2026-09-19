# Verification record

Date: 2026-09-18

## Automated

- Reservoir containment, dug-channel flow, extinguishing, immutable bedrock, and ten consecutive resets pass.
- Continuous-water renderer tests pass for joined particles, disconnected splashes, bounded kernels, and smooth thresholds.
- The authored route wins with all three canteens, no wasted particles, and the correct intake threshold.
- Both outer terrain edges remain solid.
- The working pipe body is solid while the large mouth remains open.
- The intake sensor sits inside the illustrated mouth so water remains visible through the approach rather than vanishing above the pipe.
- An untouched reservoir retains every particle above its floor, and the lower-corner leak shown in review is absent.
- After delivery, the localized intake draw leaves fewer than 20 particles in the lower approach basin rather than a persistent visible pool.
- A separately tested straight-down route lands in the visible mouth and wins; it cannot terminate on the solid pipe body.
- The sensor's upper edge is inset below the visible rim, so water remains rendered into the opening before particles are collected.
- Routing water to the capped dummy delivers zero particles, wastes zero particles, does not win, and retains the initial water count.
- Canteen contact records one fill event per buddy; reset clears both the collected state and animation timestamp.

Run with `npm test`.

## Browser smoke test

With the local server running, `node tests/browser.cjs` checks image loading, a complete mouse route, victory, all collectibles, reset, hint state, a 320-pixel layout, real synthesized touch input, and browser/network errors. Screenshots are written to `tests/artifacts/` and intentionally ignored by Git.

## Visual review

The sealed dummy now reads as capped; bedrock fills its physical footprint; side soil reaches the board boundary; the working pipe faces the incoming route; and soil remains visually continuous behind the solid pipe body.

Physical-phone testing and shared-shell integration testing remain future work.
