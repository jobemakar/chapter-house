# Pirate Island asset provenance

The complete Kenney **Pirate Kit 2.1** source download is retained locally for
the authorized Pirate Island work. Kenney's asset page describes the pack as a
3D kit with boat, ship, island, tropical and animation content and publishes it
under CC0:

- Pack page: https://kenney.nl/assets/pirate-kit
- Official download fetched 2026-09-20:
  `https://kenney.nl/media/pages/assets/pirate-kit/e6d4bb1525-1771333093/kenney_pirate-kit.zip`
- Source archive: `application/assets/source/kenney-pirate-kit-2.1.zip`
- Archive SHA-256: `667ED2CAF92954DDB98F7B7CEDE831FE99AB75063C26B25E23D32715BEE9C943`
- License: `public/assets/pirate/LICENSE.txt` (copied unchanged from the pack)

The normalized, browser-importable package is under `public/assets/pirate/`:

- `models/` contains all 72 supplied GLB models, including the pirate ships,
  island pieces, fortress/tower parts, docks, props, vegetation, flags and
  tools. These are exact copies of the archive's `Models/GLB format/` files.
- `textures/colormap.png` is the shared exact source texture. A second unchanged
  copy at `models/Textures/colormap.png` preserves the GLBs' original relative
  `Textures/colormap.png` URI when they load from the browser's models folder.
- `previews/` contains all 72 supplied model preview PNGs for asset selection
  and inspection.

GLB is the suitable runtime format for the existing Three.js loader; models
use the local colormap and do not require a network request. The FBX and OBJ
variants remain available in the reproducibility archive but are not copied
into the runtime public tree because they duplicate the GLB geometry.

The pack's license states that it is Creative Commons Zero (CC0), permits
personal, educational and commercial use, and says Kenney attribution is
appreciated but not required. Pirate Island scene composition, water, collision
and any animation/tuning remain authored application behavior.
