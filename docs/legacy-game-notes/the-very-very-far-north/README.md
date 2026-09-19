# Arctic Duet

Arctic Duet 0.1.0 is the canonical BOB-004-ALT1 playable for *The Very, Very Far North*. Duane and Major Puff each move within a fixed screen half to catch original musical snacks. The beat runs continuously through gentle, increasingly lively 32-beat levels; catches add points and misses only make a snow splash.

## Play and build

- Run `npm ci`, then `npm run build`; open `dist/index.html` through `npm start` at `http://127.0.0.1:4323`.
- Open `playable/Arctic-Duet.html` offline. `dist/duet.html` is a byte-identical compatibility alias.
- Run `npm run typecheck`, `npm test`, and `npm run diff-check`. Tests execute the compiled strict-TypeScript implementation.

Use one or two touches: a touch owns the screen half where it started until release/cancel. A mouse works the same way. A/D control Duane; left/right arrows control Major Puff. One hand makes the other friend follow the next snack unless a real touch owns that half. Pause/resume, mute, Gentle pace and Less motion remain available. Visibility pauses play; silent fallback is playable.

## Saving and keepsakes

`arctic-duet-v1` is the only active save. It validates local total catches, best level, mute, gentle pace, one-hand assist, reduced motion, and owned keepsakes. A fresh visit begins at level 1. Keepsakes are small original floor/wall forms awarded idempotently from Arctic Duet's own lifetime catch total: Duet Snow Cushion, Puffin Window Star, Aurora Wool Rug, and Together Pennant. They do not read, import, rename, or share `midnight-snow-jam-v1` or any Snow Jam reward IDs.

## Archive

Midnight Snow Jam v0.1.0 is preserved at `archive/midnight-snow-jam-v0.1.0`. Its save remains `midnight-snow-jam-v1`; archived generated `dist/index.html` and `playable/Midnight-Snow-Jam.html` retain their original SHA-256 bytes. It is not an active route or build target.

## Scope and attribution

The Arctic friends are based on the publisher-described book premise. The duet mechanic, original canvas art, synthesized accompaniment, snacks and keepsakes are new inventions; no story scene, book illustration, Duet Cats artwork, recording, or melody is reproduced. Font licenses are local under `assets/` and embedded in standalone output. See `plans/requirements.md`, `plans/arctic-duet-typescript-port.md`, and `plans/verification.md`.

Physical iPad multi-touch latency, audio mix listening, and broader family playtesting still need human QA. Nothing has been published.
