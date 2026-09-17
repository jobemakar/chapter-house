# Treehouse room-shell trial — 2026-09-17

Jobe approved trying the generated treehouse concept and may roll it back.
This is a local trial; publication is not authorized.

## Requirements and plan

1. Replace the room shell with honey-brown staggered floorboards, timber walls,
   organic corner trunks/branch beams, restrained canopy leaves and a leafy window.
2. Retain the rectangular 10-by-8 floor, floor height, existing rug/picture/mat,
   all furniture placements, interactions, navigation, camera and save formats.
   Supports hug the perimeter rather than introduce new interior obstacles.
3. Keep the original shell intact behind an explicit `RoomArt.environment` style
   parameter. Revert the trial by changing its default to `original`.
4. Use authored procedural Three.js geometry and texture data, owned by the room.
   The generated image is concept reference only, not a shipped texture or asset.
5. Run the strict build and existing regression suite, inspect the actual browser,
   and record evidence and limitations. Preserve town/standalone repositories and
   the existing private hosted Site.

Implementation: a focused `TreehouseShell` builds scenery; `RoomArt` keeps common
room details and the untouched original shell. No new persisted room-style field.

Concept generated with the built-in image tool on 2026-09-17:
`C:/Users/jmakar/.codex/generated_images/01a0b0b5-7ffa-7b50-98aa-5a5f517828af/exec-ec2ea6b1-0de5-4e9c-986f-a31fc61a5829.png`.
User supplied a treehouse illustration for inspiration. Generated furniture and
characters illustrate mood; this trial changes only the room architecture.

## Verification

- Strict TypeScript/production Vite build passed. Existing bundle-size warning
  remains; no new device performance claim.
- Existing application suite: 100/100 passing.
- Actual in-app-browser visual review at the current portrait window: complete
  room, visible window, perimeter branches/leaves, existing furniture/rug and
  controls. Tapping open floor started walking, confirmed by the read-only local
  status tool and visible avatar movement. Captured warning/error log was empty.
- No physical-device testing, sound listening or new game integration.
- Original shell remains byte-for-byte in behavior behind the `original` style;
  only indentation changed. Room-owned grain texture is disposed with the scene;
  imported pet/terrain maps are not included in that texture cleanup.

Trial awaits Jobe's feedback. Keep local; reverting the default style preserves
all saves and furniture placements.
