# Veda painted-diorama asset provenance

Phase 1 uses package-owned PNG art generated with the built-in image-generation
workflow on 2026-09-21 and corrected on 2026-09-22. The flattened concept board
is only a palette and mood target. Runtime objects, characters and terrain remain
separate assets.

## Runtime files

| File                         | Dimensions and layout                                           |   Bytes | SHA-256                                                            |
| ---------------------------- | --------------------------------------------------------------- | ------: | ------------------------------------------------------------------ |
| `veda-walk-atlas.png`        | 768×768; 4×4; rows up, right, down, left                        | 553,964 | `744E1A82500B9AA9C3ABB554CC492F197B1BA15852D251E2ABA1ED947C776346` |
| `veda-idle-atlas.png`        | 192×768; 1×4; dedicated authored idle pose for each direction   | 169,098 | `DBD80F06710D82B854165167E0482EDEBE347FD4B196757E525CFB5345CFCD1C` |
| `veda-push-atlas.png`        | 384×768; 2×4; two elephant-only effort poses for each direction | 218,326 | `C04C5BA4FE12F76F02E0E72EE8E617C4C93CA94477093B02DE46EFA8ED9A6A54` |
| `veda-object-atlas.png`      | 576×576; 3×3; nine separately cropped puzzle objects            | 310,004 | `2E973126349E8CA6BA21F08818F7043ECCFE416FAE02B44787254D0188FD4E1A` |
| `veda-environment-atlas.png` | 512×512; 2×2; four distinct 256px seamless terrain variants     | 716,947 | `D234056DDE0C9740F66431953FD5B186BF12B476121CA156AAC0C82D1CE6EEA3` |

The five runtime atlases total **1,968,339 bytes** before build compression.
Character cells are square 192px crops. Walk, idle and push silhouettes have a
common optical X center within one pixel, a common ground baseline at local
`y=174`, and at least a 17px alpha safety gutter. The new idle art is not an
alias of a walk frame. Push cells contain Veda only—crates remain separate
objects. The four terrain crops are opaque and materially different in average
color/material. Each source is toroidally half-offset, then its displaced
central seam is healed with a 104px cosine crossfade. Opposing boundaries are
naturally adjacent source pixels with continuous gradients rather than copied
edge strips or mirrored quadrants.

## Retained source inputs

Raw corrective outputs are retained under `sources/` before any resizing or
cleanup:

| File                              | Dimensions |     Bytes | SHA-256                                                            |
| --------------------------------- | ---------: | --------: | ------------------------------------------------------------------ |
| `veda-idle-raw.png`               |   2172×724 | 1,001,657 | `AE51C272351BC1EFB11FA7F9EEF501E04ACB95CBB7A392BB4EC46BAB005FAB92` |
| `veda-push-raw.png`               |  1254×1254 |   999,991 | `CACCD24B338B24579A345DDC9E6E2204D183C75676273B3F97CEE342B8FC1036` |
| `veda-terrain-raw.png`            |  1254×1254 | 2,845,215 | `5737C4B09D8FEC861F866CAE86ABDED85F3A4ADDF75E25F0CC0D08C4580D1F0B` |
| `veda-walk-reference-runtime.png` |    768×768 |   555,606 | `E63B855D6EE9E206D7FB63C560660E47195553278DCC43F3820DE82C14CD7428` |

The last file is the exact accepted walk atlas supplied to ImageGen as the
identity/style reference before its final X-anchor correction; it is not a raw
generation. The larger original walk and object generation outputs from the
first pass were overwritten before this corrective review and cannot honestly
be claimed as retained. Their exact prompts remain below. The current runtime
walk and object sheets are therefore their canonical surviving sources.

`tools/repack-veda-assets.ps1` deterministically packs the retained idle, push
and terrain sources. It uses independent per-file dimension guards: a missing
idle atlas cannot cause walk, push or terrain to be resampled. Its default run
only translates already-packed character pixels when an anchor is out of
tolerance and is hash-idempotent after correction. `-ForceGenerated` is the
explicit maintainer path for rebuilding the three retained generated sources.
`-ForceTerrain` rebuilds only terrain while preserving the independently guarded
character atlases.

## Repeat inspection artifacts

Two deterministic 3×3 sheets are retained beside this receipt:

