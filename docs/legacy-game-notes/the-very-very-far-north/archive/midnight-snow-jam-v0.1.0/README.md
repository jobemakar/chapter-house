# Midnight Snow Jam
Playable 0.1.0 · 2026-09-11 · inspired by The Very, Very Far North.

A continuous Arctic rhythm concert with Duane, Major Puff, Handsome and Boo. Tap four pads as their shaped notes arrive; the beat keeps going through misses. Three original synthesized tunes transition automatically. Play phrases to welcome friends and earn five permanent keepsakes. A 24-note Aurora charge adds a short musical flourish and double points. Easy groove widens timing, while Free jam removes timing judgement.

## Play and build
- Local preview: http://127.0.0.1:4323
- Offline: playable/Midnight-Snow-Jam.html (self-contained, no network needed).
- npm run build creates both deliverables from src/; npm start serves the preview; npm test runs the checks. No runtime or build dependencies.
- Tap pads, or D/F/J/K. Space triggers a full Aurora meter. Pause/Resume, mute, free jam and easy timing are on the main surface. Gentle motion is in Keepsakes. Backgrounding pauses play.

## Source
core.js is the beat-based chart/scoring/reward model; audio.js synthesizes and schedules the original score; render.js draws the original paper Arctic stage, musicians and keepsakes; game.js owns touch, transport, UI and saves. Fonts are local SIL OFL assets; provenance and license notices are in assets/ and included in standalone output.

## Saving
midnight-snow-jam-v1 stores version 1, lifetime hits, played phrases, best session score, permanent owned items, selected tune, mute, easy timing, gentle motion and free-jam settings. A played phrase has at least one successful timed tap or free-jam tap; untouched phrases do not mint progress. Current unfinished phrase/notes, combo and Aurora meter are not resumed after reload. Save-denied mode remains fully playable with a visible unsaved notice. Ownership is validated and rewards deduplicated on load.

## Book connection
The publisher identifies Duane as a polar bear, Major Puff as a puffin, Handsome as a musk ox and Boo as a caribou, joined by Arctic friendship. This concert, music, artwork and furniture are original inventions, not recreated novel scenes or copied book illustrations. Source: https://www.simonandschuster.com/books/The-Very-Very-Far-North/Dan-Bar-el/The-Very-Very-Far-North/9781534433427 (checked 2026-09-11).

## Verification and limits
15 tests pass: charts and player lanes; timing windows/dedup; forgiving misses; persistent phrase rewards; charge spending/window; free jam; malformed saves; touch and simultaneous chords; keyboard focus/repeats; pause/resume transport; continuous sets; modal/save/reload/denied storage; tune switching; audio graph scheduling and failed-audio fallback. The audio graph is verified using a mock AudioContext, not an acoustic recording.

The served game was opened in the browser, started, and visually inspected at a narrow 607px pane. Readable name plates were added after the first visual check. Browser saved progress and settings were observed surviving reload. Physical iPad latency, Bluetooth timing, and listening to the mix remain for family playtesting. No public deployment, backend, remote push or new lobby.

## Future clubhouse forms
The five rewards have stable IDs, thematic provenance, sizes and placement categories in core.js. The ice-drum table exposes a real future support surface; tabletop display objects do not independently block floor walking. Full geometry convention is in plans/requirements.md. This game displays ownership; room placement and avatars remain unbuilt.
