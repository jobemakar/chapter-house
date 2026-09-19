> This file describes the runnable 0.1.0 demo. [Planned replacement requirements](requirements-next.md) reflect the latest user feedback and are not implemented.

# Pocket Funhouse — demo requirements

Selected by Jobe on 2026-09-10 for a playable first build before reviewing three demos. Version 0.1.0. BOB-002.

## User requirements
- PF-001: Entertainment only, inspired by The Mystery of Locked Rooms; no quizzes, riddles, typed answers, or questions to the player. Avoid story spoilers.
- PF-002: Fully touch-first on iPad; no keyboard needed. Large controls, pointer capture/cancellation, portrait and landscape layouts. Mouse is also supported.
- PF-003: Missteps are reversible. No timer, lives, death, score loss, forced restart, or compulsory completion popup. Other rooms and free help are always available.
- PF-004: Intentional art direction, original audio with mute, editable source, reproducible hosted and standalone outputs, and versioned local saves.

## Designer choices for this demo
- PF-005: A cut-paper mechanical theater in plum, peacock teal, cherry red and brass. Generated painted backdrop; functional mechanisms drawn on canvas.
- PF-006: Twelve authored 4-by-3 route puzzles in three wings. Tap or turn broad track tiles to route a continuously moving golden glow from inlet to keyhole. Later rooms add freely draggable shutters.
- PF-007: Each room has a guaranteed authored route, with alternate layouts and distractor tracks. Live light feedback indicates connected track; disconnected light softly fades and tries again.
- PF-008: Drag a shutter away from its track to open it, or tap its handle. Track dragging turns one quarter-turn on release; tapping does the same.
- PF-009: Solving a room opens its treasure drawer in place, adds one of twelve named escape-room curios, and illuminates a room stamp. Rooms stay available and can be replayed without losing curios. Following Jobe's book-connection question, rewards use mirrors, keys, panels, passage hardware and funhouse mementos; these remain explicitly original game rewards, not verified artifacts from the novel.
- PF-010: Previous/next-room controls never lock. A free Nudge opens a blocked shutter or aligns one route tile. Repeated nudges always solve a room; no timeout needed.
- PF-011: Audio starts on the first interaction: quiet original music-box sequence, ratchet clicks, and a treasure chime. Pause freezes animation and music; resuming requires one tap. Hidden-page time does not advance the game.
- PF-012: Save solved rooms, current room, each room's arrangement and shutter state, mute preference using pocket-funhouse-v1. Storage denied/corrupt data must fall back to a playable session.
- PF-013: Controls remain at least 48 CSS pixels on iPad layouts. Respect reduced motion; do not require fast reaction or sound.
- PF-014: Expose a small optional read-only game-status WebMCP tool if the browser supports it. Do not depend on it.
- PF-015: Keep authored gameplay in strict TypeScript with typed room definitions, puzzle state, storage, audio, canvas renderer/input and controller composition. Tests execute compiled production exports; JavaScript is limited to build/test tooling and generated output.

## Acceptance checks
Validate every authored route and repeated nudge completion; rotation and reversible shutters; progress preservation on navigation and reload; corrupt/denied saves; touch cancellation; frame-rate independent animation and pause; build asset references and syntax. Browser playtesting and actual iPad/audio checks must be reported separately from simulations.

## Scope and distinctness
An authored route-mechanism puzzle, not Stormglide's continuous steering or Wish's projectile skill shots. Compared against BOB-004–010: no rhythm scoring, food scheduling, merge board, stealth agents, habitat simulation, containment, or player-built production machine. Whole-room rotation, moving platforms and physical inter-room travel remain pitch possibilities, not claims about this demo. No backend or shared lobby in this revision.
