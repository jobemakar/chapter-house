# Frozen JavaScript Snapshot — Dig & Douse

This directory is a frozen, exact pre-TypeScript snapshot of the rich **Wildfire — Dig & Douse** source. It preserves the JavaScript prototype that preceded the active TypeScript port.

Do not modify files in this archive. Make all current game changes in the active `src/` tree instead.

## Running the snapshot

From this directory, with Node.js installed:

```text
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4173` in a browser. The deterministic checks run with:

```text
npm test
```

With the server running, run the browser smoke test separately:

```text
node tests/browser.cjs
```

## What is and is not preserved

The original source, tests, local assets, and planning files are copied here. `Box2D` vendor output is intentionally omitted: after `npm ci`, `build.cjs` reconstructs it from the pinned `liquidfun-wasm` package. `node_modules`, generated `dist/` output, and test artifacts are also omitted because they are reproducible build products rather than source history.
