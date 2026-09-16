# Phone walkthrough revision verification — 2026-09-16

## Application review

- Application regression suite: 98/98 passing, including the town/camera/icon changes.
- Fishing outcome audit: exactly one `< 0.30` completed-reel decision, followed by
  weighted species selection only on a catch. No extra success roll in collection
  awards. A uniform 1,000-outcome threshold check gives exactly 300 catches; this
  is a model check, not a claim about a physical phone session or its short sample.
  A seeded 10,000-completed-reel simulation produces 3,023 catches (30.23%).
- Cast duration and both wait limits are doubled (1.16 seconds casting, then
  1.9–3.1 seconds waiting). Reel has no timing expiry. Counts/rarities unchanged.
- Waterfall terrain collision and bank fishing eligibility agree. Raised source
  terrain is blocked; the moved windmill has a reachable approach via the bridge.
- Browser visually reviewed the larger cliff-sided waterfall, uphill source
  channel, far-bank signless windmill and retained original fountain. Historic
  comparison fountain assets remain archived but are not loaded or interactive.
- Browser reviewed Wishbone's SVG sound/fullscreen/help/pause controls and
  launched from Long Walk Home's whole-yard view. Model checks establish no
  release-frame snap, bounded fast zoom easing, pause and reduced-motion behavior.
- Sound SVG updates only when status/mute changes, not on every animation frame.

## Standalone and publication evidence

The active typed menu contains 14 standalone previews plus integrated Wishbone.
Door Atelier is no longer active; its source and archived snapshot remain intact.
The origin manifest records 20 exact original standalone build files and SHA-256
hashes. New concept playables embed required local art and have no remote runtime
dependencies. The snapshot refresh tool copies builds, never reauthors gameplay.

Original suites/builds: Pocket Funhouse 8 checks, Arctic parent 21, Merienda 6,
Gummy 14, Contraption 11, new Luminous Locks 6 and new Moonlight Munch Run 9.
Stormglide's test covers rotation/world coordinates and aspect-preserving canvas.
All original canonical artifacts were rebuilt before packaging.

Browser review uses 844×390 phone-landscape emulation, not a physical phone.
Merienda's compact customer/pan/serving layout fits the viewport; Clear Plate and
Less Motion remain accessible. Gummy's full square tray and Undo/Hint/Mix fit.
Arctic uses a wide stage. Contraption has a larger aspect-preserved board,
scrollable side toolbox and separate accessible level selector/reset controls.
Stormglide preserves a run's world/collectible bounds with aspect-preserving
rotation; it may letterbox when orientation changes rather than crop collectibles.

Root reviewed and completed both packaged mansion puzzles, including artwork,
lit receiver feedback and unlocked room selection. Final routes match the visible
corner arms and the observatory has different authored geometry. Packaging review
caught and fixed head-script startup order and oversized CSS image-variable
failures; images now use standard embedded img sources. The trial uses an arched
passage reveal, free hints/reset/undo, validated local saves and accessible controls.

Moonlight Munch Run's strict model checks include 20 minutes of continuous play,
independent left/right pointer ownership, once-only feeding and save recovery.
Agent browser playthrough observed a fed creature's YUM/departure, saved count
after reload, and help/pause freeze. Root inspected its exact packaged landscape
art/control layout and launched food with desktop controls. No game-over system.

Build output has the existing large-bundle warning; no claim of optimized mobile
download size is made. Publication reuses the owner-private identity in hosting.json;
the deployment receipt lives with shared plan 36 rather than modifying reviewed
source after packaging. Final build and preview verification pass: 14 previews /
20 files have exact snapshot, production and served bytes, correct MIME and an
unknown-route 404 response.
No physical-device testing or listening to sound is claimed. Saves remain local
to each browser/origin/game; this revision does not add accounts or multiplayer.
