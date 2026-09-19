# iPad touch-first design

Date: 2026-09-10 · Local version 0.2.0 · Requirements SG-017–SG-022

The primary device is an iPad. A relative thumb drag chooses direction and speed without moving the rider under the finger. A visible lower-left pad mirrors that direction; dragging the open playfield also works. Touch down is neutral, a 7-pixel dead zone ignores jitter, and a 52-pixel drag reaches full speed. Lift immediately clears velocity. A second finger can use the large lower-right Dash button while the steering pointer keeps ownership.

Pointer cancellation, lost capture, pause, and viewport resize clear input. Extra finger presses/releases cannot take over or stop the first finger. Dash fires on touch down and suppresses its compatibility click. Keyboard activation remains available.

Touch capability selects the layout, including on larger iPads. The design reserves a lower control band, enlarges all controls to at least 48 CSS pixels, handles device safe-area offsets, and supports portrait/landscape without requiring an orientation choice. On touch devices, canvas pixel ratio is capped at 1.5. The original painted sky and chapter hue are cached between viewport/chapter changes instead of re-filtered on every frame.

The core game, collection schema, and permanent progress key remain unchanged. The updated playable is local only; the previously public Site remains at its old release. No backend, multiplayer, or meta-game code was added.

Physical iPad Safari playtesting is still needed to assess feel, actual frame rate, audio, and the screen layout; event simulation is not a substitute for that feedback.
