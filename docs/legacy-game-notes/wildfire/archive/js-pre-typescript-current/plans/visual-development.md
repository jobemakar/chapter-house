# Second-pass art

Generated using the built-in image-generation tool. Reference: `../wildfire-concept/intake-hose-v2.png` (style only).

Saved asset: `public/assets/forest-backdrop-v2.png`. The background is illustration only: diggable soil, rocks, water, canteens, fittings, fire and spray are independently rendered and positioned by the game. This prevents the artwork from baking a fixed level into the board.

## Final prompt

Use case: stylized-concept. Asset type: production 2D game background, portrait 4:5. Image 1 is STYLE REFERENCE ONLY, not an edit target. Create a lush hand-painted pine forest background in the same friendly polished storybook adventure-game treatment, evergreen dark teal foliage, fern green moss, warm sunlight, distant blue mountains. Composition needed for a real modular water-digging puzzle: border foliage only at far left and far right about 8% width, upper 15% has distant sky and forest, middle 65% is calm low-contrast shaded deep forest space where interactive ochre soil will be overlaid by code, NO dirt blocks or terrain filling that space. Bottom 22% is a campsite vignette with small golden canvas tent at bottom left and an empty clear earthen ground at bottom center-right where code will draw a fire and hose. Keep gameplay area readable. No fire, smoke, hose, water, pipes, characters, canteens, text, UI, tile seams, grid, frame, logos or watermark. Flat front-facing game board framing, painterly texture and dimensional foliage, not photographic.

## Modular visual rules

- Irregular, partial-width soil footprint; no visible tile seams.
- Terrain authoring cells are separate from the smoothed silhouette, texture and grassy transitions.
- Intake position, facing, sensor and working/dummy behavior are data-driven.
- Matching blue-drop badges teach the disconnected intake/hose relationship.
- Cracked lip, tarnished color and crossed badge distinguish the leaking dummy.
- Three optional golden canteen buddies fill once when touched by water.
- This pass illustrates one side intake and one upward dummy; multiple working intakes and different campsite arrangements remain supported design directions, not all demonstrated in this level.
