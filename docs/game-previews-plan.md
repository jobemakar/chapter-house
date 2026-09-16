# Standalone game preview menu — 2026-09-16

User authorizes easy access to the other existing demos before integration or
iteration. This supersedes the one-visible-game menu restriction only for
clearly labeled standalone previews, not shared progression or gameplay ports.

## Requirements

1. Retain Wishbone Fling as the integrated game with Chapter House rewards.
2. Add available book demos and useful alternate versions to Games, displaying
   game/book titles, concise descriptions, and a standalone preview label.
3. Open previews in a separate tab with noopener, leaving Chapter House easy to
   return to. Show a clear warning that preview saves/rewards remain separate.
4. Package existing standalone HTML builds unchanged; do not rewrite games,
   migrate saves, add rewards or modify their original repositories.
5. Use a typed allowlisted preview catalog and a reproducible Vite bridge for
   local serving and production asset output. Do not expose arbitrary files.
   Self-contained builds and exact allowlisted colocated dependencies may use
   this bridge. Preserve optional remote font styling in unchanged previews.
6. Verify source files exist, local links serve actual game HTML rather than
   SPA fallback, production contains each preview, and menu works on narrow
   layouts. Audit stale catalog entries before declaring unavailable games.
7. Preserve current publication boundary: local build only; no hosted update.

Root owns catalog/menu/build bridge and final verification. A bounded lower-cost
implementation agent audits demo inventory and dependencies read-only. No new
game mechanics, art or book connections are introduced.
