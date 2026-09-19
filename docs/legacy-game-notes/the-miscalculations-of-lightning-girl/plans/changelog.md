# Stormglide change log

## 2026-09-19 — TypeScript/OOP source port (0.3.0, local only)
Stormglide's authored gameplay entry is now `src/game.ts`. Added typed
ProgressStore, StormModel, InputController, StormAudio, StormRenderer, and
StormGame composition boundaries; build compilation; a pinned TypeScript lockfile
entry; strict typecheck/check commands; and compiled-production save tests. The
endless simulation, assets, Site ID, public URL, localStorage key/fields, and
touch/audio behavior are retained. No publication occurred. Browser/iPad visual,
input-feel, and audio listening QA remain pending.

## 2026-09-10 — iPad touch-first revision (0.2.0, local only)
User requested iPad play with no keyboard assumed. Added relative thumb steering, a visible pad, two-thumb dash, immediate lift-to-stop, interruption/rotation cleanup, larger touch targets, safe-area layout, and cached background rendering. Keyboard/mouse remain supported. Source and both playables rebuilt. Event and long-flight simulations passed; physical iPad playtesting remains outstanding. No public deployment, backend, multiplayer, or meta-game implementation. See touch-design.md and touch-verification.md.

## 2026-09-10 — Local source organization (0.1.1, not republished)
Reason: Jobe requested a durable ten-book collection workspace, logged ideas, requirements-led generation, and editable game source.

- Established the canonical book folder under `Desktop/codex/interactive/battle-of-books/`.
- Preserved the original Git history and Sites project identity.
- Extracted readable source into HTML, CSS, and JavaScript; extracted embedded fonts into local assets.
- Added a dependency-free build that recreates the hosted release and single-file offline playable.
- Added local preview tooling, pinned formatting tooling, and the existing behavioral simulation.
- Recorded the retrospective requirements/design baseline, shared mechanic registry, asset provenance, stable catalog metadata, and persistent project rules.
- No intended gameplay, save-schema, or public-site behavior change.
- Verification: source/asset/build validation and behavioral simulation; detailed migration verification recorded in `verification.md`.

## 2026-09-10 — Public access enabled
Jobe explicitly requested a publicly available site. Existing Site access changed from owner-private to public. Same game and URL.

## 2026-09-10 — Original playable release (0.1.0)
- Created cloud steering, spark trails, rings, forgiving hazards, dash, powers, dog companions, six chapter palettes, and timed events.
- Added original synthesized music/effects, pause, mute, motion preferences, and local collection saving.
- Created the original sky art and standalone HTML.
- Published Sites version 1 from source commit `7934b664f3863c7442f1f0357de21102933047ae`.
- Original verification: syntax/assets and a simulated flight of more than 7.5 minutes. No actual browser playtest or audio listening was performed.
