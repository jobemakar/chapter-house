# Design history

- **2026-09-10 — Emberwatch:** an unbuilt real-time containment-strategy proposal. Preserved in `plans/pitch.md`.
- **Initial Dig & Douse prototype:** established reservoir, clearable earth, simulated water, and a fire target.
- **Fluid rendering pass:** replaced the visible ball-like appearance with a joined metaball surface while retaining particle physics.
- **Concept exploration:** defined an intake that remotely powers a fire hose, optional Wildfire-themed canteen buddies, modular terrain, different source/intake orientations, multiple or dummy intakes, and a compact separate target vignette.
- **Painted visual pass:** generated a quiet forest frame, continuous soil, reservoir frame, bedrock, canteens, intake sprites, and campsite target. The interactive field was made dominant and the target vignette was reduced.
- **Containment and fairness pass (2026-09-18):** sealed the dummy with a visible cap and removed its sensor; extended permanent side containment; made the target inset solid; aligned rock collision with the visible art; flipped the working intake toward the route; restricted collection to its large mouth; and made its body solid.
- **Collection-feedback pass (2026-09-18):** inset the intake sensor deeper into the visible mouth so water no longer disappears above it; replaced canteen checkmarks with a fill burst, upward drift, and fade; and designated canteens as a future persistent progression contribution.
- **Drainage pass (2026-09-18):** flattened the diggable reservoir floor to remove corner leaks and added a localized side-intake draw so water flows into the mouth instead of forming a broad standing pool above it.
- **Intake alignment pass (2026-09-18):** moved the large mouth beneath the natural straight-down approach and tucked the solid pipe body behind the campsite frame, eliminating the case where water could visibly rest on top of the housing.
- **Mouth-depth correction (2026-09-18):** moved the circular collection sensor deeper inside the illustrated opening so the rendered water overlaps the pipe mouth vertically before collection instead of leaving a visible air gap.
- **TypeScript/OOP preservation port (2026-09-19):** archived the exact current painted JavaScript game, then retained its level geometry, physics tuning, images, interaction, diagnostics and browser behavior in typed simulation/render/input/HUD/lifecycle classes. Level data is now an ordered typed catalog for future levels; LiquidFun vendor JavaScript/WASM remains unchanged behind a narrow boundary.

The current direction is Dig & Douse. Emberwatch remains useful concept history, not the active implementation plan.
