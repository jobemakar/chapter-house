# Arctic Duet TypeScript port plan

Completed 2026-09-19. The stable BOB-004-ALT1 experiment is promoted to the repository root as `arctic-duet`.

1. Preserve Midnight Snow Jam 0.1.0 in `archive/midnight-snow-jam-v0.1.0`, including original generated outputs and its independent save key.
2. Make `src/arctic-duet/` the authored source. Compile `core.ts`, `audio.ts`, `render.ts`, and `game.ts` with pinned TypeScript 5.9.3 and strict/no-implicit-any/no-unchecked-index settings.
3. Keep the existing authored gameplay contract: 78 BPM, a four-beat count-in, seamless 32-beat levels, level-8 difficulty cap, two screen halves, keyboard/mouse controls, one-hand assist, mute, gentle pace, reduced motion, pauses and silent audio fallback.
4. Keep `arctic-duet-v1` independent and validate it. Add only new `duet-*` keepsake IDs awarded idempotently from its `total` field.
5. Publish generated canonical `dist/index.html` and offline `playable/Arctic-Duet.html`; retain `dist/duet.html` only as a byte-identical alias.
6. Verify reproducible compilation/build and test compiled implementation. Browser/device/audio listening remain human QA.
