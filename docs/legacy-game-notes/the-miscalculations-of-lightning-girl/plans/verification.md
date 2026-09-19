# Migration verification

## TypeScript port verification — 2026-09-19

- Two clean `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` passes completed. The TypeScript compiler uses `strict: true` without relaxed `noImplicitAny` or `strictNullChecks` overrides.
- Tests run against the compiled script embedded in `dist/index.html`, including valid normalized saves, malformed JSON, future fields, and storage-denied writes, plus the established deterministic collision, bounded-flight, and pointer-input coverage.
- Hosted and standalone artifacts are generated from the same compiled TypeScript output. Physical browser/iPad layout, real audio, and cross-reload localStorage QA remain manual checks.

Date: 2026-09-10

- Original and reorganized game JavaScript are identical after applying the same formatter. No gameplay logic changed.
- Original sky PNG and all six font files match their original bytes.
- Two successive builds produced identical hashes for hosted HTML, sky PNG, and standalone HTML.
- Hosted and standalone outputs include font license notices; the standalone embeds its sky and fonts.
- Catalog and per-game manifest paths exist and agree on the game ID. All local Markdown links checked successfully.
- The existing 7.5-minute behavioral simulation passed at desktop 1280×800, portrait 390×844, and landscape 844×390 viewport dimensions. This validates simulation bounds and behavior with mocked APIs, not real-device rendering or touch.
- No actual browser playtesting, UI screenshots, audio listening, or cross-reload save test was performed. The optional page tool was tested only in a simulated context.
- This is a local maintainability revision. No new Site version was saved or deployed.
