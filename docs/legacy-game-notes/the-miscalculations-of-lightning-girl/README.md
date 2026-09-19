# Lightning Girl: Stormglide

An endless, forgiving cloud-surfing game inspired by *The Miscalculations of Lightning Girl* by Stacy McAnulty.

[Play publicly](https://lightning-girl-stormglide.mowgliworf.chatgpt.site)  
Offline: open `playable/Stormglide.html` in a browser.

## Play
On iPad, drag the lower-left thumb pad (or the open sky) to steer; lift to stop. Tap the large Dash button with your other thumb to burst through a storm. Mouse, arrow keys/WASD, and Space remain supported. Collect sparks, pass through rings, and find the twelve pup pals. Press P or the pause button for a break.

There is no final level or game-over screen. Sky chapters cycle and the flight continues after the collection is complete.

## Edit and rebuild
Requires Node.js 18 or newer. Run `npm ci` first to install the pinned TypeScript
compiler and development tooling; the generated game runtime itself has no
third-party dependency.

```text
npm run build
npm test
npm run typecheck
npm run check
npm start
```

The local preview prints its URL, normally `http://127.0.0.1:4320`. Stop it with Ctrl+C.

For source formatting, run `npm run format` after installation. Prettier is a pinned development-only dependency.

- `src/index.html`: page structure and visible copy.
- `src/styles.css`: responsive layout, colors, typography, controls.
- `src/game.ts`: typed game state, synthesized audio, controls, spawning, collisions, drawing, and saves.
- `assets/`: original background and local fonts.
- `scripts/build.cjs`: produces both outputs from source; embeds fonts and artwork for offline play.
- `dist/index.html` and `dist/sky.png`: hosted release artifacts.
- `playable/Stormglide.html`: complete portable game in one file.
- `tests/game.test.cjs`: simulated gameplay checks, not a real browser or audio-listening test.
- `game.json`: stable identity and paths for the eventual collection/lobby.

The game code is TypeScript with focused persistence, model, input, audio, renderer, and game composition boundaries. `npm run build` compiles it into a generated intermediate before producing the hosted and standalone artifacts.

## Design records

[TypeScript port](plans/typescript-port.md)
[Requirements](plans/requirements.md) · [Design and tuning](plans/design.md) · [Change log](plans/changelog.md) · [Asset provenance](plans/assets.md)

## Saves
Uses browser-local `stormglide-v1` data. Discoveries, total rescues, selected/unlocked trails, best score, and preferences persist. Reloading starts a new flight; current flight score and position do not resume. Saves do not sync between the hosted site and an offline copy.

## Source history and publishing
This folder is now the canonical checkout. Its original Git history and Sites identity were retained. The earlier conversation workspace is a historical copy.

Existing public Site: `appgprj_6aa2fa6610a081918c72910e6f006fd9`. Do not register another Site for this game. Use the Sites building/hosting workflow when publishing is requested. The original public release is version 1; this source reorganization has not been published.

## iPad revision
Local version 0.3.0 retains the touch-first controls and adds the strict TypeScript/OOP port. [Touch design](plans/touch-design.md) records the controls and [verification](plans/touch-verification.md) records checks and limits. The public Site has not been updated; current official Sites documentation restricts targeting children under 13, so suitable hosting must be chosen for this collection.
