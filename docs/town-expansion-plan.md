# Willowbrook expansion and interaction pass

2026-09-15. User feedback authorizes a larger town, a crossable stream, improved
pet following and more intentional fountain/audio behavior.

## Interpretation

“Four times this size” means four times the ground area: double the current
dimensions from 30×24 to 60×48. This keeps travel substantial while avoiding a
fourfold increase on each axis, which would produce sixteen times the area.

## Requirements

1. Expand Willowbrook to 60×48 while retaining the clubhouse entrance, reading
   tent, garden, fountain, imported Kenney woodland language, pan/zoom and Home
   escape. Compose additional paths, groves and open clearings rather than merely
   stretching the existing geometry.
2. Run a visible stream through the map as a true barrier. Add one clearly
   readable timber bridge that both avatar and pet can cross. Navigation may
   enter the stream band only within the bridge deck and must not cut across
   water corners or banks.
3. Keep all existing room, pet, game, save and currency data unchanged. The
   larger town is transient presentation and does not add a save migration.
4. Change the outdoor companion target from the avatar’s exact position to a
   stable point beside the avatar. Prefer the right side, fall back to the left
   or behind when terrain blocks it, route through the same navigation map and
   settle without standing on the avatar’s feet.
5. Permit coin tossing only when the avatar is within the fountain plaza’s
   interaction radius. Disable the persistent Toss coin control when unavailable;
   a distant fountain tap gives a short proximity hint and no toss.
6. Launch the visible coin from the avatar toward the fountain pool along a
   readable arc. Keep the toss cosmetic: no balance change and no idle reward.
7. Give every eligible coin toss a distinct audible clink/splash that respects
   shared mute, hidden/inactive lifecycle and gesture gating. It must not vanish
   merely because fountain-water ambience is attenuated.
8. Add subtle procedural town nature ambience (wind/leaves and light birds),
   separate from spatial fountain/stream water, with the same mute, pause,
   visibility and disposal guarantees. Avoid runtime third-party audio requests.
9. Update automated coverage for cross-map routing through the bridge, rejected
   water destinations, companion-side selection, coin proximity/arc and audio
   lifecycle. Run the full tests and production build; visually inspect desktop
   and 390×844 portrait navigation on both sides of the stream. Do not claim
   physical-device or large-world performance without measurement.

## Implementation and ownership

Astra owns coordinate/layout design, navigation, companion targeting, fountain
proximity, coin trajectory, integration, review and browser QA. Delegate the
bounded `TownAudio` nature/coin-sound implementation and focused audio tests to
GPT-5.6 Terra. Existing `TownAssets` and `PetAssets` retain resource ownership;
the pass adds no third-party asset package and no Firebase or deployment work.