| File                            | Purpose                                                                                               | SHA-256                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `terrain-repeat-3x3-native.png` | All four variants repeated 3×3 at native 256px tile size; 1536×1536 overall                           | `E5C9A3E52F80D71872C839616118ABA479169FF9B0FECE96E0844C1DB33AB919` |
| `terrain-repeat-3x3-phone.png`  | The same four repeats scaled as complete panels to approximately 43px per board cell; 258×258 overall | `4E3987728E5F5F6A3E6488FAFAFEE20D2EC5403846CBFDEBA3F6FD5FAE72F150` |

`tools/write-terrain-repeat-inspection.ps1` regenerates both. Scaling the whole
repeat panel prevents the QA artifact from introducing per-cell interpolation
borders that are not present in the source texture.

## Exact prompts

### Walk atlas — original 2026-09-21 prompt

```text
Use case: stylized-concept
Asset type: production game sprite atlas
Primary request: a clean transparent-background 4 by 4 sprite atlas for Veda, a friendly young elephant character from a cozy children's book puzzle game. Exactly sixteen separate full-body source frames, arranged in four equal rows and four equal columns with generous transparent padding. Row 1 is walking north/up seen from behind, row 2 is walking east/right in profile, row 3 is walking south/down facing the viewer, row 4 is walking west/left in profile. Each row is a four-frame walk cycle: left foot, passing, right foot, passing, with tiny trunk and ear movement and a stable readable silhouette. Veda wears a small muted teal scarf and warm ochre satchel.
Style/medium: richly painted diorama children's-book illustration, hand-painted gouache with subtle paper grain, crisp readable edges, consistent character proportions across all frames, no 3D render.
Composition/framing: orthographic front-facing sprite sheet, each frame centered inside an identical 256 by 256 cell, atlas has transparent background and no borders; use the full canvas for the grid only.
Lighting/mood: soft warm sanctuary light, gentle forest-green and moss shadows.
Color palette: forest green, moss, ochre, peach, cream, muted teal.
Constraints: genuine transparent background; exactly 16 frames in a 4x4 grid; no labels, no arrows, no text, no scenery, no extra characters, no watermark; do not merge neighboring cells; keep each elephant entirely inside its cell with 16px safety padding.
Avoid: flat emoji, photorealism, complex background, cropped ears or feet, mirrored-only poses, inconsistent scale.
```

### Dedicated idle atlas — corrective 2026-09-22 prompt

```text
Use case: stylized-concept
Asset type: raw production game sprite source sheet for Veda's Great Escape
Input image: identity and rendering reference. Match this exact young elephant: cream/beige body, peach inner ears, muted teal scarf, ochre satchel, identical facial design, body proportions, gouache texture, lighting, and scale.
Primary request: create exactly four genuinely authored neutral idle poses of the same Veda, one for each direction, arranged as a strict single horizontal row in this order: up/back view, right/profile, down/front view, left/profile. These are calm standing poses, distinct from walking frames: all feet planted, relaxed trunk and ears, subtle direction-specific posture. Left and right must be separately authored, not mirrored copies.
Composition/framing: exactly 4 equal square cells in one row, one full-body elephant centered in each cell, common ground/contact baseline and optical center, consistent scale, at least 12% transparent safety gutter around each silhouette.
Background: genuine transparent alpha everywhere outside the elephant; no floor, shadow field, scenery, gradients, frames, dividers, text, labels, or watermark.
Constraints: elephant only; preserve teal scarf and ochre satchel in every direction; no crate or other prop; no cropped ears, feet, trunk, scarf, or satchel; no extra characters; no direction arrows; crisp clean alpha edges suitable for deterministic repacking.
```

### Elephant-only push atlas — corrective 2026-09-22 prompt

