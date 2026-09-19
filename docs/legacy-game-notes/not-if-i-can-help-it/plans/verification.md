# Verification — 2026-09-13

## 0.5.0 TypeScript port — 2026-09-19

- `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` pass against
  pinned TypeScript 5.8.3. The suite executes `build/game.js`, the compiled
  production export, not a source duplicate.
- Six production tests cover stable/playable board generation, diagonal and
  rejected swaps, a 250-turn cascade simulation, compatible 0–4/10–29
  encodings and four-power chains, gravity/mix/restore, idempotent v1→v2
  migration, malformed/future fields, and committed-state interruption behavior.
- The built outputs remain self-contained. Pending manual QA: browser
  interactions/animations, physical iPad Safari, and listening to audio.

- Seven Node tests passed: opening three-stage cascade, rejected supply placement, full-board swap/scoop recovery, maximum-form preservation, adjacency boundaries, corrupt-save validation and all-form/reward reachability.
- Automated Edge browser checks passed using real DOM input: tap selection, pointer drag, touch drag via browser touch emulation, merge cascade, undo retaining ownership, scoop/undo, save/reload, pause/resume, persisted comfort/mute settings and keyboard supply placement.
- Viewports: desktop 1366×950, iPad landscape 1024×768, iPad portrait 768×1024 and phone 390×844. No horizontal overflow; all tray cells at least 44×44 pixels. No JavaScript or browser console errors.
- Visually inspected desktop, phone and iPad landscape screenshots. Tightened landscape spacing so the full tray and Undo/Scoop controls remain visible. Corrected opening adjacency discovered by the initial failing test. All affected checks rerun successfully.
- Reproducible build produces identical self-contained HTML at dist/index.html and playable/Gummy-Nook.html.
- Limitations: touch is emulated, not physical iPad Safari. Audio synthesis/control behavior was exercised but not listened to. Sustained child playtesting remains pending. Clubhouse placement is metadata and a decorative ownership shelf only.

Run `npm test`, `npm run build`. Browser suite: serve dist/index.html on 127.0.0.1:8787, set PLAYWRIGHT_MODULE to an installed Playwright package and GUMMY_TEST_OUTPUT to a screenshot directory, then `node tests/browser.cjs`. The core game and build have no third-party dependencies.

## 0.1.1 verification
Existing browser/touch/save acceptance checks pass with animation-aware waits. tests/motion.cjs passes two-way swap flights, visible intermediate merge tiers, sequential cascades, cancellation through undo/pause and reduced-motion bypass. Inspected a swap screenshot. Initial motion-test timing used a mocked clock that does not advance Web Animations; switched this test to real browser animation time. Physical iPad and audio listening remain unverified.


## 0.2.0 verification — 2026-09-13
Eight core tests passed: stable/full/playable generation, intersecting runs, adjacency, rejected swap preservation, gravity, 250 complete turns including cascades, v1 migration and v2/corrupt-save recovery. Browser acceptance passed at 1366×950, 1024×768, 768×1024 and 390×844 with tap/swipe match resolution, invalid swaps, animated refill, undo, hint, mix, persistence, keyboard, settings and pause. All cells at least 44×44; no horizontal overflow or console/page errors. Standalone-file v1 migration preserved the original key and ownership. Dedicated motion checks passed swap/refill flights, undo/pause interruption and reduced motion. Inspected landscape-iPad, phone and in-progress refill screenshots. Physical iPad Safari and audio listening remain unverified.

## 0.3.0 verification
13 core/audio-recipe tests pass, including 250 complete turns, eight-way adjacency, scheduled delivery, all three power effects, chained expansion, underlying-color matching, gravity/mix/save preservation and bounded rising sound recipes. Existing four-layout browser/touch/save/migration suite and motion-interruption suite pass. Dedicated feedback browser test passes diagonal touch input, actual audio-effect dispatch, retained finished flights while later arrivals are moving, persistent stationary SVG identity, and visible activation of all three powers. Inspected the iPad powerup screenshot. No physical-iPad or audio-listening claim.

## 0.4.0 verification
14 core tests passed, including fourth-power delivery, full X coverage, chaining, mix/save persistence and 250 complete turns. Existing browser gameplay/touch/save suite passed on four layouts. New tests/overlays.cjs passed row/column projectile overlays, radial burst, frost coverage/hold/shards, settled cleanup, pause and undo during freeze, and reduced-motion bypass. Inspected row and frost screenshots. Shard verification uses a mutation observer so a screenshot delay cannot miss a brief effect. Physical iPad and audio listening remain unverified.

## 0.4.1 verification
Overlay suite passes four distinct effects, frost/shards, cleanup, pause/undo cancellation and reduced motion. Mid-effect screenshot inspection uses paused real Web Animations to avoid missing brief effects. New tests/sounds.cjs renders all five custom cues using OfflineAudioContext; each waveform is nonzero and distinct, measured individual peaks below 0.15, muted and cancelled output exactly zero. This verifies synthesis and control behavior, not physical listening or device speakers.

## 0.4.2 — 2026-09-13
User experiment: tray, rim and light tile wells gradually blend mint → sky blue → lavender → rose → apricot → mint. One color chapter per 120 cumulative clears, continuous RGB interpolation, six-second CSS easing on progress updates. Candy art/colors and game rules unchanged. No new save fields; palette resumes from saved cleared count. Reduced motion disables easing. Browser smoke check passed five distinct colors, cycle wrap, duration, unchanged board/SVG identity and reduced-motion handling; inspected lavender iPad screenshot.
