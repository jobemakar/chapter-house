# Pocket Funhouse — next prototype requirements
2026-09-10 · BOB-002-R2 · Planned revision, not implemented. Supersedes the tile/shutter mechanism for the next prototype; requirements.md still documents the runnable 0.1.0 demo.

## Goal and book connection
Guide an autonomous wind-up key to a lock by rearranging a mechanical funhouse. Inspired by the book's funhouse/secret-passage premise and the indirect-control aspect of Junkbot. The key creature, rooms and collectible designs are original. See [shared redesign](../../plans/10-redesign-direction.md).

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| PF2-001 | Replace tile rotation with A-to-B environment construction around an autonomous wind-up key. | User direction + designer key | Key moves without direct steering; moving a block changes its route. |
| PF2-002 | Include movable blocks, a reversible conveyor, a pressure plate and a hinged bridge in the first kit. Levers follow once the base kit is readable. | User examples + bounded designer slice | Each piece changes behavior visibly; no decorative fake switch. |
| PF2-003 | A dragged piece follows the finger continuously; show its destination ghost before release. | User slide feedback | Drag left/right/up/down and see corresponding movement, never a hidden Boolean toggle. |
| PF2-004 | Unify object selection rules: drag moves, a separate large arrow rotates/reverses, a visible lever responds to a tap. | Designer | No piece changes meaning depending on a tiny unmarked region. |
| PF2-005 | Support stacked groups with clear selection/highlight; moving a supporting block can carry its selected stack. | Designer, informed by reference | Move a constructed staircase as a group without repeated one-block drags. |
| PF2-006 | Preserve the build when the key hits an obstacle or falls. Walls turn it around; catch/return mechanisms keep it in the room. | User continuity rule | An unsuccessful route costs no items, lives or mandatory restart. |
| PF2-007 | Free pause/edit/resume, undo and help; other prototype rooms remain accessible. | User continuity + designer | A player can revise a setup calmly and resume from a useful state. |
| PF2-008 | Show cause and effect through bridge motion, conveyor arrows, plate depression and matched symbols on connected devices. | Designer | A muted/color-impaired player can identify what a switch controls. |
| PF2-009 | Three small authored rooms establish building, switching and sequencing. At least one supports two materially different successful arrangements. | Designer | Document and simulate valid solutions using only the provided kit. |
| PF2-010 | Give a room reward once; optional clever-route achievements do not withhold the core collectible. | User + designer | Slow or assisted completion still earns its themed keepsake. |
| PF2-011 | Collectibles use documented funhouse/escape-room themes and have placeable forms. | User | Wind-up key sits on a table; mechanism worktable supports items. |
| PF2-012 | Retain tactile cut-paper/brass art and add responsive mechanism sounds, gesture-unlocked audio, mute and reduced motion. | Existing direction + collection rule | Movement remains readable without audio; no startling failure alarm. |
| PF2-013 | iPad-first, no keyboard, 48-pixel primary controls, stable drag ownership/cancel and useful portrait/landscape layouts. | User | A second finger or orientation change does not lose or duplicate a piece. |
| PF2-014 | Preserve 0.1.0 source/build and pocket-funhouse-v1 data. Design a versioned migration only when implementing rewards/layout changes. | Collection rule | Legacy curios remain owned; no migration occurs just by opening old demo. |
| PF2-015 | Separate data-authored levels, actor rules, mechanisms, touch interaction and rendering; provide reproducible hosted/standalone builds. | User maintainability | Add/revise a room without rewriting movement rules; keep tuning values explicit. |
| PF2-016 | Use predictable platform/grid behavior, not unstable destruction simulation. | Designer distinctness | Room success depends on arrangement, not favorable random physics. |
| PF2-017 | Verify interaction feel with actual touch playtesting before expanding content. | User feedback lesson | Person can move a piece and understand its effect without an explanation of hidden gestures. |

## Fun acceptance before expansion
The first room must be enjoyable to manipulate even before it is solved. The second should create a visible satisfying chain of effects. If both need a long tutorial, revise the controls/mechanisms rather than add ten more rooms.

## Unbuilt scope
No assets regenerated, no new engine selected, no source changed and no tests of this proposed behavior have run. The previous demo's test suite only describes its previous implementation.

