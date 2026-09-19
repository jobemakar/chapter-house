# Local Moonlight shooter slice — authorized 2026-09-17

Jobe said "ok proceed" after approving a rechargeable special-serving action,
wider road (roughly 80% of playfield height), smaller illustrated actors and spaced
attack groups. This authorizes implementing the local first playable evolution;
supersedes the discussion-only hold in plans 39–41. No publication/remote push.

## Requirements and implementation plan

1. Retain Moonlight Munch Run identity, original source history and save key.
   Idempotently extend legacy fed/keeps/settings with sanitized shooter progression.
   Merienda, clubhouse/waterfall and all other original repositories stay separate.
2. Free 2D steering, forward automatic food fire. Catch shot-type switches; each
   type retains levels, duplicates upgrade it; rapid fire stacks separately.
3. Three spaced authored waves then a multi-hit boss, scaling across successive
   stretches. Side entry appears later. Boss stops world scrolling, fires aimed
   projectiles and summons guests. All creatures require food hits, never weapon
   matching. Effects distinguish food shots from incoming attacks.
4. Supplies are health. Contact/escape/projectiles cost supplies once appropriately.
   Zero supplies pauses for an explicit free Restock & continue action. Weapons,
   feeds/rewards, current stretch and boss feeding progress survive restock/reload.
   Ordinary-wave restock/reload safely replays current wave. No shots consume supplies.
5. Special-serving burst has a visible rechargeable control, keyboard Space/F,
   works with steering touch simultaneously, and has no effect while paused/restocking.
6. Generated comic scenery/sprite art: yellow Beautiful Pig truck/pink pig sign/
   striped awning (verified cover). Original invented creatures/scenery. Code
   composes/animates art and effects; does not draw scenery/characters as placeholders.
7. Preserve safe pause, blur/hidden input cleanup, mute/reduced motion/fullscreen/help.
   Landscape-first with usable portrait letterboxing and 44px touch controls.
8. Actually adapt reviewed MIT Space Patrol weapon-level/pattern and firing-step
   logic with copyright/license retained. Document precisely which logic is reused;
   waves/bosses/restock are authored adaptations, not a claimed complete Galaga clone.
9. Root owns model/save/source reuse, assets/build/packaging/integration and review.
   Delegate independent renderer and UI/input work with explicit contracts. Meaningful
   checks: legacy saves, upgrade switching, additive rapid, multi-hit/single awards,
   supplies/escapes, frozen restock/boss checkpoint, burst cooldown and bounded waves.
   Build original and app, verify exact preview bytes, actual browser inspect/play.

## Module contract for parallel implementation

`model.ts` exports `WeaponType = "straight" | "spread" | "pierce"`, `Save`,
`Creature` (`id,x,y,kind,age,fed,departure,hp,maxHp,boss,bumped`), `Shot`
(`x,y,kind,vx,vy`), `Pickup` (`x,y,type,age`; type includes weapon types and `rapid`
and `supplies`), `Spark` (`x,y,age,hue`) and `EnemyShot` (`x,y,vx,vy,age`).

`RunModel(seed=7, save?:Save)` exposes `truckX,truckY,clock,roadOffset,fed,wobble,
supplies,stage,wave,phase` (`waves|boss|restock`), `creatures,shots,pickups,sparks,
enemyShots,activeWeapon,weaponLevels,rapidLevel,burstCharge,bossHp,bossMaxHp`.
Methods `steer2d(x,y,dt)`, `tick(dt)`, `burst():boolean`, `restock():void`,
`saveState(settings:{muted:boolean,reducedMotion:boolean}):Save`.
`SaveStore.key` unchanged; `sanitize/load/write`. `KEEPSAKES` unchanged.

Renderer owns `src/renderer.ts`, class `NightRenderer(canvas)` with `resize()`
and `draw(model,reduced)`. Assets: `assets/comic-road.png` (wide scene, mostly road)
and `assets/comic-sprites.png` (transparent 4 columns × 2 rows equal grid atlas;
row0 truck/bat/leaf guest/boss, row1 food/spread basket/pierce basket/rapid basket).
Generation returned uneven atlas spacing: implementation uses explicit crop
rectangles recorded in renderer/provenance rather than exact quarters/halves.
Preserve authored proportions. Road uses three composited horizontal slices.

UI/input owns `src/game.ts`, `src/input.ts`, `src/index.html`, optional input tests.
Uses the contract above and existing `NightAudio`. DOM HUD supplies/stage/weapons/
burst/feeds; Start, Pause, Restock overlays. `moonlightSnapshot()` read-only status
and canvas datasets expose phase/stage/supplies/weapon/boss for browser QA.
Build module bundler remains root-owned; UI must import only existing module IDs.

## Acceptance and local checkpoints

2026-09-17: implementation complete for the first local playtest.
Mabuhay source implementation `478da9a`; final source verification `5319eed`.
Application exact standalone packaging `a649227`. No remote pushes or publication.

- Original strict TypeScript/offline build and 16 model/save/input checks pass.
  Legacy fed/keeps/settings migrate idempotently. Boss hunger and upgrades survive
  restock/reload. A 20-minute simulation remains bounded through free continuations.
- Application 100 regression checks, production build and exact-byte verifier pass:
  13 standalone previews / 19 files, correct MIME and unknown-route 404. Only
  Moonlight's hash changed compared with the previous origin manifest.
- Actual browser steering/special, waves, supply depletion, boss restock/checkpoint
  reload, pause/help freeze, Resume keyboard recovery and boss completion to stage
  two observed. Desktop 1280 × 720, portrait 390 × 844 and landscape 844 × 390
  inspected; viewport reset. No captured browser warnings/errors.
- Generated artwork is packaged locally. Exact prompts, crop/road-compositing
  choices and source licensing are recorded in the original experiment Markdown.
  Scenery-loop seam remains visible; tuning is provisional. No physical phone/iPad
  test, audio listening, full balancing or performance-capacity claim.

Local preview: http://127.0.0.1:5191/assets/previews/moonlight-munch-run/index.html.
Standalone save key unchanged, no shared rewards, original Merienda untouched.
Treehouse trial and approved waterfall are retained. Hosted private version two
remains unchanged. Await Jobe's feedback; no automatic iteration/publication.
