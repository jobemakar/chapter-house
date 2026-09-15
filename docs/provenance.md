# Provenance and baseline

The clubhouse ambient progression and six interaction sounds in src/room/audio.ts are newly authored procedural Web Audio compositions; no third-party recording or external audio download is used. The rounded action UI and expressive rig changes are authored source, documented in feedback-01.md.

The preserved Wish repository is the source baseline, commit `dd3f939` (Trial saved powerups and collision-driven yard mechanisms in Wishbone Fling). Its original JavaScript files and saves are not modified by this application.

The new `src/games/wishbone/` modules explicitly port the prior core solver, authored levels, articulated plush, powerups, 2D renderer, audio synthesis and milestone behavior to strict TypeScript classes. Dependency injection replaces script-order globals. The 120 Hz solver, launch tuning, target thresholds and power rules are retained. A differential regression compares both yards' trajectories and outcomes against the sibling original repository when available.

`public/assets/backdrop.png` is the prior built-in-imagegen watercolor backyard from 2026-09-10. Its original prompt and generation metadata are copied into `legacy-asset-generation.json`. No new raster assets were generated or edited for this integration. The standalone terrier PNG is not needed by the articulated canvas dog.

Fraunces (`title.ttf`) and DM Sans (`body.ttf`) retain their SIL Open Font License notices alongside the files. Three.js and Matter.js MIT notices are distributed under `public/licenses/` and copied into the production build.

Room furniture, characters, catalog portraits, icon paths and the favicon are authored procedural geometry/SVG for this local application. They are invented visual treatments, not claims about exact objects or character appearance in the novel. Audio is the prior original Web Audio synthesis, ported to `GameAudio`; no recordings were downloaded.

The book connection, spoiler policy and keepsake invention boundaries remain in the collection's plans/08-book-connections.md and plans/11-collectible-catalog.md. This integration introduces no new game concept or altered mechanical signature.

Feedback 02: bowl, aquarium, fish and trampoline are original procedural Three.js geometry; the wooden launcher is original canvas drawing. New yard layouts are invented play spaces, not representations of scenes from the novel. Existing licensed/source assets are unchanged.

Feedback 04: village buildings, water, trees, coin, reaction textures, launcher and grass are authored procedural Three.js/canvas graphics. User-provided reference images guided the pouch and bubble silhouettes; they were not copied into distributed assets. Fountain water/coin and dog-block rustle are original procedural Web Audio. Pocket-power gameplay is removed; prior documentation describes the historical baseline.

## Kenney outdoor assets — 2026-09-15
Mini Forest (1.0): https://kenney.nl/assets/mini-forest
Nature Kit (archive 2.1): https://kenney.nl/assets/nature-kit
Both CC0; supplied licenses retained in public/assets/town/licenses. See woodland-assets.md for model mapping. Nature materials are made nonmetallic and recolored to sage/stone. Mini Forest palette remains supplied. Custom fountain, ground/path geometry, entrance details and signs remain authored TypeScript. The earlier all-procedural description is historical; the outdoor scenery now includes imported models. Room avatars/furnishings remain procedural.
