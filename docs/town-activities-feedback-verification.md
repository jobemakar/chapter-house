# Willowbrook activity feedback verification

2026-09-15

## Implemented

- Replaced the always-present context bubble with an avatar-owned action arc. A tap on the stationary, idle avatar toggles it; walking, choosing an action, or leaving town closes it.
- The arc always contains Fish and Dig. Unavailable actions stay visible with native disabled semantics, muted styling, and a short explanation for Fish away from the stream.
- Kept Reel as a separate automatic prompt during an active cast so closing the avatar arc cannot strand fishing.
- Strengthened fishing feedback with three bright, independently pulsing ripple rings, a visible lure, and small splash droplets. Reduced motion preserves the cue without repeated scaling.
- Reworked digging into two controlled shovel strokes with stable paw poses. A dark temporary hole and an exact CC0 Kenney Nature Kit dirt mound now appear in front of the avatar and persist through the result moment.
- Added original image artwork for all eight digging finds. Successful fish and dig results now show their actual collection image, name, rarity treatment, and stacked count in a two-second bubble above the avatar.
- Willowbrook's title card now restarts on each entry, identifies the space, and fades away. Reduced motion uses an opacity-only fade.
- Updated Help copy to explain the avatar-tap interaction.

## Assets and provenance

`public/assets/town/nature/crops_dirtSingle.glb` is an exact 4,196-byte copy of Kenney Nature Kit's `Models/GLTF format/crops_dirtSingle.glb`, SHA-256 `6D9DF48FA8B691A949C053F56977E1134CD917EC7C8A936612D7FA1978DCCE1D`. It uses inline dirt materials with no texture or animation dependency. The existing packaged Nature Kit CC0 license applies and `docs/provenance.md` records the mapping.

The eight find images under `public/assets/collections/finds/` are original project SVG artwork. Existing fish result bubbles reuse the previously packaged Kenney Fish Pack sprites.

## Automated validation

- `npm test`: 84 passing tests. New coverage verifies the always-present Fish/Dig definitions, availability changes, stationary avatar toggling, rejection during walking or an activity, and automatic closing for movement/actions/reset. Catalog checks now require image-backed discoveries.
- `npm run build`: TypeScript and the Vite production build pass. Vite retains the existing large-chunk advisory (about 900 kB before gzip); it is not a build failure.
- `git diff --check`: passed apart from the repository's expected LF-to-CRLF checkout notices.

## Served-browser review

- Desktop 1280×720: entered Willowbrook and confirmed the title card fades away; tapped the avatar to open a two-action arc; verified Fish is visibly disabled away from the stream while Dig remains active; inspected the revised shovel stroke and Kenney mound/hole; and saw an image-backed Pocket Compass result bubble above the avatar.
- Mobile 390×844 with Chrome touch emulation: the title was visible on entry and `visibility: hidden` after its fade. The menu status changed from closed to open after one avatar tap. Fish remained disabled, Dig remained enabled, and both 68-pixel action buttons fit cleanly around the centered avatar without clipping.
- The stronger fishing ripple treatment is deterministic scene geometry and is covered by the same activity state transitions as the existing fishing flow. A stream-bank catch was not forced during this feedback pass; the prior stream-only fishing playthrough and deterministic fishing tests remain valid.

## Limits

No physical phone or tablet was used, so finger feel remains a family-device check. This pass was intentionally limited to the requested interaction, animation, discovery, and signage feedback. No publication was performed.
