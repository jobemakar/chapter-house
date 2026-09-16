# Chapter House — integrated slice

## Standalone demo previews — 2026-09-16

Open **Games** and scroll to **Explore the other demos**. All ten books are
represented: integrated Wishbone Fling plus nine other standalone book demos,
with three extra comparisons (Backyard Ruckus, Arctic Duet and Contraption Club).
Previews open in new tabs and do not award Chapter House coins or keepsakes.
They retain their existing gameplay and browser-local save keys.

The typed catalog is `src/core/game-previews.ts`. The Vite preview bridge serves
and packages exact existing standalone builds and allowlisted dependencies.
Three previously uncatalogued builds are retained as immutable artifacts in
`preview-sources/`; their original editable projects remain untouched. See
[source provenance](docs/preview-sources.md), [plan](docs/game-previews-plan.md)
and [verification](docs/game-previews-verification.md). After building, run
`npm run verify:previews -- http://127.0.0.1:5191/` against the active local server
to compare every served and built preview with its source bytes.

This is access for review, not integration of the other nine games. Bureau After
Dark and Veda retain optional Google Fonts requests from their original files.
No publication is implied by this local menu update.

A TypeScript application connecting a cozy 3D library clubhouse to Wishbone Fling. This is checkpoint BOB-SLICE-01A: the shared space plus one game, playable locally or from the static public demo. Accounts, Firebase and live visits are checkpoint B. No other game has been integrated or changed.

## Public demo

