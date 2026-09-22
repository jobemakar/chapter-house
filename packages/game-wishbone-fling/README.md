# Wishbone Fling level authoring

Wishbone's canonical TypeScript game and desktop editor share the same Matter physics, renderer, controls and audio. The editor is local authoring tooling; levels still support touch gameplay in standalone Wishbone and Chapter House.

## Start locally

From `application/`:

```powershell
npm run dev:wishbone
```

- Editor: http://127.0.0.1:5193/editor.html
- Standalone game: http://127.0.0.1:5193/
- Chapter House: run `npm run dev`, then open http://127.0.0.1:5190/ and choose Wishbone.

The editor's write API exists only on the standalone local development server. A production build includes the editor page for inspection, but supplies no filesystem write endpoint. Nothing in this implementation publishes the project.

## Authoring

Open a saved yard, or supply a new stable file ID and choose Blank or Copy. Select objects on the canvas, drag them, or use their numeric inspector. Physics pieces retain their catalog sizes; fixed rectangular terrain exposes width and height. Rotate pieces and directional devices. Edit level width and height, pan with Space-drag or middle-drag, zoom with the wheel/buttons, and optionally snap to a 20-unit grid. Arrow keys nudge, Shift increases the step, Delete removes, and Ctrl/Cmd-Z undoes.

The launcher moves anywhere its complete artwork and automatic upright support fit inside the world. Add fixed terrain or movable boxes beneath it if desired. Terrain can have gaps. Wishbone launches in either direction and reappears at the launcher after a throw or Recall. Toys that fall below the world during active play are rescued once; fallen ordinary pieces remain removed until Restack. Toys falling out before the first throw are instability diagnostics, never player rewards.

Multiple levers each choose a gate; multiple magnet controls each choose a field. Spring rotation sets its fixed-strength force direction. Controls do not expose general physics tuning.

Save writes the current draft only. Incomplete drafts can be saved, but must become structurally valid before Play or inclusion. Add to playable list explicitly, reorder with the list controls, and Save order separately. Removing an entry never deletes the level file or player history. Successful test completion is not required for inclusion.

Play tests a cloned unsaved document with production gameplay. Pause, sound and Recall remain available. Stop returns to the authored layout; Restart begins another disposable test. Test sessions cannot save player progression, award rewards or credit active time. The playtested flag records that a test was started, not completion certification.

## Files and architecture

- `public/levels/<stable-id>.json`: version-one authored document, including stable numeric piece identities and a nondecreasing `nextPieceId` allocation counter.
- `public/levels/index.json`: version-one ordered array of explicitly included IDs; initially the existing visible order, original indices 2–27 followed by 0–1.
- `src/level-files.ts`: shared draft parsing, playable validation, copying and deterministic layout revision hashing. Object-array order does not change the revision.
- `src/level-loader.ts`: asynchronous manifest/file loading, retaining valid entries and reporting individual invalid/missing files. No embedded fallback catalog.
- `src/legacy-levels.ts`: immutable old numeric IDs and original revision hashes for save migration; no duplicated level geometry.
- `src/editor/`: immutable edit history, selection tools, unstepped production preview and isolated production playtest.
- `tools/level-store.ts`: local-only bounded, same-origin JSON API with ID/path validation and atomic file replacement.
- `tools/level-assets.ts`: read-only Chapter House asset serving/build packaging at `game-data/wishbone-fling/levels/`; it does not expose the editor's writes.

`loadWishboneFling(levelsBaseUrl?: URL)` resolves the ordered catalog before returning the production game module. Standalone uses its own `levels/`; Chapter House passes its base-aware namespaced location. Both builds package the exact same authored files.

Version-three progress uses `selectedLevelId`, stable numeric piece identities and per-device state. Version-two numeric selection maps through immutable original metadata. Compatible checkpoints retain poses; a changed physics revision discards only transient layout. Earned rescues, keepsakes, archived power metadata and inactive-level history remain. Standalone and Chapter House keep their existing separate persistence hosts.

## Verification

```powershell
npm run check --workspace @chapter-house/game-wishbone-fling
npm test
npm run build
```

Run these from `application/`. Tests cover physics/recovery, level files and local storage, edit history, migration and existing campaign playability. See `application/docs/wishbone-level-editor-verification.md` and root `plans/60-wishbone-fling-level-editor.md` for dated evidence and limitations.
