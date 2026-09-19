# Local shooter source adaptation — 2026-09-17

Source: [Nuno Freitas / Space Patrol](https://github.com/nunof07/space-patrol),
commit `63b1a09d2ff70d5504ebc060cdaa9feb4f205b8d`, explicit MIT license.
Copyright 2018 Nuno Freitas. Full notice retained in assets/SPACE-PATROL-LICENSE.txt
and embedded in both generated JavaScript and offline HTML distributions.

`src/arcade.ts` adapts the original weapon-level validation/increment routines,
cyclic EnemyWeaponComponent fire-step timing, and PulseLevel4 angle/pattern
delegation. These are actual code adaptations, not a complete Galaga clone.
The old Phaser 3.10 / TypeScript 2.8 stack, art and sound are not imported.
Current TypeScript modules own steering, automatic food fire, catches, retained
per-type levels, additive rapid fire, supplies/restock, saved boss progress,
authored wave progression and bosses. Those behavior changes are original.

Reviewed alternatives Kinetic Scan and Micro Shooters had no sufficiently clear
project license for reuse; no code or assets from them enter the build.
Ordinary shots are free; supplies represent health. Three waves precede a boss.
Enemy count, velocity and weapon levels are bounded; successive stages scale
difficulty. Boss health scales to a bounded maximum. These are tuning defaults
for Jobe's first local playtest, not final balance claims.
