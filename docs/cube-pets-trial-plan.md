# Cube Pets trial

2026-09-15. The user authorized a contained visual and behavior trial of Kenney
Cube Pets after the woodland-village pass.

## Brief

Replace the three implemented pet renderers with the matching Cube Pets cat,
bunny and fox while preserving Chapter House's existing pet identities,
ownership, prices, saves, navigation and interactions. Player avatars retain the
rounded procedural `AnimalRig`; the imported square silhouettes are pets only.

## Requirements

1. Keep stable pet IDs `cat`, `bunny` and `fox`, including Clover, Pip and Fig,
   starter selection, owned/active state and shop behavior.
2. Package only the three trial GLBs, their shared texture, individual catalog
   preview images and the supplied CC0 license under local application assets.
   Do not make runtime third-party requests.
3. Load the curated models once for the application, clone skinned scenes safely,
   share source geometry/material/texture resources and give each visible pet an
   independent animation mixer.
4. Map authored idle/walk animation to roaming and following, the eat animation
   to completed bowl approaches, dance to trampoline play and the positive
   gesture to petting. Keep the existing procedural trampoline trajectory and
   reaction bubbles.
5. Show the new pets in starter, Pets and Shop portraits without making those
   synchronous panels wait for GLB loading. Maintain usable fallback behavior and
   a readable notice if 3D pet assets fail.
6. Preserve clubhouse and Willowbrook navigation, touch targeting, pause,
   reduced-motion behavior, local save keys and all non-pet art.
7. Add focused loader/animation tests, run the full test suite and production
   build, and visually check clubhouse interactions plus the outdoor follower at
   desktop and narrow portrait sizes. Do not claim physical-device performance.

## Implementation boundary

Use a dedicated `PetAssets` resource owner and animated `PetRig`. The app owns
one `PetAssets` instance and passes it to the clubhouse and temporary town scene.
The room/town continue to own positioning, routes, reactions and interaction
timelines. Catalog thumbnails use the packaged Kenney preview PNGs; furniture and
avatar portraits remain generated from their current renderers.

This is a three-pet pipeline trial, not approval of the eventual 15-plus-species
roster and not a Firebase or publication change.
