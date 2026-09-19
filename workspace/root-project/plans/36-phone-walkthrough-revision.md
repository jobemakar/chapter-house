# Phone walkthrough revision — 2026-09-16

Jobe explicitly says start after collecting walkthrough feedback and discussing
replacement concepts. Update the same owner-private Chapter House Site after
review; retain original repositories, stable saves and standalone boundaries.

## Numbered requirements

1. Remove the comparison Kenney garden fountain and its collision/click handling;
   retain the original wishing fountain. Move the windmill to the far bank and
   remove its sign. Keep its sails independently rotating.
2. Build a larger, grounded waterfall using the Nature Kit example as reference:
   elevated non-walkable rocky terrain, a visible uphill water source descending
   to the stream, convincing banks/foam. No floating source or walkable water.
3. Wishbone sound/fullscreen/help/pause controls use recognizable icons with
   accessible labels. Establish this convention for future integrations.
   The Long Walk Home launch zoom eases quickly rather than snapping.
4. Verify the fishing outcome is 30 percent per completed reel statistically and
   at its exact threshold. At least double the total cast-to-Reel wait; Reel never
   expires. Preserve counts, rarity and once-only award behavior.
5. Stormglide rotation preserves the logical reachable play area, including
   collectibles. Arctic Duet fills landscape rather than shrinking. Merienda and
   Gummy fit landscape height. Contraption prioritizes landscape with large usable
   canvas/controls, without changing puzzle physics or saved layouts.
6. Pocket Funhouse celebrates after the spark completes its successful route.
   Preserve original game/save. Gummy match audio becomes brighter and more
   exciting while preserving mute and comfort controls.
7. Merienda replaces the too-realistic food/pan art with flatter, muted, cartoony
   generated imagery consistent with its original night-market aesthetic.
8. Retire Door Atelier from the active menu (retain its source and saves/history).
   Add a new illustrated puzzle-box mansion concept: mysterious/eerie but legible,
   rotating mirrors guiding conservatory light into door targets, tactile puzzle
   interaction, no quizzes/timers/death, free help/reset, meaningful door opening.
   Generated room art supplies visual craft; separate controls/beams remain code.
9. Add a separate Mabuhay food-truck experiment: top-down 2D truck auto-driving
   left-to-right with scrolling ground, left thumb steers vertically, right thumb
   tosses food toward approaching hungry folklore-inspired creatures. Mouse Y
   steers; click tosses. No health/game-over, collisions harmless, continuous play.
   Invented feeding mechanic, not a claim about book canon. Preserve Merienda.
10. Rebuild and package exact standalone artifacts/dependencies, review responsive
    behavior and full new puzzle/action loops, publish exact reviewed output using
    existing Site identity and owner-private audience. Report actual evidence and
    limitations without claiming physical-device/audio listening tests.

## Mechanic comparison / decisions

Locked Rooms: rotate/observe light routing -> align receivers -> open passage in
authored stationary rooms. Distinct from player-built corn machines, match-3,
cooking, photography, music and scrolling flight. Same-book routing overlap with
Pocket Funhouse is deliberate; this is an additional visual puzzle trial.
Door Atelier is rejected by user as confusing and visually unsatisfactory.

Mabuhay alternative: continuously steer + aim/toss food -> appease approaching
creatures -> collect snacks/change scenery. Deliberate user-selected overlap with
Stormglide's continuous steering, but vertical road steering plus feeding moving
targets replaces free flight/dash. Side-view jumping runner, kindness errands,
snapshot market and time-loop hotel remain deferred/rejected discussion history.
Verified anchor: siblings, family food truck and Filipino folklore threats
(Scholastic Mabuhay summary). Invented creatures/art/routes/feeding, spoiler-light.

## Ownership and checks

Root owns town layout/navigation/fishing/Wishbone camera and all Site checkout
edits, artifact integration, review/publication. Bounded cheaper implementation
agents work only in original standalone repositories outside the Site checkout:
existing standalone feedback, new Locked Rooms, and new Mabuhay truck. Each
writes per-game requirements/plan before code and reads current game documents.
Run original suites, app tests/typecheck/build, exact preview verifier, visual
desktop/portrait/landscape and new full playable loops. Preserve dirty user files.

## Publication receipt — completed 2026-09-16

Owner-private version 2 successfully published at
https://chapter-house-jm.mowgliworf.chatgpt.site on 2026-09-16 23:52:48 UTC.

- Site: `appgprj_6aab095b3270819195be324780e2f89e`
- Source commit: `9e0cb24dd9e5caeb99871e1f0571f00b972002f7` (pushed to the existing Sites main branch)
- Saved version: `appgprj_6aab095b3270819195be324780e2f89e~appgver_060679177b948191a4c17214b01f6773`
- Deployment: `appgdep_6aab2bbfd4e4819192da1620d3491be6`, status `succeeded`
- Saved archive: 83 files; `sha256:5a3e979d8904f6d7179918ebfa51539316228a6bb713c788a3b548c529f957f1`
- App: strict build passes, 98/98 tests. Preview verification: 14 previews / 20 exact original-build, production and served files; correct MIME and unknown route 404.
- Seeded fishing simulation: 3,023 catches / 10,000 completed reels. All timing limits doubled; non-expiring Reel unchanged.
- Standalone original suites pass; new puzzle 6 checks, new truck 9 checks. Root browser completed both final mansion routes and reviewed phone-landscape layouts; truck agent observed feeding/departure/save roundtrip.
- Browser emulation/model checks are not physical-phone tests or listening tests. Static saves remain per browser/origin/game; no cloud transfer or multiplayer.

Build helper encountered a Windows npm runtime-path issue; the existing `npm run build` workflow succeeded after source commit and generated the exact packaged output. Standard Sites package helper completed successfully. No Site identity/audience change, GitHub publication or original standalone Site update was made.
