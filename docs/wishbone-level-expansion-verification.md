# Wishbone Fling twenty-level expansion verification — 2026-09-21

Parent scope: `../../plans/55-wishbone-twenty-level-expansion.md`. The local
Wishbone catalog now contains 28 yards: the original eight unchanged, followed
by twenty appended yards at indices 8–27. Stable old IDs and indices, browser
local saves, checkpoints and rewards remain unchanged. The delivered additions
include two wide yards and focused lever, spring-pad and magnet mechanisms. No
publication was performed.

## Automated evidence

- Targeted Wishbone checks: 41/41 passed.
- Full `npm test`: 150/150 passed.
- TypeScript typecheck passed.
- Production build passed.
- Final reviewer reported no findings.
- Anti-pattern audit passed.
- `verify:previews` ran against a preview server and failed only its existing
  unknown-route expectation: it received the Vite SPA fallback status 200
  instead of 404. This was not an asset or Wishbone failure.

## Served-browser evidence

The served browser review covered the default desktop viewport and a 390×844
portrait viewport. All 28 entries were exposed, the picker was scrollable, and
the `Grand Garden` and `Spring Clean` yards rendered. In portrait, the wide-yard
overview remains visually compressed, consistent with the existing `Long Walk
Home` behavior.

Physical-device and audio testing were not performed. The local development
console showed pre-existing ResizeObserver loop warnings during hot reload; the
reviewed tab had no page console errors.

## Publication boundary

This is a local implementation and verification receipt only. The owner-private
Site and other hosted outputs were not updated.
