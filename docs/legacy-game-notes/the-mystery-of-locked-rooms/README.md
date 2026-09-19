> **Latest plan:** [Pocket Funhouse: The Wandering Key — revision 2](plans/redesign.md). The playable linked below is still the original 0.1.0 demo.

# Pocket Funhouse

Version 0.1.1 · local playable demo · strict TypeScript port · inspired by *The Mystery of Locked Rooms* by Lindsay Currie.

Twelve authored mechanical rooms. Turn brass tracks, slide shutters and lead a glow to the keyhole. A drawer reveals an original escape-room keepsake. Free nudges and all-room access prevent stalls.

## Play and iterate
Open [Pocket Funhouse](playable/Pocket-Funhouse.html) in a browser, or use the local preview after building. Touch-first on iPad, with mouse support; no keyboard needed.

- `npm run build`: compiles TypeScript, then creates dist/index.html and the self-contained playable.
- `npm start`: serves the built game at http://127.0.0.1:4321/.
- `npm run typecheck`: checks the strict TypeScript source without emitting files.
- `npm test`: compiles production exports, then runs core, save-fixture and simulated interaction checks.

Authored source lives in src/ as TypeScript classes and typed level data. Edit it and rebuild; never edit only the generated HTML. No runtime packages or network requests are required. assets/ contains generated art and licensed fonts; scripts/ contains build/preview tools. No hosting account, public URL, backend or shared lobby has been created.

## Design and evidence
[Requirements](plans/requirements.md) · [Design](plans/design.md) · [TypeScript port](plans/typescript-port.md) · [Change log](plans/changelog.md) · [Verification](plans/verification.md) · [Asset provenance](plans/assets.md) · [Original pitch](plans/pitch.md) · [Book connections](../plans/08-book-connections.md)

## Saved data
Local key: `pocket-funhouse-v1`. Current room, room arrangements/shutters, collected curios, and mute. This is device/browser-local progress, not an online account. Clearing browser data or changing host can remove/isolate access to this save. Corrupted or denied storage falls back to a playable session.
