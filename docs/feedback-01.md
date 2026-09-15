# Clubhouse feedback pass — 2026-09-14

## Brief and scope

Polish the local clubhouse's sound, expressive animal animation, furniture interaction and decorating recovery. Preserve Wishbone Fling mechanics and existing local progress. Firebase remains the next checkpoint.

## Requirements

1. Add quiet, looping ambient music and distinct UI, pet and jump feedback. Respect the shared mute setting, browser gesture unlocking, background suspension and game transition; do not overlap clubhouse music with game music.
2. Preserve the avatar's travel direction on arrival. Ignore zero-length route points and retain facing when changing appearance.
3. Give jumping anticipation, airborne limb motion and a soft landing; make waving readable outside the body silhouette. Respect reduced motion.
4. Tapping a placed lamp toggles its light outside decorating. Save that state per owned instance locally now; preserve it through placement, storage and reload. The later member persistence must carry the same state.
5. Canceling an item preview leaves decorating usable: selecting another item must work immediately. Provide an explicit way to finish decorating.
6. Try three rounded, organic action buttons near bottom-center with accessible names and adequate touch targets. Keep placement controls and phone orientations usable.

## Implementation plan and acceptance

- Delegate the bounded sound service to a less expensive coding model, with no ownership of the room, profile or shell. Integrate and review it in the primary agent.
- Implement route/facing, rig animation, lamp state and editor fixes in the primary agent. Add focused regression checks for arrival heading, animation poses and per-instance persisted lamp state.
- Build and test; inspect the actual browser at desktop and phone sizes, including cancel then select, lamp toggle/reload and navigation between game and room. Record physical-device/listening limitations accurately.
- Rebuild the existing local deliverable and update verification notes. No Firebase setup or deployment in this pass.

## Deferred or proposed design

- User explicitly deferred a larger clubhouse or connected rooms; retain this as a future option without building it now.
- Proposed avatar catalog starts with fur colors, hats, glasses and neck accessories; shirts/pants require fitting across species and animation. This is a recommendation, not a finalized catalog or a restriction on the confirmed ability to buy outfits.
