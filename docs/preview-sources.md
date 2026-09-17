# Packaged preview sources

## Bureau visual refresh — 2026-09-17

Parent plan 45 and canonical Bureau revision 0.3.0 replace final generic record
icons with illustrated cards/case notes, search ovals with neutral object sprites,
and the plain map floor/shelves with restrained generated art. Puzzles, save keys,
IDs and rewards stay unchanged. Canonical PNGs/full prompts and distribution
encoding provenance live in the original game's assets directory. Only Bureau's
snapshot changed: 17,708,631 bytes, SHA-256
`9DE4FDBD06EE512FE8922A6052F318F1B7A05DC1FB24F5E684C45D01EA14AD22`.
The current manifest remains authoritative. This is a standalone preview, not a
Chapter House gameplay/account/reward integration.

These are reviewed standalone build snapshots, not integrated gameplay
source. Refresh them only from reviewed canonical builds, not manual generated
HTML edits. The preview build bridge emits them without compiling or rewriting
them. The Chapter House menu may open them as separate preview artifacts only.

## Current snapshot refresh — 2026-09-16

All thirteen preview builds and required dependencies now reside under
preview-sources in this application, including the added Door Atelier concept.
The build bridge resolves this application root, not the sibling collection.
Veda game.js/style.css, Merienda generated art, Gummy hover and Contraption
affordances were refreshed from their original source repositories. The older
tables below retain the initial audit as history; current authoritative hashes,
sizes, original paths and byte-equality checks are in
[preview-origin-manifest.json](preview-origin-manifest.json).

