# Willowbrook activity feedback pass

Date: 2026-09-15  
Status: selected for implementation from Jobe's direct playtest feedback

## User decisions

1. The contextual action UI is hidden by default. It opens only when the user taps their own stationary avatar, and tapping the avatar again dismisses it.
2. The open action UI forms an arc around the avatar instead of a persistent speech-bubble block.
3. The arc always shows Dig and Fish. Actions that are invalid at the avatar's current position remain visible but disabled and gray. The non-expiring Reel prompt remains an automatic active-fishing prompt so the player cannot lose the cast by closing the radial menu.
4. Starting a walk, starting an activity, or leaving Willowbrook closes the action arc.
5. Fishing keeps its current overall motion, but water ripples become larger, brighter and more layered.
6. A successful fish or dig result appears for about two seconds above the avatar with the discovery image and name, while still saving and announcing the count normally.
7. The current shovel/dig motion is rejected. Replace it with a readable scoop sequence and a convincing temporary hole/mound treatment, using a suitable locally packaged Kenney asset if the audited packs contain one.
8. The Willowbrook title card appears on entry, then fades and becomes non-interactive so it does not permanently occupy the viewport.

## Implementation plan

1. Add explicit radial-open state to `TownWorld`. Avatar ray hits toggle it only while route and activity are idle; navigation and activity transitions close it.
2. Extend `TownContextView` to report menu-open state and availability separately. Render both Fish and Dig whenever open, using disabled semantics and CSS arc positions. Continue projecting the group anchor from the avatar each frame.
3. Add a dedicated two-second discovery result view carrying the catalog definition and count. Render fish from packaged Kenney PNGs and provide image-form artwork for finds rather than text alone.
4. Replace the single ripple ring with multiple independently pulsing rings plus a small lure splash. Reduced motion keeps the rings visible but removes repeated scale oscillation.
5. Remove the current shovel/body oscillation. Animate a controlled two-scoop tool pivot with fixed readable paw poses, then transition to a temporary authored dirt/hole prop. Keep all action resources disposable.
6. Add an entry-title animation that is restarted on every town entry. Reduced motion uses a short opacity fade without translation.
7. Add focused tests for avatar radial toggling/availability where logic can be separated, preserve the activity/profile tests, then run the complete suite, production build, desktop browser review and 390×844 touch review.
8. Update verification and shared planning, commit locally, and do not publish without a new publication request.

## Acceptance

On entry, Willowbrook's title identifies the space and then gets out of the way. A stationary avatar tap opens two curved actions; Fish remains visible but disabled away from the stream, becomes enabled at a bank, and the same avatar tap closes the menu. Walking never leaves the menu floating behind. Fishing produces emphatic readable ripples. Successful discoveries display their art and name above the avatar for roughly two seconds. Digging reads as two intentional scoops followed by a temporary hole/mound, without the previous limb jitter or body glitch.
