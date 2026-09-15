# Cube Pets asset provenance

This trial packages only Kenney **Cube Pets** `animal-cat`, `animal-bunny`, and
`animal-fox` from the supplied expanded pack under `public/assets/pets/`.

- Source inspection folder: `C:\Users\jmakar\Documents\Codex\2026-09-15\rom-x20-2\work\cube-pets-inspection-20260915\expanded`
- Included downloads: `Models/GLB format/animal-{cat,bunny,fox}.glb`, its shared
  `Models/GLB format/Textures/colormap.png`, and each matching `Previews/*.png`.
- Pack license/version evidence: supplied `License.txt`, copied unchanged as
  `public/assets/pets/licenses/Cube-Pets-CC0.txt`. It identifies **Cube Pets
  2.0** by Kenney (creation date 2026-03-26) as CC0; retain that file with all
  redistributed trial assets.
- Raw GLB observation: each chosen model exposes `static`, `idle`, `walk`,
  `run`, `eat`, `dance`, `gesture-positive`, and `gesture-negative`. Runtime
  validates the clips it uses: idle, walk, eat, dance, and gesture-positive.

The GLBs refer to `Textures/colormap.png` with that exact capitalized relative
path, hence the packaged directory name. Preview inspection and node positions
(head/front legs at positive Z) show that the authored model faces +Z. The rig
records an explicit zero-radian model yaw so that this verified authored forward
orientation remains aligned with Chapter House's +Z convention. Models are
centered and ground-aligned at source scale 0.48; bunny height is not normalized
away, so its ears remain naturally taller.
