# Willowbrook stream activities verification

2026-09-15

## Implemented

- Added a world-anchored action bubble that follows the avatar. It offers Dig on walkable town ground, adds Fish only within a clear stream-bank zone, and becomes a persistent Reel prompt after the lure settles.
- Added a deterministic activity state machine. Fishing resolves its 30 percent catch chance only on Reel and never expires while waiting. Digging has a forgiving 60 percent discovery chance and leaves only a short-lived procedural mound/hole treatment.
- Added procedural held-tool poses, rod, reel, fishing line, lure ripple, shovel and soil treatment. Walking pauses during an activity; the companion remains free to settle beside the avatar.
- Added six fish and eight finds across common, uncommon and rare tiers. Duplicate discoveries stack as counts in an additive version-1 profile field. Existing saves receive empty collection maps without changing their other progress.
- Added one Collection panel with Fish and Finds sections. Locked entries show silhouettes and rarity text; found entries show name and count. Fish cards use six packaged 128×128 Kenney Fish Pack sprites.
- Added cartoony procedural prompt, cast, plop/ripple, reel, miss, catch, dig and rarity cues. They use the existing town audio lifecycle and stop when muted, hidden, inactive or disposed.
- Replaced the single-pointer camera handlers in both town and clubhouse with a shared pointer gesture recognizer. Two-finger pinch is midpoint-anchored, clamped and cannot become a tap, pan or walk. Mouse/touch drag, wheel and explicit zoom controls remain.
- The narrow-screen clubhouse starts at 1.18 zoom so the room reads larger before user input. Town mobile controls hide the redundant fountain shortcut to preserve room for Collection and zoom controls.

## Assets and provenance

The shipped fish art is an unmodified subset of Kenney Fish Pack 2.0 under CC0. Six 128×128 Double PNGs and the source license are stored under `public/assets/collections/fish/`. Exact source URL and local paths are recorded in `docs/provenance.md`. Rod, shovel, line, ripples and soil are original procedural geometry; the audited Kenney 3D packs had no suitable standalone held fishing rod.

## Automated validation

- `npm test`: 80 passing tests. New coverage includes stable catalogs and rarity reachability, deterministic 60/30 percent thresholds, the non-expiring Reel state, rejected state transitions, stream-only bank eligibility, bridge exclusion, profile stacking/migration and malformed-ID rejection, pointer tap/pan/pinch cancellation, and activity-audio scheduling/lifecycle.
- `npm run build`: TypeScript and Vite production build passed. Vite retains the existing large-chunk advisory (about 895 kB before gzip); this is not a performance measurement.
- `git diff --check`: passed. Git only reported the repository's expected LF-to-CRLF checkout notices.

## Served-browser review

- Desktop 1280×720: selected a starter, entered Willowbrook, verified the Dig bubble follows the avatar, inspected the held shovel and temporary soil, walked around the fountain to a clear stream bank, confirmed Fish appears there beside Dig, cast into the water, inspected the held rod/line/ripple, left Reel waiting, reeled to a harmless miss, and opened the two-section silhouette Collection panel.
- Mobile 390×844 with real Chrome DevTools touch events: Willowbrook retained its header, compact controls, avatar-following Dig bubble and bottom actions. A two-finger spread changed town zoom from 0.80 to 1.28 and `walking` remained false.
- Mobile clubhouse: initial zoom was 1.18. The same two-touch spread reached the 1.55 clamp; the midpoint anchor correction changed pan by less than 0.006 world units on either axis. The closer room, top controls, action buttons and six-item dock remained visible and reachable.
- The procedural held-tool treatment reads at both desktop and zoomed mobile scale, but remains the explicitly agreed visual trial for Jobe's review.

## Limits

No physical phone or tablet was used, so finger feel and speaker loudness remain family-device checks. Audio behavior was verified through deterministic fake Web Audio scheduling rather than an acoustic measurement. The random browser playthrough produced an empty fishing result; caught-fish persistence and every rarity boundary are covered deterministically by tests. No account, Firebase, multiplayer, 3D Connect Four, or publication work was performed.
