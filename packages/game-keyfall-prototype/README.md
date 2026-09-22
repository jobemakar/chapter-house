# Keyfall exploratory prototype

An unregistered, standalone TypeScript/Vite prototype for the abandoned-funhouse
physics idea. Swipe over velvet cords to release the brass key, collect three
optional clue tickets, and guide it into the glowing keyhole. It is deliberately
separate from Pocket Funhouse and uses only the versioned save key
`chapter-house:keyfall-prototype:v1`.

From `application/`:

```sh
npm run typecheck -w @chapter-house/game-keyfall-prototype
npm test -w @chapter-house/game-keyfall-prototype
npm run build -w @chapter-house/game-keyfall-prototype
npm run dev -w @chapter-house/game-keyfall-prototype
```

The file-backed room picker follows `public/levels/index.json` in order. The
initial files retain the complete 20-room Campaign and three Prototype rooms.
Campaign contains exactly two transformed MIT
adaptations and eighteen original rooms authored from coordinate-free briefs.
Rooms 03-08 introduce one concept at a time, 09-14 pair mechanics, and 15-20
use readable multi-step combinations. See
[docs/original-campaign.md](docs/original-campaign.md) for the briefs, room list,
clean-room boundary, recovery grammar, and batch verification. The
prototype rooms still demonstrate a direct drop, a two-cord pendulum sequence,
and a bumper plus tappable bellows. The approved cartoon funhouse background is
packaged locally; cords, key, tickets, props, and goal are separate live objects.
See [cartoon art provenance](docs/cartoon-art.md). Progress and settings are
local-only. No rewards are granted.

## Local level editor

Start the development command above, then open
`http://127.0.0.1:5198/editor.html`. The game remains at
`http://127.0.0.1:5198/`. Both use the same renderer, physics and input handling.

The separate desktop-first editor creates blank rooms or copies saved rooms,
places and moves built-in objects, rotates platforms and fans,
and provides undo/redo, numeric coordinates and optional grid snapping. Fan
power and platform length are adjustable; bounce and thickness stay fixed. Round bumpers remain
available alongside flat platforms. Every anchor connects automatically to the
one key using the initial distance.

Save writes one versioned JSON level file directly to `public/levels/<id>.json`.
Drafts may omit the key, goal or tickets; the editor lists problems before Play
or campaign inclusion. Play starts a fresh test with no player-save writes;
Stop restores the exact editing layout. Save is explicit and unsaved work is
marked. Add/remove/reorder operations affect the campaign list separately;
**Save order** writes `public/levels/index.json`. Removing a campaign entry does
not delete its level file. A successful playtest is informational, not a gate.

The game reads only included, valid files and reports missing/invalid entries.
Reload gameplay after saving changes. Level saves do not trigger editor HMR,
which would otherwise discard editing history. All 23 original files remain
available as starting material; no old level or progress record was deleted.
`src/rooms.ts` retains the historical authored fixtures and trace regression
tests; normal gameplay now reads the JSON files, not a fallback to those fixtures.

The file-write API exists only on the loopback development server, accepts
same-origin JSON writes, and writes only into the levels directory. Built game
output includes the level files and order but has no filesystem-write service.
No database, custom-image uploads, cloud sync or publication is introduced.

The campaign's two licensed adaptations are pinned to
`emersion/mlgrope` commit `1c398f18dfb5977fb1f7fcb8a671584a102f406a`, paths
`levels/0.csv` and `levels/1.csv`. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
or the in-game **Credits & licenses** link for the complete MIT notice. The
source CSVs are not shipped or loaded at runtime. Human-readable transformation
notes are in [docs/mlgrope-transformations.md](docs/mlgrope-transformations.md).

`src/completion-traces.ts` checks in typed, fixed-step zero-ticket and
three-ticket pointer traces for all twenty campaign rooms. `src/trace-replay.ts` applies
them through production cord hit-testing and world-element taps at 16 ms per
tick. Tests prove all twenty rooms reach the lock with zero tickets, every one
of the sixty tickets is reachable and bankable, and Draft Gallery's taught bubble-first
route remains successful across 256–1,504 ms of ordinary cut reaction delay.

The reusable Phase 2 runtime is present without adding campaign rooms. Typed
world-element definitions create bubbles, continuous or tappable air jets,
movable counterweights, and gentle-reset hazards through `PhysicsRoom` and
`WorldElementFactory`. Each exposes an immutable render snapshot and a complete
create/update/collision/tap/dispose lifecycle. Pointer input is arbitrated into
one tap or one slash, so operating a device cannot also sever a cord.

## Fans and platforms

**Q / E** rotates any selected rotatable object left/right by 15° (outside text
fields), with undo support. **Wall** adds a solid wooden barrier with adjustable
40–280px length and 20px thickness. It rotates like a platform but has no rebound.

The former bellows are now animated fans. Select **Fan** and edit **Rotation °**
to aim airflow: 0° right, 90° down, 180° left, -90° up. Tap in play to activate
the push. **Power ×** adjusts fan push and blade speed from 0.25× to 3×, with
1× retaining the original strength. **Length px** sets a platform's length
from 40 to 280 logical pixels; thickness and bounce remain fixed. Ctrl/⌘ D
duplicates the selected object outside text fields. Tickets gently sway and
bob, respecting pause and reduced-motion settings.
Existing files keep the `bellows` kind and their
original trajectories; the editor converts stored angles to airflow headings.

## Rope tuning

Bubble/balloon lift is controlled by `BUBBLE_TUNING.accelerationScale` near the
top of `src/elements.ts`. It is now `0.1` (10% of original net upward
acceleration); `1` restores the original lift. Gravity is compensated before
scaling, so the bubble still rises. Per-level `buoyancy` values are unchanged.

The primary feel controls are `CORD_TUNING` near the top of `src/physics.ts`:

- Lower `stiffness` allows more stretch; higher values pull toward the rest
  length more aggressively.
- Lower `damping` preserves more bounce; higher values settle the key sooner.
- `PHYSICS_TUNING.constraintIterations` controls how many times Matter solves
  constraints per step and therefore also affects the apparent stiffness.

The current user-selected feel uses stiffness `0.002`, damping `0.001`, and two
constraint iterations. A cord copies these values when its room world is
created, so use the in-game room reset or reload the page after changing them.

Each rope is an actual articulated Matter chain, not a drawn curve. Point count
comes from `PHYSICS_TUNING.cordPointSpacing` (currently about one point per nine
canvas pixels), and each point's mass comes from `cordMassPerPixel`. This keeps
short and long ropes at the same simulation resolution and linear mass density.
Gravity and momentum create sag from those masses; the renderer merely traces
their live positions. Per-link stiffness is derived from `CORD_TUNING.stiffness`
and the connection count so changing rope length does not silently change the
material's whole-rope stretch by putting more springs in series.
