# Dig & Douse requirements

Date selected: 2026-09-18  
Status: current requirements for the local visual prototype and future level authoring

## Experience

1. The player clears soil with a continuous drag or finger stroke to form a downhill water channel.
2. A contained reservoir releases a finite, visible volume of water only after the player clears its diggable floor; no particles may leak around the lower corners before digging.
3. Water must read as a joined fluid surface, while its gameplay remains particle-based.
4. The success target is the large open mouth of a working intake. The intake's body and attached machinery are solid obstacles and do not collect water.
5. A successful intake powers a visually matched hose in a compact campsite vignette; enough delivered water extinguishes the fire.
6. The hose/fire vignette may be spatially disconnected from the intake and intentionally read like a small cut-scene. It should generally occupy about one eighth of the screen so the puzzle remains primary.
7. There is no timer, death state, or book quiz. Reset is always voluntary and fully restores the level.

## Terrain and containment

8. Level geometry may use a modular grid internally, but visible soil must look continuous rather than tiled. Transition pieces and softened edges should conceal construction seams.
9. A level may fill the board, use only part of it, begin from a side reservoir, or use multiple separated terrain masses.
10. Permanent boundaries must keep water inside the playable simulation. Water may not bypass the puzzle along either outer edge or travel behind/below a non-playable target vignette.
11. Immutable rocks must visually occupy their physical collision area. Players must be able to clear soil close to the visible rock edge without an unexplained dead zone.
12. The terrain, pipe bodies, rock, reservoir walls, and non-playable vignette must all participate in water clipping and collision.

## Intakes and level behaviors

13. Intakes may face up, down, left, or right and may appear at the edge or inside a level.
14. Levels may contain multiple working intakes, multiple sources, or fair dummy intakes.
15. A dummy must communicate why it cannot work. The current dummy has a solid bolted cap, has no collection sensor, blocks water, and accepts zero particles.
16. Working and hose endpoints use the same blue-drop marking so the remote connection can be learned without a literal continuous pipe.
17. Only the working intake's large visible opening is a target. Sensors must not extend behind its body or into adjacent earth.
18. A side-facing intake may draw nearby water toward its mouth to prevent an artificial standing pool, but particles count only after crossing the visible opening.

## Collectibles and feedback

19. The current level contains exactly three optional golden canteen buddies. Each activates once when touched by water, plays a visible fill/burst animation, then lifts and fades away without a checkmark.
20. The local prototype keeps canteens as a per-level tally. In the production game, collected canteens must also contribute to persistent player progression; the exact reward and redemption economy will be specified during shared-app integration.
21. A sealed dummy should produce concise feedback that it is capped; a working intake should show delivered-water progress.
22. The optional hint may show one possible path but must not dig or solve the level automatically.

## Visual and technical quality

23. The interactive soil, water, obstacles, intakes, and collectibles must draw the eye more strongly than the forest frame.
24. The background should be quiet and subordinate. The target vignette may use stronger narrative detail but remains compact.
25. The game must support touch, mouse, and keyboard clearing and remain usable at 320 CSS pixels wide.
26. Simulation must pause while hidden, use a bounded fixed timestep, and reset without particle, fixture, or state leakage.
27. Current work remains local until publishing is explicitly requested. Any future shared-app integration must follow that application's TypeScript, OOP, save, progression, and audio requirements.
