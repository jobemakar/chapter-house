# TypeScript port — 2026-09-19

## Scope

Port the canonical Pocket Funhouse demo, rather than wrapping its former JavaScript. Preserve all twelve paths, exact `pocket-funhouse-v1` room/solved/mute/12-rotation/gate format, input behavior, artwork, synthesized sound, optional read-only status tool and delayed visual celebration.

## Composition

1. `core.ts` owns readonly level definitions plus trace, rotate, nudge and defensive progress loading.
2. `support.ts` owns the storage boundary, original Web Audio music box, and optional status registration.
3. `game.ts` composes `GameController` and `CanvasRenderer`; the controller owns DOM/input/frame lifecycle and immediate durable awards while the renderer owns canvas drawing.
4. `tsc` emits CommonJS production modules into `.build/`. The build script embeds those modules with a tiny local loader in both output variants, so tests and browser output exercise the same compiled game code.

## Guardrails

- `strict`, checked indexing and exact optionals are enabled. No `@ts-ignore`, `@ts-nocheck` or loose `any` is permitted.
- Build/test scripts may stay JavaScript; authored active gameplay may not.
- Luminous Locks is a pre-existing authorized removal and is outside this port. Door Atelier remains archived/rejected and untouched.

## Verification sequence

Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, then repeat the sequence and compare the two built HTML artifacts. Browser/device touch layout and audio listening remain manual QA.
