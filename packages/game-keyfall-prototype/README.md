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

The room picker separates the complete 20-room Campaign wing from the three
preserved Prototype rooms. Campaign contains exactly two transformed MIT
adaptations and eighteen original rooms authored from coordinate-free briefs.
Rooms 03-08 introduce one concept at a time, 09-14 pair mechanics, and 15-20
use readable multi-step combinations. See
[docs/original-campaign.md](docs/original-campaign.md) for the briefs, room list,
clean-room boundary, recovery grammar, and batch verification. The
prototype rooms still demonstrate a direct drop, a two-cord pendulum sequence,
and a bumper plus tappable bellows. This is a canvas prototype: the generated concept
image is art direction, while cords, key, tickets, props, and goal are live
objects. Progress and settings are local-only. No rewards are granted.

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

## Rope tuning

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
