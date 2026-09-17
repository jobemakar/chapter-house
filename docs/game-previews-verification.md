# Standalone game preview menu verification — 2026-09-16

Games retains integrated Wishbone Fling and adds twelve clearly labeled
standalone links: nine other book demos plus Backyard Ruckus, Arctic Duet and
Contraption Club comparisons. Each preview opens a new tab with noopener and a
visible separate-saves/rewards warning. No preview grants Chapter House rewards,
and no gameplay or save migration was added.

The initial catalog's three concept-only entries were stale: the inventory audit
found Bureau After Dark, Veda's Great Escape and the newer Little Lantern Keeper
· Emberwatch outside the collection. Exact snapshots and required dependencies
are now stored separately from integrated source with provenance/checksums.
The original production variant choices are not silently replaced; the new
preview catalog identifies which actual artifacts the menu opens.

## Checks

- `npm test`: 90 passing tests, including unique routes, separate-tab semantics,
  existing HTML/dependency checks, and rejection of source traversal or arbitrary
  assets. Existing physics, saves, rewards and town tests remain passing.
- `npm run build`: strict TypeScript and Vite pass. All twelve preview entries
  and six colocated assets are emitted separately, not loaded with the main app.
  Existing large-main-chunk advisory remains (~904 kB uncompressed).
- `npm run verify:previews`: all 18 files at the active 5191 server and in dist
  match the source bytes exactly, have the correct MIME types, and return 200.
  Unknown preview paths return 404 rather than Chapter House SPA fallback.
- Served-browser menu inspection showed all twelve titled links and the separate
  preview warning. A Stormglide link opened a second tab with its actual start
  screen while the Chapter House menu remained open.
- A Veda link loaded its actual puzzle page, CSS, JavaScript and sanctuary art;
  its browser error/warning log was empty at inspection.
- 390×844 responsive menu inspection confirmed scrollable, readable cards with
  reachable links; viewport was reset afterward. Test-created tabs were closed.

Root planned, implemented the typed catalog/menu/allowlisted build bridge and
reviewed/tested integration. A bounded GPT-5.6 Terra agent audited inventory and
packaged the three additional snapshots read-only with respect to originals.

## Boundaries

This is preview access only, not nine new TypeScript game integrations or a full
playtest of all demos. Original demos retain their historical controls, saves and
limitations. Bureau and Veda retain optional Google Fonts imports; functional
fallback fonts remain. No physical-device test, new audio listening or publication
was performed. The public hosted build remains unchanged.

## Moonlight shooter local verification — 2026-09-17

Original experiment's 16 checks pass (model/save/input); application 100 checks,
strict TypeScript/Vite build and exact snapshot verifier pass. Current local
inventory: 13 standalone previews/19 files plus integrated Wishbone. All source,
production and served bytes match, correct MIME, unknown route 404. Moonlight
is embedded offline comic art/code with retained MIT notice, separate save key
and no shared rewards. Current hashes/sizes are in preview-origin-manifest.json.

Actual browser steering/special/waves/boss/supply depletion/free continuation,
checkpoint reload and boss completion into stage 2 were observed. Pause/help
block game input; resumed keyboard focus recovers. Desktop 1280 × 720,
portrait 390 × 844 and landscape 844 × 390 layouts reviewed; viewport reset. No console
warnings/errors captured. No physical touch-device/audio listening/full balance
validation claimed. Original verification entries above are historical.
Local changes only; private hosted version 2 and all other preview bytes unchanged.
