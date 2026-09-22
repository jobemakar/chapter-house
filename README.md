# Chapter House — integrated slice

## Integrated game workspace — 2026-09-19

Chapter House now integrates all ten canonical TypeScript games:
Wishbone Fling, Dig & Douse, Pocket Funhouse, Arctic Duet, Gummy Nook,
Contraption, Stormglide, Bureau After Dark, Moonlight Munch Run, and Veda's
Great Escape. Each is an
independent npm workspace package with a direct standalone Vite target and the
same package-owned gameplay implementation lazy-loaded inside Chapter House—no
iframe or `postMessage` bridge.

Veda's Great Escape is now the canonical *The Elephant in the Room* game. Its
five-puzzle JavaScript study was ported to the same strict TypeScript/OOP package
boundary as the other games; the earlier Sanctuary Seasons proposal is
superseded. No legacy preview cards remain.

Package/source/save/reward details and verification are in the
[migration log](docs/workspace-game-package-migration-log.md) and
[repeatable recipe](docs/game-package-migration.md). Accounts, Firebase and
live visits remain later work. No publication is implied by this local work.

## Veda painted-diorama migration — 2026-09-22

Veda's Great Escape is locally at package revision 1.1.0. The migration keeps
the five authored 9×7 puzzles, `veda-great-escape.v1` save key, progress
version 1, reward IDs and active-play accounting while replacing the emoji study
with package-owned painted sprites, authored directional frames, bounded board
feedback and gesture-gated semantic audio. The [concept provenance](docs/concepts/vedas-great-escape/asset-provenance.md)
and [verification receipt](docs/veda-painted-diorama-verification.md) record
the source prompts, hashes, exact checks, browser evidence and unverified
physical/listening boundary. This revision is local only; no Site was updated.

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

This repository is an npm workspace. Every game declares its direct runtime
dependencies in its own package while the repository shares one root lockfile.
Run any game by itself with its root shortcut:

```sh
npm run dev:wishbone       # 5193
npm run dev:douse
npm run dev:pocket         # 5194
npm run dev:arctic         # 5195
npm run dev:gummy          # 5196
npm run dev:contraption    # 5197
npm run dev:stormglide     # 5198
npm run dev:bureau         # 5199
npm run dev:moonlight      # 5200
npm run dev:veda           # 5201
npm run check --workspaces --if-present
```

Dig & Douse uses port 5192. Each standalone adapter uses its game-specific
browser save. Chapter House supplies the integrated profile, lifecycle,
active-play currency, navigation, and reward inventory through the typed
`@chapter-house/game-host` contract.

The `dist/` directory is generated. Source is in `src/`; never edit the generated bundle. A portable local copy and PowerShell launcher are supplied in the task's outputs folder. That copy needs Node 24, but no npm installation or network connection to play.

## Play

Choose Clover the cat or Pip the bunny as a free starter. Tap open floor to walk, drag to pan, and use a mouse wheel or pinch to zoom. A focused room also accepts arrow keys/WASD. The translucent top bar keeps icon-only destinations and activities available throughout the app; accessible names and tooltips retain their meaning, and Decorate dims outside. React opens a scrollable attached grid of 50 emoji. Wave and Jump perform their animations without adding a reaction bubble, while Call pet has its own whistle icon rather than reusing Pets. Every enabled UI button has hover feedback. Tap a visible pet directly to pet it.

Decorate lets you choose furniture, tap its new floor spot, rotate, place, cancel, or store it. Invalid placements preserve the item; Undo reverses the last room edit. Furniture is solid, navigation routes around it, and 3D depth handles occlusion. Floors and walls stay fixed.

Cancel, placement and storage keep decorating active; tap another piece or choose Done to finish. Outside decorating, tap the reading lamp to toggle its locally saved light. Quiet room music begins with your first interaction; the shared sound button controls music and UI/pet/jump sounds. Room music stops while Wishbone is open.

The [feedback pass](docs/feedback-01.md) adds expressive jump/wave poses, stable arrival direction and rounded action buttons. Larger or connected rooms are recorded for later. More avatar accessories are proposed, not included in this polish pass.

Games opens any of the ten integrated titles. While playing, Exit game replaces the brand and destination buttons on the left; name, currency, mute, fullscreen, and help remain on the right. Package-owned duplicate exit/mute/fullscreen controls are hidden only in the integrated host and remain available in standalone builds. Durable game progress persists in the Chapter House profile, and each namespaced reward is validated, granted once, and mapped to a placeable catalog keepsake. Game rewards cannot be bought.

Active play earns one coin per ten counted seconds, independent of score. Idle, paused and hidden games stop earning. A fern costs 12, the cheapest additional pet 60; furniture copies are distinct, pet ownership is unique. These are named developer tuning values, not final economy balancing.

## Implementation map

