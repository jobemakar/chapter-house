# Battle of the Books games

## Current application — 2026-09-19
Start with [application brief](plans/19-application-brief.md), [functional requirements](plans/20-application-requirements.md) and [implementation plan](plans/21-application-plan.md). These documents consolidate the confirmed voice decisions and the shared-space-plus-one-game-first delivery sequence. Historical demo references below are not a current readiness inventory.


A growing collection for Jobe's daughter, beginning with **Stormglide**, inspired by *The Miscalculations of Lightning Girl* by Stacy McAnulty.

This is the canonical workspace for the ten-book collection. The consolidated application plan starts with the shared clubhouse and one game together, then integrates the other nine. Dated demo references below are historical; production variants and current readiness must be reconciled before integration.

The local Chapter House now integrates all ten canonical games as independently
runnable TypeScript workspace packages: [source and run instructions](application/README.md)
and [migration record](application/docs/workspace-game-package-migration-log.md).
Firebase accounts and shared visits are the next application layer; they are not
wired by this local game migration.

## Start here
- [Chapter House source and run instructions](application/README.md)
- [Workspace game-package migration record](application/docs/workspace-game-package-migration-log.md)
- [Legacy game notes](application/docs/legacy-game-notes/README.md)
- [Persistent rules](AGENTS.md)
- [Project overview](plans/00-project-overview.md)
- [Game idea registry and overlap checks](plans/01-game-idea-registry.md)
- [Stormglide project log](plans/02-stormglide.md)
- [Machine-readable game catalog](catalog.json)

## Layout
```text
battle-of-books/
  AGENTS.md
  README.md
  catalog.json
  plans/
    00-project-overview.md
    01-game-idea-registry.md
    02-stormglide.md
    game-requirements-template.md
  application/
    packages/         ten canonical TypeScript game packages
    docs/
      legacy-game-notes/  searchable notes from the retired repositories
  archive/
    legacy-book-game-sources-2026-09-19.tar.gz
```

The local application integrates all ten selected games through one lazy package
registry while retaining a direct standalone development target for each game.
All ten titles come from the supplied photo.

## Play now
[Public Stormglide game](https://lightning-girl-stormglide.mowgliworf.chatgpt.site)

For local and standalone run commands, use [the application README](application/README.md).

## Version history
The root Git repository tracks shared rules, planning, and the catalog. The ten
canonical games now live as independent workspace packages under
`application/packages/`. Their former repositories, including Git history and
working-tree state, are consolidated in the source archive named above.

## Earlier planning references
[Ten game pitches](plans/03-ten-game-pitches.md) · [Shared-world ideas](plans/04-meta-game.md) · [Multiplayer limitations](plans/05-multiplayer-feasibility.md) · [iPad update](plans/06-ipad-and-planning-update.md)

## Three-demo review
[Review notes](plans/09-three-demo-review.md) · [Book connections](plans/08-book-connections.md) · [Cloudflare vs Firebase](plans/07-hosting-comparison.md)

The two new demos are local and have no public URL. Stormglide’s local iPad revision remains separate from the older public release.

## Historical redesign direction
[Game revisions](plans/10-redesign-direction.md) · [Themed placeable collectibles](plans/11-collectible-catalog.md) · [Isometric clubhouse requirements](plans/12-isometric-clubhouse.md). These are plans; current demos remain the previous versions.

## Recorded Wish experiment
The original Floppy Fetch notes are preserved in the
[legacy notes archive](application/docs/legacy-game-notes/wish/experiments/floppy-fetch/README.md).
[Comparison notes](plans/13-floppy-fetch.md).
