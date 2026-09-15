# Local verification — 2026-09-14

## Automated checks

`npm run typecheck`, `npm test`, and `npm run build` are the reproducible commands. The suite currently contains 24 checks:

- Both yards clear with ordinary throws. Fixed-step outcomes agree at 30/60/120 Hz presentation rates; joints stay attached while independently flopping.
- The TypeScript trajectories and rescued targets match the retained JavaScript baseline in both yards. This comparison ran with the original sibling repository present.
- Quick recall and repeated poor launches return safely without adding bodies. Bounce count, magnet range, wind consumption, pickups, clear-reward rotation, lever, polarity and bellows retain their behaviors.
- Pause/cancel/hidden state, actual controller saving and repeated mount/dispose are tested against an inert DOM/canvas harness. The final frame queue and active ResizeObservers are empty after disposal.
- Fourteen throws grant exactly one placeable dog bed, including reload. Legacy import preserves original keys and full source payload. Ordinary duplicates and pet uniqueness, replayed purchase IDs, affordability, repeated activity credits and idle expiry are checked.
- A* routes avoid furniture; placement rejects bounds, overlaps, occupied entry points and blocked access.

The controller harness exercises real game code and physics but does not verify rendered pixels, browser-specific fullscreen, or audible output.

## Browser checks actually performed

Codex's Chromium-based in-app browser was used to inspect and operate the application. Viewports included 390×844 phone portrait, 844×390 phone landscape, 768×1024 tablet portrait, and 1280×800 desktop, plus the normal 735×854 app panel.

- Chose Clover from the starter choices and entered the room. Inspected room geometry, warm library art, catalog portraits, avatar and pet.
- Walked around the table toward the bookcase, waved/jumped, called the pet, zoomed and panned. The scene uses real 3D depth. Petting via the accessible Pets-panel button displayed the positive response; precise tapping on a moving pet was difficult to verify through remote coordinate automation and should be tuned on a physical touch device.
- Launched Wishbone in both yards and cleared all eight targets through the actual UI. Collected all three power discoveries, observed quick recall and paused/resumed in flight.
- Reached fourteen actual throws, earned the dog bed, returned to Decorate, rejected its initially occupied position, moved and rotated it to an open spot, placed it, reloaded, and observed it still marked “In your room.” Then stored it and used Undo to restore placement.
- Observed currency increase during play and persist through room return/reload. Economy purchase edge cases are automated state tests; no ten-minute pet purchase session was claimed.
- Changed fur color and accessory, observing the actual model update in both room and wardrobe preview. Reopened the production build through the packaged launcher, with prior progress intact.
- Checked Help, collection pause/resume, room/game return, and responsive control availability. The fullscreen control was exercised without an application error; the embedded browser did not expose a reliable fullscreen state through its DOM inspection interface.
- The initial Windows development watcher encountered EBUSY while copying an asset. Windows development now uses polling; the delivered build uses a static local server.
- Browser diagnostics exposed no application errors. An initial deprecated Three.js shadow-map warning was fixed by selecting the supported PCF shadow map.

## Remaining validation

No physical iPhone, Android or iPad was available for this pass. Viewport emulation does not certify mobile GPU frame rate, Safari fullscreen behavior, actual touch ergonomics, audio quality, or child playtesting. Synthesized audio is retained and its lifecycle is exercised, but it was not listened to through speakers. Multiplayer, concurrent-account writes, disconnect recovery, Firebase costs and online presence are outside this local checkpoint.

The complete larger first slice is still gated on checkpoint B (real accounts and shared visits) and user review. No deployment was performed.
