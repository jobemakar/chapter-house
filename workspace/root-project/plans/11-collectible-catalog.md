# Collectibles: theme first, placeable by design

## Current scope note — 2026-09-14
The [consolidated brief](19-application-brief.md) and [requirements](20-application-requirements.md) govern current acquisition/display rules: special keepsakes are game-exclusive; shop furniture may have duplicate copies; pets are one of each kind; living pets and avatar wearables need no separate display form. Floor/wall placement is selected and tabletop stacking is deferred. Preserve all existing ownership/metadata and adapt old tabletop forms before integration. The item families below are content proposals and dated implementation records, not a current readiness inventory.

2026-09-10 · Proposed item catalog, not awarded or implemented.

## Rules
- Every named collectible has a documented book, character, setting, game-action or thematic connection. Very loose links are allowed by Jobe; they need not be literal objects in the text.
- Distinguish verified anchors from invented designs. A lightning-cloud sofa is a loose transformation; it is not a sofa from Lightning Girl.
- Game keepsakes have placeable floor/wall forms, including badges as plaques and photos as framed prints. Avatar cosmetics and living pets are explicit exceptions. Furniture is collectible too; pictures alone do not replace functional furniture.
- Score, XP and spendable reward counters are accounting values, not collectible items. Do not pad the collection with non-placeable currencies.
- Non-wearable game cosmetics may use compatible floor/wall display forms; avatar wearables/colors do not require separate displays. Preserve ownership without duplicating quantity across equipped/display views.
- Items come with stable IDs, placement category, size, support rules and thematic rationale before asset production. No rewards that cannot fit the room.
- Placed figurines/music boxes may retain signature animations. Living roaming/interactable pets and walking animal avatars are now separate selected systems in the application specification.

## Starter item families for all ten games
These are original proposed designs. The verified book anchors and sources remain in [the book audit](08-book-connections.md).

| Book/game | Example floor furniture | Example tabletop/wall item | Why it belongs |
| --- | --- | --- | --- |
| Lightning Girl / Stormglide | Cloud sofa; shelter-style dog bed | Lightning lamp; Cutie Pi-inspired dog figurine; framed trail light | Lightning, shelter dogs and Lucy's bond with Cutie Pi. |
| Locked Rooms / Funhouse | Secret-door bookcase; mechanism worktable | Wind-up key; mirror-maze ornament; lever-operated lamp | Funhouse puzzles, mechanisms and hidden passages; the particular artifacts are invented. |
| Wish / Wishbone Fling | Future canonical mapping retains the Fling discoveries below; Backyard Ruckus furnishings remain archived | Bounce Biscuit display; Magnet Bandana; Tailwind Pinwheel | Wishbone and affectionate pet play; the three effects and displays are invented. Standalone TypeScript port is deferred. |
| Very, Very Far North / Arctic Duet | Duet Snow Cushion; Aurora Wool Rug | Puffin Window Star; Together Pennant | Arctic friendship and playing together; all four forms are original inventions. |
| Mabuhay! / Moonlight Munch Run | Tiny Truck floor display | Lantern wall plaque; Moon Menu framed print | Family food truck and Filipino food imagery; the nighttime route and reward forms are invented. |
| Not If I Can Help It / Gummy Nook | Gummy-bear beanbag; soft fabric bench | Gummy lamp; candy jar; soft sock cushion | Gummy imagery, textures and personal comforts. No medical claim. |
| Amari / Bureau After Dark | Bureau filing cabinet; artifact display table (planned shared-world rewards) | Local standalone: Night Garden case file; Lanternwing cryptid record | Bureau of Supernatural Affairs and magical investigation. Both records and all sigils are invented. Standalone records persist locally; shared-world catalog integration remains planned. |
| Elephant in the Room / Veda's Great Escape | Veda's leafy bench; Veda's elephant fountain | Future additions may extend the route-puzzle set without changing the two stable reward IDs | Caring for Veda and helping her reach the sanctuary; the reward forms are invented. |
| Wildfire / Dig & Douse | Camp bench; forest planter | Camp lantern; model water bucket; regrowing forest diorama | Forest/camp setting and the game's water-and-restoration theme. The three golden canteen buddies are optional in-level pickups whose production tally will contribute to persistent player progression; exact redemption is still to be designed. Their appearance is invented survival-themed imagery. |
| Popcorn / Picture Day Parade | Photo-backdrop screen; camera-tripod side table | Framed game photo; camera lamp; photo strip | School Picture Day and the book's comic visual language; no actual child photos. |

## Historical support examples — stacking deferred
- Mechanism worktable: floor item, solid footprint, named flat top accepting tabletop objects.
- Lightning lamp: tabletop item, no support surface of its own.
- Snack tray: tabletop item; later can expose small item slots for snacks. Nesting beyond a table and one object is a later interaction, but the data model supports it.
- Secret-door bookcase: floor furniture, shelf surfaces plus an in-place door animation. Its opening does not teleport or require an avatar.
- Doghouse side table: floor furniture whose roof is a flat support surface by design; the dog's resting nook is decorative.
- Framed photo: one owned item with a tabletop stand or wall mount. Switching display mode is not earning another copy.

