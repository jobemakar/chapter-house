# Backyard Ruckus verification
2026-09-11 · 0.2.0

## Automated evidence
13 checks pass with `npm test`:
- Both authored arrangements remain supported for 30 seconds without input.
- Removing a support causes an actual physical cascade.
- Two low support shots cumulatively clear both yards; all four awards occur once.
- The dog creates more collapse than the same projectile alone.
- Twelve poor throws remain playable, socks refill and recall returns control immediately.
- Equivalent 30/60/120 Hz input durations produce matching physical poses and target counts.
- Checkpoints restore partial damage and freed targets without duplicate awards.
- Version 2 save loading and reward awards are idempotent; legacy stars/badges/disc selection are retained.
- Aiming clamps power; all keepsakes have placement footprints and the table has a surface.
- Simulated touch-only play earns toys and keepsakes in both yards, and opens/closes the collection.
- Second-finger release, pointer cancel and resize cannot accidentally throw.
- Pause freezes a flight; restacking keeps rewards.
- Storage denial leaves gameplay usable.

The interaction harness runs source with a mock DOM/canvas and the real physics engine. It cannot establish visual quality, audio quality or physical-device input feel.

## Browser evidence
The hosted build returned HTTP 200. Inspected the actual browser canvas and performed pull/release input. The first yard’s targets and progress counter responded and keepsakes unlocked. A live read-only progress tool registered successfully. No browser error/warning logs were found in that session. Browser inspection exposed a suspended target after a support slid away; disabling body sleeping fixes that underlying case and the support-removal test now runs without any special wake-up operation.

The main controls measured at least 48 CSS pixels high at a 1024×768 viewport. Portrait and landscape layout checks are browser checks, not Safari/iPad hardware certification. Generated art is reused from the first demo. WebAudio events are implemented but have not been independently listened to by the agent.

## Limits
Two finite, replayable yards; no endless level generator. Real iPad/Safari performance, physical touch feel and subjective fun need the family’s playtest before expansion. The launch dots are an approximate pre-collision arc. Physics checkpoints resume objects without their prior velocity. Saves stay within the current browser/origin; no backend, synchronization, clubhouse or publication is included.

Final browser checks: the keepsake modal opened and displayed owned and locked objects, including recognized legacy progress. At 768×1024 the page was 768 pixels wide, all visible buttons were at least 48 pixels high, and the full layout fit vertically. The standalone build has all seven scripts inlined and all art/fonts embedded; embedded JavaScript parses successfully.
