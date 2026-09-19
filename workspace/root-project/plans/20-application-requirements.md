# Application functional requirements

2026-09-14 · META-001-R3 · Consolidated specification.

[Brief](19-application-brief.md) · [Build plan](21-application-plan.md). U = confirmed user direction, C = carried-forward collection principle, D = proposed design/engineering detail. Mixed origins distinguish the required outcome from the recommended mechanism. These requirements describe intended behavior, not completed implementation.

## Entry, games and persistence

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| APP-01 | Offer immediate guest play with a generated cute name. | U | A newcomer enters without credentials; labels do not confuse stable player identities. |
| APP-02 | Members use Jobe-provisioned usernames/passwords, without email, public registration or a player reset flow. | U | Valid credentials open the correct profile/space; invalid credentials allow a simple retry. |
| APP-03 | Provide a private admin page for creating usernames/passwords; enforce admin privileges server-side. | U/D | Jobe provisions an account through UI; ordinary members and guests cannot provision accounts or read credentials. |
| APP-04 | Persist member appearance, room, owned items/pets, balance and durable game progress across login/devices. | U/D | Reload and a second-device login restore confirmed data; failed saves are retryable rather than silently discarded. |
| APP-05 | Save guest progress on the same browser/device. Guests have no member social access. | U | Guest return restores local progress; member rosters, visits and invitations are inaccessible. |
| APP-06 | Provide a ten-game selector in the clubhouse interface, independent of avatar travel or currency. | U | Every integrated game launches from UI and returns to the room; first development slice includes only one selected game. |
| APP-07 | Retain distinct entertainment mechanics, coherent art, spoiler-light thematic rationale and game-specific briefs/requirements/plans. | C/U | Each selected variant is documented and compared with the other games before implementation. |
| APP-08 | Avoid consequential timers and death/restart loops; permit timing challenges and voluntary puzzle resets without loss of earned progress. | U/C | Mistakes permit recovery; reset does not clear permanent unlocks; intentional rhythm/physics timing is still possible. |
| APP-09 | Essential play is touch-first with PC equivalents; clubhouse supports phone portrait and landscape. | U | No essential hover/keyboard-only interaction; rotation preserves valid controls/state; phone and iPad checks pass. |
| APP-10 | Offer fullscreen, recoverable help and readily accessible mute. Provide a responsive fallback where fullscreen is unavailable. | U/C/D | Entry/exit, safe areas, audio gesture requirements and interruption are checked on supported browsers. |
| APP-11 | On the account's first login only, offer optional import when local guest progress exists. | U | Import or fresh start is an explicit choice; subsequent logins load account progress without offering import. |
| APP-12 | Make first-login import atomic/idempotent and account-scoped; retain recoverable local data until success. | D | Interrupted/repeated import grants no duplicate starter, currency or reward; two devices cannot import twice. |
| APP-13 | Preserve earned progression when leaving a game; exact unfinished-session restoration is not required. | U | Mid-puzzle departure keeps currency/unlocks/milestones; return uses the documented game entry/checkpoint. |
| APP-14 | Show the assigned username consistently; no separate member display-name editor. | U | Avatar labels, friend roster, notices and invitations use the assigned name. |
| APP-15 | Keep gameplay settings and pause behavior usable without a wall of instructions. | U/C/D | Help can be reopened; muted/reduced-motion use remains understandable; held input is cleared on interruptions. |

## Social spaces and invitations

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| SOC-01 | All credentialed members are automatically friends; show general online status, including members playing games. | U | No friend-request workflow; playing a book game counts as online; stale sessions eventually expire. |
| SOC-02 | Allow anytime visits, including while the owner is offline; invitations are optional. | U | A member enters another saved room without approval or the owner's device being connected. |
| SOC-03 | Show live movement, jump and wave for players actually sharing a room. | U | Two clients see consistent actors/actions; a member in a different game is not falsely rendered in the room. |
| SOC-04 | Provide no chat, visitor notes, stickers, gifts or left-behind content. | U | No messaging editor or visitor content-write path is exposed. |
| SOC-05 | Only the owner can edit room layout and equipped home pets. | U/D | Visitor writes are rejected outside the UI too; pet interaction does not grant editing permission. |
| SOC-06 | In-app friend-online notices show assigned name and Visit; no external device push. | U | Visit opens that friend's clubhouse even if they are playing elsewhere; notices appear only during app use. |
| SOC-07 | Show detailed in-room activity when visiting, not elsewhere in the roster/notice UI. | U | Roster conveys general online status without reporting the friend's clubhouse activity. |
| SOC-08 | Invite friends to the inviter's own room or invite a host to join a visitor in the host's room. | U | Invitation names the correct destination and acceptance enters that room; sending never teleports the recipient. |
| SOC-09 | Incoming game invitations immediately overlay and pause play, including mid-level, with Join and Later/dismiss. | U | Simulation/timers/audio pause; Later resumes the same session; Join saves durable progress and leaves. No automatic acceptance. |
| SOC-10 | Deduplicate invitation/presence events and handle expiry, missing destinations and reconnect. | D | Reconnect does not repeatedly interrupt play; invalid invite can be dismissed safely; prior pause reasons remain respected. |
| SOC-11 | Do not show visitors a keepsake's source game or earning instructions when tapped. | U | Visitor tap opens no acquisition-information popup; internal item metadata is preserved. |

