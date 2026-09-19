# Willowbrook expansion — 2026-09-15

User feedback expanded Willowbrook from 30×24 to 60×48, which doubles each axis
and produces four times the ground area. The retained fountain square,
clubhouse entrance, reading tent and garden now sit in a larger path-and-grove
layout. A full-width stream divides the town; one visible timber bridge is the
only legal avatar and pet crossing, and water itself is non-walkable.

Outdoor companions now route to a walkable position beside the avatar instead
of overlapping the avatar’s feet. Fountain coins are proximity-bound, launch
visibly from the avatar to the pool, and have a distinct clink and landing sound.
Procedural global wind/leaves and bird ambience joins the existing spatial water
sound while retaining shared mute, hidden-page and disposal behavior.

Astra planned, designed and integrated the layout, navigation, follow,
interaction and visual behavior and performed final browser review. A bounded
GPT-5.6 Terra sub-agent implemented the town audio layer and focused tests. All
67 tests and the production build pass. Desktop and 390×844 browser checks cover
both districts, the bridge, proximity state and companion spacing; no physical-
device, Firebase or publication claim is made.

See `application/docs/town-expansion-plan.md` and
`application/docs/town-expansion-verification.md`.
