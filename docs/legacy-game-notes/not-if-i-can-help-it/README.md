# Gummy Nook

## TypeScript production build

The active gameplay source is `src/game.ts`: strict TypeScript classes for the
board engine, save store/codec, SVG art, renderer, audio, motion queue and
controller. `dist/index.html` and `playable/Gummy-Nook.html` are generated
self-contained outputs; the former gameplay JavaScript files were removed.

Use Node 20+:

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Tests run against the compiled production export in `build/game.js`. Browser,
physical-device, and listening verification remain manual follow-ups.

Local 0.5.0: a cozy, touch-first match-3 game loosely inspired by Not If I Can Help It.

Open playable/Gummy-Nook.html or serve dist/index.html. Swipe between any touching gummies, including diagonals, or tap two neighboring cells. Match three or more in a row/column; pieces clear, fall and refill into cascades. Nonmatching swaps return gently. Hint, Mix and Undo are free. No timer or game over.

Original candy art, fast eased motion, synthesized music/effects and saved comfort settings. Four keepsakes decorate the cozy corner. Prior earned items migrate automatically at the same browser origin; the old save remains untouched.

Build: npm run build after npm ci installs the pinned TypeScript compiler. Core checks: npm test. Browser checks: tests/browser.cjs and tests/motion.cjs against 127.0.0.1:8787, with PLAYWRIGHT_MODULE configured as needed and GUMMY_TEST_OUTPUT set to a screenshot directory. The generated runtime has no third-party dependency.

Source: src/. Current design: plans/match3-design.md. Requirements, history, provenance and verification: plans/. Earlier merge game preserved at Git tag gummy-nook-before-match3. Physical iPad and family playtesting remain pending. No public deployment.

Powerups arrive during refills: ↔ clears a row, ↕ clears a column, ✹ clears a 3×3 patch. Swap a marked gummy with any neighbor or include it in a match to activate. Cascade sounds build in pitch and harmony.

❄ Frost Flake freezes both diagonals through its cell, then shatters them. Row/column powers shoot glowing streaks; Sugar Burst throws a shock ring and candy sparks.
