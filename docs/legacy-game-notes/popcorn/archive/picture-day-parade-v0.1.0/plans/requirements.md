# Picture Day Parade requirements — 2026-09-12

Selected by Jobe's request to build the planned Popcorn game. Current direction: BOB-010-R2; preserve original stable game ID. Requirements recorded before implementation.

## Book anchor and scope
Verified: Andrew's school Picture Day is a central setup, and the novel uses humorous illustrated panels. Source: https://www.penguinrandomhouse.com/books/736977/popcorn-by-rob-harrell/ (checked 2026-09-12). The booth cast, gags, locations and rewards are original inventions. No novel characters or plots are reproduced. Anxiety is neither a joke nor a gameplay meter.

Mechanic signature: drag a camera crop, cue a repeatable gag, choose shutter timing, inspect/keep the resulting illustration, try a new composition. Stationary stage with moving subjects. Friction is funny alternate photos and unlimited reshoots; no life loss/reset. Discoveries depend on visible poses and composition. Distinct from all ten current loops as audited in ../plans/10-redesign-direction.md: no rhythm lanes, flight, route building, projectile destruction, merge board, cooking, stealth, habitat simulation or containment.

| ID | Requirement | Origin / acceptance |
| --- | --- | --- |
| PD-001 | A fully playable, touch-first illustrated camera game with no quizzes or player questions. | User/collection; all actions usable by pointer. |
| PD-002 | Move an actual crop frame by dragging; wide/close zoom; directional keyboard alternative. | Designer; saved photo matches crop. |
| PD-003 | Repeatable prop gags visibly alter pose; shutter timing and framing determine discoveries. | Plan; early/peak/late shots differ. |
| PD-004 | Three original scenes with three pictured-moment goals each; all scenes free to visit. | Designer expansion; no album economy or locks. |
| PD-005 | Unlimited shots, optional burst takes three successive captures and selects best; no forced restart. | Plan/designer; misses preserve all discoveries. |
| PD-006 | Inspect latest shot without blocking play, keep selected photos in an album and export a print PNG. | Plan; no real camera, remote requests or uploads. |
| PD-007 | Save discoveries, shot count, mute/slow settings and up to 30 deliberately kept photo snapshots. | Collection/designer; never auto-replace saved photos; explain capacity. |
| PD-008 | Gesture-unlocked original synth soundtrack and effects, persistent mute, pause/resume and slower-motion setting. | Collection; hidden tabs pause; reduced-motion default honored. |
| PD-009 | Coherent comic stationery art: ink outlines, coral/cream/teal, original expressive procedural art. | Collection/designer; responsive portrait/landscape and legible controls >=44px. |
| PD-010 | Each keepsake has a future placeable form and stable spatial metadata; no clubhouse integration. | User; framed photo, camera lamp, backdrop screen metadata in source. |
| PD-011 | Readable source, dependency-free reproducible standalone/hosted build, local Git history and checks. | Collection; node build.mjs and node --test tests/*.test.cjs. |
| PD-012 | Verify scoring boundaries, persistence and actual browser rendering and controls; state device/audio limitations honestly. | Collection; record results in verification.md. |

## Save / reward definitions
Key `picture-day-parade.v1`, schema version 1. Stored captures hold scene/time/gag age/crop and deterministic visual state, not large image strings. User-chosen photos stay until individually removed in album. Storage failure shows an explicit session-only warning. No prior Popcorn machine save exists or is touched.

Original keepsakes: framed game print (wall/tabletop, .30×.05×.24 m, no floor block); camera lamp (tabletop, .22×.18×.32 m); backdrop screen (floor, 1.5×.20×1.8 m, matching walk footprint with .15 m clearance). First kept photo grants print form; 3 unique moments grant lamp; 6 grant screen. All derive loosely from school photography, not literal book objects. Awarded ownership is persistent and never removed when a photo is deleted. Placement is deferred.
