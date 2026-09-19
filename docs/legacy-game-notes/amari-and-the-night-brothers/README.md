# Bureau After Dark

An unofficial mystery inspired by *Amari and the Night Brothers* by B. B. Alston. Revision **0.3.0**, two playable floors.

Tap neutral search spots and Amari walks around the shelves to investigate. Hidden sigils produce a pleasant chime and enchanted parchment. Tap or rub the silver writing into focus, answer its riddle, then tap the generated sigil to open your journal. Follow the three ordering clues at the archive to collect a permanent record and unlock the next floor. Each floor begins with an automatic walk out of the elevator.

- Floor 1: The Midnight Archive — Moon, Feather, Key; Night Garden case file.
- Floor 2: The Cabinet of Wonders — Star, Shell, Flame; Lanternwing cryptid record.
- Progress and mute are kept on this browser/device. If saving is unavailable, play continues for the current visit.
- The six sigils, riddles, rooms and records are original game inventions, not objects or puzzles claimed to occur in the book.

## Build and check

Requires Node.js only. This repository carries its own pinned TypeScript test and
build tooling; it does not read `../application/node_modules`. From this directory:

```powershell
npm ci
npm run check
```

Open `playable/Bureau-After-Dark.html` or serve it locally. It embeds six sigils,
two illustrated record cards, one transparent object atlas and one floor texture;
optional Google Fonts have system fallbacks. `src/domain.ts` owns levels, saves
and navigation; `src/game.ts` owns interactions; `src/world-art.ts` owns atlas
rendering; `src/reward-cards.ts` and its stylesheet own record presentation.
The build type-checks the assembled runtime before emitting HTML.

Generated PNG originals remain in assets. Delivery WebPs are tracked and can be
re-encoded with `node tools/encode-art.cjs PATH_TO_SHARP_PACKAGE` (or use locally
installed sharp with no path argument). This is format/quality encoding only,
quality 90, with no resize or crop; the original transparent atlas stays PNG.

The generated playable identity and size are unchanged. Its browser saves remain
separate from integrated Chapter House gameplay: progress uses
`bureau-after-dark:progress:v2` and mute uses `bureau-after-dark:muted`.

[Current requirements](plans/requirements.md) · [Asset provenance](assets/PROVENANCE.md) · [Original stealth pitch](plans/pitch.md) · [Changelog](CHANGELOG.md)

The September 13 single-room prototype is preserved in `archive/bureau-after-dark-v1.html`. The September 10 disguise/stealth pitch is historical; the user explicitly selected this riddle-based revision on September 17. The September 19 work is a tooling migration only, not a source port or gameplay revision.