## Space, avatar and editing

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| SPC-01 | Present cozy isometric 3D with fixed camera orientation; library remains the provisional treatment. | U/C | Readable depth/scale survive pan and zoom; no camera rotation is needed. |
| SPC-02 | Animal avatars walk with eight-direction animation and correct idle transitions. | U | All directions are visually checked with supported accessory categories; no human-only assumption in controls. |
| SPC-03 | Route actors around furniture and maintain reachable entry/valid destinations. | U/D | Obstacle routes work; invalid placements/destinations cannot trap actors or block the only entry. |
| SPC-04 | Correct occlusion for furniture, pets and avatars, including jumps. | U | Walk around every side of wide/tall objects, with multiple actors and camera zoom; no z-sort popping or walking through objects. |
| SPC-05 | Provide touch/PC jump and wave or a species-appropriate equivalent, visible to visitors. | U | Actions animate locally and remotely; jump does not bypass ground obstacles. A squeak remains optional. |
| SPC-06 | Allow switching animal species anytime; provide free basic colors/accessories and purchasable extra outfits. | U | Appearance saves/replicates and owned cosmetics survive species changes; compatibility is defined per asset. |
| SPC-07 | Owner can place, move and store furnishings with understandable preview, cancel and undo. | U/D | Invalid drops recover cleanly; inventory and room refer to the same owned instance. |
| SPC-08 | Support floor items and wall decorations; defer object-on-furniture placement. | U | New display forms need no tabletop nesting; old tabletop ownership is retained and mapped before integration. |
| SPC-09 | Give the full-size room and free movable starter furnishings from the beginning. | U | No room expansion/size purchase; starter items can be rearranged and stored. |
| SPC-10 | Keep floor/wall colors and finishes fixed; allow duplicate owned furniture copies. | U | No finish editor; two matching chairs have independent placement and inventory state. |
| SPC-11 | Allow owner decorating during visits, with live updates to visitors. | U | Two-client test shows committed moves/removals while membership and ownership stay correct. |
| SPC-12 | Validate navigation and collision after layout changes; keep drag previews local as a proposed default. | D | Occupied-cell edits reject or resolve safely; routes replan; furniture cannot trap a visitor/pet or create invalid depth state. |

## Pets

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| PET-01 | Final collection includes at least 15 pet kinds, with home roaming behavior. | U | Every kind has a documented acquisition route, readable asset, navigation footprint and movement/idle behavior. |
| PET-02 | Own one of each kind; allow all different owned pets at home without a separate gameplay cap. | U | Duplicate acquisition is prevented; all owned kinds can be active together; crowding is performance-tested. |
| PET-03 | Choose one free starter from a small selection. | U | First-use selection grants exactly one pet; import/retry cannot award a second starter. |
| PET-04 | Make multiple-pet ownership visually apparent; empty personal slots are available up front and stay empty. | U/D | No lengthy instructions or earned slot gates; expanding UI does not imply a fixed active-pet maximum. |
| PET-05 | Show all ordinary identities in the shop from the start, with owned/available states. | U | Players can inspect choices to save for; an owned kind cannot be purchased again. |
| PET-06 | Include one mystery pet earned by trying all ten games, with visible condition and hidden identity until earned. | U/D | Persistent ten-game progress awards once and deterministically; no purchase, random chance or victory requirement. Qualifying play is defined per game. |
| PET-07 | Pets support owner and visitor interaction. | U | Supported interactions produce coherent responses for shared-room clients without editing/ownership rights. Petting/call-over are proposed first actions. |
| PET-08 | A visitor may summon one owned companion after arrival; it follows that visitor. | U | At most one companion per visitor; movement routes around obstacles; host's roaming pets remain separate. |
| PET-09 | Provide safe companion swap/dismiss and departure/reconnect cleanup. | D | No duplicate companion or permanent guest pet remains after departure; ownership is unchanged; follow resumes after interaction. |

