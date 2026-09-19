> For the planned replacement, see [redesign.md](redesign.md) and [requirements-next.md](requirements-next.md). The implementation below remains unchanged.

# Wishbone’s Big Fetch — design

Pull back a frisbee and release it through hoops, ricochet bumpers and springs. Wishbone always retrieves the disc. Three yards have six target layouts apiece, with three cosmetic discs and six badges to earn.

## Book anchor
Wishbone is the dog Charlie befriends. The affectionate, reliable fetch loop extends that bond. The frisbee playground, visual design and named yards/discs are inventions, not verified scenes or character descriptions.

## Structure and tuning
- src/core.js: deterministic projectile physics, 18 yard/target combinations, collisions, progression and validated saves.
- src/game.js: touch ownership, DOM controls, canvas rendering, audio events and frame loop.
- src/support.js: browser storage, original synthesized sound and optional read-only WebMCP status integration. Kept local so each book remains independently portable.
- scripts/build.cjs: embeds source and local assets into standalone HTML; emits hosted output with local asset references. No bundler or CDN.

The world uses a 960-by-600 logical canvas, floor at 510, launch origin (130,437), gravity 550 units/second², drag length clamped to 170 units. Maximum active flight is 6.2 seconds; fetch and return each have a 1.5-second fallback. Collision checks sweep hoop crossings between frames. Physics dt is capped at 1/30 second; frame suspension does not create a huge step. Every completed throw grants at least one star. Discs unlock at 0/20/55 stars and change appearance only.

## Presentation
Warm watercolor yard, animated generated terrier cutout, chalk-like trajectory and plucked summer melody. Yard differences are targets, springs, bumpers and tints on one painting.

Reduced-motion preference suppresses decorative trails/particles and some bobbing; gameplay remains intact. Canvas device-pixel ratio is capped at 1.5. Mute and pause are always visible. No external service is called.

## Deferred
Additional authored yard art, more dog animation poses, and richer trick-route challenges. Shared progression, reward economy, lobby, identity and multiplayer are deferred until the three-demo review.
