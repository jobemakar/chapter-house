# Collection feedback verification — 2026-09-16

## Implemented

Veda tap-select/tap-destination and legal-move glow; Contraption cool solid
bolted mounting versus warm dashed draggable grips/cursors; Gummy fine-pointer
icon lift/highlight with Motion-off/reduced-motion static feedback; seven
generated Merienda pan/food/topping sprites in the existing night-market layout.
Pocket Funhouse remains byte-identical to its canonical standalone. Door Atelier
adds three original 3D miniature-door scenes with separate `door-atelier-v1`
progress. It is a visual/mechanic trial, not a replacement.

Town adds a fixed Kenney block/timber/roof tower with independently rotating
sails, a comparison garden fountain beside the existing wishing fountain, a
Nature Kit waterfall with animated streaks/foam and rock backing, and an organic
curved stream with restrained flowing glints. TownStream supplies the exact
same banks to the water ribbon, fishing lure targets and navigation. New scenery
has blocked footprints and the bridge remains the only crossing. Original
coin behavior, saved profiles, IDs, rewards and economy are unchanged.

## Automated / static checks

- Application: 93 tests pass, including lifecycle/save/economy/physics regressions,
  curved-bank collision/fishing, actual drawn ribbon bank vertices, reduced
  water motion and status-tool invalid-input rejection. Strict TypeScript and
  production build pass. Existing single large application bundle warning
  remains; no capacity or physical-device performance claim.
- Preview verifier: 13 previews / 21 files have exact snapshot, production and
  HTTP-served bytes, expected MIME, and unknown local preview route 404.
- All 21 snapshots independently match original canonical builds/dependencies.
  SHA-256, byte counts and original paths are in preview-origin-manifest.json.
  The application build now requires no sibling game repositories.
- Merienda: six core checks pass. Gummy: fourteen board/power/save checks pass.
  Contraption: eleven tests pass, including all six authored solutions across
  fifteen seeds, immutable fixed geometry and output parity.
- Veda: original puzzle checker solves all five levels (7/9/18/18/26 moves);
  authored game.js syntax passes. The original repository tracks readable
  game.js/style.css under dist and has no separate build pipeline; those source
  files were changed, then copied exactly—not an opaque HTML-only edit.
- Door Atelier: all three authored piece/socket/mechanism/key/lock/open solutions,
  reset, repeated free help, explicit key pickup and malformed-save recovery
  checks pass; TypeScript/Vite production build passes.

## Observable browser checks

Desktop town: local GLBs finish loading; stationary tower with rotating sail
orientations, both fountains, curved banks, water and corrected front-facing
waterfall/rock backing inspected. Title fades after entry. Existing bridge is
visible; complete crossing routes are checked automatically rather than claimed
as a new physical-device walking test.

Merienda: opened kitchen, cooked/ flipped/ plated a bun, applied a matching
topping, served Moss and observed the served count increase and replacement
customer. All seven sprite types load. Inspected 390×844 kitchen: no horizontal
overflow, visible food/empty-pan imagery, coherent order/topping composition.
Art influenced layout: held basin stays empty beneath snack overlays and
toppings are smaller than the food base. Customers/scenery/keepsakes unchanged.

Door Atelier: manually collected the part, selected inventory, installed it,
operated mechanism, collected key, unlocked and opened Brass Garden Door;
inspected orbit and 390×844 layout. Review caught and fixed camera cropping,
ring-center touch misses, narrow rotating-key targets and unsafe save input.
Other two solutions are automated checks, not claimed full manual playthroughs.

Veda: 390×844 layout shows a large D-pad and recovery controls; tapped elephant
to reveal destinations, then tapped a glowing adjacent square and verified the
position/move count. Existing swipe/keyboard support remains.

Gummy: fine-pointer hovered candy has the expected upward transform/highlight,
verified after mouse selection; motion overlays remain independently layered.
Contraption: inspected mounting/drag contrast and labels in the workbench.
Game menu contains all thirteen links and separate-save labels at desktop and
phone width. Read-only WebMCP status succeeds with `{}` and rejects unexpected
input without changing the world. Temporary active viewport overrides reset.

No physical phone/iPad, speaker listening, multiplayer, cross-origin save
transfer or exhaustive unchanged-demo playtest is claimed. Gummy agent's ad-hoc
overlay browser server lacked its expected support paths; its seven 404s were
reported rather than counted as game failures. Production preview dependency
and core checks pass independently.

## Publication

One new owner-private Chapter House ChatGPT Site is registered in
.openai/hosting.json; no earlier standalone Sites were replaced. Publication
uses the reviewed static build, retaining original game repositories/saves.
The deployment outcome and literal production URL are returned by the Sites
connector in the task handoff; success is not inferred from registration.
