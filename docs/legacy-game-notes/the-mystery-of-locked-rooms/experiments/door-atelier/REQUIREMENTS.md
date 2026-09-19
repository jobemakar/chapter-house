# Door Atelier — requirements

**Identity:** `door-atelier` · **save:** `door-atelier-v1` · **format:** standalone original miniature-door experiment.

## Numbered requirements

1. Present three always-accessible, original, inspectable 3D miniature door scenes: Brass Garden Door, Lantern Mirror Door, and Clockwork Secret Passage.
2. The core signature is **rotate / inspect → collect a physical piece → use it at its socket → operate linked mechanisms → open the door**. It is spatial close inspection, not track routing, a quiz, typed-answer riddle, or autonomous-machine construction.
3. Horizontal drag/swipe rotates the displayed diorama; large previous/next buttons switch scenes. Tappable objects must visibly respond, and the camera/scene must have true depth. Ring-shaped sockets have filled invisible touch hit regions, so tapping their center works.
4. Each scene has a short authored, physical solution with visible state changes: pieces are collected into an inventory; selected pieces are used at matching sockets; mechanisms reveal a key or release the door.
5. No countdown, failure state, destructive mistake, score loss, or locked scene order. Reset is unlimited for the current scene. Nudge is always free and contextual.
6. Keep the scene visible while controls are used: phone-first controls have large targets and avoid a fullscreen modal/overlay that hides the diorama.
7. Save scene completion, current scene, mute, pause, and reduced-motion preferences locally and independently from Pocket Funhouse. Corrupt or unavailable storage falls back to a playable session.
8. Include gesture-triggered synthesized audio, mute and pause controls, and reduced-motion behavior. Sound is decorative only.
9. The book anchor is the novel's abandoned funhouse, secret passages, elaborate puzzles and rumored treasure. All three workshop scenes, props and solutions are invented and contain no copied artwork, characters or levels.
10. Ship editable TypeScript source, reproducible standalone build instructions, and automated puzzle-state checks. Do not change Pocket Funhouse or the collection application.

## Authored solutions

1. **Brass Garden Door:** inspect the ivy pedestal to collect the **mossy gear** → select it in inventory and tap the empty brass socket → tap the newly connected **garden crank** → collect the revealed **garden key** → use the key on the door lock → tap the door.
2. **Lantern Mirror Door:** inspect the floor satchel to collect the **mirror shard** → install it in the mirror frame → tap the **lantern shutter** to shine the reflected beam onto the seal → collect the released **silver key** → use it in the lock → tap the door.
3. **Clockwork Secret Passage:** inspect the tool tray for the **spring coil** → install it on the clock spindle → tap the **winding handle** → collect the dropped **passage key** → use it on the panel lock → tap the panel.

## Deliberate limits

The assets are authored geometric forms and synthesized sound rather than a licensed asset pack. This is a focused three-scene prototype: it has no narration, translations, cloud sync, haptics, accessibility audit on physical hardware, or copied reference-game content.
