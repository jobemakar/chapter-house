# Stormglide

First read the parent `../AGENTS.md` and shared idea registry.

- Canonical game ID: `stormglide`; idea: `BOB-001`.
- Edit `src/index.html`, `src/styles.css`, `src/game.ts`, and `assets/`; do not hand-edit `dist/` or `playable/`.
- Read `plans/requirements.md` and `plans/design.md` before changing behavior. Retain requirement IDs and update the change log.
- Run `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` after relevant source changes. Tests build fresh compiled output before their VM checks.
- `npm run format` formats editable source and project tooling. Do not run a formatter over generated outputs.
- Preserve `stormglide-v1` storage compatibility and the existing `.openai/hosting.json` Site ID.
- Current public release is version 1. Source reorganization alone is not a request to publish.
- The game is endless and forgiving. Do not add death, forced restarts, quizzes, or mandatory level-completion dialogs.
