# Game migration source baselines

Captured before the workspace-package batches on 2026-09-19. The book
repositories intentionally contain pre-existing uncommitted canonicalization,
TypeScript-port, art, and verification work. Migrations copy from these working
trees and must not edit, clean, reset, or commit them.

| Source repository | HEAD | Pre-existing status entries | Intended package |
| --- | --- | ---: | --- |
| `../wish` | `dd3f939` | 6 | Wishbone history only; active source begins in `application/src/games/wishbone` |
| `../wildfire` | `28b2c41` | 23 | `game-dig-and-douse` (pilot complete) |
| `../the-mystery-of-locked-rooms` | `d1261fd` | 51 | `game-pocket-funhouse` |
| `../the-very-very-far-north` | `de1a7fe` | 20 | `game-arctic-duet` |
| `../not-if-i-can-help-it` | `0704e7b` | 26 | `game-gummy-nook` |
| `../popcorn` | `167b852` | 58 | `game-contraption` |
| `../the-miscalculations-of-lightning-girl` | `11d3992` | 19 | `game-stormglide` |
| `../amari-and-the-night-brothers` | `69e3fe8` | 9 | `game-bureau-after-dark` |
| `../mabuhay` | `f7ee31e` | 124 | `game-moonlight-munch-run` |

The counts are evidence of the starting state, not a cleanliness target. After
each migration, compare repository status against this baseline and investigate
any new path before accepting the package.

The Elephant repository has no implemented canonical runtime to copy. The
current Veda preview came from a separate JavaScript study and is excluded from
mechanical package migration until the production choice is resolved.

## Veda addendum — 2026-09-19

Jobe subsequently selected Veda's Great Escape as canonical. The preserved
preview snapshot was ported rather than mechanically copied: `game.js` SHA-256
`6A0E5588B471CE016D95F50D773F1179F8AC5F57ED3A38D9E5AEFA56B9373B3B`,
`style.css` SHA-256
`FD746A6AD5E05F4C8DD24C7426B3FA1ED6FF7722906BADB4959BFD0B55FDE780`, and
`sanctuary.png` SHA-256
`DDD04D4928B5719D38FFCF6F452F2A5419E22595ADC4D877C8EECF81090E3945`.
The image was copied byte-for-byte; gameplay and presentation were rewritten in
strict TypeScript with package lifecycle/progress boundaries. The original
preview provenance remains recorded in `docs/preview-sources.md` and was not
rewritten as package provenance.
