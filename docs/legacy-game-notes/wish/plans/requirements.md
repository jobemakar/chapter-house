> This file describes the runnable 0.1.0 demo. [Planned replacement requirements](requirements-next.md) reflect the latest user feedback and are not implemented.

# Wishbone’s Big Fetch — demo requirements

Selected by Jobe on 2026-09-10 for a playable first build before reviewing three demos. Version 0.1.0. BOB-003.

## User requirements
- WF-001: Entertainment-only loose inspiration from Wish, without spoilers, quizzes or questions posed to the player.
- WF-002: Fully playable with one finger on iPad. Mouse support too. No required keyboard; portrait and landscape layouts and large touch targets.
- WF-003: Misses remain fun: Wishbone retrieves every disc. No lives, restarts, lost rewards or blocking failure dialogs. Sustained replayable play.
- WF-004: Warm watercolor summer art, audio and mute, maintainable source and reproducible standalone and hosted builds.

## Designer choices for this demo
- WF-005: Side-view physics playground with three freely selectable yards: Clover Commons, Chime Orchard and Sunset Creek. Each has six deterministic target arrangements, recurring with variation after a throw.
- WF-006: Drag backward from a large disc launch area; an aim line and first-part trajectory preview show power and direction. Release launches a gravity-driven disc. Clamp extreme input and cancel without throwing when touch is interrupted.
- WF-007: Generous hoop targets, spring pads and curved ricochet bumpers offer multi-hit trick shots. Visible motion and sound celebrate each hit; no sound-dependent controls.
- WF-008: Wishbone follows the flight, catches the landing disc, and carries it back. Whole throw/return cycle is bounded; an always-available Fetch now button accelerates recovery without penalty.
- WF-009: Three discoverable discs unlock at 0, 20 and 55 total stars, with cosmetic trail variation only. Six trick badges reward milestones; new unlocks are nonblocking. Every completed throw earns at least one star; hoops and bounces add bonuses.
- WF-010: Best throw, stars, throws, badges, selected yard/disc and mute save under wishbones-big-fetch-v1. Active throw is ephemeral. Validate saved data and tolerate unavailable storage.
- WF-011: Original plucked summer melody, soft bounce sounds and hoop chimes, unlocked by first interaction. Pause freezes physics/music. Hidden-page time does not fast-forward the game.
- WF-012: Art includes locally stored generated yard and dog cutout; physics targets are functional canvas geometry. No external runtime resources. Bound particles and cap pixel ratio for iPad.
- WF-013: Optional read-only game-status WebMCP integration, never needed to play.

## Acceptance checks
Check aim mapping and minimum/maximum launch force; target collision and bounce behavior; bounded automatic return even on misses; each yard and seeded layout; pointer ownership/cancellation; pause; persistent rewards and cosmetic unlocks; corrupted or unavailable saves; standalone build asset embedding and syntax. Distinguish simulation from physical iPad/audio/browser playtesting.

## Scope and distinctness
Directly launching each disc differs from Stormglide's continuous steering, Pocket Funhouse's authored mechanisms, and Popcorn's reusable machine construction. Compared against other reserved games: no rhythm, food scheduling, merges, stealth, habitat building or containment. Dog fetching is thematic overlap with Stormglide's dog companions, not the same play loop. No shared account, lobby or online progression is implemented.
