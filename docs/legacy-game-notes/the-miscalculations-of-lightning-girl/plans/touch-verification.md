# Touch-first verification

Date: 2026-09-10 · Local version 0.2.0

- Existing 7.5-minute game simulation and new touch event tests passed at 1024×768, 768×1024, 1180×820, and 390×844 touch viewports, plus 1280×800 desktop.
- Checks cover neutral touch down, dead zone, directional steering, lift-to-stop, simultaneous second-thumb dash, unrelated pointer releases, canceled/lost capture, compatibility-click suppression, rotation preserving score, pause clearing input, and keyboard fallback.
- Two successive builds produced identical hosted and offline artifact hashes.
- These are simulated browser/canvas events. No physical iPad Safari playtest, browser visual QA, audio listening, or measured frame-rate test was performed.
- The source migration was separately verified before touch changes; its prior record remains in verification.md.
- No publication or service setup was performed.
