# Icon shell, reactions, appearance, and pet motion verification — 2026-09-19

Implemented locally at `http://127.0.0.1:5191/`; no deployment or hosted-site
change was made.

## Automated verification

- Strict TypeScript/Vite production build passes. The existing large-chunk
  warning remains.
- Application tests pass 104/104. New checks cover the 50 unique reaction
  choices and the shared pet roaming policy's equal speed, bounded target,
  catch-up, and call behavior.
- Preview verification passes for 13 previews / 19 files with exact source,
  production, and served bytes, correct MIME types, and unknown-route 404.

## Live browser verification

- The eight top navigation controls and four avatar controls contain icons only;
  accessibility exposes their names and disabled state. Tooltips remain.
- Willowbrook visibly renders beneath the top bar. Its computed background is
  the requested 0.7-alpha color, and the bar is an absolute overlay rather than
  sitting over an opaque page strip.
- React opens an attached grid aligned immediately above its button. Exactly 50
  emoji-only menu items are present with accessible labels and no visible text
  labels. The picker is scrollable, choosing an emoji closes it, and the selected
  emoji appears in the avatar thought bubble.
- The outdoor Your Look panel applied Slate fur while still open. Read-only live
  status reported the rendered rig and profile both at `#8e9eae` with the same
  bow accessory before panel close. Test appearance was restored to Lilac/Bow.
- Indoor and outdoor pets use `PetRoamingController` and `PetRoamingPolicy` with
  the same 0.8 movement speed, 3–7 second cadence, 3.6-unit catch-up boundary,
  and obstacle-aware routes. Room furniture activities remain separately owned.
- At 390×844, all eight top icons and four bottom icons fit with no document
  overflow. The reaction picker uses five columns and stays within the viewport.
- At 844×390, the picker uses eight columns, stays inside the viewport, and the
  document has no horizontal overflow. The default viewport was restored.
- Captured browser warning/error log was empty. The surviving tab was returned
  to the clubhouse and retained for continued iteration.

## Future spaces

Clubhouse and Outside remain direct icons in this pass. When a third destination
is added, replace those destination icons with one Places icon that opens a small
data-driven picker. Each place record should supply its id, icon, label,
descriptor copy, availability, and transition callback. Activities such as
Games, Collection, Pets, Your Look, and Shop remain separate global controls.

