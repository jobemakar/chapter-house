# Phone feedback — 2026-09-16

1. Landscape rotation must preserve Stormglide's logical world dimensions and camera-to-input mapping. The character, flight bounds, pickups and collision/reachability rules remain in world coordinates; CSS may size the canvas but cannot resize physics.
2. Keep the existing `stormglide-v1` save and endless, forgiving loop unchanged.
3. Rebuild the canonical playable output and run the existing tests.
