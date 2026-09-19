# Three demos ready for iteration
2026-09-10. Local builds only for the two new games; no Cloudflare/Firebase account, hosting, shared lobby or multiplayer created.

| Game | Current scope | Main interaction | Recovery | Local reward |
| --- | --- | --- | --- | --- |
| Stormglide 0.2.0 | Existing endless flight and iPad touch revision | Relative thumb steering and dash | Bumps briefly slow the flight | Pup and trail collection |
| Pocket Funhouse 0.1.0 | Twelve authored route rooms, three wings | Turn tracks and slide shutters | Free nudges; visit any room | Twelve escape-room keepsakes |
| Wishbone’s Big Fetch 0.1.0 | Three yards, six layouts each, repeatable throws | Pull back, aim and release | Dog retrieves every miss; Fetch now | Stars, three cosmetic discs, six badges |

The new demos are gameplay prototypes for comparison. They deliberately do not implement all possibilities in the original pitches. Funhouse has no whole-room rotation or platform character. Big Fetch uses one painted yard backdrop with different obstacle arrangements and color treatments, not three separately illustrated environments. Collectible icons are simple symbols; later art can be iterated separately.

## Current verification
Seventeen automated core and simulated-interaction checks pass (eight Funhouse, nine Big Fetch). These verify authored solutions, nudges, projectile/hoop collision, attainable shots, return bounds, progression, touch cancellation/ownership, pause, navigation and denied/corrupt storage. Both previews returned HTTP 200 and are exposed locally.

Generated art was visually inspected as individual assets. Actual browser visual playtesting, physical iPad performance and listening to audio have **not** been performed. The simulated canvas is not proof of visual layout or audio quality. Optional WebMCP status tools were checked in the simulated registry; a live supported browser registry was not tested.

## Product decisions to revisit after playing
- Does each input feel enjoyable for several minutes?
- Which reward makes the player want to keep playing?
- Does the book anchor feel recognizable without teaching or spoilers?
- Could those rewards become desirable objects in the Storyship?
- Should Funhouse's finite room collection expand through more authored rooms, while Fetch and Stormglide remain repeatable?

These are parent review prompts, not questions shown inside the games. Economy balancing is deferred: a Funhouse room, a Fetch throw and a Stormglide minute should not pay identical rewards merely because all can emit a number. No shared currency or XP has been wired.


## Feedback received and next plans
Jobe found Funhouse's shutter drag unintuitive and Fetch's hoop mechanic unfun. Both are being redesigned on paper; see 10-redesign-direction.md. The new clubhouse requirements are in 12-isometric-clubhouse.md. No new gameplay tests or replacement builds have run.

## Wishbone replacement implemented — 2026-09-11
Wishbone’s Big Fetch: Backyard Ruckus 0.2.0 is now the current local Fetch demo. Two physical tower yards replace hoops with a sock projectile, dog charges and persistent collapse. Six pet-themed keepsakes have future floor/tabletop forms. The original 0.1.0 standalone and save are preserved. See wish/plans/design.md and wish/plans/verification.md (relative to the collection root). Funhouse remains its original demo pending its planned replacement; the clubhouse remains unbuilt.
