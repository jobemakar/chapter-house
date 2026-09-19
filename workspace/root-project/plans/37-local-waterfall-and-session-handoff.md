# Chapter House session handoff — 2026-09-16

## Publication update — 2026-09-17

Jobe subsequently explicitly requested remote phone publication. The approved
waterfall, treehouse trial and latest thirteen standalone previews are now live
in successful owner-private Sites version 3, with integrated Wishbone retained.
See [plan 44](44-latest-phone-sites-publication.md) for exact source and receipt.
Earlier local-only/hosted-version-two statements below remain historical. No
further iteration, save sync or audience change was included in this request.

## Settled at session end

Jobe approved the rebuilt waterfall ("looks good!") and explicitly said
"keep local". Do not publish, push to hosting, or start more iteration without
a new user request. The next session is for fresh feedback, not unfinished work
that needs an automatic continuation.

Application workspace:
`C:\Users\jmakar\Desktop\codex\interactive\battle-of-books\application`.
Local preview used this session: `http://127.0.0.1:5191/`. A server/browser tab
is transient; verify it is available next time rather than assuming it survived.

## Current local versus hosted state

- Local waterfall implementation commit:
  `410f5f42080cf00887090c5b0ddf0ec56783705d`.
- Owner-private hosted version 2 is unchanged:
  https://chapter-house-jm.mowgliworf.chatgpt.site/ .
  Its source commit is `9e0cb24dd9e5caeb99871e1f0571f00b972002f7`;
  publication receipt remains in [plan 36](36-phone-walkthrough-revision.md).
- The hosted version still has the rejected rectangular spillway. The approved
  natural waterfall is local only. Keep the same hosting identity/audience if
  publication is explicitly requested later; do not create a replacement Site.

## Approved waterfall redesign

The previous parallel walls, non-uniformly stretched facade skins, round source
disk and falling dash effect are replaced. Focused TypeScript `TownWaterfall`
composes native-proportion stone modules/facades, irregular upright kit rocks,
asymmetric grassy planted shelves, a winding supported brook, a visible animated
drop and broad whitewater foam. Some upright/boulder earth materials are palette
harmonized to pale stone; packaged GLB source binaries are unchanged.

Terrain footprint is conservatively blocked at 13.6 by 14 units. Water remains
non-walkable and the bridge is the only stream crossing. TownAssets owns all
28 imported model definitions; waterfall clones detach before generic teardown.
Saves, fishing, windmill, original fountain and games are unchanged by this pass.

Application documentation is authoritative for detail:

- `application/docs/waterfall-redesign.md`: requirements, implementation and QA.
- `application/docs/woodland-assets.md`: exact models, CC0 sources/palette changes.
- `application/docs/phone-walkthrough-plan.md` and
  `application/docs/phone-walkthrough-verification.md`: prior combined revision.

## Verification and limits

- Strict production TypeScript/Vite build passes. Existing large-bundle warning
  remains; no optimized-download/device-performance claim.
- Application tests: 100/100 passing, including native scaling, shared-import
  detachment, brook/drop seam, finite geometry, motion freeze and terrain blocking.
- Preview verifier: 14 standalone previews / 20 exact source, production and
  served files; MIME checks and unknown-route 404 pass. Wishbone remains the only
  integrated game; standalone saves/rewards remain separate.
- Actual browser visual review discarded the first cube-heavy redesign and
  caught/fixed a cliff facade obscuring the waterfall. Final scene was reviewed
  at desktop scale and 844 by 390 phone-landscape emulation, with no document
  overflow or captured browser warnings/errors. Viewport override was reset.
- No physical-phone testing, sound listening or full reference-island recreation
  is claimed. Existing phone feedback remains valuable for the next session.

Review screenshot:
`C:\Users\jmakar\Documents\Codex\2026-09-15\rom-x20-2\outputs\waterfall-redesign.png`.
Exact generated art prompts/paths from prior revision are in each original
experiment's provenance Markdown and the task output `generated-art-provenance.md`.

## Next-session entry checklist

1. Read parent `AGENTS.md`, this handoff, current application brief/requirements/
   build plan and the above latest planning/verification/asset documents.
2. Inspect Git status before edits. Parent planning, application and original
   book repositories have separate boundaries; preserve unrelated user changes.
3. Start from approved local terrain, not the stale hosted waterfall. Keep
   owner-private hosting and local save keys intact; no Firebase/multiplayer or
   game integration was added.
4. Ask what Jobe wants to iterate next. Broader mobile UI collapsing was deferred
   for future feedback; it is not a mandate to implement it on resume.
5. Do not resurrect Door Atelier (archived/rejected). Retain Pocket Funhouse,
   Merienda and Moonlight Munch Run as separate existing trials. Update 2026-09-17:
   Jobe rejected Luminous Locks and requested complete local removal; see plan 39.

Implementation work is complete. Only documentation was requested at session end.

## Local shooter evolution — 2026-09-17

This is a dated addendum; earlier waterfall completion remains approved.
Jobe subsequently authorized trying a treehouse shell (plan38), removed
Luminous Locks completely (plan39), discussed a Moonlight shooter (plans40/41),
and said ok proceed to the local first playable shooter slice (plan42).
The original Moonlight experiment is rebuilt in its separate Mabuhay repo and
copied exactly into the application's standalone-preview snapshot. Separate
saves/rewards remain; Wishbone is still the sole integrated game. No publication.
Read plan42 plus the original experiment's requirements/source-adaptation/art
provenance/verification before further Moonlight changes. Await Jobe's playtest
feedback; do not automatically implement another iteration or publish.

Local shooter checkpoints: Mabuhay implementation478da9a / verification5319eed;
application standalone packaginga649227. Plan42 records16 shooter checks,
100 application checks,13 previews/19 exact files and actual browser review.

## Moonlight challenge/frame feedback — 2026-09-17

Jobe subsequently enjoyed the shooter but requested more challenge, true sprite
animation and avoid-only monster drops with a one-second firing interruption.
[Plan43](43-moonlight-road-hazards-and-frame-animation.md) is implemented locally:
potholes/spore pods, actual generated actor frames, tougher waves/bosses and
offscreen feeding correction. Source25/application100 checks, production build
and13 previews/19 exact served files pass. Original requirements/plan/verification
and FRAME-AND-HAZARD-PROVENANCE contain detailed evidence and current artifact hash.
Final play QA used a separate localhost origin; temporary test server is closed.
Canonical Mabuhay commitf7ee31e7e104243f8c18ee6ca98273d727a61558;
application snapshot1c55c213050ea14c74dac21fd61fd20880bcc2c1.
Primary preview remains5191 (verify server on resume). Separate saves, treehouse,
approved waterfall and other games remain intact. Hosted version two unchanged.
Await next playtest/iteration request; no automatic continuation or publication.
