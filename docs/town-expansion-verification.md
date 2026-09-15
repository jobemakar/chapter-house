# Willowbrook expansion verification

2026-09-15

Willowbrook now occupies 60×48 ground units, four times its former area. The
original square and landmarks remain recognizable, while a stream divides the
larger north and south districts and a timber bridge supplies the only legal
crossing.

## Implementation

- Expanded the authored layout on both axes, redistributed tree groves and lawn
  variation, and added connected district paths without changing saved profile,
  pet, currency or game data.
- Added a full-width water band, planted banks and a raised timber bridge. The
  shared navigation map rejects every water destination and allows stream-band
  movement only within the bridge deck, including diagonal-segment checks.
- Changed the outdoor companion destination to a walkable shoulder point beside
  the avatar, with left-side and trailing fallbacks when the preferred side is
  blocked.
- Added a bounded fountain interaction radius. The persistent Toss a coin button
  is disabled outside it, and a direct distant fountain tap produces a proximity
  hint rather than starting an animation.
- The cosmetic coin now launches at the avatar, follows a deterministic arc and
  lands in the fountain pool. Its immediate clink and timed landing splash bypass
  attenuated water ambience while still honoring mute/hidden/inactive state.
- Added procedural global woodland ambience: a quiet wind/leaves bed and sparse
  bird calls. Fountain water remains the spatial sound and all town-owned voices,
  timers and nodes are stopped on mute, hide or disposal.

## Validation

- `npm test`: 67 passing tests. New coverage includes cross-district routing
  through the bridge, rejected water destinations, side-follow targets, fountain
  interaction bounds, avatar-to-fountain trajectory and the expanded town-audio
  lifecycle.
- `npm run build`: TypeScript and Vite production build passed. The existing
  large-chunk advisory remains (about 880 kB JavaScript before gzip); this check
  is not a performance measurement.
- Desktop browser: walked from the fountain district onto the bridge and into
  the northern district; the camera followed across the stream and the Cube Pet
  settled beside the avatar. Verified the coin control changes from disabled to
  enabled at the fountain and that a toss shows the established wish reaction.
- Visual inspection confirmed the water, planted banks, timber deck and rails
  read as one crossing, with connecting paths visible on both sides. Browser
  logs contained no warnings or errors.
- Narrow portrait 390×844: the bridge, stream, avatar, side-following pet, heading
  and all town controls remained visible and reachable. The temporary viewport
  override was restored.

## Limits

Audio lifecycle and oscillator scheduling are covered by deterministic fake
Web Audio tests, but loudness and mix were not measured on a physical device.
Likewise, bridge navigation was exercised in the browser and by pathfinding
tests, not on a touchscreen device. No Firebase, account, multiplayer or
publication work was included.
