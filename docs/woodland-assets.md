# Woodland village assets

`TownAssets` packages the 12 curated GLBs under `public/assets/town/` and loads
them only from the app's local `/assets/town/` paths. Mini Forest models require
`mini/Textures/colormap.png`, which is included beside the GLBs; the Nature Kit
models embed their palette data. On load, Nature Kit materials are harmonized for
the town: `grass` becomes #749963, `leafsGreen` #66865b, `woodBark` #956344, and
`dirt` #a2a69b. Their authored metallic setting is also changed to non-metallic
with 0.9 roughness so outdoor foliage and wood respond naturally to the scene
lighting. Other material colours remain authored in the source GLBs.

Both source packs are distributed by Kenney under CC0 1.0. Their supplied license
texts are included at:

- `public/assets/town/licenses/mini-forest-CC0.txt`
- `public/assets/town/licenses/nature-kit-CC0.txt`

Source dimensions below are raw GLB bounds (`x × y × z`). `TownAssets.create()`
centers X/Z and raises the source minimum Y to ground level, so the small negative
Y values in the Nature Kit source data do not need hand correction.

| Key | Local model | Raw size | Material / source palette |
| --- | --- | --- | --- |
| `mini-tree` | `mini/tree.glb` | 0.927 × 1.684 × 0.883 | `colormap` texture |
| `mini-tree-high` | `mini/tree-high.glb` | 0.927 × 2.284 × 0.883 | `colormap` texture |
| `mini-roof` | `mini/building-roof.glb` | 1.341 × 1.050 × 1.165 | `colormap` texture |
| `mini-tent` | `mini/tent.glb` | 1.262 × 1.000 × 1.075 | `colormap` texture |
| `mini-rocks` | `mini/rocks-low.glb` | 1.000 × 0.523 × 1.000 | `colormap` texture |
| `mini-plant` | `mini/plant.glb` | 0.396 × 0.192 × 0.430 | `colormap` texture |
| `flower-yellow` | `nature/flower_yellowA.glb` | 0.159 × 0.193 × 0.181 | `grass` #749963; `colorYellow` #feb147 |
| `flower-purple` | `nature/flower_purpleA.glb` | 0.159 × 0.242 × 0.181 | `grass` #749963; `colorPurple` #9f89ff |
| `mushroom` | `nature/mushroom_redGroup.glb` | 0.270 × 0.250 × 0.254 | `_defaultMat` #fff; `colorRed` #e04a50 |
| `grass` | `nature/grass_leafs.glb` | 0.234 × 0.143 × 0.257 | `grass` #749963 |
| `bush` | `nature/plant_bush.glb` | 0.396 × 0.244 × 0.396 | `grass` #749963 |
| `rock` | `nature/rock_smallA.glb` | 0.361 × 0.191 × 0.361 | `grass` #749963; `dirt` #a2a69b |

The Mini Forest roof is a separate centered piece that reaches Y 1.050. It is
grounded independently by `create()`, so its vertical offset is an explicit
composition choice in the scene.

Its raw source bounds are min `(-0.670, 0.000, -0.583)` and max
`(0.670, 1.050, 0.583)`; `TownAssets.create("mini-roof", { height })` scales its
ground correction together with the model.

`TownAssets` keeps the imported resources alive for all of its clones. Before a
generic scene disposer (such as `RoomArt.release`) runs, detach those clones; then
call `TownAssets.dispose()` to release their shared geometry, materials, and
textures. Failed or cancelled loads reject with the specific asset path and clean
up every model that did complete.

Visual review selected only Mini Forest trees for a consistent rounded silhouette; Nature Kit supplies the flowers, grass, mushrooms, shrubs and stones. The unused oak model was omitted.
# Asset expansion — 2026-09-16

Fantasy Town Kit 2.0: https://kenney.nl/assets/fantasy-town-kit (CC0).
Exact GLTF exports under public/assets/town/fantasy: windmill.glb (sails only),
wall-block.glb, wall-wood-block.glb, roof-high-point.glb and fountain-round.glb.
Their external Textures/colormap.png and fantasy-town-CC0.txt are locally retained.
The fixed tower is assembled from kit blocks/roof; only the sail group rotates
around its source X-axis. The comparison fountain adds bounded procedural jets.

Nature Kit: https://kenney.nl/assets/nature-kit (CC0). Exact GLTF exports added:
cliff_waterfall_rock.glb, cliff_waterfallTop_rock.glb and rock_largeA.glb. Existing
Nature CC0 provenance/license remains. Instance scale/orientation and a palette
pass adapt them to the town; source GLBs are unchanged. Falling streaks/foam and
the curved flowing stream shader are original TypeScript scenery, not claimed
Kenney animations. TownAssets now owns 21 shared imported model definitions.

Water's geometry, fishing and navigation share TownStream's smooth bank bends;
the bridge segment stays flat for alignment. New scenery collision footprints
are kept in the navigation model. Resource-sharing/disposal remains with
TownAssets for imports and town scene teardown for authored geometry/materials.

## Phone walkthrough revision — 2026-09-16

Comparison fountain removed from scene/navigation/asset-loader selection; its
historical packaged source is retained for provenance only. Windmill moves to
the far bank, without a label. Waterfall references the Nature Kit sample scene:
https://kenney.nl/media/pages/assets/nature-kit/656a90532f-1677698896/sample.png .
Added exact CC0 cliff_block_rock.glb and cliff_rock.glb from the same pack.
TownAssets now loads 22 models. Block terraces plus irregular cliff faces,
planted crests, an uphill pool and descending channel support the larger drop.
The entire raised footprint is scenic/non-walkable; bridge remains the only
water crossing. Authored channel/foam motion is not a Kenney animation.