The current committed build is published at
[jobemakar.github.io/chapter-house](https://jobemakar.github.io/chapter-house/).
This is static GitHub Pages hosting: progress is saved only in that browser and
there are no accounts, shared visits or server-side synchronization yet.

## Run and develop

Node 24 is used for this build. In this directory:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5190/. Keep this origin (including port) to keep the same browser save. The generated production version can be served with `node tools/serve.ts dist 5190`; that server binds only to this computer. Stop any existing development server using that port first.

```sh
npm run typecheck
npm test
npm run build
```

The `dist/` directory is generated. Source is in `src/`; never edit the generated bundle. A portable local copy and PowerShell launcher are supplied in the task's outputs folder. That copy needs Node 24, but no npm installation or network connection to play.

## Play

Choose Clover the cat or Pip the bunny as a free starter. Tap open floor to walk; drag to pan and use +/− to zoom. A focused room also accepts arrow keys/WASD. Wave, jump, call your pet, or pet it through the Pets panel. Tap a visible pet directly for the same interaction.

Decorate lets you choose furniture, tap its new floor spot, rotate, place, cancel, or store it. Invalid placements preserve the item; Undo reverses the last room edit. Furniture is solid, navigation routes around it, and 3D depth handles occlusion. Floors and walls stay fixed.

Cancel, placement and storage keep decorating active; tap another piece or choose Done to finish. Outside decorating, tap the reading lamp to toggle its locally saved light. Quiet room music begins with your first interaction; the shared sound button controls music and UI/pet/jump sounds. Room music stops while Wishbone is open.

The [feedback pass](docs/feedback-01.md) adds expressive jump/wave poses, stable arrival direction and rounded action buttons. Larger or connected rooms are recorded for later. More avatar accessories are proposed, not included in this polish pass.

Games opens Wishbone Fling. Pull back from the left of its yard, then release. Five new focused yards showcase a bridge, domino chain, lever gate, bellows and magnet; the two original yards remain under Classics. A forked wooden slingshot and compact overlay controls replace the heavier framing. Recall appears only while Wishbone is away; keepsakes remain accessible. Durable progress persists; collectible pocket powers have been removed. Fourteen throws earn a Patchwork dog bed; return to Decorate to place it. All nine original keepsakes have floor display models. Game rewards cannot be bought.

Active play earns one coin per ten counted seconds, independent of score. Idle, paused and hidden games stop earning. A fern costs 12, the cheapest additional pet 60; furniture copies are distinct, pet ownership is unique. These are named developer tuning values, not final economy balancing.

## Implementation map

- `src/main.ts`: application navigation, panels and settings.
- `src/core/profile.ts`: versioned local profile, inventory, transaction receipts, rewards and monotonic activity credits; storage is injected through `StoragePort`.
- `src/core/game-session.ts`: common pause/mute/flush/dispose lifecycle boundary.
- `src/core/catalog.ts`: furniture/pet metadata, prices and legacy reward mapping.
- `src/room/room.ts`: orthographic Three.js room, actor paths, editor and camera controls.
- `src/room/navigation.ts`: footprint validation and A*; diagonal corner cutting is rejected.
- `src/room/motion.ts`: route following with stable arrival heading.
- `src/room/audio.ts`: gesture-gated procedural ambient music and interaction sounds.
- `src/room/art.ts`: reusable 3D furniture and animal rig factories; directional animation uses world rotation.
- `src/room/portraits.ts`: cached catalog and wardrobe portraits from the actual room models.
- `src/games/wishbone/`: explicit typed physics, articulated dog, renderer, progression, audio and session controller. No iframe, legacy script imports or global script ordering.
- `tests/`: real physics/regression, save/economy/navigation and controller lifecycle tests. The DOM harness does not claim to be a real browser or audio listening test.

## Saves and migration

`chapter-house-profile-v1` owns the integrated profile. On first use it can import `wishbone-floppy-fetch-v1` from the same browser origin. The original key and other Fetch keys stay untouched; the complete imported payload is retained as `legacySnapshot`. This cannot read a demo hosted at a different origin. Cleared browser data is not recoverable without a backup; cloud persistence is later.

Keepsakes use stable `reward-{id}` instances. Repeated sync cannot grant a second bed. Spending and ownership update in one local profile snapshot; replayed purchase IDs are rejected. Active-time snapshots are monotonic and cannot pay twice. This is single-browser persistence, not a substitute for Firebase transactions across multiple clients.

Storage failure leaves the game playable in memory and displays a persistent saving-unavailable notice. Preferences, room layout, inventory, pet roster and durable Wishbone progress save together. A departed yard checkpoint is kept as a convenience, while pause retains the live transient board. Departing disposes frame callbacks, listeners, observers, physics and audio.

## Scope and remaining work

This subset has one fox avatar (four fur colors, scarf/bow/none), two starter choices, three total pet kinds and a compact ordinary-furniture shop. Final species switching, 15 pets, mystery pet, earned wardrobe, wall-item editing, admin/member accounts and social synchronization remain in the product plan. They are not simulated here.

Physical phone/iPad testing and listening on actual speakers remain pending. Browser viewport checks cover portrait/landscape and tablet/desktop dimensions. Fullscreen support depends on the host browser; failure shows a fallback notice. Price pacing and the generosity of the active-play window should be tuned with actual children.

See `docs/verification.md`, `docs/provenance.md`, and the collection's `plans/19` through `plans/22` for requirements and the next checkpoint.

## Interactive furnishings and five-yard pass

Decorate includes a free local preview bowl, aquarium and pet trampoline. Tap a placed bowl to fill it (saved locally), a tank to make swimming fish dart, or a trampoline to invite a pet to bounce. Duplicate pieces are available in the shop. The currency uses a round gold coin. See [plan](docs/feedback-02-plan.md) and [verification](docs/feedback-02-verification.md). The camera update below supersedes the original scrolling deferral.

## Camera and feeding update

Restack and Keepsakes now use large icons. Drag away from the launcher to pan; use +/−, wheel or pinch to zoom, and the overview button to see the whole yard. Detailed views follow a throw and return to the launcher. Background layers move at different rates. The upward-boost gadget is now a spring pad. Magnet levels show a horseshoe and metal blocks; classics have fewer incidental gadgets. Tap an empty bowl to fill it, then a full bowl to send a pet to eat and empty it. See docs/feedback-03-plan.md and docs/feedback-03-verification.md. This supersedes the earlier camera deferral.

## Village and simpler Fling update

Outside opens Willowbrook square: walk or drag to explore, tap the nearby fountain to toss a free cosmetic coin, and return to the clubhouse. There is no separate coin button. Trees, buildings, stream and fountain constrain routes; water sound attenuates with the view. Avatar thought-cloud reactions and pet speech bubbles accompany actions and feeding.

2026-09-16: Wishbone's fence now has its own near-world layer, with ground-anchored
zoom and faster parallax than the mountains. The lawn extends to the viewport
edges in wide overview. See [plan](docs/feedback-05-plan.md) and
[verification](docs/feedback-05-verification.md).

Levels → The Long Walk Home is the new wide spring-only yard. Overview, pan/zoom and flight follow show its full width. The Y-fork launcher holds Wishbone in a lower leather pouch, and dog/block impacts use a short procedural rustle. Pocket power collection and activation are removed; archived data and already-owned displays remain. See docs/feedback-04-plan.md and docs/feedback-04-verification.md.

## Outdoor woodland pass — 2026-09-15
The outdoor houses have been replaced with a Kenney-based woodland setting. See docs/woodland-village-plan.md, docs/woodland-assets.md and docs/woodland-village-verification.md. Twelve locally packaged GLBs plus their texture and license files total about 272 kB. No external requests are needed at play time. Assets are loaded per outdoor scene and shared between clones; terrain streaming remains future work.

## Collection feedback — 2026-09-16

Games opens thirteen standalone previews, including Door Atelier alongside the
unchanged Pocket Funhouse. All required preview builds/dependencies now live in
preview-sources; the application builds without sibling repositories. Saves and
rewards stay separate. Veda supports tap-select/tap-destination, Contraption
labels fixed versus draggable devices, Merienda uses generated kitchen sprites,
and Gummy has fine-pointer icon hover feedback.

Outside includes a Kenney windmill with rotating sails, a second garden fountain
for comparison, curved flowing water and an animated Nature Kit waterfall.
TownStream defines the common bank boundary for art, collision and fishing;
only the bridge crosses the water. See docs/collection-feedback-06-plan.md and
docs/collection-feedback-06-verification.md. Physical-phone testing remains pending.
