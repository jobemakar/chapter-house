# Local change log

## 2026-09-22 — Desktop level editor and file-based campaign

Implemented the editor specified in shared plan 59: ordered JSON campaign, manual draft saves, dirt/rock/empty painting, editable terrain shapes, solid snapped pipe obstacles, multiple adjustable-fill reservoirs with centered outlets, separately positioned working intake and campsite, optional canteens and isolated Play/Stop/Restart.

The gameplay runtime now supports authored geometry, percentage water quotas, dynamic level/canteen presentation and sequential campaign progression. Version-two player saves preserve legacy totals, earned rewards and the original level identity. The original shipped level remains exact until its authoring geometry is edited. New levels have no hint route. Short-landscape gameplay places controls beside the board to retain a useful playfield.

Implementation UI/file workflow/static obstacle artwork were delegated to GPT-5.6 Sol. Primary agent owned physics, campaign/save integration, code review and final verification. See editor-verification.md for evidence and limits. Local only; no publication.

## 2026-09-22 — Larger tests and pipe contact
- Enlarged desktop playtesting into a viewport overlay with compact side HUD.
- Removed invisible ledges around working/capped pipe artwork in original and authored levels, retaining the working mouth sensor and sealed decoys.
- Restored saved startup drafts when their ID matches the initial placeholder.
- Verified typecheck, all seven test entrypoints, production build, four-facing collider regressions, browser playthrough, Restart and Escape.

## 2026-09-22 — Hose spray and pipe finish
- Anchored spray to the illustrated nozzle opening relative to target bounds, with a gentle five-strand fan and moving droplets.
- Added cylindrical teal shading, brass couplings, seams, compact markings and seeded patina to fixed obstacle pipes, clipped to their collision silhouette.
- Ctrl+R rotates a selected pipe even with a property control focused; R remains supported and rotation is undoable.
