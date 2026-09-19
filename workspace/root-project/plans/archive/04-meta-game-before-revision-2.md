# Shared meta game — spitballing

Date: 2026-09-10  
Status: three proposed directions; no lobby, database, multiplayer, economy, or decoration system implemented.

## META-001 — The Storyship (leading proposal)
A battered little flying clubhouse has ten curious doors, one into each book game. Every adventure brings back something that makes the ship feel more like yours: a companion, a useful-looking contraption, an animated curiosity, or furniture. Gradually it becomes a wonderfully improbable home assembled from ten worlds.

**Loop:** choose any book door → play for a while → bring home rewards → arrange the clubhouse → discover a new cozy corner or interaction → head out again.

### Collectibles, levels, and rewards
- **Shared XP:** active play and discoveries advance a collection-wide level. Normalize rewards by effort/time so the fastest-scoring game is not the only sensible choice. Raw Stormglide score is not directly comparable to cooking orders or habitat milestones.
- **One shared currency:** provisional name “Stardust,” used for optional decorative variations. Avoid ten separate mandatory currencies.
- **Per-book collections:** each game has its own themed curios and achievement milestones. Finishing a set grants a signature animated object. Progress and currencies never disappear after an in-game mistake.
- **Levels expand expression:** new room shapes, balcony space, wallpaper tools, and decorative interactions. Example milestones at levels 5/10/15 are placeholders to tune after testing, not fixed requirements.
- **Guaranteed rewards first:** clear discovery and milestone rewards; surprising finds can supplement them. Duplicate collectibles become dye or crafting material rather than a disappointing loss.
- **No required daily streaks:** nothing decays while she is away, and there are no punitive attendance mechanics.
- **Access:** all available book games remain playable in any order; shared levels do not gate the next book. No quizzes or proof-of-reading gates.

### A space worth decorating
Drag furniture into place, rotate with a big handle, recolor compatible items, and freely undo/rearrange. Use generous snapping on iPad.

Decorations should have charming behavior: a pup sleeps on the cloud sofa; the Arctic band plays when placed near a stage; the snack cart serves visiting companions; an Amari lamp floats around; popcorn bounces through a display machine. These can be short local animations, not a complex life simulation.

Mixing themes is the reward: an elephant fountain next to a gummy beanbag under a secret-door bookcase. A “showcase corner” can display favorites without requiring a single correct layout.

### Example rewards by book
| Book/game | Example reward |
| --- | --- |
| Stormglide | Cloud couch and a pup |
| Pocket Funhouse | Opening secret-door bookcase |
| Wishbone’s Big Fetch | Doghouse and frisbee toy |
| Midnight Snow Jam | Tiny Arctic bandstand |
| Midnight Merienda | Snack cart |
| Gummy Galaxy | Squishy beanbag and candy-glass lamps |
| Bureau After Dark | Levitating artifact cabinet |
| Sanctuary Seasons | Elephant fountain and leafy balcony |
| Emberwatch | Camp lantern and regrowing grove |
| Popcorn Contraption Club | Animated popcorn machine |

### Suggested first prototype, only if requested
One clubhouse room; two linked games; one shared level track; a small set of furniture; drag/rotate/undo; a clear save indicator. Validate whether returning home actually feels rewarding before adding a broad economy or multiplayer.

## META-002 — Pocket Planet
Each book earns pieces for a tiny rotating planet: an Arctic ridge, sanctuary, food-truck plaza, magical district, and so on. Strong visual sense of collecting worlds; outdoor decorations and paths connect them.

Tradeoff: more demanding camera/placement on touch, and mixing biomes may feel less personally cozy than arranging rooms. Still proposed, not selected.

## META-003 — The Secret Treehouse
A treehouse gains branches and rooms as the collection grows. Each room has a book door and a personal display shelf. This is the simplest, warmest layout and could work well with flat illustrated rooms.

Tradeoff: less spectacle than a ship or planet, but likely the easiest iPad interface. Still proposed, not selected.

## Distinctness and boundaries
This is a shared reward-and-expression layer, not an eleventh arcade game. Its furniture placement overlaps intentionally with Sanctuary Seasons at the interface level; the sanctuary game has functional environmental/animal systems, while the clubhouse is freely expressive. Do not let building the hub dictate identical mechanics for the ten games.

No design above is implementation authorization. A selected direction needs its own numbered requirements, save model, content limits, and acceptance criteria.

## Future technical shape
Keep game IDs stable. A game can eventually report a small result such as game ID, unique session/result ID, earned milestones, and collection events. A shared service must validate rewards and apply each result once. Use versioned save schemas and migration for existing Stormglide discoveries. A future backend should store progress and layouts; a local-only prototype can explicitly use device-local saves.

Do not build these services now. The current games remain independent, and Stormglide's local save key remains unchanged.

## Hosting caveat found during multiplayer research
Current [official Sites documentation](https://learn.chatgpt.com/docs/sites#understand-limits-and-unsupported-uses) says Sites must not target children under 13 or the applicable age of digital consent. This affects this fourth-grade collection; it is not solved merely by using parent-managed accounts. Choose suitable hosting before implementing a child-facing connected clubhouse. Current work produces portable local game files and design records, and does not change the existing public Site.
