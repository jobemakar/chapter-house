# Cloudflare and Firebase for the book-game collection

> Firebase is the selected hosting direction as of September 14. See the [current build plan](21-application-plan.md) for the Firestore-first movement/presence evaluation. The comparison and prices below are a September 10 historical research snapshot, not renewed recommendations or current quota guarantees.

Checked 2026-09-10. Advice only: neither provider has been provisioned or deployed to.

## Recommendation
Cloudflare remains the simplest, most generous choice for publishing the current independent static games. Firebase becomes the stronger convenience choice if the next committed step is player identity, cloud saves, a shared collectible inventory, and a clubhouse that updates across devices. This is an engineering judgment about this project, not a claim that either is universally better.

Both can be built and deployed from this workspace with their official command-line tools after the owner authorizes an account. Neither requires a game-engine rewrite. The new demos have no hosting-provider dependencies. Use an adult-owned hosting account; the games themselves currently ask players for no account or personal information.

| Dimension | Cloudflare Workers Static Assets + optional backend | Firebase Hosting + optional backend |
| --- | --- | --- |
| Static game hosting | Static asset requests free and unlimited, with no additional asset storage charge. Dynamic Worker execution has separate limits. | Free Spark plan, with Hosting storage and transfer quotas. Blaze meters overage. |
| Free database | D1: 5 GB total, 5 million rows read/day, 100,000 rows written/day. | Standard Firestore: 1 GiB, 50,000 document reads/day, 20,000 writes/day. Realtime Database offers a separate free allowance including 100 simultaneous connections. These are different billing units, not equivalent operations. |
| Paid backend | Workers Paid has a $5/month minimum plus applicable usage. D1 and Durable Objects have their own metering. | Blaze is pay-as-you-go with free allowances. Cloud Functions requires billing enabled. A tiny project may be low-cost, but this is not a blanket zero-cost guarantee. |
| Cloud saves and identity | D1 is SQL-based. We build the API, authorization and live synchronization or integrate an identity provider. | Authentication and browser database SDKs come together; Firestore listeners and offline web support simplify saved inventory and rooms. Security rules and account design still require deliberate implementation. |
| Multiplayer | Durable Objects and WebSockets suit custom, coordinated game sessions. | Realtime Database and Firestore make lightweight shared state easier; Realtime Database includes presence. They do not by themselves implement a complete authoritative action-game server. |
| Ease for Jobe | I can handle files, configuration, deployment and updates after one-time authorization. Strong choice when the games are mostly self-contained. | Same deployment assistance. More integrated tools for the future meta game, with more services/billing settings to understand. |
| Portability | Static games highly portable; SQL data broadly familiar. Durable Object logic is provider-specific. | Static games highly portable; Firestore data models, SDK calls and security rules create more Firebase-specific backend code. |

## Pricing detail worth flagging
Firebase's current [pricing table](https://firebase.google.com/pricing) lists Hosting's free transfer allowance as **360 MB/day**. Its [Hosting usage guide](https://firebase.google.com/docs/hosting/usage-quotas-pricing), updated September 8, 2026, still lists **10 GB/month**, then $0.15/GB on Blaze. These are similar in total scale but different in burst behavior; confirm the effective quota in the project console before choosing Spark for a larger group. The guide says free-plan sites can be disabled after the transfer quota and a short grace period. Hosting storage is 10 GB free, then $0.026/GB on Blaze.

Firebase budget alerts do not themselves cap charges. We would check the available service-specific spending controls if enabling billing. This comparison concerns **Firebase Hosting** for our static games, not the separate **Firebase App Hosting** product.

For the present demos, a database adds no play value yet. Keep the builds portable while evaluating the three mechanics; select hosting when ready to share, and select a backend once the meta-game requirements are concrete. No hybrid-provider complexity is necessary now.

## Primary references
- [Cloudflare static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare deployment guide](https://developers.cloudflare.com/workers/get-started/guide/)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Firebase plan behavior](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- [Firestore versus Realtime Database](https://firebase.google.com/docs/database/rtdb-vs-firestore)
- [Firebase CLI](https://firebase.google.com/docs/cli)

