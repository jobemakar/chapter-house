# Original campaign rooms 03-20

Rooms 03-20 are original Keyfall work authored from blank 560x800 grids. No
*Cut the Rope DX* files, coordinates, object lists, names, prose, layouts, art,
audio, code, or extracted data were used. The coordinate-free source briefs are
checked in at `src/original-room-briefs.ts` and intentionally precede the room
geometry in `src/rooms.ts`.

## Progression

| Rooms | Band | New reading load |
| --- | --- | --- |
| 03-08 | Introductory | One-cord bubble releases that teach required tap air, passive drafts, a bumper bank, and visible hazard routing one at a time. |
| 09-14 | Paired mechanic | Bubble release paired with tappable air, a bumper bank, opposing air modes, or a two-cord release with air. |
| 15-20 | Readable multi-step | A bubble decision and two cuts followed by a required passive-air, tap-air, or bumper route; hazards mark unsafe lanes in 15, 18, 19, and 20. |

Every direct route uses its room's named system: cross-drafts move the lock lane,
bellows taps supply required impulses, bumpers create required banks, and later
rooms require two releases before their air or bumper sequence. The
optional three-ticket routes retain a forgiving bubble sweep, but use distinct
ticket geometry and different return timings rather than defining the canonical
solution. Required-mechanic metadata is replayed after each dependency is
neutralized; all canonical routes then fail.

The final band uses the systems actually present in each room:

- 15: bubble + two cords + required continuous air, with a lower pit to route around (three pointer actions);
- 16: bubble + two cords + required bumper bank (three pointer actions);
- 17: bubble + two cords + required continuous air and correcting tap air (four pointer actions);
- 18: bubble + two cords + required continuous air, with a far hazard and optional ticket bellows (three pointer actions);
- 19: bubble + two delayed cord cuts + required bumper bank away from a scenery hatch (three pointer actions);
- 20: bubble + two cord cuts + required first bumper bank through a center lane bounded by side hazards (three pointer actions).

There are no counterweights in rooms 03-20. Rooms 04 and 18 contain optional
tap-air support for their mastery routes, but their canonical routes depend on
the declared continuous draft instead. Room 20 is a focused bumper finale, not
a claim that every prior mechanic appears at once.

## Room list

1. 03 — Curtain Call
2. 04 — Whisper Lift
3. 05 — Draft Mark
4. 06 — Soft Rebound
5. 07 — Stage-Left Cue
6. 08 — Trapdoor Chalk
7. 09 — Breath and Buoyancy
8. 10 — Balcony Bank
9. 11 — Countercue Draft
10. 12 — Crosswind Matinee
11. 13 — Split Velvet
12. 14 — Twin Cue Wings
13. 15 — Orchestra Crossing
14. 16 — Prop Room Passage
15. 17 — Echoing Flyloft
16. 18 — Crosswind Chorus
17. 19 — Last Rehearsal
18. 20 — House Lights

## Deterministic verification

`src/completion-traces.ts` contains one typed zero-ticket completion trace and
one typed three-ticket mastery trace for every campaign room. Both use the
production 16 ms fixed step and production cord/tap handling. The original rooms
are replayed as three explicit batches of six in `tests/keyfall.test.ts`.

At the 2026-09-21 Phase 4 checkpoint:

- rooms 03-08: six of six zero-ticket and six of six mastery traces pass;
- rooms 09-14: six of six zero-ticket and six of six mastery traces pass;
- rooms 15-20: six of six zero-ticket and six of six mastery traces pass;
- each mastery replay collects exactly three tickets and still reaches the lock;
- each zero-ticket replay reaches the lock without touching a ticket.
- all 18 normalized room geometry signatures are distinct;
- the campaign distributes 10 one-cord and 8 two-cord rooms;
- 20 declared runtime dependencies across the 18 originals fail when
  individually neutralized under the canonical trace;
- every brief's allowed systems exactly match its room definition, required
  systems exist, and its pointer-action count matches the canonical trace.

These are deterministic simulation checks, not claims of physical-phone
playtesting. Pointer targets used by original rooms are at least 40 logical
pixels in radius, and the fixed 560x800 geometry remains unchanged by resize.
