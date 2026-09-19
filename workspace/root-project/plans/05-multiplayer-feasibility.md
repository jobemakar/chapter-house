# Multiplayer feasibility — discussion only

> Historical feasibility discussion from September 10. Current scope includes realtime shared rooms, anytime visits, owner-only live decorating and no chat. Firebase is selected; see the [current build plan](21-application-plan.md) for the Firestore-first evaluation. Earlier Sites capabilities and audience notes below are dated reference, not the current hosting decision.


Date: 2026-09-10  
User explicitly asked for limitations, with no multiplayer implementation. No services have been enabled.

## Verified platform capabilities
[Official Sites documentation](https://learn.chatgpt.com/docs/sites#understand-limits-and-unsupported-uses), checked 2026-09-10, states that HTTP, HTTPS, and WebSockets are supported; raw inbound/outbound TCP is not. D1 is available for structured data, with a documented 10 GB per-Site database storage limit, and R2 for object storage.

This establishes networking/storage building blocks, not ready-made game rooms, guaranteed low latency, a specific concurrent-player capacity, or a permanently running game server. The available documentation does not establish those guarantees.

## Engineering assessment, not a platform guarantee
| Shape | Fit and considerations |
| --- | --- |
| Asynchronous visits, shared collections, cooperative milestone totals | Easiest starting point. Save state on the server and retrieve it when needed. Players need not be online together. |
| Turn-based play or small shared building sessions | Feasible in principle with validated actions, conflict handling, and updates over requests or WebSockets. |
| A small casual live co-op room | Technically plausible; prototype before promising performance. Needs room ownership, state synchronization, reconnect handling, and authoritative reward rules. |
| Fast competitive action or a large shared world | Much more work. A dedicated real-time backend is often a better architecture; D1 should not store every animation frame. |

A browser can render and simulate locally while a server exchanges necessary actions/state. Fast action needs lag handling and server-side validation. A database plus WebSocket endpoint does not by itself resolve coordination across instances or disconnected iPads.

No exact player limit is claimed. Practical capacity depends on runtime quotas, update rates, network conditions, backend design, and testing. Avoid promising “X players supported” before a real prototype.

## Best fit for this collection, if explored later
Start with asynchronous clubhouse visits and a cooperative shared building project, then consider a small shared decorating room. Keep direct communication out of the first prototype; preset reactions are enough to make a visit feel social. These are proposed directions, not selected requirements.

## Important audience limitation
The same official Sites documentation says not to target children under 13 or the applicable age of digital consent. This collection is for a fourth-grader. A suitable different host would therefore need to be chosen for the child-facing hosted collection; using parent-managed profiles does not establish an exception.

The earlier conversation correctly described technical storage capabilities but omitted this audience restriction. No multiplayer/backend has been built, and the existing public Site has not been modified or taken down in this work.
