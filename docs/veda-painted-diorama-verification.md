# Veda's Great Escape — painted-diorama implementation verification

Date: 2026-09-22  
Scope: local Phase 4 receipt for [plan 56](../../plans/56-veda-painted-diorama-migration.md)  
Package revision: `@chapter-house/game-vedas-great-escape` 1.1.0  
Publication: none

## Compatibility boundary

The migration is presentation and lifecycle work only. `WIDTH = 9`, `HEIGHT =
7`, all five level maps, solver rules, `veda-great-escape.v1`, progress version
1, `vedas-great-escape:leafy-bench`,
`vedas-great-escape:elephant-fountain`, and the two/five completion thresholds
are unchanged. No new durable field or transient visual state is persisted.
The version bump is a compatible minor package/catalog revision (`1.0.0` →
`1.1.0`), not a save-format migration.

## Exact automated commands and results

Commands were run from the indicated directories on Node 24 / npm workspace
dependencies:

```text
cd application/packages/game-vedas-great-escape
npm run check
```

Result: PASS. `tsc --noEmit`; `tsx --test tests/*.test.ts`; 36 tests passed,
0 failed; `vite build` emitted all five runtime atlases and sanctuary art.
The package build included `veda-idle-atlas`, `veda-push-atlas`,
`veda-object-atlas`, `veda-walk-atlas`, `veda-environment-atlas`, and
`sanctuary.png`.

```text
cd application
npm run typecheck
npm test
npm run build
```

Result: PASS. Root strict typecheck passed; 150 tests passed, 0 failed; root
production build passed. Vite printed the existing `path`/`fs` externalization
advisory from `liquidfun-wasm` and the existing large-chunk advisory; neither
was a Veda failure.

Preview verification was also run against the local root Vite server:

```text
cd application
npx vite --host 127.0.0.1 --port 5191 --strictPort
npm run verify:previews
```

Result: PASS, `Verified 0 previews / 0 files ... unknown route 404.` The
current menu has no legacy preview entries, so this is intentionally a zero-file
check. A known harness issue remains documented in [plan 55](../../plans/55-wishbone-twenty-level-expansion.md): when this check is pointed at a
Vite SPA fallback rather than the byte-serving preview server, the unknown path
returns 200 instead of 404. That known fallback behavior is not an asset,
Veda, or save failure and was not reproduced by the dedicated 5191 verification
server.

## Art, loading and audio evidence

The package tests decode the PNGs, assert dimensions, alpha gutters, content,
frame uniqueness, direction coverage, anchor tolerances, terrain uniqueness,
repeat-boundary gradients and retained inspection-sheet hashes. The exact
runtime hashes, retained raw inputs and ImageGen prompts are in
[asset-provenance.md](concepts/vedas-great-escape/asset-provenance.md).
The production build output contained every referenced local asset; no remote
runtime asset or iframe is used.

The audio implementation is procedural Web Audio, not a remote recording. It
uses named semantic cues for footsteps, push, blocked movement, closed/open
gate, switch, peach, undo, hint, level start and completion, plus sparse
sanctuary ambience. The package audio tests passed lifecycle, mute, suspend,
resume, delayed-cue, node cleanup, retry and unsupported-WebAudio cases. Audio
event counters and snapshots were inspected through tests; I did not claim to
have subjectively listened to the cues on speakers or headphones.

## Browser smoke

The standalone Vite target was opened at `http://127.0.0.1:5201/`. The visible
browser run confirmed local artwork loaded (terrain, wall, foliage, Veda,
crate, switch, peach and gate), with no emoji board pieces. The following
interaction sequence was completed:

1. Arrow-key walking moved Veda and pushed the crate onto its switch.
2. The closed gate changed to open; the closed-exit attempt produced the
   recoverable route message rather than damaging progress.
3. A route around the crate reached the exit and showed the completion dialog
   (`7 moves`, `0 peaches`) with Next adventure and Keep exploring controls.
4. Hint, undo, restart and Sound off → Sound on were exercised. The accessibility
   tree retained the board description, level controls and recovery buttons.

Standalone browser visual inspection and direct console capture were completed
at each requested target size. No saved screenshot files are claimed.

| Target viewport | Actual rendered board | Final visual/console result |
| --- | ---: | --- |
| 1280×800 desktop | 732×569.33 | 9:7; no message overlap/root overflow; visible controls ≥44×44; no Veda runtime exceptions/errors; one benign `/favicon.ico` 404 |
| 390×844 portrait | 324×252 | 9:7; no message overlap/root overflow; visible controls ≥44×44; no Veda runtime exceptions/errors; one benign `/favicon.ico` 404 |
| 844×390 landscape | 470×365.55 | 9:7; no message overlap/root overflow; visible controls ≥44×44; no Veda runtime exceptions/errors; one benign `/favicon.ico` 404 |
| 768×1024 tablet | 627×487.66 | 9:7; no message overlap/root overflow; visible controls ≥44×44; no Veda runtime exceptions/errors; one benign `/favicon.ico` 404 |

These are the actual final Chrome measurements, not synthetic renderer or unit
test slots. The board preserves the authored ratio (`board height = width ×
7 / 9`) at every inspected viewport.

The Chapter House browser target at `http://127.0.0.1:5190/` reached its real
host fallback: “This view needs WebGL. Try reopening it in an up-to-date browser
with graphics acceleration enabled.” Because that is a genuine host limitation,
the integrated Veda launch, in-host pause/mute lifecycle and in-host completion
could not be truthfully claimed from this browser. The package's standalone
content and the faithful 9:7 integrated fit contracts were verified instead.

The standalone direct console capture at all four target sizes contained no Veda
runtime exceptions or errors; each capture did contain one benign 404 for the
missing `/favicon.ico`. The integrated console could not be meaningfully
exercised because the host stopped at its WebGL-required fallback described
above.

## Unverified checks and disposition

- Physical phone/iPad/touchscreen use was not performed.
- Subjective audio listening was not performed; audio state instrumentation and
  lifecycle tests are the evidence boundary.
- Real WebGL integrated-host launch was blocked by the browser environment.
- No hosted output, Site identity, save data, reward IDs, unrelated Wishbone or
  Keyfall work, or source-repository history was changed by this Phase 4 record.