- `src/main.ts`: application navigation, panels and settings.
- `src/core/profile.ts`: versioned local profile, inventory, transaction receipts, rewards and monotonic activity credits; storage is injected through `StoragePort`.
- `packages/game-host/`: framework-neutral pause/mute/flush/dispose session and
  typed host-service contract shared by integrated game packages.
- `packages/game-dig-and-douse/`: one Dig & Douse gameplay implementation,
  assets, direct dependencies, tests, standalone adapter, and integrated entry.
- `packages/game-*/`: the other independently runnable game packages, each with
  package-owned progress, manifest, runtime, assets, tests, and standalone host.
- `src/core/integrated-games.ts`: generic game discovery, lazy factories,
  progress codecs, summaries, and reward allowlists.
- `src/core/game-session.ts`: compatibility re-export of the shared lifecycle
  boundary for the existing Wishbone integration.
- `src/core/catalog.ts`: furniture/pet metadata, prices and legacy reward mapping.
- `src/room/room.ts`: orthographic Three.js room, actor paths, editor and camera controls.
- `src/room/navigation.ts`: footprint validation and A*; diagonal corner cutting is rejected.
- `src/room/motion.ts`: route following with stable arrival heading.
- `src/room/audio.ts`: gesture-gated procedural ambient music and interaction sounds.
- `src/room/art.ts`: reusable 3D furniture and animal rig factories; directional animation uses world rotation.
- `src/room/portraits.ts`: cached catalog and wardrobe portraits from the actual room models.
- `tests/`: real physics/regression, save/economy/navigation and controller lifecycle tests. The DOM harness does not claim to be a real browser or audio listening test.

## Saves and migration

`chapter-house-profile-v1` owns the integrated profile. On first use it can import `wishbone-floppy-fetch-v1` from the same browser origin. The original key and other Fetch keys stay untouched; the complete imported payload is retained as `legacySnapshot`. This cannot read a demo hosted at a different origin. Cleared browser data is not recoverable without a backup; cloud persistence is later.

Keepsakes use stable `reward-{id}` instances. Repeated sync cannot grant a second bed. Spending and ownership update in one local profile snapshot; replayed purchase IDs are rejected. Active-time snapshots are monotonic and cannot pay twice. This is single-browser persistence, not a substitute for Firebase transactions across multiple clients.

Storage failure leaves the game playable in memory and displays a persistent saving-unavailable notice. Preferences, room layout, inventory, pet roster and durable progress for all integrated games save together. Transient live boards stay package-owned. Departing disposes frame callbacks, listeners, observers, physics and audio.

## Scope and remaining work

This subset has one fox avatar (four fur colors, scarf/bow/none), two starter choices, three total pet kinds and a compact ordinary-furniture shop. Final species switching, 15 pets, mystery pet, earned wardrobe, wall-item editing, admin/member accounts and social synchronization remain in the product plan. They are not simulated here.

Physical phone/iPad testing and listening on actual speakers remain pending. Browser viewport checks cover portrait/landscape and tablet/desktop dimensions. Fullscreen support depends on the host browser; failure shows a fallback notice. Price pacing and the generosity of the active-play window should be tuned with actual children.

See `docs/verification.md`, `docs/provenance.md`, and the collection's `plans/19` through `plans/22` for requirements and the next checkpoint.

## Interactive furnishings and five-yard pass

Decorate includes a free local preview bowl, aquarium and pet trampoline. Tap a placed bowl to fill it (saved locally), a tank to make swimming fish dart, or a trampoline to invite a pet to bounce. Duplicate pieces are available in the shop. The currency uses a round gold coin. See [plan](docs/feedback-02-plan.md) and [verification](docs/feedback-02-verification.md). The camera update below supersedes the original scrolling deferral.

## Camera and feeding update

Restack and Keepsakes now use large icons. Drag away from the launcher to pan; use +/−, wheel or pinch to zoom, and the overview button to see the whole yard. Detailed views follow a throw and return to the launcher. Background layers move at different rates. The upward-boost gadget is now a spring pad. Magnet levels show a horseshoe and metal blocks; classics have fewer incidental gadgets. Tap an empty bowl to fill it, then a full bowl to send a pet to eat and empty it. See docs/feedback-03-plan.md and docs/feedback-03-verification.md. This supersedes the earlier camera deferral.

## Village and simpler Fling update

Outside opens Willowbrook square: walk or drag to explore, tap the nearby fountain to toss a free cosmetic coin, and return through the persistent top bar. There is no fountain shortcut, recenter button, or explicit zoom button; wheel and pinch zoom remain. Trees, buildings, stream and fountain constrain routes; water sound attenuates with the view. One shared roaming controller gives pets the same calm speed, bounded-near-avatar behavior, and obstacle-aware routing indoors and outside. Your Look changes rebuild the visible Willowbrook avatar immediately without leaving the panel.

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
