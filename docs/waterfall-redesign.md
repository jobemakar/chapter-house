# Natural waterfall redesign — 2026-09-16

User rejects the version-two spillway composition against the attached Kenney
Nature Kit mockup. This replaces that terrain assembly, not other town gameplay.

## Requirements and plan

1. Replace parallel rectangular walls/repetitive terraces with an asymmetric
   rocky bluff, varied cliff columns and grassy shelves. Preserve imported kit
   geometry proportions; no extremely stretched cliff-face skins.
2. A winding upstream brook is supported by land, begins among higher rocks,
   and reaches a clear waterfall lip. Remove the flat circular source disk.
3. A prominent drop meets the existing stream with visible foam and rocks.
   Keep palette compatible with town; reduced motion freezes scenery movement.
4. Rendering and navigation share the scenic footprint. Water/raised ground
   remains non-walkable and the timber bridge remains the only crossing.
5. Preserve local saves, windmill, original fountain, fishing and all games.
   TownAssets continues to own imported resources; authored meshes are disposed
   with the scene. Package any added kit models locally with CC0 provenance.
6. Root owns terrain/rendering/navigation. Delegate only a read-only bounded
   geometry audit. Run regression/build and inspect the actual browser image,
   comparing silhouette, cliff detail, vegetation and water to the supplied
   reference. Record actual evidence, not just successful compilation.

This request authorizes the redesign and local preview, not a new publication.

## Verification

- Production strict TypeScript/Vite build passes; existing large-bundle warning
  remains. Full application suite: 100/100 passing.
- Added checks for uniform imported scaling, shared-resource detachment,
  brook/drop seam continuity, finite geometry, reduced-motion freeze and blocked
  source terrain. Existing bridge routes and bank fishing checks pass.
- Exact standalone preview verification: 14 previews / 20 source/build/served
  files still match, correct MIME and unknown-route 404.
- Root browser review rejected the initial cube-heavy assembly, then reviewed
  the revised pale sculpted facades/uprights, vegetation, winding brook, visible
  waterfall and foam. Review also caught/fixed a facade obscuring the drop.
- This is a Nature Kit-inspired composition, not a pixel-identical recreation
  of its complete demo island. No physical-phone or performance claim.
- Phone-landscape emulation at 844 by 390 fits the 844 by 336 town canvas with
  no document-height overflow. Browser review shows the waterfall, foam and
  far-bank windmill at overview scale. No captured browser warnings/errors.
