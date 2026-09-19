# Fountain taps and Wishbone depth — 2026-09-16

Implemented direct playtest feedback in the local application. The fixed Toss
a coin button is removed; fountain taps retain proximity, cooldown, cosmetic
flight, audio and wish reactions. This supersedes plan 30's persistent-button
requirement without changing the fountain rules or economy.

Wishbone now samples only sky/mountains from its unchanged painted backdrop.
A separate authored canvas fence sits behind the physical items, shares the
floor's vertical zoom/pan anchor, and moves horizontally almost at world speed
(0.96), faster than the mountain layer (0.20). The lawn extends to the viewport
bottom and edges at wide overview. Physics and saved world coordinates are
unchanged; no new mechanic or collectible.

Root implemented/integrated/reviewed this small coupled pass without delegation.
86 tests and strict production build pass. Served-browser inspection covered
classic/wide yards, overview/detail/diagonal pan, 390×844 layout and direct
fountain taps at distant/near positions. Physical-device testing, new listening
and publication were not performed.

See `application/docs/feedback-05-plan.md` and
`application/docs/feedback-05-verification.md`.
