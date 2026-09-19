# Stormglide TypeScript port

Date: 2026-09-19 · Local version 0.3.0 · No publication

## Goal

Port the editable Stormglide gameplay source to TypeScript without changing its
endless, forgiving flight loop, public Site identity, assets, or the compatible
`stormglide-v1` durable-progress contract.

## Design

`ProgressStore` validates and writes durable preferences/collection progress;
`StormModel` owns the live player, entities, particles, followers, float text,
history, and fixed-step clock; `InputController` owns pointer identity/surface
and steering vectors; `StormAudio` owns the live Web Audio graph; and
`StormRenderer` owns the live canvas/backdrop cache. `StormGame` composes them
and supplies each animation-frame delta. The existing tuned simulation, canvas
treatment, and control event order remain behaviorally stable.

The compiler writes `.build/game.js`; the reproducible build inlines that
compiled production code in the hosted and offline artifacts. `.build/` is a
generated intermediate and is not authored source.

## Compatibility and limits

Only `muted`, `music`, `gentle`, `trail`, `total`, `found`, and `best` are
persisted. Invalid JSON, invalid field values, unknown future fields, and denied
storage all fall back safely. Score, entities, player location, and followers
remain session-only. Browser/iPad visual feel and audio still require manual QA.
