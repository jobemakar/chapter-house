# Wildfire — Dig & Douse

Author: Rodman Philbrick  
Current game direction: **Dig & Douse** (BOB-009-R2)  
Status: local, playable visual prototype

Clear continuous channels through earth to route a finite reservoir of water into the large mouth of a working intake. The intake powers a hose in a small, deliberately separate campsite vignette, where the stream puts out a fire. Bedrock cannot be dug, capped pipes are inert obstacles, and three golden canteen buddies are optional collectibles.

This prototype uses LiquidFun/Box2D particle physics and original image-generated art. It uses no Disney code, names, characters, or assets. Water, flame, digging masks, glow, and hose spray are code-rendered. The earlier **Emberwatch** proposal remains preserved in [plans/pitch.md](plans/pitch.md) as concept history.

## Run locally

Requires Node.js.

```text
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4173. Run `npm test` for deterministic physics and rendering checks. With the server running, `node tests/browser.cjs` performs desktop, real-touch, responsive-layout, art-loading, and victory smoke tests.

## Controls

Drag with a mouse or one finger to clear soil. The board captures touch, while the page remains scrollable outside it. Keyboard users can focus the board, move with the arrow keys, and hold Space to clear.

## Project map

- `public/` — playable source and local runtime assets
- `dist/` — generated static build
- `physics.js` — deterministic terrain and LiquidFun simulation
- `public/levels.js` — modular level geometry and behavior data
- `assets/concepts/` — concept-art iterations and their prompts
- `plans/requirements.md` — numbered product and level rules
- `plans/design.md` — visual, interaction, and level-design specification
- `plans/asset-prompts.md` — exact prompts and provenance for current assets
- `plans/history.md` — design-decision timeline
- `plans/implementation.md` — technical architecture and integration boundary
- `plans/verification.md` — current validation record

The construction grid is deliberately invisible: the earth renders as a continuous material, and transition shapes hide modular assembly. This remains a standalone JavaScript prototype. Integrating it into the shared Battle of the Books application will require a TypeScript/OOP port and shared progression, save, audio, and shell integration.

LiquidFun WebAssembly is derived from [Birch-san/box2d-wasm](https://github.com/Birch-san/box2d-wasm/tree/liquidfun); see `public/vendor/LICENSE.zlib.txt`.
