# Local slice implemented — 2026-09-14

BOB-SLICE-01A is now a playable local application in application/, a separate source repository. It uses strict TypeScript, object-oriented controllers and services, Three.js for the room, and the retained Matter.js 0.20.0 physics baseline for Wishbone Fling.

Implemented: local guest/save, furnished full-size library, representative fox avatar and free appearance controls, 8-direction walking/wave/jump, pet choice/roaming/interaction, floor editing with footprint/path validation and undo, room/game navigation, both original Fling yards and all powers/mechanisms, durable progression, nine floor-display reward mappings including the fourteen-throw dog bed, active-play coins, unique pet ownership and duplicate ordinary furniture.

The browser playthrough earned the dog bed through fourteen actual throws, placed/rotated it, reloaded, then stored and undid the edit successfully. All 24 automated checks, strict typecheck and production build pass. Physics parity was compared with original commit dd3f939. Detailed evidence and limitations are in application/docs/verification.md.

Routine defaults: one coin/10 active seconds; 5-second recent-action window and 8-second bounded flight observation; cheapest extra pet 60 coins; fern 12 coins. Three pet kinds demonstrate the economy; the final 15-kind roster remains planned. The avatar is one representative species for this checkpoint, as specified in task 22. The room art is procedural 3D and the original watercolor game backdrop/fonts/audio are retained.

The source game repository and prior hosted demos are untouched. No Firebase setup or publication occurred. Physical-device ergonomics, mobile GPU behavior, speaker listening and native fullscreen still need device checks. Checkpoint B remains the next implementation milestone: real provisioned accounts, Firebase persistence, live friends/visits and pausing invitations, using this same space and Wishbone before integrating other games.
