# Contraption and Machine Workshop

The canonical TypeScript game is shared by Chapter House and its standalone
entry. The desktop level editor is local only.

From `application/`, run `npm run dev:contraption` and open
[Machine Workshop](http://127.0.0.1:5197/editor.html).
The normal standalone game is at [Contraption](http://127.0.0.1:5197/).

Choose a unique file ID and Blank or Copy current. Add pieces, drag them or enter
coordinates/rotation, mark fixed fixtures, and choose additional spare quantities.
Select a spare piece to configure its initial state or control binding. Inlets
and the bowl move in the editor; the playfield and piece sizes stay fixed.

Corn buttons react to kernels; hand levers react to player taps. Each targets
one conveyor or fan. Conveyors reverse and fans switch on/off. Toggle controls
repeat; latches act once until restarting. Devices have authored initial states.

Save level file writes a draft without including it in gameplay. Add current
level and Save playable list explicitly control inclusion and order. Incomplete
drafts can be saved; Playtest/inclusion require valid connections and geometry.
Undo/redo, optional snapping and Ctrl/Command-S are available. All included
levels are selectable without unlock gates.

Playtest runs the actual game with disposable progress and no persistent host
effects. Stop returns to the exact editor document. Restart resets the test.
The game's own Pause and Sound buttons remain available. The editor starts
tests muted. New levels contain no authored solution or solution-assist UI.

Files live in `public/levels/`, with `index.json` as the separate ordered list.
Chapter House reads these same files through its read-only asset bridge. Both
builds package them; local writes are never included in production servers.
Spare records have stable identities, including their button/lever bindings.

The six original puzzles and old assists remain, including a compatibility path
for the original finale's multi-belt directional switches. Those switches are
not offered in the new-piece palette. Player saves migrate to stable level IDs
while retaining the existing storage key and old earned progress. Incompatible
level edits reset only that level's saved arrangement.

See [verification](docs/editor-verification.md) and root plan 61 for requirements,
implementation decisions, known limits and verification details.
