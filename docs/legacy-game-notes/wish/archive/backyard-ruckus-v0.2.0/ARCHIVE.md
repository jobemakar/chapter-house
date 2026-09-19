# Backyard Ruckus 0.2.0 archive

Archived 2026-09-19 after the repository direction changed to keep **Wishbone
Fling** as the canonical, deferred TypeScript-port candidate. This directory is
a self-contained, runnable preservation copy of the Backyard Ruckus closure;
it is not the active game.

## Included closure

- Authored 0.2.0 source, local art/fonts, build and preview scripts, manifest,
  lockfile, focused physics/browser-harness tests, README and planning record.
- Byte-preserved generated outputs: `dist/index.html`,
  `playable/Wishbones-Big-Fetch.html`, and the retained `v0.2` and `v0.1`
  standalone aliases.
- Both durable contracts: `wishbones-big-fetch-v2` is the 0.2.0 save; it
  recognizes but never writes `wishbones-big-fetch-v1`. The v0.1 standalone
  continues to own the v1 contract.

The archive deliberately excludes `.git`, `node_modules`, caches, and the
separate Wishbone Fling experiment. Install the pinned dependency with `npm ci`
before running it.

## Rebuild and test

From this directory, run `npm ci`, `npm run build`, and `npm test`. The test
script is intentionally limited to the 13 Backyard Ruckus checks. `npm run
build` regenerates the hosted and primary standalone outputs from `src/` and
`assets/`.

## Baseline integrity

Immediately before archival, the source repository was clean and all 31
repository checks passed. The following SHA-256 values identify the archived
Backyard artifacts and source at capture:

```
775001e4ed914b0fc33d3c3bf8828d554d7e7a8d4fe51102eaec04977a8ad2f9  dist/index.html
1026875a85a087a13951df8c356a03bf246f37b196dd8c17ac7ed8ee5eff4dc9  playable/Wishbones-Big-Fetch.html
1026875a85a087a13951df8c356a03bf246f37b196dd8c17ac7ed8ee5eff4dc9  playable/Wishbones-Big-Fetch-v0.2.html
2002ea67d029ae0ef69173f025ab5e046f7fcb6885ca1780331ec8c8f7f4a6c9  playable/Wishbones-Big-Fetch-v0.1.html
e7edce78cd5a278223eca9b8a1e1ecef683150f4f4d0fc97a77bad9de90e7b44  src/core.js
1e69666483ad83caddbad1489737a71c0180af3c9e128505024080909e18dc1e  src/game.js
2320d403b4071b7a72dde7c1b36e5f03c476cc203f903d2b2176cc91dcdfe3a2  src/index.html
314e3eb8239223e3d240c2dd050f470751e3adcf445a33d517e69f1e9d2cc687  src/levels.js
bf3b28a8561bdc6b2a554036c602a96d4f929deb255692633172c2165fcb35f8  src/progress.js
984d2ae8bd60116f10b408c261e2e369521d7d7a879ab13753be735a6bcc6163  src/render.js
6035401c82f867af47ab252f6f23645ba66a156eceba161529807579d5134a93  src/styles.css
509dee5848deff4912cc9ea36519aa01fce23f7f093f93872e13abac3250e606  src/support.js
```

The original `dist/index.html` and primary 0.2 standalone are regenerated as
part of archive verification and must reproduce these hashes. The `v0.1`
standalone is historical and intentionally not regenerated.
