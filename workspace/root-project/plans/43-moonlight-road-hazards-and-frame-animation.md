# Moonlight challenge / frame animation — 2026-09-17

Jobe enjoyed the shooter but found it too easy. He requested animated sprite
art instead of only code transforms, and creature-dropped road hazards that
cannot be shot away: contact interrupts firing for one second. Keep local.

## Requirements before implementation

1. Preserve controls, automatic forward food, catch/switch/retained upgrades,
   additive rapid fire, keepsakes, supply recovery and saved boss hunger.
2. Hungry guests drop illustrated potholes or sticky spore pods on the road.
   Food and special servings neither damage nor remove them. Contact suppresses
   both automatic fire and special serving for one simulation second. Already
   flying food continues; this penalty alone does not spend supplies.
3. Drops have a visible 0.65-second warning before contact is active. Normal road
   hazards scroll with travel; boss drops stay on the stopped road and expire.
   Limit count/separation/lifetime to retain dodging space. A sustained overlap
   does not refresh the timer every frame; re-entry is another contact.
4. Visible firing-interruption feedback and disabled special control. Pause/help/
   hidden/restock freeze the clock; restock clears transient hazards/interruption.
   No new save key or loss of durable progression; wave checkpoints remain.
5. Modestly quicker/spaced enemy approaches, one extra guest per wave, faster boss
   attack cadence and stronger bosses. Keep existing crowd cap and free restock.
   Exact tuning is a first local feedback pass, not a final balance claim.
   Browser review of Jobe's stage-six spread/rapid save exposed off-screen instant
   feeds. Food now interacts with guests only once they enter the screen; later
   small guests take two hits and drops happen after 0.4–0.6 seconds of approach.
6. Generated transparent frame atlases preserve the approved truck/creature look:
   wings actually flap, leaf creature runs/blinks, boss breathes/moves paws, truck
   wheel/detail frames move. Renderer changes source frame pixels over time; do
   not replace frame art with sinusoidal scaling/rotation. Reduced motion selects
   a stable frame; gameplay travel/steering remain. Preserve original art files.
7. Keep TypeScript source and reproducible embedded/offline builds, retained MIT
   notice, exact Chapter House snapshot packaging. Update art provenance and dated
   requirements/verification. No other original game, clubhouse or hosted edits.

## Ownership and checks

Root: model/collisions/difficulty, generated assets/provenance, bundler, tests,
packaging, integration/review and local commits. Delegate only renderer/UI work.
Renderer owns src/renderer.ts: new assets comic-motion.png and comic-hazards.png;
image-specific crop rectangles (generation may not obey equal grids). Public
model additions: hazards [{id,x,y,kind:0|1,age,contact}], fireLock:number (seconds).
0.65-second arming threshold; show road warning then hazard. True sprite frames,
no creature/truck squash or rotational animation. Existing sprite atlas retains
food/pickups. UI owns src/game.ts and src/index.html: visible interruption label,
disable special while fireLock>0, help text and QA datasets fireLock/hazardCount.

Checks: unshootable collision path; exact one-second suppression/autofire recovery;
manual burst blocked without spending charge; telegraph/contact/re-entry; real
guest/boss drops; bounded hazards and viable lifetime; pause/restock cleanup;
legacy saves/boss checkpoint/upgrades; actual rendered frame changes and browser
controls/layouts. Do not claim physical device use or listening without doing it.

Mechanic signature gains prioritizing droppers and steering around road hazards;
otherwise the user-selected traveling shooter remains the same standalone game.

## Local completion

Implemented avoid-only potholes/spore pods and exact one-second kitchen jams,
actual generated four-frame actor animation, tougher waves/bosses and offscreen
feeding correction. Reduced motion holds frame zero. Original art/saves remain.
Strict source build and25 checks; application100 checks/build; exact preview
verification13 previews/19 files pass. Desktop, portrait and landscape reviewed;
final play QA used a separate localhost origin to protect Jobe's existing save.
Browser contact visibly disabled special without spending charge/supplies,
then firing recovered. Full evidence and hash: original experiment verification
and FRAME-AND-HAZARD-PROVENANCE.md. No publication or other game/room edits.
Balance remains a local feedback pass; await Jobe's next playtest.

Local checkpoints: canonical Mabuhayf7ee31e7e104243f8c18ee6ca98273d727a61558;
application packaging1c55c213050ea14c74dac21fd61fd20880bcc2c1.
