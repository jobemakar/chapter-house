# Woodland village art pass
2026-09-15. User authorizes a creative first pass replacing all existing village houses, using Kenney Nature Kit and/or Mini Forest outside only.

## Brief
Make Willowbrook a coherent woodland square with a timber clubhouse pavilion, reading tent and garden nook. Replace all old box/cone houses; imported scenery supplies crafted silhouettes. Retain animal avatars, pet, fountain, stream boundary, camera and local progress.

## Requirements
1. Remove all five old houses and their obsolete collision footprints. Keep a clearly tagged home entrance and persistent Home UI.
2. Package selected CC0 models locally with license/provenance; no runtime third-party requests.
3. Combine a restrained palette of foliage/rock/wood assets with open paths around the fountain. Match asset scale and collision geometry.
4. Keep tap walking, pet follow, pan/zoom, reactions, fountain coin and spatial audio working. Preserve local save keys.
5. Load models once per scene, share cloned model geometry/materials, guard late async completion after leaving, and dispose textures/resources. Provide readable loading failure rather than broken models.
6. Verify desktop and narrow portrait visually; run navigation regression tests and production build. Do not claim large-world optimization or device performance without measurement.

## Plan and ownership
Astra owns layout, art composition, integration, review and browser QA. Delegate a bounded TypeScript TownAssets loader + selected model packaging to Terra. API loads a curated model list and returns centered/grounded clones scaled by height or footprint; lifecycle owns imported resources. No changes to existing scene/game/save code by delegate.
Build new scene structures from Mini Forest timber components after checking bounds. Use Nature Kit for small landscape accents where visually compatible. Keep broad approaches and low foreground foliage. Rebuild local deliverable and document checks/remaining limitations. No Firebase or deployment.
