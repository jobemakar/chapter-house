# Isometric clubhouse — revision 2 placement history

## Current reference — 2026-09-14

Current behavior is specified in [application requirements](20-application-requirements.md) and the [build plan](21-application-plan.md). Floor/wall placement, avatars, pets and live visitors are selected; tabletop support and camera rotation are not in first-release scope. The numbered CL requirements below are historical R2 requirements, retained for reference and future stacking work, not an unresolved conflict.

## Historical revision follows

2026-09-10 · META-001-R2 · User-selected presentation/placement direction; ship versus treehouse fiction remains undecided. No clubhouse implemented.

## Experience
A miniature 3D room seen from a comfortable isometric angle. Pick up a table, put it beside a window, then place a lamp or a fetched toy on the table. Moving the table carries its contents. Collected pieces from all ten books make the room personal.

Use real spatial positions and surfaces, with a fixed orthographic/isometric camera. The exact renderer/library is deferred to implementation. A simple stylized 3D approach is preferred for reliable depth, object picking and surfaces; camera rotation, if included, snaps to four quarter-turn views. Do not confuse the clubhouse's 3D presentation with a requirement that every book game become 3D.

No player avatar, character customization, walking controls, pathfinding agent, social presence character or roaming pet behavior is in scope. Keep floors, obstacles, doors and empty routes spatially meaningful so a future walking character could be added.

## Numbered requirements
| ID | Requirement | Origin | Acceptance example |
| --- | --- | --- | --- |
| CL-001 | Present a coherent isometric 3D room with a readable floor, depth and furniture scale. | User | Table and lamp visibly occupy different heights; occlusion works from supported views. |
| CL-002 | All collectible item types have at least one valid placeable display form. | User | A toy, badge and furniture reward can each be placed, moved and returned to inventory. |
| CL-003 | Drag to position an item; show a translucent preview and clearly highlight valid supports before committing on release. | Designer / touch-first rule | Item follows the finger; invalid drops return it to its last valid position, with a brief explanation. |
| CL-004 | Furniture exposes real support surfaces. A tabletop item may sit on a table within its surface boundary. | User | Lamp placed on table has the correct height and never sinks to the floor or floats. |
| CL-005 | Placed items attach to their support, with a local position/orientation. | Designer, necessary for CL-004 | Move or rotate table; lamp stays on the same spot relative to its top. |
| CL-006 | Validate the entire supported group when moving/rotating a parent. | Designer | Table plus tall lamp cannot clip a wall/ceiling even if the bare table would fit. Invalid move does not lose either item. |
| CL-007 | Returning furniture to inventory also safely returns its supported contents; offer Undo. | Designer | Removing a table leaves no floating lamp and destroys no owned item. |
| CL-008 | Support relationships are acyclic and have stable surface IDs. | Designer | An item cannot support itself, nor can a table be placed on its own child tray. |
| CL-009 | Floor occupancy, support surfaces, wall mounts and walk-blocking footprints are distinct data. | User future-walkability intent | A wall photo does not block a floor lane; a table has a floor obstacle as well as an elevated top. |
| CL-010 | Preserve door/entry zones and offer an optional empty-path overlay. | User future-walkability intent | A layout can retain a connected walking lane. Decoration is not forced through an avatar or movement mode. |
| CL-011 | No avatar is designed or implemented in this slice. | User | Prototype contains placement tools and items only; no character controls or avatar setup. |
| CL-012 | Touch-first selection, drag, rotation, cancel and undo. Pinch zoom/two-finger pan cannot accidentally move a held item. | User / designer | Add a second finger during a drag: preserve/cancel the staged move safely and enter camera mode explicitly. |
| CL-013 | Small-object selection offers a large alternative such as selecting its supporting table and choosing the object from a contents list. | Designer | A lamp behind another item remains selectable without pixel hunting. |
| CL-014 | Use generous floor/surface snapping, contact shadows and a drop ghost. No free-fall physics needed for decorating. | Designer | Drop near an edge resolves predictably; the child stays inside support bounds. |
| CL-015 | Save room layout and owned inventory using versioned data; tolerate missing/renamed assets without losing ownership. | Collection rule | Save/reload reproduces table/lamp parenting; an unavailable item moves to inventory with a placeholder entry. |
| CL-016 | Inventory and placement refer to the same unique owned instance. | Designer | Placing an item does not mint a second copy; returning it restores its inventory slot. |
| CL-017 | Every item records a book/game/theme rationale and original-versus-verified status. | User | Review an aurora lamp, dog toy and photo frame and explain each connection in one sentence. |
| CL-018 | Provide pleasant pickup/place sounds, gesture-unlocked audio, mute and reduced motion. | Collection rule | Silent and reduced-motion modes remain fully usable. |
| CL-019 | Author readable source, reusable item definitions and reproducible builds; retain asset provenance. | Collection rule | Add a new tabletop item without rewriting the placement system. |
| CL-020 | First slice uses local saves only unless a backend is separately requested. | Current scope | No account creation, multiplayer service or remote database is provisioned to test placement. |

## Placement model
Separate an item definition from each owned instance.
- Definition: stable item ID, originating book/game, thematic rationale, visual asset, bounding volume, floor footprint, walk-blocking footprint, allowed mounts, support surfaces and decorative animation.
- Support surface: stable surface ID, shape/bounds, height and accepted placement category. It belongs to an item or room.
- Instance: unique instance ID, definition ID, cosmetic variant and ownership.
- Placement: instance ID, room ID, optional parent instance/surface ID, local transform. Root items attach to the room floor or wall; child transforms attach to the parent surface.
- Ground coordinates and height remain separate. Collision and support validation use world geometry, not screen-pixel overlap or painted shadows.
- Store parent relationships rather than duplicated absolute positions that drift after moving a table. Validate the graph on load; recover unsupported children to inventory rather than deleting them.
- Keep the model capable of a tray on a table with a small object on the tray. First interaction prototype needs only table plus object; deeper nesting is deferred until basic selection is comfortable.

## A room suitable for future walking
Represent connected floor areas, entrances and obstacles now. Reserve entry/door clearances; optionally show a one-tile-wide illustrative path through the furnished room. This is editor geometry validation, not an avatar specification or a promise every cluttered layout is navigable. Future walking can use these positions and footprints without rebuilding a flat decorative collage. Normal game selection still works directly through the lobby interface.

## First prototype acceptance sequence
1. Place a table on the floor and rotate it.
2. Put a Funhouse wind-up key and Wishbone toy on two positions on its top.
3. Move the table; both objects travel with it.
4. Select the key independently, move it to a shelf, and undo.
5. Reject unsupported/overlapping placements visibly and without loss.
6. Return the table to inventory; its remaining toy returns too; undo restores the group.
7. Reload and confirm ownership, positions and support relationships.
8. Inspect the empty route past the furniture and door.
9. Repeat the essential interactions on an iPad; real device testing remains a future acceptance task.

## Visual direction
A warm, tactile miniature with clean silhouettes, soft lighting and modest geometry. Furniture from different books shares scale/material treatment while retaining its theme. Contact shadows make stacking legible. Cutaway walls avoid obscuring items; zoom and a limited camera keep touch placement understandable. No engine choice, asset generation, scene build or performance claim has been made in this planning pass.

## What stays undecided
The fiction (Storyship remains a leading option), exact room size and expansion pacing, economy, renderer, backend/provider and any future walking character. We can test a table-and-lamp room without settling those choices.

