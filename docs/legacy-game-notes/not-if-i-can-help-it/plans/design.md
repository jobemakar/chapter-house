# Gummy Nook design and maintenance
2026-09-13 · local 0.1.0

This demo realizes BOB-006-R2. Seven original candy silhouettes, a mint tray, peach-paper room and warm shelf establish a quiet confectionery setting. SVG geometry is authored in src/art.js; gradients can be disabled. Original synthesized sound is authored in src/audio.js. No external assets, fonts, packages, requests or recordings are required.

## Play rules
Select the supply, then a cell, or drag directly. Matching pairs upgrade. Only a deliberate pair merge initiates adjacent cascades; ordinary placements and moves remain stable. Cascades consume the first equal neighbor in up/right/down/left order and repeat at the destination. Position an equal gummy beside the planned destination to set up a longer chain. Unequal board pieces swap, while supply pieces reject unequal occupied cells. Golden bears are the maximum form and remain on the tray until moved or scooped.

The opening dewdrop at 11, heart at 12 and star at 16 permit a three-step first merge. The first three shapes and candy jar are welcome discoveries. The supply starts with 0/0/1. After the flower is discovered, new supplies have a 42% chance of hearts; after the butterfly, 18% stars, 24% hearts and 58% dewdrops. Unlimited free supply and rearrangement make the tray a discovery sandbox rather than a finite-move puzzle.

## Progress and recovery
Local storage key bob-gummy-nook-v1, version 1. Save fields: 25-cell board, 3-piece queue, discovered tiers, cumulative merges, derived keepsake IDs, mute/music/motion/gloss settings. Save after each accepted action. Thirty board/queue undo snapshots exist only for the current page session. Undo restores arrangement and supply, retaining all discoveries and cumulative merge count. Reload preserves play state but clears undo history. No older save existed; no migration needed. Malformed data is field-validated; unavailable storage leaves a playable memory session with visible save notice.

Shape discoveries unlock the four keepsakes defined in src/core.js. Shelf art represents ownership; full clubhouse placement and cross-game inventory are not implemented. The historical stable game ID gummy-galaxy is retained even though the title is Gummy Nook.

## Accessibility and scope
Touch drag, tap-tap, Tab/Enter/Space, named cell buttons, shape silhouettes in addition to color, live action status. Pause/settings use native modal dialogs. Reduced-motion preference is honored and configurable; matte candy and music toggles are independent. Master audio gain mutes currently sounding notes immediately. Audio starts on a gesture.

No publication, accounts, remote services, quizzes, failure screens, time pressure or book-story recreation. Original thematic connection is documented in requirements.md.

## 0.1.1 movement feedback
Each swap uses two simultaneous 190 ms eased flights with opposing shallow arcs. Merges use a 190 ms travel followed by a 125 ms squash; adjacent cascades repeat sequentially. Drag release begins at the held gummy position. State commits and saves first; input is gated during playback, while undo, pause or settings safely cancel the visual sequence and render committed state. Reduced motion skips travel. Source: src/motion.js.


## Superseded by 0.2.0
The merge/supply rules above describe historical 0.1.x. Current full-board match-3 design, pacing and migration: match3-design.md. Original art and audio provenance still apply.
