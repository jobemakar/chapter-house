# Revised game and clubhouse direction — historical design record

## Current reference — 2026-09-14

Use [application revision 3](19-application-brief.md) and its [requirements](20-application-requirements.md) for current clubhouse scope. Animal avatars, pets and social spaces are selected; tabletop stacking is deferred and pet/wearable display exemptions are confirmed. Per-game redesign history below remains useful and is not a current implementation-status inventory.

## Historical revision follows

2026-09-10 · Planning revision 2 · No replacement game or clubhouse built in this revision.

## What changed
Jobe found Funhouse's slide unclear/broken and Big Fetch's current throw loop unfun. He wants more inventive A-to-B environment puzzles inspired by Junkbot, and projectile-led physics destruction where Wishbone blunders after a thrown toy. Collectibles may be very loosely related to their books, but must have a thematic reason to exist and be placeable in an isometric 3D clubhouse. No avatar is planned; room geometry must remain suitable for walking later.

These are new design directions, not claims that either current 0.1.0 demo has changed. Preserve both demos and saves for comparison.

## BOB-002-R2 — Pocket Funhouse: The Wandering Key
**Pitch:** A little wind-up key scuttles through a miniature funhouse. Rearrange stage blocks, reverse conveyors, weight pressure plates and pull levers so it reaches a lock on the other side. The delight is watching your arrangement work: a moving box holds a switch, a bridge drops, and the key strolls straight into a secret door.

The key is an invented mechanical attraction, not a character from the book. The funhouse, secret passages and treasure give it a clear book connection.

- Input: drag physical pieces directly; tap large direction/rotation controls and visible levers; optionally pause to arrange.
- Verbs: stack, bridge, redirect, weigh, guide.
- Loop: watch the key's understandable behavior → rearrange the environment → observe a new route → open the secret compartment.
- Space: compact side-view, cutaway rooms with actual platforms and moving components.
- Challenge: a small reusable kit and several valid solutions. Learn physical cause and effect without quizzes.
- Recovery: walls turn the key around; a fall lands on a return conveyor. The player's construction stays intact. Free help and another room remain available.
- Progression: open compartments, discover new mechanism combinations, earn miniature funhouse props.
- Visual/audio: painted toy theater, tactile timber and brass, softly clicking wheels, satisfying switch/gate sounds. Moving platforms and wires make causes visible.
- First experiment: three small rooms, a wind-up key, blocks, one conveyor, a pressure plate and a hinged bridge. Add more pieces only after moving and routing feel good.

**Concrete room:** The exit sits above a low trench. A box placed on the pressure plate opens a bridge, but the key needs that same box as a step. Use the conveyor to deliver the box to the plate after the key climbs it. Also provide enough pieces for an alternate stair/bridge solution. The room tests routing and sequencing, not a memorized single answer.

**Why the old slide failed:** source inspection confirms that pointer movement merely marks a drag and pointer release toggles a Boolean shutter state. No shutter follows the finger. “Slide” therefore describes an interaction the demo does not actually provide. Retire this ambiguous interaction with the tile-routing prototype; direct movement must follow the player's finger.

