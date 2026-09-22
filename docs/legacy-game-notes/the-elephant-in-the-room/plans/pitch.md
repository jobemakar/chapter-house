# Veda's Great Escape — canonical game

Date selected: 2026-09-19  
Book: *The Elephant in the Room* by Holly Goldberg Sloan  
Idea: BOB-008  
Status: implemented locally, version 1.1.0 (painted-diorama migration)

Help Veda find her way to the sanctuary through five compact route puzzles.
Each room asks the player to push crates onto golden switches, optionally gather
peaches, and then walk through the opened exit.

## Mechanic signature

- Input: tap Veda and a glowing adjacent destination, swipe the board, use the
  on-screen direction pad, or use arrow/WASD keys.
- Primary verbs: walk, push, plan, undo.
- Loop: inspect a route → push crates without trapping them → open the gate →
  reach the flag → unlock the next chapter.
- Recovery: unlimited undo and restart, plus a solver-backed next-step hint.
- Progression: five authored puzzles, per-level best moves/peaches, and durable
  Chapter House keepsakes after two and five completions.
- Presentation: a painted sanctuary diorama with package-owned sprites,
  authored four-direction Veda walk/idle/push frames, finite interaction
  feedback and optional semantic sanctuary audio with immediate mute.
- Shared-world rewards: Veda's leafy bench and elephant fountain.

The rescue premise and Veda are the book connection. The crate/switch puzzles,
peach detours, exact route and reward forms are original game abstractions.

The earlier Sanctuary Seasons habitat-building pitch is superseded by this
selection and remains available through Git history and dated planning records.

The 2026-09-22 painted-diorama migration preserves the canonical puzzle core,
save key, progress version, reward IDs and five-level progression. See [plan
56](../../../../../plans/56-veda-painted-diorama-migration.md) and the
[local verification receipt](../../../../../application/docs/veda-painted-diorama-verification.md).

[Book reference](https://www.penguinrandomhouse.ca/books/554551/the-elephant-in-the-room-by-holly-goldberg-sloan/9780735229952)
