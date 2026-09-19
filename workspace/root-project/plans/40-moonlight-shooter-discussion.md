# Moonlight Munch Run shooter evolution — discussion 2026-09-17

Later same-session update: Jobe selected the cover's bright comic feel and
authorized the stated next step, source research and a gameplay-view mockup.
See [plan 41](41-shooter-source-and-art-mockup.md). Earlier implementation hold
below describes the discussion boundary; this step has not changed the playable.

Discussion only. Jobe explicitly said not to implement this evolution yet.
Preserve current Moonlight Munch Run, its standalone saves and repository; keep
local. No source selection, asset generation, gameplay edit or publication is
authorized by these answers. Luminous Locks was separately rejected/removed.

## Confirmed direction

- Adapt the proven gameplay logic of an existing suitably licensed arcade shooter,
  Galaga or another appropriate source, with a Mabuhay theme. Jobe wants more than
  a few shooter features loosely added to the current experiment.
- Keep traveling through a scrolling world, with increasingly difficult waves.
  Start with forward approaches; side arrivals are appropriate later.
- Automatically shoot food forward. Fed creatures disappear or leave. Larger
  creatures require more hits; no required shot-type matching.
- An unfed creature reaching/passing the truck is a mistake. Damage represents
  creatures eating food supplies. Running out of food ends active play temporarily;
  restock and continue rather than restart the entire journey.
- Catch weapon pickups during action. Different shot-type pickups switch the
  active pattern. Repeat pickups increase its strength; each type retains earned
  progression when switched away and back. Rapid fire is additive to shot type.
  Weapons/upgrades survive restocking.
- Include bosses. Truck/road travel stops for the boss encounter, resumes when
  it is fed. Boss feeding progress survives restocking. Bosses both throw dodgeable
  projectiles and summon smaller hungry creatures.
- Jobe likes cover-based visual details but has not read the book. Keep connections
  spoiler-light, distinguish verified details from invented game mechanics.
- Generated artwork for truck, creatures and terrain/scenery, with animation to
  bring the world to life. Jobe does not want code-drawn visuals like many prior
  trials unless deliberately choosing a retro aesthetic.

## Suggested defaults, not separately settled

- Free movement within the play area during normal waves and stopped bosses was
  the assistant's interpretation of Jobe's "sounds reasonable" response. Confirm
  the exact controls during planning.
- Ordinary shots do not consume supply-health; this was an assistant suggestion.
- Restart current ordinary wave after restocking, preserve earned rewards; this
  was a suggested implementation of "continue", not a settled checkpoint design.
- Specific shot types, boss roster, supply values, restock interaction, pickup
  strength limits, stage count and source/license review remain open.

## Verified cover details / proposed art approach

Publisher cover visually inspected 2026-09-17: sign reads "The Beautiful Pig";
yellow food truck, pink pig emblem, red-and-white serving awning, purple/pink trim.
Source: https://schol.ca/our-books/book/mabuhay-9781338738643
Cover: https://www.scholastic.ca/hipoint/648/?src=9781338738643.jpg&w=1200

Proposed approach: cohesive generated illustrated scenery layers and sprite art;
code handles movement, hitboxes, scene compositing, effects and sprite/rig animation.
Do not assume a single generated painting supplies gameplay animation frames.
Graphic-novel-inspired art is a candidate, not a confirmed style selection.

## Source research status

An MIT-licensed Python/Pygame Galaga recreation was found:
https://github.com/ihalseide/Galaga . It is unfinished and its README acknowledges
borrowed sounds/music/sprites. It establishes a possible code-adaptation approach,
not a selected base or asset license. Review suitable source, completeness,
licensing and TypeScript port scope before committing to literal reuse.

Next: settle visual style and assess an appropriate shooter base. Continue
discussion; no automatic implementation from this document.
