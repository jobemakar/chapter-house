# Willowbrook activity feedback pass

Date: 2026-09-15  
Status: implemented and locally verified; not published

## Selected revision

Jobe's direct playtest feedback replaces Willowbrook's persistent action bubble with a stationary-avatar toggle. Tapping the user's avatar opens an arc containing Fish and Dig; tapping again dismisses it. Both actions stay visible, while unavailable ones are gray and disabled. Walking, starting an action, and leaving town also dismiss the arc. Reel remains a separate non-expiring prompt during fishing.

Fishing now uses larger layered ripples, a lure, and splash droplets. Successful fish or dig discoveries display the actual collection image, name, rarity treatment, and stacked count above the avatar for about two seconds.

The rejected shovel/body oscillation was replaced by two controlled tool strokes with stable paw poses. Digging creates a temporary dark hole plus a locally packaged Kenney Nature Kit dirt mound, then removes it without changing the walkable world.

The Willowbrook title card appears when the player enters, then fades away. Reduced motion keeps the orientation period but uses an opacity-only transition.

## Verification

- Application tests: 84 passing.
- TypeScript and Vite production build: passing; existing chunk-size advisory remains.
- Desktop 1280×720 review: title fade, action arc, disabled Fish, revised dig treatment, and image-backed discovery bubble verified.
- Mobile 390×844 touch emulation: one avatar tap opened the arc; both 68-pixel actions fit without clipping; title visibility changed from visible on entry to hidden after the fade.
- No publication or hosted-site update was performed.

Detailed implementation and verification live in:

- `application/docs/town-activities-feedback-plan.md`
- `application/docs/town-activities-feedback-verification.md`
