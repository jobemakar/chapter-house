# Mobile walkthrough layout verification — 2026-09-21

Parent scope: `../../plans/53-mobile-walkthrough-layout-fixes.md`. This is the
local response to Jobe's physical-phone walkthrough and uploaded Bureau portrait
screenshot. No remote Site or standalone host was updated.

## Automated evidence

- Application: 124/124 tests pass; `npm run build` passes strict TypeScript and
  Vite production output. The existing large-chunk advisory remains.
- Gummy package check passes typecheck, progress/engine tests and build. New
  assertions prove negative virtual rows retain the destination column and stay
  above row zero.
- Arctic and Bureau package typechecks, tests and builds pass.
- `npm run verify:previews -- http://127.0.0.1:5192/` passes exact production/
  served-byte and unknown-route checks. It reports 0 previews / 0 files because
  all canonical games have left the legacy standalone preview shelf.
- `git diff --check` passes.

## Integrated browser evidence

Chromium-based in-app browser review used the built application, not individual
standalones:

- At 844×390 the Games panel occupies y=62–382; its content area is y=126–381
  and the first complete 218px game card is y=136–354.
- Arctic Duet has no document overflow. Its stage is 445×282 and the 126px right
  rail contains status plus three 44px option rows without overlap.
- Gummy Nook has no document overflow. Its 254×254 board is y=133–387, with
  vertical tools beside it and a 254px-tall internally scrollable nook.
- Bureau portrait at 390×844 renders all six hotspots as transparent, borderless
  54×54 targets. Archive/topbar overlap measures zero. At 844×390 the full
  356×253 board fits; Archive/topbar overlap remains zero. The clue-journal dialog
  is bounded to y=11–388 and scrolls internally when content exceeds its height.
- Browser diagnostics contained no warnings or errors. Temporary viewport
  overrides and local QA servers were closed after review.

Jobe supplied the original physical-device evidence. Final verification here is
viewport emulation, not a claim of a second physical-phone or audio-listening
session.
