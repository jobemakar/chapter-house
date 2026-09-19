# Canonical TypeScript preview refresh — 2026-09-19

> Superseded later on 2026-09-19: Jobe selected Veda's Great Escape as the
> canonical Elephant game. It was ported to a TypeScript workspace package and
> removed from this legacy preview menu. The counts below remain the verified
> snapshot from before that selection.

## Scope

Refresh the local Chapter House Games menu from each selected book repository's
current canonical build. Keep Wishbone Fling integrated, retain Veda's Great
Escape as the only current JavaScript preview, and replace superseded comparison
or archived menu entries with the selected TypeScript games. Preserve standalone
save keys and do not publish.

Dig & Douse carries its local LiquidFun WASM runtime, generated artwork and
license through the same explicit preview allowlist used by the other builds.
Preview cards identify implementation language and version.

## Verification

- All eight standalone TypeScript projects rebuilt successfully from their
  current authored sources.
- Chapter House strict TypeScript and production Vite build passed.
- All 107 Chapter House tests passed.
- Preview verification passed for 9 previews / 27 files: snapshot, production
  and locally served bytes match; MIME types and unknown-route handling passed.
- The production preview remains local at `http://127.0.0.1:5190/`.

No physical touch-device testing, subjective audio review or publication was
performed in this refresh.
