# Avatar species verification

2026-09-19 · META-001-AVATAR1 · Local only

## Automated checks

- `npm run typecheck` passed.
- `npm test` passed all 113 application tests. The profile coverage confirms
  legacy saves default to fox, bunny survives save/reload, and an unknown value
  normalizes to fox.
- `npm run build` passed and rebuilt the production application output.
- `git diff --check` passed for the authored change set.

## Browser review

Reviewed the local Vite build at desktop size in the in-app browser:

1. Your Look displayed Fox, Cat and Bunny as readable selectable controls with
   exactly one selected state.
2. Each choice updated the rendered preview and the visible clubhouse actor.
   Bunny's long ears and short tail, cat's plain tail, and fox's cream-tipped
   tail were visibly distinct; the existing Lilac color and scarf remained.
3. Entering Willowbrook after choosing Bunny rendered the bunny actor at the
   arrival position with the companion unchanged.
4. Reloading returned to the clubhouse with Bunny still selected and rendered,
   confirming browser persistence.

No remote Site, Firebase data or standalone game package was changed.

## Feedback correction verification — 2026-09-19

After Jobe rejected the original fox/cat distinction as too subtle:

- Fox now has taller pointed ears, a longer muzzle and a large low cream-tipped
  brush tail. Cat has a broader head, compact muzzle, cheek/whisker marks and a
  slim upright curved tail. Browser comparison confirmed that the two read as
  different species in both the wardrobe preview and normal clubhouse actor.
- The free palette now contains ten named colors: Autumn, Slate, Honey, Lilac,
  Cream, Cocoa, Moss, Rose, Midnight and Teal. The four original hex values are
  unchanged.
- The palette was visually checked at desktop size and a 390×844 phone viewport.
  Ten unlabeled visual swatches wrap cleanly into two rows while retaining their
  accessible names; Teal selection updated the preview and actor immediately.
- `npm run typecheck`, all 115 tests and `npm run build` passed after the visual
  correction. The existing Vite large-chunk advisory remains non-blocking and
  unrelated to avatar customization.

This correction remains local and unpublished.

## Rollback verification — 2026-09-19

Jobe rejected the cat and bunny and requested the original fox shape back.
Species controls and the saved species field were removed. Room, Willowbrook and
wardrobe portrait rendering again construct the fox explicitly. The
`AnimalRig` head, muzzle, rounded ears and nested cream-tipped tail match the
pre-species source implementation.

The ten-color catalog remains active and continues to preserve the four
original exact values. A temporary local profile containing a `species` key can
still load because unknown additive profile fields are ignored; it renders the
fox without affecting any other saved data.

Post-rollback typecheck, all 114 tests and the production build passed. Browser
review confirmed that Your Look contains no species controls, identifies the
preview as a fox, renders the original rounded fox in the preview and room, and
retains all ten color swatches. No publication occurred.
