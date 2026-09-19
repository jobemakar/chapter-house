# Generation provenance and inspection

Exactly four new raster assets were generated with built-in `image_gen.imagegen`, one call per asset, dispatched in parallel. No inputs, edits, retries, or variants. The originals were copied byte-for-byte to this folder with PowerShell Copy-Item. Full prompts are in VISUAL-UPGRADE-PROMPTS.md.

Root subsequently encoded Night Garden, Lanternwing and floor delivery copies as
quality-90 WebP using Sharp and tools/encode-art.cjs, without crop or resize.
Original PNGs remain unchanged. The transparent atlas is embedded unchanged PNG.
Runtime uses an inspected crop for the wide bookcase, not unsafe quarter-cell
clipping; all twelve search object cells retain their complete source gutter.

Source root: C:/Users/jmakar/.codex/generated_images/01a0b181-4aa9-7cd1-b4c9-9230795526fd/

| Asset | Source filename | Dimensions | Pixel format |
|---|---|---|---|
| night-garden.png | exec-0703fa41-b0ba-430b-974e-78d5d8a0de12.png | 1536 x 1024 | RGB |
| lanternwing.png | exec-b589eb57-efcb-448c-ae2d-b9578aa41826.png | 1536 x 1024 | RGB |
| bureau-objects.png | exec-c7dfab77-b50f-45bf-a948-e92b2eca15cf.png | 1254 x 1254 | RGBA |
| bureau-floor.png | exec-ee420eb0-700d-4a15-a17a-cce93f4e2907.png | 1254 x 1254 | RGB |

All four inspected visually with view_image. Dimensions and alpha inspected with System.Drawing.

Atlas alpha pixel counts: 841,958 fully transparent (alpha 0), 729,150 partial-alpha, 1,408 fully opaque (alpha 255); generated alpha was preserved exactly.

Garden: rich silver flowers, misty winding path, indigo/teal scene and warm antique-gold light. No people, text, UI or frame.

Lanternwing: complete unclipped gentle mothlike creature, delicate soft face, luminous turquoise/gold translucent wings, nocturnal forest. No people, text, UI or frame.

Floor: quiet dark diamond slate texture with thin brass perimeter; no furniture, props, text, or characters. Image is 1254 square despite requested 1024 square; no resizing performed.

Atlas: true alpha transparency, sixteen complete requested silhouettes in correct row order, empty specimen case, closed box and ledger. No visible labels/text, puzzle sigils or grid lines. However it does NOT strictly meet all placement/viewpoint requirements: nominal equal-cell size is 313.5 px, sprites do not consistently have 15% padding, row-3 bookcase extends beyond the first quarter-cell, and the viewpoint is mostly elevated frontal rather than mostly top-surface. Bookcase rendered aspect is closer to 2:1 than requested 230:65. Do not assume exact quarter-cell crops safely contain every object. These issues are reported without retry, per instruction.
