# Revision 0.3.0 validation — 2026-09-17

## Toolchain migration validation — 2026-09-19

Run `npm ci` followed by `npm run check` from this directory. The check typechecks
the strict source and tests, executes the domain/art tests, then rebuilds the
same self-contained playable without a sibling application dependency. This does
not replace browser interaction, visual, physical-device or audio-listening QA;
those remain pending when a new browser/device pass is requested.

On 2026-09-19, a clean `npm ci` and `npm run check` passed: three test entries
(domain plus two art assertions), strict typechecking and the self-contained
two-floor build. Rebuilding preserved the 17,708,631-byte playable with SHA-256
`9DE4FDBD06EE512FE8922A6052F318F1B7A05DC1FB24F5E684C45D01EA14AD22`.
No browser/device/audio pass or publication was performed for this tooling-only
migration.

Illustrated visual pass: strict source and assembled TypeScript builds pass; two new artwork/card tests and the existing domain assertion suite pass (three Node test entries). Application tests pass 100/100; production build and exact preview packaging verification pass (13 previews, 19 files). Bureau's rebuilt artifact is 17,708,631 bytes, below the static asset limit. Original PNGs and complete generation prompts are retained; three full-resolution WebP derivatives reduce embedding cost.

Actual UI playthrough solved all six riddles and both seals, inspected both illustrated rewards and the two-record collection, then reloaded and reopened the saved collection. Map artwork and search-object states were reviewed. Phone-sized portrait 390×844 and landscape 844×390 checks showed no horizontal overflow; record notes are 14px HTML text and modal content scrolls vertically. Both reward images loaded. No captured browser warnings/errors; viewport override reset. This is browser viewport testing, not a physical phone or audio listening test. Domain/save formats, reward IDs, navigation and puzzle logic are unchanged.

## Earlier revision 0.2.0 checks

Strict TypeScript checks pass for source modules and the assembled runtime. Domain tests exercise every pair of spots/archive destinations on both floors, densely sampling collision-free routes, entry paths, invalid destinations, wrong/missing/duplicate sigil orders, locked floors, single reward claims, persistence/reload, malformed saves and inaccessible storage.

Browser playthrough completed all six riddles and both archive seals using the actual UI. Verified an empty spot, tap reveal, rubbing reveal, keyboard Enter reveal, wrong-answer retry, generated art/stardust reveal, automatic journal transition with matching small icons and clues, wrong-order retry, correct first reward/second-floor unlock, all second-floor rewards, phone layout at 390 × 844, and reload retaining both records. No console warnings/errors were reported. Viewport override was reset after testing.

Discovery and reward audio are original synthesized chimes triggered after a user gesture; mute is available and persisted. Auditory quality was not independently assessed by the automated browser check.

Application packaging is checked with its full test suite, production build and `verify:previews`, including exact source/production/served bytes, MIME and unknown-route 404. Standalone progress remains separate from Chapter House progress. Local-only revision.
