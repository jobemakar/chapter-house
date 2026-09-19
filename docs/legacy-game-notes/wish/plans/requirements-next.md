# Wishbone’s Big Fetch — next prototype requirements
2026-09-10 · BOB-003-R2 · Backyard Ruckus working subtitle. Active requirements for the implemented 0.2.0 prototype. requirements.md retains the original 0.1.0 hoop-fetch requirements.

## Goal and book connection
Keep pull-and-release, but make physics collapse the central pleasure. Throw a sock/toy into a wobbly structure; Wishbone chases it and knocks things over. Free the marked squeaky toys. Wishbone's bond with Charlie anchors the pet theme; towers, toys and game events are invented. See [shared redesign](../../plans/10-redesign-direction.md).

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| WF2-001 | Retain one-finger pull-back aiming and release-to-throw with a clear power/direction preview. | User | An intended short/long, high/low throw is understandable without a keyboard. |
| WF2-002 | Launch a toy or rolled sock; Wishbone pursues it as a separate physical actor. | User option, designer selection | The toy impact and dog charge are visibly distinct events. |
| WF2-003 | Authored towers use stacked boxes, planks, cushions and light buckets with actual support, rotation and collision. | User physics intent | Removing a supporting box makes the supported structure topple rather than play a fixed animation. |
| WF2-004 | Dog contact transfers momentum and can knock objects down. His route is legible; he does not teleport or pass through solid towers. | User | Landing a toy behind a weak support produces a different cascade than landing it in front. |
| WF2-005 | The primary goal is freeing all marked squeaky toys from their perches. Show a simple remaining-target count and clear target silhouettes. | Designer | Player can identify goals before a throw and recognize each one freed. |
| WF2-006 | Let freed toys, displaced structures and partial progress persist across throws. Unlimited attempts; no ammo/lives or forced reload on a miss. | User collection rule | Three imperfect throws can cumulatively complete a scene. |
| WF2-007 | Make recovery quick and useful: a missed throw still gets a playful fetch; Recall is always available when chasing stalls. | User continuity + designer | The next aim is available within one second of a settled return; automatic chase timeout/Recall prevents indefinite waiting. |
| WF2-008 | Pause the scene while aiming if useful for calm targeting. In-flight steering and construction tools are excluded from the core loop. | Designer distinctness | Success comes from the throw and ensuing physics, not directly steering or rebuilding a route. |
| WF2-009 | One main structure and one alternate arrangement are the first slice. Each must allow a satisfying chain reaction without requiring a pixel-perfect shot. | Designer | Demonstrate two materially different target throws and a forgiving near-miss. |
| WF2-010 | Use weight, anticipation, brief impact emphasis, debris motion and material sounds to make collapse feel satisfying. | User fun feedback | Sock thuds, boxes tumble, buckets rattle, toy squeaks; reduced-motion mode retains the information. |
| WF2-011 | Targets are pet toys; dog collisions are playful with no injury/death. No story character's distress becomes a failure meter. | Designer | No harm animation or failure screen interrupts the yard. |
| WF2-012 | Award placeable pet-themed objects: sock/toy, ball basket, bandana display, dog bed, doghouse table. | User | Every owned reward has a documented theme and valid display/support form. |
| WF2-013 | Optional style scores/achievements reward cascades without withholding basic items from assisted or repeated throws. | User continuity + designer | Completing through several throws still grants the main keepsake. |
| WF2-014 | Keep the warm illustrated yard and expressive dog. Provide audio on first gesture, mute, pause and reduced-motion controls. | Existing direction + collection rule | All game events remain understandable silently. |
| WF2-015 | Touch-first on iPad, primary controls at least 48 pixels, clamped aim, explicit pointer ownership/cancel and resize safety. | User | Canceling a drag does not throw; rotation does not create a giant impulse. |
| WF2-016 | Preserve wishbones-big-fetch-v1, existing stars/discs/badges and the 0.1.0 demo. Any later migration is versioned and tested. | User iteration rules | Existing rewards remain recognized without manufacturing duplicate awards. |
| WF2-017 | Use readable source, data-authored structures and configurable physics. Select a suitable rigid-body implementation during the build; pin dependencies if introduced. | User maintainability | Change stack geometry/mass/friction independently from input/rendering; reproducible build. |
| WF2-018 | Verify stack stability, support collapse, target accounting, repeated/poor throws, dog unsticking, frame-rate behavior and actual iPad feel before expanding. | Designer | No exploding stack at rest, no rewarded target twice, no endless fetch or object tunneling. |

## Deferred alternative
BOB-003-ALT1: launch the dog itself. Not selected for the first replacement prototype; keep as an option if toy-plus-chase proves sluggish. Also defer special projectile types and multiple dogs until the simple cascade is fun.

## Fun acceptance before expansion
A plain throw into one stack should already feel better than collecting a hoop. The dog must add meaningful, funny consequences; if his chase merely delays the next shot, redesign that sequence. No economy, extra environments or polish can substitute for that check.

## Implementation — 2026-09-11
Selected by the user and implemented as 0.2.0. Matter.js 0.20.0 is pinned and embedded; two authored yards reuse existing art. Socks refill independently after 1.05 seconds. Six pet-themed keepsakes carry future placement metadata; the clubhouse is unbuilt. Versioned v2 saves leave v1 untouched. Automated and browser evidence is recorded in verification.md. Physical iPad feel remains unverified, so no level expansion is included.