## Rewards and economy

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| ECO-01 | Each game's special keepsakes are direct, exclusive rewards for progress in that game. | U | Catalog records triggers/theme/display form; no shop purchase grants the same special keepsake. |
| ECO-02 | Shared virtual currency is earned by active game play independently of score/performance, never idle time. | U | Low-scoring play can earn; leaving a game unattended does not; no real-money payment path exists. |
| ECO-03 | Preserve earned rewards through mistakes, reset, departure and revisions. | U/C | Confirmed ownership and balance survive retries/reload/migration without duplicate grants. |
| ECO-04 | Wearable cosmetics and living pets are exempt from separate placeable-display forms; other keepsakes retain thematic display forms. | U/C | Metadata categories distinguish cosmetics, pets, shop furnishings and exclusive keepsakes; currency is an accounting value. |
| ECO-05 | Use varied pet prices; cheapest additional pet targets about ten active minutes. Offer small decorations after a few active minutes. | U | Playtest against configured earning rate, without timers or performance gates; later prices remain tuning choices. |
| ECO-06 | No overall player level or shared XP leveling track in first release. | U | Individual game progress, currency and collection suffice; no global-level gates. |
| ECO-07 | Use generous game-aware activity detection; proposed comparable rates and no double earning from simultaneous account sessions. | D | Puzzle thinking and observed simulation can count within defined bounds; pause/background/idle cannot accrue indefinitely; overlapping sessions do not multiply currency. |
| ECO-08 | Grant/spend currency and inventory atomically, with stable reward/purchase IDs. | D | Replayed requests, concurrent purchases and reconnect cannot double-spend, double-award or lose confirmed transactions. |

## Engineering and delivery

| ID | Requirement | Origin | Acceptance |
| --- | --- | --- | --- |
| ENG-01 | All authored application and game code in the integrated product must be TypeScript and object-oriented. | U | Integrated game logic, not just the shell, is TypeScript with clear class/module responsibilities and reproducible type/build checks; legacy comparison demos stay preserved. |
| ENG-02 | Implement substantial shared behavior once; trivial controls may stay local. | U | Account/save/reward/inventory/invitation/room services are shared; game mechanics stay isolated. |
| ENG-03 | Target a few dozen total users, measuring room concurrency and crowded-pet performance separately. | U/D | Agreed multi-client/mobile load checks have evidence; no untested capacity guarantee. |
| ENG-04 | Preserve source, IDs, asset provenance and versioned saves; report actual validation. | C | Source rebuilds; old saves recover; simulation, browser, device, visual and audio checks are identified separately. |
| ENG-05 | Use Firebase as hosting direction; evaluate Firestore-only before adding RTDB. | U/D | Documented prototype results settle movement/presence choice, usage and reconnect behavior. |
| ENG-06 | Keep admin actions, member room ownership and credentials protected without complex member flows. | D | Server checks reject cross-owner/admin access; no plaintext credentials are served or logged to ordinary clients. |
| ENG-07 | Shared rooms and pets work while the owner is offline. | U/D | Late visitors load the saved layout; pet motion stays coherent without depending on the owner's device. |
| ENG-08 | Start with the shared space plus Wishbone Fling together: port/connect current behavior first, then iterate on mechanics; get that experience right before integrating the other nine. | U | First-slice acceptance in the build plan passes before remaining game adapters/content integrations begin. |

## Scope and review

Core product decisions above are settled. Remaining technical/design choices are listed in the build plan rather than embedded as contradictory open questions. Shared-space multiplayer does not imply multiplayer games. No chat, trading, visitor gifts, real-money purchases, overall levels, room expansions, finish customization, tabletop stacking, external push or realtime leaderboard is included.

This document intentionally does not mandate exact restoration of departed gameplay sessions, unlimited users in one room, a specific renderer, all pet art in the first technical slice, or a commercial-grade anti-cheat system. These requirements are not a claim that existing demos already meet them.
