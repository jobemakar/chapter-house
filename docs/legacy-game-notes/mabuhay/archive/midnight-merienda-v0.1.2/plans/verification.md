# Verification — 0.1.0, 2026-09-12
- `node --test tests/core.test.cjs`: 6 passing tests for independent pans, early taps, flip/plating, late edible food, wrong-order recovery, occupied-plate safety, pause, 60 continuous orders, food unlocks, all rewards and save sanitation.
- `tests/browser.cjs` with bundled Playwright/headless Microsoft Edge: nine full orders through DOM buttons, mismatch recovery, unlocks at 3/8, third customer, pause freezing time, two earned keepsakes, reload preserving progression, mouse drag, a complete touch-emulated order, Chromium touch-event drag, no page errors.
- Screenshots and horizontal/customer-bound checks at 1280×900, 1024×768, 768×1024, 390×844, 360×740, 844×390. Desktop, iPad portrait and phone screenshots visually inspected. Phone landscape scrolls vertically.
- Browser testing caught a build string-replacement escaping issue; fixed by callback insertion preserving source dollar characters. Offline output rebuilt from source.

Limits: this is automated browser play and visual inspection, not child playtesting. Physical iPad/Safari performance and subjective audio listening are unverified. Audio is original synthesis; no recorded soundtrack. One market scene, three foods and six recurring customers. No publication or actual clubhouse placement integration.

Final follow-up: full drag-only snack-to-pan, ready-pan-to-plate, topping-to-plate, plate-to-customer service passed after suppressing synthetic source clicks following drags. Rebuilt iPad layout inspected and direct file:// standalone startup passed with no JS errors.


## 0.1.1 feedback verification
Six core tests passed after same-slot replacement. tests/customer-feedback.cjs passed: return animation exists and completes, rejected plate unchanged, happy departure disables served guest, waiting node retained, different face arrives, pause holds departure, reduced motion completes, no duplicate award or browser errors. Browser service/touch/layout regression also run. Physical device and subjective animation feel remain user-playtest checks.
