# Feedback 04 verification — 2026-09-15

Implemented the local outdoor village, distinct character reactions, removal of active pocket powers, revised pouch/Y-fork launcher, dog/block collision sound, and the 2400-unit-wide Long Walk Home yard. The wide yard uses only the spring mechanism, eight targets, unlimited throws, an overview and flight-follow camera. World-space grass keeps structures grounded while the watercolor backdrop moves separately.

## Automated checks

- All 56 tests pass. Strict TypeScript and the production Vite build pass. Vite reports the existing large-bundle advisory (about 772 kB before gzip).
- Physics checks cover stable idle yards, ordinary-throw completion of the wide yard, and world/checkpoint restoration. Camera checks cover inverse transforms, wide bounds, overview/follow/return and reduced motion.
- Save tests retain original source keys, archived fields and already-owned displays; old power discoveries no longer create new rewards. Removed active-power tests were replaced with compatibility checks.
- Town A* tests verify paths around the fountain and trees, solid buildings and stream exclusion, including a reachable point beside the fountain that did not coincide with a grid node.
- Instrumented town audio tests verify gesture/mute/background gating, distance gain, stereo pan, unavailable-audio fallback and disposal. These are scheduling tests, not speaker listening tests.

## Browser observations

On the local production output at port 5190: Outside opens the village; Fountain square walks toward the basin; tapping the basin triggers the coin animation and leaves the 54-coin balance unchanged. A route to the far side walks around the fountain. Dragging pans the world independently. Return home and reload preserve the furnished room, pet and profile.

Water diagnostics show one playing loop when unmuted, with gain falling from about 0.018 to 0.012 as camera distance increases and stereo position changing with the view. Original muted preference restored. Off-screen suppression is covered by the audio unit test; actual speaker quality remains unverified.

Room wave and call-pet display the cloud-shaped avatar bubble and smaller pet speech bubble. Desktop and a 390×844 portrait viewport were inspected; no physical-device test is claimed. The wide level appears in Levels, launches through the normal drag gesture and changes from whole-yard overview to a following detail view. Active pocket controls are absent; existing keepsakes remain.

## Review and limits

Astra wrote the pre-code plan and independently reviewed the integration. Terra implemented bounded Wishbone and town-art/audio work; the primary agent integrated navigation, reactions and app transitions, reviewed changes and performed browser checks. Review fixes included fountain-edge path termination, town texture disposal, wide camera clamping, and hiding unobtainable power keepsakes for fresh profiles. Visual review also corrected face-overlapping bands, unsupported band anchors and wide-background coverage.

Town buildings are scenery; the clubhouse has a return action. Fountain tossing is free and cosmetic. This remains a local prototype with no Firebase or live multiplayer. Physical phone/iPad, native fullscreen and listening on actual speakers remain pending.
