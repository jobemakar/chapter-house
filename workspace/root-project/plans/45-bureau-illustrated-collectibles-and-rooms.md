# Bureau illustrated collectibles and rooms — 2026-09-17

Jobe authorized implementation after the phone walkthrough recorded in
`C:/Users/jmakar/Documents/Codex/2026-09-17/i/outputs/phone-playtest-feedback.md`.
The earlier recording-only hold is superseded. Upgrade presentation, not puzzles.

## Brief and requirements

1. Replace bland final record icons with richly illustrated collectible cards.
   Night Garden gets a moonlit magical garden illustration and short case notes;
   Lanternwing gets a creature portrait, name and concise field-record details.
2. End-of-floor cards should feel more valuable than individual sigils: larger
   landscape artwork within a crafted card frame, distinct case/cryptid metadata,
   readable real HTML text and restrained magical reveal. Collection revisits use
   the same card. These remain invented game records, not claimed novel details.
3. Replace the twelve labeled oval search locations with generated object art.
   Preserve neutral labels, minimum 44px touch targets, keyboard activation and
   found/searched states. Tap still walks to the existing spot before searching.
4. Enrich the floor with restrained generated midnight stone/wood texture and
   atmospheric lighting. Preserve dark indigo/gold, nighttime eeriness, exact
   shelf collisions, pathfinding, elevator/archives and existing room layout.
5. Keep two floors, six sigils, all riddles/order clues, navigation, reward IDs,
   save keys/formats, mute/fullscreen/help, pause/focus and reduced-motion support.
6. Rebuild canonical authored TypeScript/template and embed raster assets in the
   standalone HTML. Refresh only Bureau's Chapter House snapshot and provenance.
7. Validate strict build, existing domain checks, old saved rewards, discoverable
   artwork, phone portrait/landscape card readability and no horizontal overflow.
   Publish to the existing owner-private Chapter House Site for remote testing;
   no new Site, audience change, gameplay integration or save synchronization.

## Signature and comparison

Unchanged: tap/search → reveal parchment → solve riddle → keep sigil/order clue
→ unseal archive → permanent record. No new mechanic or overlapping game concept.
Trading, card battles, rarity/economy and collectible gameplay are not added.

## Implementation ownership

Root owns planning, map painting/hotspots, build asset embedding, integration,
verification, canonical packaging and Sites publication. One image-only helper
generates two reward illustrations, one object atlas and one subtle floor texture
outside the Site checkout. One bounded coding helper owns new reward-card module
and stylesheet only. Helpers do not modify the application Site or publish.

## Reviewed implementation and verification

Canonical revision 0.3.0 embeds two illustrated collectible cards, twelve atlas
search objects, shelf/elevator/lamp artwork and a restrained midnight floor.
Root reviewed both helper deliverables and retained generated originals plus
complete prompts/provenance. Only Bureau's application snapshot changed.

Strict module and assembled TypeScript builds, artwork tests and existing domain
assertions pass. Application tests pass 100/100; production build and exact
13-preview/19-file source-production-served verification pass. Bureau artifact:
17,708,631 bytes; SHA256
`9DE4FDBD06EE512FE8922A6052F318F1B7A05DC1FB24F5E684C45D01EA14AD22`.

Actual browser UI completed six riddles and both archive seals, inspected both
rewards and collection, then reloaded and reopened both persisted records.
Portrait 390×844 and landscape 844×390 have no horizontal overflow; 14px record
notes remain real text in vertically scrolling modals. Both images loaded and
no captured warnings/errors occurred. Temporary viewport override reset. No
physical-device or listened-audio claim. Puzzle/domain/save keys are unchanged.

## Successful publication receipt

Published version 4, owner-private, 2026-09-17T22:45:51.271676+00:00:
https://chapter-house-jm.mowgliworf.chatgpt.site

- Site: `appgprj_6aab095b3270819195be324780e2f89e` (existing identity).
- Canonical game commit: `69e3fe8`; exact pushed application source:
  `de5c5b701210630252dc96084b234b4852ee7b7b`.
- Saved version:
  `appgprj_6aab095b3270819195be324780e2f89e~appgver_709f557efd8881918da999195ebf1a5b`.
- Deployment: `appgdep_6aac6d8f528c8191a66929f1f406ac0f`, terminal `succeeded`.
- Archive SHA256:
  `356f0c51cca3baac811222768b3f6164699f2ed3eb424320718221441566c187`.

Sites skill/helper was no longer installed at packaging time. Safe static
fallback packaged validated dist output with the unchanged hosting manifest,
verified archive entries/identity and asset limits, then native Sites save and
private deployment succeeded. No source-tree archive, new Site, access change,
standalone origin publication, Firebase or cross-device save synchronization.
