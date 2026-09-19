# Verification — 0.1.1

2026-09-19

## TypeScript-port verification

- Strict `tsc --noEmit` checks all authored gameplay TypeScript with `noUncheckedIndexedAccess`, exact optional property types and no suppression directives.
- Tests compile then import `.build/core.js`, and the VM browser harness executes the same emitted `core`, `support` and `game` modules that the build bundles.
- Twelve authored solutions, repeated-nudge completion, rotation/shutters, valid save preservation, malformed saves, ignored future fields, denied storage, navigation, pointer cancellation and pause are covered.
- Build emits a hosted asset-relative `dist/index.html` and a self-contained `playable/Pocket-Funhouse.html`; no network requests are introduced.
- Durable solve is still written immediately after route proof; chime/particles remain delayed until the spark’s visual route arrival, per 2026-09-16 phone feedback.

- 10 passing automated tests: see `tests/core.test.cjs`, `tests/interaction.test.cjs` and `tests/save-fixtures.test.cjs`.
- Pure game-rule checks plus Node VM simulated pointer/DOM/canvas callbacks. These are not a real browser or a device emulator.
- Every one of twelve authored paths solves; repeated free nudges finish every room. Rotation, reversible shutters, valid/malformed/forward-compatible save fixtures, navigation, single-pointer ownership/cancellation and pause verified.
- Saving denied by the browser does not block play.
- Generated assets visually inspected individually; no gameplay screenshots or DOM/browser interaction testing performed.
- Hosted output served with HTTP 200 at localhost 4321.
- Optional read-only WebMCP status handler checked using a simulated registration context; live browser support not verified.

## Remaining playtest work
Actual Safari/iPad touch comfort, rendered visual layout in portrait and landscape, frame rate, audio quality/volume, and subjective fun need user playtesting. No claim of physical-device validation is made.
