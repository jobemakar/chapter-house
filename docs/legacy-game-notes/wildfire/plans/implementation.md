# Prototype implementation

## Runtime

### TypeScript/OOP port — 2026-09-19

The current canonical implementation is authored in strict TypeScript under `src/`. `WaterSimulation` owns the LiquidFun world, particle lifecycle, terrain rebuilds, collection and reset; `WaterSurfaceRenderer` owns the half-resolution liquid surface; `SceneRenderer` owns painted terrain and draw order; `InputController` maps pointer/keyboard input; `HudController` owns accessible DOM state; and `WildfireGame` composes lifecycle and the bounded fixed-step clock. `src/levels.ts` is an ordered typed catalog, currently containing the unchanged painted-hillside level, with `getLevel`/`getNextLevel` as the multi-level extension boundary.

LiquidFun's `Box2D.js` and WASM are intentionally retained third-party runtime files under `public/vendor/`; the typed simulation isolates their untyped Emscripten APIs. `build.cjs` copies static material to `dist/` and bundles `src/main.ts`; `server.cjs` serves only that generated build. The pre-port source is frozen in `archive/js-pre-typescript-current/` with its reconstruction instructions. Gameplay constants, assets, geometry, save/diagnostic shape and behavior were retained.

The standalone prototype uses TypeScript bundled with esbuild and a small Node static server. LiquidFun runs through `liquidfun-wasm@6.0.4-lf.1`. Terrain uses a 0.15-unit construction grid whose occupied runs are merged into horizontal Box2D fixtures. Digging rebuilds only changed rows. The visible ground is rendered from continuous masks and textures, so internal cells do not appear as tiles.

The simulation advances at 60 Hz with a bounded catch-up count. Collected particles are removed, making intake progress unique per particle. Page visibility pauses simulation. Reset reconstructs terrain, water, collectibles, counters, and target state.

## Water appearance

`public/water-renderer.js` sums Gaussian particle kernels into reusable half-resolution buffers and applies a smooth threshold. Nearby particles form a continuous metaball surface; isolated droplets remain readable. Cached solid masks clip water against terrain, rocks, reservoir walls, fixtures, and vignette geometry. This rendering does not alter the underlying LiquidFun physics.

## Data-driven level behavior

`public/levels.js` owns current polygons, protected borders, pockets, fixtures, rock visual insets, canteens, intake orientations and mouth sensors, target placement, and hint path. Dummy intakes omit sensors. A sealed dummy is both a visual cap and a solid fixture.

Each canteen records the exact simulation step when first contacted. Rendering uses that event for a deterministic burst, lift, and fade while the filled state remains available for level scoring and future progression persistence. The working intake uses a circular scoring sensor confined to the illustrated mouth plus a short-range velocity field that draws nearby particles into a side-facing opening. The draw prevents a standing basin without awarding water before it reaches the mouth.

## Art pipeline

The current painted assets were generated specifically for this prototype. Exact prompts and provenance are in `plans/asset-prompts.md`; earlier full-screen studies and prompt documents are in `assets/concepts/`. Water, flame, glow, cleared-soil masks, hose spray, progress, and interaction feedback are code-generated because they must animate and respond to state.

## Integration boundary

This repository currently proves the mechanic and visual treatment. It is not yet integrated into the Battle of the Books shell. Production integration should port runtime modules to TypeScript classes, connect shared navigation/save/progression/audio systems, establish formal level schemas and loaders, and re-run accessibility and physical-device testing inside the shared application.
