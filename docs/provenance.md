# Provenance and baseline

## Standalone preview packaging — 2026-09-16

The Games menu packages existing standalone playable artifacts from the sibling
book repositories unchanged, with original embedded art, fonts, notices and
save keys intact. These files are not integrated gameplay source and are not
compiled by the application's TypeScript gameplay build. Vite emits exact bytes
on demand via the typed preview allowlist; source repositories are preserved.

Additional previously uncatalogued Bureau After Dark, Veda's Great Escape and
Little Lantern Keeper · Emberwatch artifacts are snapshotted under
`preview-sources/`. `preview-sources.md` records original project paths, commits,
hashes, required local artwork and optional Google Fonts styling requests.
No new raster art or audio was created for this menu pass.

Promotion note — 2026-09-19: Veda's Great Escape is now canonical and no
longer served from the preview allowlist. The original snapshot and hashes stay
here as provenance. Its five puzzles were rewritten as strict TypeScript in
`packages/game-vedas-great-escape`; `sanctuary.png` was copied byte-for-byte,
and no new third-party art or recorded audio was added.

The clubhouse ambient progression and six interaction sounds in src/room/audio.ts are newly authored procedural Web Audio compositions; no third-party recording or external audio download is used. The rounded action UI and expressive rig changes are authored source, documented in feedback-01.md.

The preserved Wish repository is the source baseline, commit `dd3f939` (Trial saved powerups and collision-driven yard mechanisms in Wishbone Fling). Its original JavaScript files and saves are not modified by this application.

The new `src/games/wishbone/` modules explicitly port the prior core solver, authored levels, articulated plush, powerups, 2D renderer, audio synthesis and milestone behavior to strict TypeScript classes. Dependency injection replaces script-order globals. The 120 Hz solver, launch tuning, target thresholds and power rules are retained. A differential regression compares both yards' trajectories and outcomes against the sibling original repository when available.

`public/assets/backdrop.png` is the prior built-in-imagegen watercolor backyard from 2026-09-10. Its original prompt and generation metadata are copied into `legacy-asset-generation.json`. No new raster assets were generated or edited for this integration. The standalone terrier PNG is not needed by the articulated canvas dog.

2026-09-16 depth refinement: the renderer samples only the upper 66.5% of this
unchanged painting (sky, trees and mountains), excluding its baked-in fence.
The independent warm-ivory picket fence, sage verge and extended lawn are
original canvas artwork authored in TypeScript. No third-party assets were added.

Fraunces (`title.ttf`) and DM Sans (`body.ttf`) retain their SIL Open Font License notices alongside the files. Three.js and Matter.js MIT notices are distributed under `public/licenses/` and copied into the production build.

Room furniture, characters, catalog portraits, icon paths and the favicon are authored procedural geometry/SVG for this local application. They are invented visual treatments, not claims about exact objects or character appearance in the novel. Audio is the prior original Web Audio synthesis, ported to `GameAudio`; no recordings were downloaded.

The book connection, spoiler policy and keepsake invention boundaries remain in the collection's plans/08-book-connections.md and plans/11-collectible-catalog.md. This integration introduces no new game concept or altered mechanical signature.

Feedback 02: bowl, aquarium, fish and trampoline are original procedural Three.js geometry; the wooden launcher is original canvas drawing. New yard layouts are invented play spaces, not representations of scenes from the novel. Existing licensed/source assets are unchanged.

Feedback 04: village buildings, water, trees, coin, reaction textures, launcher and grass are authored procedural Three.js/canvas graphics. User-provided reference images guided the pouch and bubble silhouettes; they were not copied into distributed assets. Fountain water/coin and dog-block rustle are original procedural Web Audio. Pocket-power gameplay is removed; prior documentation describes the historical baseline.

## Kenney outdoor assets — 2026-09-15

Mini Forest (1.0): https://kenney.nl/assets/mini-forest
Nature Kit (archive 2.1): https://kenney.nl/assets/nature-kit
Both CC0; supplied licenses retained in public/assets/town/licenses. See woodland-assets.md for model mapping. Nature materials are made nonmetallic and recolored to sage/stone. Mini Forest palette remains supplied. Custom fountain, ground/path geometry, entrance details and signs remain authored TypeScript. The earlier all-procedural description is historical; the outdoor scenery now includes imported models. Room avatars/furnishings remain procedural.

The unmodified Nature Kit source
`Models/GLTF format/crops_dirtSingle.glb` is additionally packaged as
`public/assets/town/nature/crops_dirtSingle.glb` for Willowbrook's temporary
dug-soil treatment. Its two dirt materials are inline and it has no external
texture dependency; the existing Nature Kit CC0 license above applies.

## Kenney Fish Pack collection sprites — 2026-09-15

Fish Pack 2.0: https://kenney.nl/assets/fish-pack. The selected source sprites are
distributed by Kenney under CC0 1.0. Six unmodified 128×128 source PNGs from the
pack's `PNG/Double/` directory are locally packaged as
`public/assets/collections/fish/fish-blue.png`, `fish-green.png`,
`fish-orange.png`, `fish-pink.png`, `fish-grey-long-a.png`, and
`fish-grey-long-b.png`. The supplied license is retained unchanged as
`public/assets/collections/fish/Fish-Pack-CC0.txt`.

## Kenney Cube Pets roster — 2026-09-20

[Cube Pets 2.0](https://kenney.nl/assets/cube-pets) by Kenney is distributed
under CC0. All 24 original `Models/GLB format/animal-*.glb` files, matching
`Previews/animal-*.png` files, shared `Textures/colormap.png`, and the supplied
license are locally packaged under `public/assets/pets/`. The extracted source
was `C:\Users\jmakar\AppData\Local\Temp\chapter-house-cube-pets-2c3d4bdf3c904d9f9713d4793d7b3813\pack`.
Tiger remains packaged but is deliberately not an ordinary store pet.

## Kenney Pirate Kit source package — 2026-09-20

Pirate Kit 2.1: https://kenney.nl/assets/pirate-kit (CC0). The complete
official download is retained as
`application/assets/source/kenney-pirate-kit-2.1.zip` with SHA-256
`667ED2CAF92954DDB98F7B7CEDE831FE99AB75063C26B25E23D32715BEE9C943`.
Its normalized runtime GLB models, previews, shared colormap and unchanged
license are under `public/assets/pirate/`; the 72 GLBs are exact copies from
the pack's `Models/GLB format/` directory. See `docs/pirate-assets.md` for the
inventory and import notes. No runtime external dependency is introduced.
