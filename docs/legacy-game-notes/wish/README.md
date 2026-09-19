# Wishbone Fling

Wishbone Fling is the repository’s canonical game candidate, retained in its
current JavaScript experiment form and **deferred for a behavior-preserving
TypeScript/OOP port**. Its authored experiment files, generated playable, and
`wishbone-floppy-fetch-v1` save contract are intentionally unchanged by this
migration.

Backyard Ruckus 0.2.0 is a runnable historical closure at
[archive/backyard-ruckus-v0.2.0](archive/backyard-ruckus-v0.2.0/ARCHIVE.md).
That archive retains its byte-verified generated outputs and
`wishbones-big-fetch-v1`/`wishbones-big-fetch-v2` contracts.

## Canonical Fling

- [Standalone Wishbone Fling](playable/Wishbone-Fling.html)
- [Authored experiment](experiments/floppy-fetch/README.md)

Run `npm ci`, then `npm run build` to rebuild the Fling outputs and `npm test`
for its current 18 simulated physics/input/powerup checks. The root build still
uses shared legacy Backyard support modules, which must be ported together with
Fling rather than rewritten piecemeal during this archival migration.

---

# Archived reference: Wishbone’s Big Fetch: Backyard Ruckus

Version 0.2.0 · local playable prototype · inspired by *Wish* by Barbara O’Connor.

Pull a rolled sock backward and release it into a wobbly tower. Wishbone charges after it, shoving boxes and hopping through the rubble. Knock four squeaky toys off their perches. Another sock is available after about one second; you never have to wait for the dog to return. Partial destruction stays between throws.

## Play
- [New physics game](playable/Wishbones-Big-Fetch.html)
- [Original hoop-fetch demo, preserved](playable/Wishbones-Big-Fetch-v0.1.html)

Two authored arrangements, unlimited throws, voluntary restacking, six pet-themed keepsakes, sound/mute, pause and gentle-motion controls. Designed for iPad touch; mouse works too. No keyboard required. Landscape gives the largest yard. These are two repeatable playgrounds, not an endless level generator.

## Archived Backyard build and iterate
Run the commands from `archive/backyard-ruckus-v0.2.0` for its preserved build,
preview, and 13 physics/simulated interaction checks.

Edit `src/levels.js` for arrangements; `src/core.js` for physical tuning and dog behavior; `src/render.js` for canvas art; `src/game.js` for touch, controls and feedback; `src/progress.js` for rewards and save migration. Source is readable and independent of the generated HTML. Matter.js is pinned at 0.20.0 and embedded into the build. No CDN, account or runtime network connection is needed. Existing generated watercolor art and licensed fonts remain local.

## Archived Backyard saves and keepsakes
The new `wishbones-big-fetch-v2` key holds throws, unique toys freed, owned keepsakes, best cascade, preferences, selected yard and both yards’ last physical arrangements. Checkpoints save every two seconds and on navigation/pause/pagehide. Moving bodies resume at rest and then obey gravity; active socks and the dog’s chase are not resumed. Restacking is voluntary and keeps earned rewards. Progress is local to a browser/origin, not synchronized between the standalone file and a hosted URL.

The original `wishbones-big-fetch-v1` key is never written by this game. A one-time legacy snapshot preserves recognition of stars, badges, selected disc and yard; existing star totals still identify earlier disc unlocks. The archived original HTML continues to understand its original save. There is no cross-origin save transfer.

Keepsakes have documented floor/tabletop footprints; the doghouse table includes a support surface for the future isometric clubhouse. Placement, avatars, cross-game currency, online services and publication are outside this build.

[Current requirements](plans/requirements-next.md) · [Design](plans/design.md) · [Verification](plans/verification.md) · [Change log](plans/changelog.md) · [Art provenance](plans/assets.md)
