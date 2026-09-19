# Local treehouse variation trial — 2026-09-17

Jobe requested a treehouse alternative for the clubhouse floor/walls, reviewed a
generated concept and authorized trying it with the option to roll it back.

Requirements, implementation and verification are recorded in
[application treehouse trial](../application/docs/treehouse-trial.md).
The original room shell is retained via `RoomArt.environment("original")`;
change the default style back to `original` to roll back the appearance without
touching any saves or furniture. Trial source is `src/room/treehouse.ts`.

This is local only at http://127.0.0.1:5191/ . No publication or remote push.
The approved local waterfall from [plan 37](37-local-waterfall-and-session-handoff.md)
and the existing private hosted Site remain as previously recorded.

Strict build and 100 existing regression checks pass. Actual browser review
confirmed the new shell, floor walking and empty captured warning/error logs.
No physical-device or performance claims. Await feedback before further changes.
