# Floppy Fetch comparison experiment
2026-09-11 · BOB-003-ALT1 · implemented local prototype 0.1.0

Jobe selected a separately playable plush-dog launch experiment after the discussion of dog animation and ragdolls. It uses the exact same two authored structures as Backyard Ruckus, so the comparison centres on the input and collision pleasure.

| Candidate | What flies | Dog behavior | Next attempt |
| --- | --- | --- | --- |
| Backyard Ruckus 0.2 | Rolled sock | Separate physical dog chases | Sock refills independently after 1.05 seconds |
| Floppy Fetch 0.1 | Jointed plush Wishbone | Floppy impact, unfolding recovery, foreground trot | Automatic bounded return; Call Wishbone accelerates return |

Both preserve damage, offer unlimited attempts and the same six pet-themed keepsakes. They have independent saves. No additional book, avatar, lobby or backend has been built. The original game remains the catalog's main Wish candidate; the experiment is listed under it, pending family preference.

Source, requirements, playable pointers and verification: [Floppy Fetch](../wish/experiments/floppy-fetch/README.md). The existing source and both earlier standalone demos are preserved.

Other animation ideas remain logged for later: animated anticipation/running/skids for the sock-chasing dog; and a hybrid of animated pursuit with occasional ragdoll impacts. Direct plush tossing is the only one selected for this experiment.

## Name and visual revision — 2026-09-11
The user renamed this experiment **Wishbone Fling** (0.1.1). Ear placement and text contrast were corrected; the same stable experiment ID, save key and local route remain. Current standalone: wish/playable/Wishbone-Fling.html.

## Life revision — 2026-09-11
Wishbone Fling 0.1.2 adds animated dragging and toy expressions. Same save, routes and two yards. 20 automated checks pass; browser visual QA blocked by local file navigation policy. Three bankable powerups and three impact-triggered yard mechanisms remain proposed in wish/experiments/floppy-fetch/next-mechanics.md.

## Systems experiment implemented — 2026-09-11
Wishbone Fling experiment 0.2.0 implements the selected Bounce Biscuit, Magnet Bandana and Tailwind Pinwheel with persistent counts and three display keepsakes, plus gate lever, polarity button and bellows. All 31 automated checks pass; served browser play and visual inspection completed. Baseline tag wishbone-fling-before-powerups allows rollback. The original 0.2 sock-and-chase demo remains unchanged. Details: wish/experiments/floppy-fetch/README.md.

## Canonical selection and deferred port — 2026-09-19

Jobe selected Wishbone Fling as the canonical Wish game and requested that
Backyard Ruckus be archived. The complete Ruckus 0.2.0 project is runnable at
`wish/archive/backyard-ruckus-v0.2.0`. Fling's standalone JavaScript source and
save remain unchanged: its TypeScript port is explicitly deferred because Fling
is under active revision in Chapter House. No application files were changed.