**Junkbot influence:** borrow indirect control and rearrangeable environments, not LEGO assets, named characters, exact rooms or failure rules. Its developers describe guiding an autonomous character by moving bricks and improving the feel through iteration. [Designer account](https://www.ericzimmerman.com/assets/pdfs/Iterative_Design.pdf), [LEGO interview](https://www.lego.com/cdn/cs/set/assets/blte95c26554f38a01a/bits_n_bricks_s03e29_feature_and_transcript.pdf).

## BOB-003-R2 — Wishbone’s Big Fetch: Backyard Ruckus
**Pitch:** Lob a rolled-up sock into a gloriously wobbly backyard obstacle course. The sock knocks a support loose; Wishbone barrels after it, sending boxes, cushions and toy buckets tumbling. Your goal is to free the squeaky toys perched in the structures. One well-placed throw can turn the whole yard into a ridiculous domino effect.

Use an ordinary toy as the projectile and Wishbone as a second physical force. This keeps him expressive and recognizable, and gives the throw two satisfying consequences.

- Input: pull back to set direction and strength; release. A short trajectory preview ends before the full outcome.
- Verbs: lob, lure, topple, scatter, fetch.
- Loop: spot a weak support or useful landing spot → throw → toy impact → dog charge → collapsing structure → collect freed toys or make another throw.
- Space: authored side-view yard structures made from movable rigid bodies. Player aims but does not construct the towers.
- Challenge: leverage, balance, momentum and choosing where the dog runs. Clear objective: free every marked squeaky toy from its perch.
- Recovery: unlimited throws; partial collapse and freed toys persist. No lives, ammunition limits, dog injury or failure screens. A missed throw can still make a funny small mess.
- Progression: placeable pet toys, doghouse furniture and yard keepsakes. Extra style rewards for big chain reactions, never fewer core items for imperfect play.
- Visual/audio: warm illustrated cardboard-and-cushion world, expressive dog anticipation and goofy running, material-specific thumps/rattles/squeaks.
- First experiment: one satisfying collapsing structure, three marked toys and a physical dog chase. Then a second arrangement with a different weak point. Do not build three cosmetic yards again before the first collapse feels fun.

**Concrete shot:** A toy rests on a plank spanning two stacks of boxes. Land the sock behind the taller stack. Wishbone knocks out the lower box on his way through, the plank tilts, and the toy spills into the play area; the fallen plank tips a bucket into a second stack. The goals are toys recovered, while the reward in the moment is the cascade.

Directly launching the dog is retained as BOB-003-ALT1, a deferred alternative from Jobe's brainstorm. Preferred now: throw toy → dog pursuit, because the dog adds a second distinct force and personality. No judgement that cartoon dog-launching is forbidden; it is simply not the chosen experiment.

## BOB-004-R2 — Midnight Snow Jam, grounded in Arctic friends
Keep the rhythm mechanic. Jobe explicitly accepts loose theme connections, so it need not recreate a scene from the novel. Duane's Arctic circle of friends becomes a playful ensemble; each newly met friend adds a distinct musical part. Music stays uninterrupted, with forgiving timing and optional free play.

Replace generic trophies with a polar-bear cushion, puffin perch, aurora lamp and ice-drum side table. These point back to characters/setting even though the band and furniture are invented. The signature ensemble is a placeable music box, not roaming characters in the clubhouse.

## BOB-006-R2 — Gummy Galaxy becomes Gummy Nook (working title)
Keep the satisfying merge-and-squish board. Remove the unrelated outer-space framing. Discover combinations of gummy shapes and textures in a bright little candy tray; each discovery unlocks a matching tiny ornament, lamp or cushion for the clubhouse.

The link is intentionally loose: gummy imagery and a comfortable space to choose things you enjoy. Do not depict Willa's sensory processing differences as a meter, enemy or condition to cure. Texture/motion/sound controls are available to everyone. Cosmetics such as a gummy-bear lamp or soft sock cushion have a clearer anchor than a generic alien trophy.

## BOB-010-R2 — Picture Day Parade (working title)
Retire Popcorn Contraption Club as the leading plan. Building conveyor contraptions now overlaps Funhouse, while popcorn manufacturing also weakly represents the book.

**New pitch:** Run a comic photo booth on the world's silliest Picture Day. Hats wobble, props pop up and friends try to squeeze into the frame. Choose the framing, trigger a harmless prop and catch the glorious moment with the shutter. Every picture is a keepsake; great combinations reveal new poses and backdrops. Missed timing makes a funny alternate photo, never an anxiety failure state.

- Input/verbs: frame, cue, time, snap; optional forgiving burst.
- Loop: observe a short repeatable scene → cue one gag → frame and snap → add an original illustrated photo to the album → play another scene.
- Space/challenge: a staged camera view; timing/composition, not projectile physics, rhythm note lanes or machine construction.
- Recovery: every picture retained if desired; unlimited reshoots, no timer to fail. No real camera, uploads or child photos.
- Rewards: placeable framed game photos, camera lamp, photo-strip rug and backdrop screen. Anxiety is not the joke or a score.
- First experiment when requested: one repeating photo scene, one prop cue and a shutter. Confirm it is fun rather than a passive screenshot button before adding an album economy.

## Distinctness audit against all ten current directions
| Game | Primary loop now | Relevant boundary |
| --- | --- | --- |
| Stormglide | Continuous steering/dash through scrolling skies | Neither new demo adds in-flight steering as its primary input. |
| Funhouse R2 | Construct a route for an autonomous mechanical key | Reserve manipulable conveyors/switches/platform routing here. |
| Fetch R2 | Aim a projectile and dog pursuit to collapse authored structures | No player-built machine or environment construction; shared physics is implementation overlap only. |
| Snow Jam R2 | Timed musical performance with Arctic ensemble | Distinct from Picture Day's sparse chosen moment/composition. |
| Midnight Merienda | Assemble food and schedule cooking stations | No routing autonomous movers or destruction goals. |
| Gummy Nook R2 | Matching/merging shapes and discovering combinations | No structural collapse, actor navigation or music timing. |
| Bureau After Dark | Disguise and stealth timing around agents | Direct destination/disguise choices; no constructed walking routes. |
| Sanctuary Seasons | Functional habitat creation and animal responses | Overlaps placement with clubhouse intentionally; its ecology has gameplay consequences. |
| Emberwatch | React to changing fire and allocate containment tools | No construction puzzle solution or destruction celebration. |
| Picture Day Parade R2 | Frame and time a photo of an animated scene | Old popcorn machine reserved as retired history, not a second Funhouse. |

## Next implementation order, when requested
1. Funhouse: validate intuitive piece movement and one interesting A-to-B room.
2. Fetch: validate one satisfying toy-hit/dog-charge/collapse sequence.
3. Clubhouse: one isometric room, one table and placeable rewards on its surface; no accounts or avatar.
4. Compare the two new play loops and their rewards in that room before expanding content.

The first two can be built independently. This order expresses priorities, not a background automation or an authorization to create services.


## Wishbone replacement implemented — 2026-09-11
Wishbone’s Big Fetch: Backyard Ruckus 0.2.0 is now the current local Fetch demo. Two physical tower yards replace hoops with a sock projectile, dog charges and persistent collapse. Six pet-themed keepsakes have future floor/tabletop forms. The original 0.1.0 standalone and save are preserved. See wish/plans/design.md and wish/plans/verification.md (relative to the collection root). Funhouse remains its original demo pending its planned replacement; the clubhouse remains unbuilt.

## Picture Day Parade implemented — 2026-09-12
Jobe requested the planned Popcorn build. BOB-010-R2 now has a local three-scene 0.1.0 implementation with nine composition moments, unlimited reshoots and an optional photo album. No album economy; player fun review remains pending. No publication or clubhouse integration.

## Original BOB-010 comparison authorized — 2026-09-12
Jobe asked to try the original contraption concept. It is now a separate machine-building experiment, alongside Picture Day Parade. The earlier retirement decision remains historical; its Funhouse construction overlap is explicitly accepted for this comparison.

## BOB-010-R3 selected and built — 2026-09-13
The user shifted Contraption Club from open sandbox to authored levels with nonblocking persistent clears. Six levels now exercise the retained physics; fixed and movable machinery, clean batches and linked switch behavior make up the progression. Picture Day and legacy sandbox are retained.
