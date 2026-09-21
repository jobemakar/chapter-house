# Cube Pets asset provenance

The complete Kenney **Cube Pets 2.0** pack is locally packaged under
`public/assets/pets/`: all 24 `Models/GLB format/animal-*.glb` files, the shared
`Models/GLB format/Textures/colormap.png`, and all 24 matching `Previews/*.png`
files. This includes `animal-tiger` even though Tiger is reserved outside the
ordinary store catalog.

- Source inspection folder: `C:\Users\jmakar\AppData\Local\Temp\chapter-house-cube-pets-2c3d4bdf3c904d9f9713d4793d7b3813\pack`
- Included download paths: `Models/GLB format/animal-*.glb`, shared
  `Models/GLB format/Textures/colormap.png`, and `Previews/animal-*.png`.
- Pack license/version evidence: supplied `License.txt`, copied unchanged as
  `public/assets/pets/licenses/Cube-Pets-CC0.txt`. It identifies **Cube Pets
  2.0** by Kenney (creation date 2026-03-26) as CC0; retain that file with all
  redistributed trial assets.
- Raw GLB observation: every packaged model exposes `static`, `idle`, `walk`,
  `run`, `eat`, `dance`, `gesture-positive`, and `gesture-negative`. Runtime
  validates the clips it uses: idle, walk, eat, dance, and gesture-positive.

The GLBs refer to `Textures/colormap.png` with that exact capitalized relative
path, hence the packaged directory name. Preview inspection and node positions
(head/front legs at positive Z) show that the authored model faces +Z. The rig
records an explicit zero-radian model yaw so that this verified authored forward
orientation remains aligned with Chapter House's +Z convention. Models are
centered and ground-aligned at source scale 0.48; individual model height is
not normalized away, so each animal keeps its authored proportions.
