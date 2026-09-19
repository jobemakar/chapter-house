# Wishbone’s Big Fetch: Backyard Ruckus

> **Archived 2026-09-19.** This preserved 0.2.0 closure is runnable in place;
> see [ARCHIVE.md](ARCHIVE.md) for the retained save contracts, integrity
> hashes, and isolated verification. Wishbone Fling remains in the parent
> repository as the canonical, deferred-for-TypeScript-port candidate.

Version 0.2.0 · local playable prototype · inspired by *Wish* by Barbara O’Connor.

Pull a rolled sock backward and release it into a wobbly tower. Wishbone charges after it, shoving boxes and hopping through the rubble. Knock four squeaky toys off their perches. Another sock is available after about one second; you never have to wait for the dog to return. Partial destruction stays between throws.

## Play
- [New physics game](playable/Wishbones-Big-Fetch.html)
- [Original hoop-fetch demo, preserved](playable/Wishbones-Big-Fetch-v0.1.html)

Two authored arrangements, unlimited throws, voluntary restacking, six pet-themed keepsakes, sound/mute, pause and gentle-motion controls. Designed for iPad touch; mouse works too. No keyboard required. Landscape gives the largest yard. These are two repeatable playgrounds, not an endless level generator.

## Build and iterate
Run `npm ci`, then `npm run build`. Run `npm start` for the local preview at http://127.0.0.1:4322/. Run `npm test` for physics and simulated interaction checks.

Edit `src/levels.js` for arrangements; `src/core.js` for physical tuning and dog behavior; `src/render.js` for canvas art; `src/game.js` for touch, controls and feedback; `src/progress.js` for rewards and save migration. Source is readable and independent of the generated HTML. Matter.js is pinned at 0.20.0 and embedded into the build. No CDN, account or runtime network connection is needed. Existing generated watercolor art and licensed fonts remain local.

## Saves and keepsakes
The new `wishbones-big-fetch-v2` key holds throws, unique toys freed, owned keepsakes, best cascade, preferences, selected yard and both yards’ last physical arrangements. Checkpoints save every two seconds and on navigation/pause/pagehide. Moving bodies resume at rest and then obey gravity; active socks and the dog’s chase are not resumed. Restacking is voluntary and keeps earned rewards. Progress is local to a browser/origin, not synchronized between the standalone file and a hosted URL.

The original `wishbones-big-fetch-v1` key is never written by this game. A one-time legacy snapshot preserves recognition of stars, badges, selected disc and yard; existing star totals still identify earlier disc unlocks. The archived original HTML continues to understand its original save. There is no cross-origin save transfer.

Keepsakes have documented floor/tabletop footprints; the doghouse table includes a support surface for the future isometric clubhouse. Placement, avatars, cross-game currency, online services and publication are outside this build.

[Current requirements](plans/requirements-next.md) · [Design](plans/design.md) · [Verification](plans/verification.md) · [Change log](plans/changelog.md) · [Art provenance](plans/assets.md)
