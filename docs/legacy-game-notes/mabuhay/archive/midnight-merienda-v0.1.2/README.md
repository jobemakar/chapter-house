# Midnight Merienda
An original touch-first food-truck game loosely inspired by Mabuhay! by Zachary Sterling. Local demo 0.1.1.

Open playable/Midnight-Merienda.html directly in a modern browser. Choose a snack, tap a pan, flip when it glows, plate when ready, add the pictured topping, and tap a matching customer. Two pans can run together. Drag and keyboard buttons supported. No lives or impatient-customer failure.

## Develop
Run `node build.mjs` and `node --test tests/core.test.cjs`. No npm dependencies needed. Source lives in src/; dist/index.html and playable/Midnight-Merienda.html are generated. Browser tests require Playwright via PLAYWRIGHT_MODULE, Edge, a local preview on port 8786, and an existing screenshot directory via MM_TEST_OUTPUT. Run `node tests/browser.cjs`.

Saved locally: served/fresh totals, keepsakes and sound/motion settings. Pans, plate and orders reset on refresh while unlocked foods remain. Requirements, decisions, source architecture, change log and honest verification limits are in plans/. Asset provenance is in assets/PROVENANCE.md. No publication; physical iPad and child playtesting pending.
