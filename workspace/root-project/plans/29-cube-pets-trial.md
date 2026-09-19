# Cube Pets trial — 2026-09-15

The user authorized taking Kenney Cube Pets for a contained Chapter House trial.
The three implemented pets now use the matching animated cat, bunny and fox GLBs
while retaining stable identities, saves, ownership and economy behavior. The
rounded procedural rig remains the player-avatar treatment.

The application locally packages the selected CC0 models, shared palette,
previews and license. A shared `PetAssets` owner handles load-once resources,
skeleton-safe clones, independent mixers, clip validation, failure fallback and
safe disposal. Authored idle, walk, eat, dance and positive-gesture clips connect
to the existing roam/follow, bowl, trampoline and petting behavior. A larger
invisible touch target preserves the small visual scale.

Astra planned, integrated, reviewed and performed browser QA. A bounded GPT-5.6
Terra sub-agent packaged the assets and implemented the loader, rig and focused
tests. The primary agent added room/town behavior wiring, catalog presentation,
touch-target review and final verification. All 64 tests and the production build
pass. Desktop and 390×844 browser checks cover the clubhouse, feeding and
Willowbrook follower; no physical-device, Firebase or publication claim is made.

See `application/docs/cube-pets-trial-plan.md`, `pet-assets.md` and
`cube-pets-trial-verification.md`.
