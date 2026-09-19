# Shooter source and art mockup — 2026-09-17

After [plan 40 discussion](40-moonlight-shooter-discussion.md), Jobe selected a
bright comic feel inspired by the book cover and said go ahead to the stated next
step: research a licensed shooter foundation and make a gameplay-view art mockup.
No playable gameplay/source/assets have been changed or published by this step.

Preferred reusable foundation: https://github.com/nunof07/space-patrol at
`63b1a09d2ff70d5504ebc060cdaa9feb4f205b8d`. Explicit MIT code, TypeScript/classes,
reviewed wave/projectile/health/upgradable-weapon modules. Original media is separately
licensed and not proposed for reuse. Brief actual live-demo review only, not a full
playtest or performance claim. No upstream installs/tests run.

This foundation is not a turnkey whole-game match: no bosses; original restart
resets upgrades, held input fires, orientation is vertical and inspected black-wave
factory progression needs explicit adaptation. Implementing the confirmed Mabuhay
restock/persistence/boss/side-entry systems requires authored changes and module-level
attribution. Do not claim to have cloned a complete Galaga or a boss system.

Kinetic Scan lacked clear project license evidence; Micro Shooters licensing was
ambiguous; unfinished Python Galaga is less suitable. Research copies are in session
`work/shooter-research`, outside original game repositories.

Deliverables in session outputs:
`C:/Users/jmakar/Documents/Codex/2026-09-17/chapter-house-session-handoff-2026-09/outputs/`

- `moonlight-munch-run-gameplay-concept.png`: built-in generated comic gameplay view.
- `shooter-source-review.md`: source audit, candidates, gaps and inspection limits.
- `gameplay-concept-provenance.md`: exact image prompt/method and reference provenance.

Verified truck-cover details; creatures, location/scenery and HUD are invented.
Static concept does not provide separated production sprites/animation frames.
Current Moonlight Munch Run and local saves remain untouched. Await feedback on
this concrete mockup before advancing into the playable adaptation.