```text
Use case: stylized-concept
Asset type: raw production game sprite source sheet for Veda's Great Escape
Input image: identity and rendering reference. Match this exact young elephant: cream/beige body (not blue or gray), peach inner ears, muted teal scarf, ochre satchel, identical facial design, body proportions, gouache texture, lighting, and scale.
Primary request: create exactly eight elephant-only push-effort poses of the same Veda in a strict 2 columns by 4 rows grid. Rows in order: up/back, right/profile, down/front, left/profile. Column 1 is a gentle braced lean with planted feet and trunk extended toward an imaginary object; column 2 is a stronger compressed effort pose. Each pose must clearly communicate pushing but must contain Veda only. Left and right must be separately authored, not mirrored copies.
Composition/framing: exactly 8 equal square cells, one full-body elephant centered in each, common ground/contact baseline and optical center, consistent scale matching the reference walk sprite, at least 12% transparent safety gutter around every silhouette.
Background: genuine transparent alpha everywhere outside Veda; no floor, shadow field, scenery, gradients, frames, dividers, text, labels, or watermark.
Constraints: ABSOLUTELY NO CRATE, box, wall, switch, prop, or other object in any cell; preserve cream/beige body, teal scarf, and ochre satchel in every frame; no cropped ears, feet, trunk, scarf, or satchel; no extra characters; crisp clean alpha edges suitable for deterministic repacking.
Avoid: blue/gray elephant, red scarf, missing satchel, walking poses, baked-in object, opaque background.
```

### Object atlas — original 2026-09-21 prompt

```text
Use case: stylized-concept
Asset type: production game object sprite atlas
Primary request: a transparent-background object atlas for a cozy painted sanctuary puzzle game. Arrange clearly separated object sprites in a simple clean grid with generous transparent padding: wooden push crate closed, wooden push crate resting on a brass switch, standalone round brass switch, standalone mossy stone switch, ripe peach collectible, sanctuary gate closed, sanctuary gate open, fixed mossy stone wall, and small leafy foliage tuft. Each object is shown in a three-quarter orthographic diorama view but reads cleanly as one-cell game art; matching hand-painted proportions and shared light across all objects.
Style/medium: richly painted children's-book diorama, gouache and subtle paper grain, crisp readable silhouettes, production sprite art rather than a scene.
Composition/framing: transparent 3 by 3-ish atlas on an even grid, one object per slot, no overlaps, no labels, enough empty margin around every silhouette for CSS/DOM sprites.
Lighting/mood: warm sanctuary light, soft grounding shadows painted into the object only.
Color palette: forest green, moss, ochre, peach, cream, muted teal, weathered stone gray.
Constraints: genuine transparent background; no scenery behind objects; no text; no arrows; no borders; no watermark; do not merge objects; keep every sprite fully inside its cell; preserve distinct closed/open gate and crate-on-switch state.
Avoid: emoji, flat vector icons, photorealism, random extra props, cropped objects, background color.
```

### Quiet terrain sources — corrective 2026-09-22 prompt

```text
Use case: stylized-concept
Asset type: raw production environment texture source sheet for Veda's Great Escape
Input image: palette, material, and painted-diorama mood reference only.
Primary request: create exactly four genuinely distinct quiet square terrain texture sources in a strict 2 by 2 grid: top-left soft mossy sanctuary earth with sparse tiny leaves; top-right warm pale worn stone with very subtle hairline variation; bottom-left muted deep-green moss with a few soft fern-shadow shapes; bottom-right warm weathered root-and-earth texture with restrained curved wood grain. Every quadrant must differ clearly in hue, material, and brush pattern while remaining low-contrast behind phone-size puzzle pieces.
Style/medium: hand-painted children's-book gouache with subtle paper grain; organic broad brushwork, no geometric patterning.
Composition/framing: orthographic texture samples only, one material filling each equal quadrant; no focal object, border, frame, labels, text, characters, crates, gates, switches, fruit, or scenery.
Constraints: avoid dense repeated dots, plaid, checkerboard, moire, wallpaper, tile-grid lines, strong highlights, or high-frequency noise. Keep edges visually quiet so each source can be deterministically mirror-seamed during repacking. Opaque artwork; no transparency required.
```

## Verification boundary

Automated tests decode the PNG pixels, pin raw/runtime hashes, verify per-cell
content and gutters, check separate authored idle/walk/push pixels, enforce X/Y
anchor tolerances and phone-scale coverage, and prove all four opaque terrain
variants are unique. The boundary-gradient metric compares each repeated-edge
RGB step with ordinary adjacent-pixel gradients inside that tile and caps the
ratio at 1.5 on both axes. Tests also pin both inspection-sheet hashes and
dimensions. Visual inspection of the native and approximately 43px 3×3 sheets
confirmed no tile-border seam; the root material reads as continuous quiet
earth/root texture rather than discrete mirrored or copied cells. Phase 2
renderer wiring, browser layout and animation are intentionally outside this
receipt.
