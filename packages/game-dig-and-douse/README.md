# Dig & Douse — level authoring

This package contains the shared TypeScript game, standalone browser entry and desktop-only level editor. Chapter House and standalone play use the same level catalog and runtime.

## Open locally

From `application/`:

```powershell
npm run dev:editor -w @chapter-house/game-dig-and-douse
```

Editor: `http://127.0.0.1:5192/editor.html`  
Game: `http://127.0.0.1:5192/`

Keep this server running while editing. It writes JSON files directly into this package's `levels/` directory; a static hosted copy cannot save files. Nothing is published by running the editor.

## Author and test

- New levels start with dirt across the fixed board. Paint dirt, empty space or rock; draw rectangles/polygons and adjust their points. Terrain operations apply in order, so later strokes can override earlier shapes.
- Place and resize rocks and reservoirs. Reservoirs have adjustable starting fill and one centered left, right or bottom outlet. Dig around the outlet to release the finite water supply.
- Arrange straight, elbow, T and cross pieces on the pipe grid. These are solid obstacles, not conduits. Capped decoys also block water. The one working intake receives water for the separately placed campsite target.
- Add any desired number of optional canteens, including zero. Set the required percentage of all starting water. New levels have no hint route.
- Play tests the current unsaved draft in the real game. Restart resets that test; Stop returns to the untouched editing layout. Tests never affect player saves, coins or rewards.
- Save manually. A saved level remains a draft until explicitly added to the campaign. Save campaign changes after adding, removing or reordering entries. No completed playtest is required.

## Content and progress

Each versioned JSON document has a stable level ID. `levels/campaign.json` lists IDs in play order; unlisted files remain drafts. The editor and build discover the level files automatically. Production builds package the content and do not expose the local file-writing API.

Players unlock levels in order and may replay completed levels. Completion and earned access use stable IDs, so reordering does not erase them. The original `painted-hillside` level and existing reward identity remain. Old progress is migrated idempotently to version 2 without removing aggregate canteens, victories or owned rewards. Standalone and Chapter House saves remain separate.

The original level includes preserved legacy geometry so it plays unchanged before editing. Editing its geometry converts it to the new authoring format; duplicate it first to keep the original file intact.

## Verification

```powershell
npm run check -w @chapter-house/game-dig-and-douse
```

The suite covers original-level physics, authored reservoirs and barriers, content compilation/validation, local file handling and campaign/save migration. Browser authoring and gameplay verification is recorded in `docs/editor-verification.md`.
