# Standalone previews in Chapter House — 2026-09-16

Jobe authorizes menu access to existing demos before iterating/integrating other
games. Wishbone Fling remains the only integrated game. Games now also lists
nine other book demos plus three comparison versions as standalone new-tab
previews with separate saves/rewards. This supersedes the one-visible-game rule
only for labeled preview access; it does not authorize gameplay ports or shared
rewards for the remaining games.

The inventory audit recovered Bureau After Dark, Veda's Great Escape and Little
Lantern Keeper · Emberwatch from their original generated Codex workspaces.
Their exact standalone artifacts/dependencies are separately retained under
`application/preview-sources/` with original-path/hash provenance. Existing book
source, saves, variant history and repositories are unchanged.

A typed allowlist serves previews locally and emits the same bytes through Vite
for reproducible builds. No arbitrary workspace-file route or remote server is
introduced. Ninety tests, strict production build and served/built-byte checks
pass for twelve previews / eighteen files. Browser review covered the menu,
new-tab loading, Veda artwork and narrow scrollable cards. No publication or
physical-device/full-all-games playtest is claimed.

See `application/docs/game-previews-plan.md`, `game-previews-verification.md`
and `preview-sources.md`. Root planned/implemented/reviewed; a bounded Terra
agent audited inventory and packaged exact standalone snapshots.
