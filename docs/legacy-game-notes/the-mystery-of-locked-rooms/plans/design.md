> For the planned replacement, see [redesign.md](redesign.md) and [requirements-next.md](requirements-next.md). The implementation below remains unchanged.

# Pocket Funhouse — design

Twelve authored mechanical rooms. Turn brass tracks, slide shutters and lead a glow to the keyhole. A drawer reveals an original escape-room keepsake. Free nudges and all-room access prevent stalls.

## Book anchor
The novel's abandoned funhouse, secret passages, puzzles and rumored treasure anchor the game. “Pocket” describes a miniature format; the mechanisms and collectible names are invented. On Jobe's question, random fantasy trinkets were replaced with escape-room keepsakes.

## Structure and tuning
- src/core.ts: typed deterministic authored routes, rotations, gates, trace logic, nudges and validated saves.
- src/game.ts: `GameController` composes touch ownership, DOM controls, `CanvasRenderer`, audio events and the frame loop.
- src/support.ts: typed browser storage, original synthesized sound and optional read-only WebMCP status integration. Kept local so each book remains independently portable.
- scripts/build.cjs: embeds compiled TypeScript modules and local assets into standalone HTML; emits hosted output with local asset references. No CDN or runtime package is required.

The board has 4 columns by 3 rows, 116-unit tiles in an 800-by-640 logical canvas. Twelve authored paths are guaranteed connected in their solution orientation. Wings add zero, one, then two shutters. A whole gated tile supports dragging to toggle its shutter; tapping the track turns it. Nudge aligns one wrong path tile or opens one blocked shutter. Glow is informational and never a timer.

## Presentation
Layered paper theater in jewel tones with brass track geometry, warm lights, serif title and twelve collectible stamps. Original music-box melody and small mechanical chimes.

Reduced-motion preference suppresses decorative trails/particles and some bobbing; gameplay remains intact. Canvas device-pixel ratio is capped at 1.5. Mute and pause are always visible. No external service is called.

## Deferred
More authored mechanism types, whole-room rotation, moving platforms and detailed collectible artwork. Shared progression, reward economy, lobby, identity and multiplayer are deferred until the three-demo review.
