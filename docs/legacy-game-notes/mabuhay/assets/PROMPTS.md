# Moonlight Munch Run generated art provenance

Built-in image generation, 2026-09-16, default tool mode. Files were copied locally for this experiment.

## `moonlight-truck.png`
Prompt: Transparent-background 2D game sprite, cozy cartoony Filipino night-market food truck seen from a top-down three-quarter view, facing right. Coral and teal compact truck with warm lantern glow, purple roof, golden wheel hubs, little serving hatch and simple original decorative stars. Thick clean dark navy outlines, flat shaded illustration, friendly readable mobile-game silhouette. No text, no logos, no people, no background, full object visible with generous transparent padding.

## `moonlight-guardian.png`
Prompt: Transparent-background 2D game sprite, one original friendly moonlit night-market creature inspired broadly by Southeast Asian folktale silhouettes but not depicting a named traditional monster: round fluffy purple forest guardian with tiny curled horns, large kind amber eyes, woven leaf shawl, little empty snack bowl, facing left. Top-down three-quarter view for a scrolling driving game. Thick clean dark navy outlines, flat shaded cozy cartoon illustration, clear mobile-game silhouette. No text, no logo, no people, no background, full character visible with generous transparent padding.

## `moonlight-truck-v2.png` (used in playable)

Built-in image generation EDIT, referencing this experiment's `assets/moonlight-truck.png`.

Exact edit prompt: Edit this exact game-art truck sprite: remove every background pixel completely. Return ONLY the truck, lantern glow and tiny immediately adjacent shadow as a clean isolated PNG with genuine alpha transparency around it; no black rectangle, no gradient backdrop, no vignette, no floor, no scenery. Preserve the illustrated coral, teal and purple food truck and its readable silhouette.

## Original tool output paths

All outputs were produced under `C:\Users\jmakar\.codex\generated_images\01a0ac79-9375-7ec3-9e79-bdf5b9755147\` and copied, not regenerated or edited by the completion pass:

- Original truck: `exec-6f16238c-f023-4f08-a986-72400d646958.png` → `assets/moonlight-truck.png` (retained reference, not loaded by the game).
- Guardian: `exec-8b70b0c4-5e43-4ca0-95af-36c7b292a1c0.png` → `assets/moonlight-guardian.png`.
- Edited truck: `exec-9d992dde-fcd8-40ff-ade7-33b148019a26.png` → `assets/moonlight-truck-v2.png`.

The two used PNGs retain genuine alpha with soft immediate glow/shadow. Desktop and phone landscape/portrait browser inspection shows isolated sprites over the road without dark rectangular panels. Rendering preserves each PNG's natural aspect ratio. All creature identity and behavior are invented for this game.

Pillow alpha verification: v2 truck is 1536×1024, corner RGBA `(1,1,1,0)`, 684,723 fully transparent pixels; guardian is 1306×1204, corner `(0,0,0,0)`, 782,877 fully transparent pixels. Dark RGB in transparent pixels is not an opaque background.
