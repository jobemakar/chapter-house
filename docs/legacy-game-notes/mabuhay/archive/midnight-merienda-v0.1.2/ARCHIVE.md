# Midnight Merienda v0.1.2 archive receipt

Archived 2026-09-19 before Mabuhay's canonical source moved to Moonlight Munch
Run. This is the complete runnable closure from the former root: authored JS,
assets and provenance, plans, tests, manifest, package/build tooling, `dist` and
offline playable. It intentionally excludes `.git`, `node_modules` and caches.
Do not rebuild or revise this historical closure in place.

The Midnight local-storage namespaces remain `midnight-merienda-v1` and
`midnight-merienda-settings-v1`.

| Artifact | SHA-256 |
| --- | --- |
| `dist/index.html` | `8C9B1EBF1B07BDEFE207BB479EA3CD1BC922F5998E9F84D415AEDA3E85481D0A` |
| `playable/Midnight-Merienda.html` | `8C9B1EBF1B07BDEFE207BB479EA3CD1BC922F5998E9F84D415AEDA3E85481D0A` |
| `build.mjs` | `26A54DEB8050D8EE154CD578F413CBE6816F97B9979DA6498D4A079057BC33ED` |
| `game.json` | `A7AA96CEECCA76D39FE44FD4DDEB78FF05FF17B9BFE301085A2DF8B8A19A4113` |
| `package.json` | `E06F9832E6EA38C8A63C7EB47349EB797E5F36397B9752F231CB19DF02E05D45` |
| `src/core.js` | `F52DA367AD4658264B97063DD068113F09A645E28483585BCB85164FA20C3A0F` |

`npm run verify` checks these hashes and the required closure directories. The
archive test is static integrity coverage; it is not a replacement for browser,
audio or physical-device QA.
