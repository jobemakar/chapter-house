# Gummy Nook — candy hover feedback plan

2026-09-16. This pass preserves the current match-3 design, power overlays, input rules, and saved version-2 game state.

1. A mouse/trackpad hover over a playable candy lifts it subtly and adds a gentle highlight so targets feel responsive.
2. Selected, suggested, powered, frost, and motion-overlay states remain legible and take precedence where they already do.
3. Touch input receives no hover-only behavior; the existing tap/swipe feedback remains unchanged.
4. Reduced-motion disables the lift transition while preserving a non-moving highlight.
5. No board rules, animation orchestration, power effects, audio, or persistence fields change.
6. Rebuild `dist` and the canonical standalone HTML, then run existing focused checks.

Implementation plan: add scoped `@media (hover:hover) and (pointer:fine)` candy-icon hover styles and a reduced-motion override, then build and test.
