# Unified shell and space controls verification — 2026-09-19

Implemented the persistent Chapter House bar, reusable fading space descriptor,
shared avatar actions, two-step reaction picker, bounded pet wandering, and the
requested control removals. This remains local at `http://127.0.0.1:5191/`.

## Automated verification

- Strict TypeScript/Vite production build passes. The existing large-chunk
  warning remains.
- Application tests pass 101/101. A new town-navigation check verifies that
  outdoor pet wander targets remain walkable, routable, and within 2.8 world
  units of the avatar.
- Preview verification passes for 13 standalone previews / 19 files with exact
  source, production, and served bytes, correct MIME types, and unknown-route
  404 behavior.

## Live browser verification

- Desktop/default view: one 0.7-opacity shared bar retains the logo, profile,
  coins, sound, fullscreen, and help. All eight destinations/actions live in the
  bar. The previous bottom dock and duplicate town/game app controls are absent.
- Clubhouse and Willowbrook use the same descriptor markup, visual treatment,
  4.8-second animation, and reduced-motion alternative. Willowbrook entry was
  observed visible, then non-interactive/hidden after the animation.
- React was opened with one tap; the attached Love/Wow/Curious list appeared.
  Choosing Love applied the second tap and closed the list.
- Willowbrook marks Outside current and disables Decorate with an explanatory
  title. Fountain shortcut, recenter, and explicit zoom controls were absent;
  direct fountain interaction and wheel/pinch handlers remain in source.
- Shared Wave, Jump, React, and Call pet controls were present in both avatar
  spaces. Calling the outdoor cube pet moved it 2.15 world units and settled it
  exactly 1 world unit from the avatar; free wandering remains bounded and
  walkability-routed.
- Phone portrait at 390×844 had no document overflow. All eight top navigation
  labels fit the second bar row; the shared action row remained reachable.
- Phone landscape at 844×390 had no document overflow. The app bar remained the
  only application bar; narrow landscape navigation scrolls horizontally. The
  Wishbone surface retained its yard title, Levels, Restack, Keepsakes, and game
  behavior while duplicate app controls and explicit camera buttons were hidden.
- Captured browser warning/error log was empty. Temporary viewport override was
  reset, and the surviving browser tab was returned to the clubhouse.

No physical-device, audio-listening, deployment, or hosted-site claim is made.

