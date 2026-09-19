# Game shell and action feedback verification

Date: 2026-09-19
Scope: Local only

## Automated verification

- `npm run build` — passed (TypeScript and Vite production build).
- `npm test` — passed, 104/104 checks.
- `npm run verify:previews` — passed, 13 previews / 19 files with exact source, production, served bytes, MIME, and 404 behavior.

## Browser verification

Verified against `http://127.0.0.1:5191/` in the Codex in-app browser.

- Desktop Wishbone entry presented `game-exit` on the left and retained the identity, wallet, and utilities groups on the right; the brand and destination navigation were hidden.
- Desktop game top bar measured 64px and the game host used matching 64px top padding.
- At a 390×844 viewport, Exit game, name, wallet, and utilities all remained visible with a 58px bar and matching game padding. Their measured bounds stayed within x=10–380 of the 390px viewport with no header overflow.
- Exit game returned to the clubhouse, restored the eleven normal top-bar buttons, and restored the room surface.
- The Pets and Call pet controls expose different SVG paths while retaining `Pets` and `Call pet` accessible names.
- The enabled-button hover rule is present in the loaded stylesheet, and visual checks covered shell/action controls.
- Wave and Jump were activated in the clubhouse and showed their avatar animations without reaction bubbles.
- Browser console warning/error query returned no entries.

## Notes

- No save schema, item IDs, reward logic, or published build changed.
- Physical phone/tablet testing and audio listening remain outside this browser verification.