## Existing demo rewards
Do not silently rename, erase or convert saved progress.
- Stormglide: preserve all pup/trail discoveries; later map them to themed figurines/light displays with stable migration IDs.
- Funhouse 0.1.0: preserve twelve earned curios. Existing keys/mirrors/panels can become worktable displays, mounted keepsakes or functional furniture variants. Do not pretend legacy collectibles were already 3D.
- Fetch 0.1.0: preserve stars, three discs and badges. Discs become shelf items; badges become dog-themed display patches/plaques. Stars remain a balance, not a mysterious unrelated physical collectible.
- Migration happens once in a later implementation, is documented and tested, and keeps original keys/backups readable. No migration has run in this planning revision.

## Ownership and reward pacing
Each owned item instance has one location: inventory or a room placement. Moving/rotating/recoloring it is free. Optional duplicates may be placed as separate instances; any future exchange must be explicit and reversible where practical.

Prefer guaranteed themed rewards for meaningful play. Room completions, recovered toys and musical milestones will have different cadence; never equate raw scores between games. No streak penalties, loss of items on mistakes, obligatory grind in one book, or random-only signature rewards.


## Wish implementation — 2026-09-11
Backyard Ruckus 0.2.0 awards Lucky sock, Squeaky friend, Bandana display, Ball basket, Patchwork dog bed and Doghouse table. All are original pet-themed keepsakes. Floor/tabletop footprints and the table support surface are recorded in wish/src/progress.js. The collection panel displays ownership; placement is deferred. Legacy stars/discs/badges remain recognized without duplicate conversion or deleting the original save.

## Wishbone Fling experimental discoveries — 2026-09-11
First Bounce Biscuit, Magnet Bandana and Tailwind Pinwheel discoveries each unlock a permanent tabletop display alongside consumable charge counts. Dimensions: 0.18×0.18×0.12 m, 0.18×0.12×0.25 m and 0.16×0.16×0.35 m, respectively. The pet-play link is a loose original thematic invention, not a claim about book objects. Spending charges never removes display ownership. Metadata is in wish/experiments/floppy-fetch/src/powerups.js; clubhouse placement remains unbuilt.

## Snow Jam implementation — 2026-09-11
Polar-bear cushion (floor), puffin perch (tabletop), aurora lamp (tabletop), ice-drum side table (floor, support top) and Arctic band music box (tabletop) are now earned at 2/4/8/12/20 played phrases. The connection is original thematic imagery derived from the publisher's Arctic friendship cast, not literal novel possessions. Sizes, floor/support conventions and provenance are in the-very-very-far-north/plans/requirements.md and src/core.js. Ownership is saved; clubhouse placement is not implemented.

Snow Jam is archived intact at `the-very-very-far-north/archive/midnight-snow-jam-v0.1.0`. Arctic Duet is now canonical and independently awards `duet-snow-cushion`, `puffin-window-star`, `aurora-wool-rug` and `together-pennant` at stable catch totals from `arctic-duet-v1`. These floor/wall forms do not reuse Snow Jam IDs or import its progress; definitions live in `the-very-very-far-north/src/arctic-duet/core.ts`.

## Picture Day Parade keepsakes — 2026-09-12
Framed game photo (first kept photo), camera lamp (3 unique moments), photo-backdrop screen (6 unique moments) now have persistent ownership. src/core.js in popcorn records stable IDs, mount categories, dimensions, footprints, clearance and original photography-theme rationale. Framed snapshots retain exact deterministic scene/crop state. Placement remains deferred; no shared save or clubhouse files modified.

## Contraption Club experiment rewards — 2026-09-12
Spring ornament (5 deliveries, tabletop .18×.18×.22 m) and mini popcorn machine (20 deliveries, tabletop .45×.24×.48 m) have persistent ownership and spatial metadata in popcorn/experiments/contraption-club/src/core.js. Both are original machine-themed extensions of the Popcorn title, not literal book objects. No floor walking obstruction and no support surfaces of their own. Actual placement remains deferred.

## Midnight Merienda implementation — 2026-09-12
Moonlight snack tray (3 serves), Little menu sign (8), Pocket food truck (15), Festival serving counter (25) now have persistent ownership. Original food-service designs derived loosely from the family-food-truck premise. Sizes, mounts, footprints, clearance and counter support top are in mabuhay/src/core.js; actual clubhouse placement is deferred.

Midnight Merienda is archived intact at `mabuhay/archive/midnight-merienda-v0.1.2`. Moonlight Munch Run is now canonical and keeps its separate `moonlight-munch-run-v1` progression and reward definitions in `mabuhay/src/shooter-model.ts`; Merienda ownership is neither deleted nor imported.

## Gummy Nook implementation — 2026-09-13
Candy jar (welcome tier 2), Gummy lamp (tier 3), Soft sock cushion (tier 4), and Gummy-bear beanbag (tier 6) have saved ownership. Stable IDs, mounts, dimensions, footprint, clearance and original candy/comfort rationale are defined in not-if-i-can-help-it/src/core.js. The decorative shelf displays ownership; actual clubhouse placement is deferred.

## Gummy Nook match-3 progression — 2026-09-13
0.2.0 retains all prior item IDs, forms and ownership. Candy jar is a welcome gift; lamp/cushion/beanbag now unlock at 12/40/100 matched gummies. Bunny/bear display shapes unlock at 40/100; five types remain on the board. V1 ownership is retained during migration. Placement metadata is unchanged.
