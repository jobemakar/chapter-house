# Editor requirements — 2026-09-22

User decisions are recorded in shared plan 59. This local implementation adds authoring to the canonical Dig & Douse package, preserving its excavate/route/collect/douse mechanic.

1. Desktop mouse/keyboard authoring only. Gameplay retains touch, keyboard and phone layouts. Fixed 12 × 15 world and 80 × 100 terrain grid; new drafts start filled with dirt.
2. Dirt/empty/rock brushes, rectangle and editable polygon terrain. Both painted rock and placed/resized rock objects. Ordered operations retain editable shape vertices.
3. Multiple moveable/resizable reservoirs, each with adjustable initial fill and one centered outlet on its left, right or bottom side. Finite water uses the real gravity simulation.
4. Exactly one working intake, separately placed from the campsite target. Preserve capped decoy intakes. All non-working pipes are solid obstacles, not conduits.
5. Straight, elbow, T and cross pipe obstacles snap/rotate on a coarser grid aligned with the terrain. Players cannot move them.
6. Any authored canteen count, including zero. Canteens remain optional. New levels omit hints.
7. Completion quota is a percentage of total actual starting particles, fixed for the run regardless of spills.
8. Versioned JSON files in `levels/` plus `campaign.json` in play order. Stable IDs preserve progression through reordering. The game loads the ordered files; builds include them under `douse-levels/`.
9. Manual file saves through the local editor server. New saves remain drafts. Explicit campaign add/remove/reorder and manual campaign save. Structural validity is required for campaign entries, but no playtest or victory proof is required.
10. Undo/redo and unsaved-change warning. Save failures retain dirty state. An already-listed level must be removed from campaign before saving a structurally incomplete draft.
11. Play runs an isolated in-memory draft through the actual game; Restart repeats that snapshot; Stop restores the exact authoring state/history. Authoring controls are locked during testing. No gameplay progress, coins, rewards or automatic file saves.
12. Campaign levels unlock sequentially and completed levels can be replayed. Version-two saves retain prior totals/rewards and migrate original victories to the original stable level identity; previously earned access survives reordering.
13. Preserve the original level's exact unedited runtime via its legacy geometry. Original geometry edits convert to the new authoring model, with a visible notice and Duplicate available to preserve the original. Metadata and duplicate IDs remain coherent.
14. No publication, original-book repository edits, new currency, multiplayer, new game mechanics or changed reward IDs.
