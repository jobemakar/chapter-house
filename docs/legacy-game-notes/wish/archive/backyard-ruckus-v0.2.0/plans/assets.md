# Asset provenance

2026-09-10. Original game art generated using the built-in imagegen tool, not the API/CLI fallback. Generated once per asset and inspected before integration. No image edits.

- assets/backdrop.png: watercolor summer backyard, 1536×1024.
- assets/dog.png: watercolor terrier cutout, 1536×1024 with alpha transparency. The character design is invented; not a claim about the novel's exact dog appearance.

Exact generation prompts and original-output metadata are retained in [asset-generation.json](asset-generation.json). Shared job metadata includes all three assets made for these two demos.

- assets/title.ttf: Fraunces, copied from the existing licensed Stormglide font set.
- assets/body.ttf: DM Sans, copied from the existing licensed Stormglide font set.
- SIL Open Font License notices retained in assets/Fraunces-OFL.txt and assets/DM-Sans-OFL.txt, distributed with hosted assets and embedded in standalone HTML comments.
- Music and effects: original Web Audio synthesis authored in src/support.js; no downloaded recording.
- Functional tracks/hoops/targets and reward symbols: canvas geometry or Unicode, with system fallback for symbols.
