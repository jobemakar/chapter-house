# Backyard Ruckus — implementation design
2026-09-11 · BOB-003-R2 · 0.2.0

## Chosen loop
Aim a rolled sock → release into a structure → watch its impact and Wishbone’s physical charge → free perched squeaky toys → throw again into the changed structure. The sock refills after 1.05 seconds, independently of the dog. Recall immediately readies it and sends the dog home. Chase targets time out after seven seconds; a dog stalled by rubble makes a physical hop. He never teleports home. Unlimited throws and optional restacking replace ammunition, failure and forced restart screens.

The target is displaced more than 50 world units from its settled perch to be freed. A pop and squeak identify the event; the counter updates immediately. Target IDs are deduplicated across replays and yards. A cascade label is a style celebration, not an extra collectible or progression gate.

## First slice
The Teeter Tower uses a two-level bridge stack and a separate cushion/bucket tower. The Domino Picnic uses narrow upright supports and two bridges leading to a picnic stack. They share one original watercolor yard. Both are unlocked immediately. This stays at two arrangements until Jobe reviews the basic fun; no random level generator or additional environments.

The dog adds momentum, not just delay. A projectile-only comparison causes less collapse than the same shot with the dog. Low support shots can cumulatively clear both yards. Higher shots change where the dog runs and what receives the first impact. A miss still allows another throw quickly.

## Physics and controls
Matter.js 0.20.0, MIT, exact version in lockfile. 120 Hz fixed step with bounded catch-up, 1.05 gravity, 1200×720 logical world, ground at y=600. Bodies include boxes, planks, cushions, buckets, circular toys and an upright dog. Sleeping is disabled for the small body count because sliding supports must never leave an asleep toy suspended in air. Dog return braking prevents overshooting home after a hop. Only the newest sock is pursued; at most five remain in the yard.

The large left-side input area accepts a primary pointer. Pull is relative to the initial contact, clamped to 160 units, and converted to launch velocity. The dotted trajectory accounts for gravity/air drag and stops at a prop; it is an approximate guide because it does not predict collisions or dog motion. Aiming freezes physics. Secondary pointer, cancel, lost capture, resize, modal opening and pause cannot launch a sock. Every primary DOM control is at least 48 CSS pixels high.

## Modules
- `levels.js`: data-authored prop dimensions, positions, materials and targets.
- `core.js`: physics, dog motor/hops, launch/reload, target accounting, checkpoints.
- `progress.js`: validated versioned saves, idempotent awards, legacy recognition and future placement metadata.
- `render.js`: camera, prop and toy drawing, original dog cutout, trajectory, bursts and keepsake icons.
- `game.js`: pointer/DOM controls, frame loop, audio events, persistence, optional read-only WebMCP status.
- `support.js`: original synthesized melody/effects, gesture audio startup, mute, browser storage fallback.

## Rewards and book connection
Wishbone is Charlie’s dog friend in *Wish*. Pet care and playful companionship are the loose theme. The yard structures, socks, squeaky animals and all keepsakes are original game inventions, not claims about scenes or objects from the novel. The source connection is recorded in the shared book-connections document.

| Keepsake | Earned by | Future form |
| --- | --- | --- |
| Lucky sock | First throw | Tabletop toy |
| Squeaky friend | First unique toy freed | Tabletop rubber toy |
| Bandana display | Six throws | Bandana on a tabletop stand |
| Ball basket | Four unique toys freed | Floor basket |
| Patchwork dog bed | Fourteen throws | Floor furnishing |
| Doghouse table | Eight unique toys freed | Floor furniture with top support surface |

Footprints and table surface data are in `progress.js`. No avatar or clubhouse placement implementation. No currency or XP economy. The first demo’s stars/discs/badges remain in its own save and archived playable; the new game records them as legacy progress without converting them into duplicate awards.

## Iteration priorities
Have Jobe and his daughter assess pull strength, clarity of the target, dog contribution, impact feel and replay appeal on a physical iPad. Adjust the two yards before expanding. More physics complexity and more collectibles are not substitutes for a fun throw.

Original 0.1 design: `archive/design-v0.1.md`. Original source remains in Git; archived standalone: `playable/Wishbones-Big-Fetch-v0.1.html`.
