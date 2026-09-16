# Packaged preview sources

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
- Original source: `C:\Users\jmakar\Documents\Codex\2026-09-13\cre\outputs\bureau-after-dark.html`
- Original repository/source: generated task folder `C:\Users\jmakar\Documents\Codex\2026-09-13\cre`; no Git repository or source commit was present.
- Optional network request: the copied file has a CSS `@import` for Google Fonts (`Cormorant Garamond` and `DM Sans`). Its system-font fallbacks remain in the original file.

| Packaged file | Bytes | SHA-256 | Original-byte equality |
| --- | ---: | --- | --- |
| `index.html` | 24,778 | `5B50B930C1A1B62F1EA602B1DFE1EB2F8E942934FAA0F15951F397842AC8CA21` | Verified |

## Veda's Great Escape

- Preview entry: `application/preview-sources/vedas-great-escape/index.html`
- Display title: `Veda's Great Escape`
- Original source directory: `C:\Users\jmakar\Documents\Codex\2026-09-13\cre-2\dist`
- Original repository/source: `C:\Users\jmakar\Documents\Codex\2026-09-13\cre-2`, local Git commit `6917df22673d310b30fc095f9ae2e7e873c17771` (`Replace care simulation with Veda escape puzzles`, 2026-09-14 08:23:25 -04:00). No Git remote was configured.
- Required local files were copied exactly: `index.html` loads `style.css` and `game.js`; `style.css` loads `sanctuary.png`.
- Optional network request: `style.css` has a CSS `@import` for Google Fonts (`DM Sans` and `Manrope`).

| Packaged file | Bytes | SHA-256 | Original-byte equality |
| --- | ---: | --- | --- |
| `index.html` | 2,816 | `2C8B1ECA852F72508940A5522956CA57A649A6532F66C9B1AF1F7BC5E100B73D` | Verified |
| `style.css` | 6,070 | `4CA531AFA287A316ED14AFCA6A85B343C46BCFBBE0DB93A8C3A2C79F9FE220F5` | Verified |
| `game.js` | 9,578 | `48BC438767B6CEDFC8A3AD3215B8DBA6470A60BDEA4C755F2792487A6E338C28` | Verified |
| `sanctuary.png` | 3,021,448 | `DDD04D4928B5719D38FFCF6F452F2A5419E22595ADC4D877C8EECF81090E3945` | Verified |

## Little Lantern Keeper · Emberwatch

- Preview entry: `application/preview-sources/emberwatch/index.html`
- Display title: `Little Lantern Keeper · Emberwatch`
- Original source directory: `C:\Users\jmakar\Documents\Codex\2026-09-13\cr\dist`
- Original repository/source: `C:\Users\jmakar\Documents\Codex\2026-09-13\cr`, local Git commit `6f19fccaaffe5de80e0b64657215619d3d9e5e1d` (`Reimagine Emberwatch as a cozy lantern keeper demo`, 2026-09-13 22:42:03 -04:00). No Git remote was configured.
- Required local files were copied exactly: `index.html` loads `style.css` and `game.js`; `style.css` loads `clearing.png`.
- No external runtime requests were found. The font stack is local/system fonts and its icon is a data URI.

| Packaged file | Bytes | SHA-256 | Original-byte equality |
| --- | ---: | --- | --- |
| `index.html` | 3,068 | `2F00D8442E9987BD8C08C6B302693A3C194B0932D419ACBD044091A08F9CB30C` | Verified |
| `style.css` | 7,045 | `2A5BD10B2D4314FA78A63B640A67B613B95874DFD691F1D6D2B18B6C1D3C41FF` | Verified |
| `game.js` | 8,097 | `CFD67570D8F718055BC353C4CC808D43B6EB240D08576D02A96A5E6715EEAD8E` | Verified |
| `clearing.png` | 2,691,657 | `8F111393C489D21C7D889499F1C0E1123A79DF1B5CF68BB19C063D6C92135870` | Verified |