To refresh: edit the original authored game source, run its documented build
(Veda's readable tracked JS/CSS are themselves the source), copy the canonical
HTML/dependencies, update the typed allowlist if needed, then run test, build
and verify:previews. Door Atelier uses relative stable assets/game.js and
assets/index.css paths so nested hosting is self-contained. Optional Google
Fonts requests in older demos retain their system-font fallbacks.

## Bureau After Dark

- Preview entry: `application/preview-sources/bureau-after-dark/index.html`
- Display title: `Bureau After Dark`
- Canonical source: `C:\Users\jmakar\Desktop\codex\interactive\battle-of-books\amari-and-the-night-brothers\playable\Bureau-After-Dark.html`
- Local revision 0.2.0 (2026-09-17): two floors, six generated sigils, tactile parchment/riddles, journal clues, ordered archive seals, saved case file/cryptid record and automatic elevator exit. User explicitly selected the riddle mechanic, superseding the original stealth pitch.
- Authored TypeScript, template, generated art provenance and reproducible `node build.cjs` are in the canonical book folder. The September 13 prototype is preserved in its `archive/` folder.
- All images/code are embedded. Optional Google Fonts (`Cormorant Garamond` and `DM Sans`) retain system-font fallbacks. Saves remain standalone browser-local data; no hosted update or Chapter House gameplay integration.

| Packaged file |  Bytes | SHA-256                                                            | Original-byte equality |
| ------------- | -----: | ------------------------------------------------------------------ | ---------------------- |
| `index.html`  | 14,033,569 | `53BEA42D5E3CA1C365815D4AFBD2CD9E8BCACF36CC8A616B8C40B9D894EED354` | Verified               |

## Veda's Great Escape

- Preview entry: `application/preview-sources/vedas-great-escape/index.html`
- Display title: `Veda's Great Escape`
- Original source directory: `C:\Users\jmakar\Documents\Codex\2026-09-13\cre-2\dist`
- Original repository/source: `C:\Users\jmakar\Documents\Codex\2026-09-13\cre-2`, local Git commit `6917df22673d310b30fc095f9ae2e7e873c17771` (`Replace care simulation with Veda escape puzzles`, 2026-09-14 08:23:25 -04:00). No Git remote was configured.
- Required local files were copied exactly: `index.html` loads `style.css` and `game.js`; `style.css` loads `sanctuary.png`.
- Optional network request: `style.css` has a CSS `@import` for Google Fonts (`DM Sans` and `Manrope`).

| Packaged file   |     Bytes | SHA-256                                                            | Original-byte equality |
| --------------- | --------: | ------------------------------------------------------------------ | ---------------------- |
| `index.html`    |     2,816 | `2C8B1ECA852F72508940A5522956CA57A649A6532F66C9B1AF1F7BC5E100B73D` | Verified               |
| `style.css`     |     6,070 | `4CA531AFA287A316ED14AFCA6A85B343C46BCFBBE0DB93A8C3A2C79F9FE220F5` | Verified               |
| `game.js`       |     9,578 | `48BC438767B6CEDFC8A3AD3215B8DBA6470A60BDEA4C755F2792487A6E338C28` | Verified               |
| `sanctuary.png` | 3,021,448 | `DDD04D4928B5719D38FFCF6F452F2A5419E22595ADC4D877C8EECF81090E3945` | Verified               |

## Little Lantern Keeper · Emberwatch

- Preview entry: `application/preview-sources/emberwatch/index.html`
- Display title: `Little Lantern Keeper · Emberwatch`
- Original source directory: `C:\Users\jmakar\Documents\Codex\2026-09-13\cr\dist`
- Original repository/source: `C:\Users\jmakar\Documents\Codex\2026-09-13\cr`, local Git commit `6f19fccaaffe5de80e0b64657215619d3d9e5e1d` (`Reimagine Emberwatch as a cozy lantern keeper demo`, 2026-09-13 22:42:03 -04:00). No Git remote was configured.
- Required local files were copied exactly: `index.html` loads `style.css` and `game.js`; `style.css` loads `clearing.png`.
- No external runtime requests were found. The font stack is local/system fonts and its icon is a data URI.

| Packaged file  |     Bytes | SHA-256                                                            | Original-byte equality |
| -------------- | --------: | ------------------------------------------------------------------ | ---------------------- |
| `index.html`   |     3,068 | `2F00D8442E9987BD8C08C6B302693A3C194B0932D419ACBD044091A08F9CB30C` | Verified               |
| `style.css`    |     7,045 | `2A5BD10B2D4314FA78A63B640A67B613B95874DFD691F1D6D2B18B6C1D3C41FF` | Verified               |
| `game.js`      |     8,097 | `CFD67570D8F718055BC353C4CC808D43B6EB240D08576D02A96A5E6715EEAD8E` | Verified               |
| `clearing.png` | 2,691,657 | `8F111393C489D21C7D889499F1C0E1123A79DF1B5CF68BB19C063D6C92135870` | Verified               |

## 2026-09-17 local shooter packaging

Jobe authorized a new Moonlight Munch Run slice (parent plan42). Only this
canonical original was rebuilt and repackaged: generated comic terrain/atlas,
automatic food fire, 2D movement, pickups, persistent upgrades, supplies/restock,
authored waves/bosses and special serving. MIT source adaptations and notice are
embedded in its offline HTML. Exact current hashes/bytes live in the origin
manifest. The menu remains thirteen standalone previews plus integrated Wishbone.
The application does not import Moonlight saves/rewards or run its model.
Hosted private version two remains unchanged; these bytes are local only.

Canonical Moonlight source implementation: Mabuhay commit478da9a, final
verification/provenance checkpoint5319eed. Read the experiment's current
requirements, source-adaptation, COMIC-PROVENANCE and verification Markdown.
Other standalone hashes were compared with the previous origin manifest;
only moonlight-munch-run/index.html changed. No publication or remote push.

## 2026-09-17 challenge/frame refresh

Parent plan43 is implemented in canonical Mabuhay commit
f7ee31e7e104243f8c18ee6ca98273d727a61558. Exact standalone snapshot now includes
avoid-only potholes/spore pods, one-second firing interruption, harder waves and
bosses, offscreen feeding exclusion and generated actor-frame animation.
Read the original FRAME-AND-HAZARD-PROVENANCE and dated verification alongside
requirements. Artifact9742784 bytes, SHA-256
E6C7B2C330679738A8E11D133B384DB94C2E8D2B1AA55C4D9EDB39CD8521A6F2.
Previous origin manifest compared: only Moonlight changed. Thirteen previews,
nineteen exact files; separate saves and Site unchanged. Keep local.
