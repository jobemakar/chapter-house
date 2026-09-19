# Latest Chapter House phone publication — 2026-09-17

## Authorization and scope

Jobe explicitly requested publishing the latest Chapter House and latest games
to ChatGPT Sites for remote phone testing. This supersedes prior local-only holds
for this publication, without authorizing further gameplay changes or a different
audience. Reuse the existing application Site and preserve owner-private access.

Publish the current treehouse trial, approved natural waterfall, integrated
Wishbone Fling and thirteen current standalone previews. Luminous Locks stays
removed; Door Atelier stays rejected. Standalone games retain separate saves and
rewards. No Firebase, multiplayer or cross-device/cross-origin save sync is added.

## Preparation and verification

Application source: `1c55c213050ea14c74dac21fd61fd20880bcc2c1`.
The application worktree was clean before and after mechanical snapshot refresh;
all nineteen packaged files already matched their canonical current builds.
Production TypeScript/Vite build and all 100 application checks pass.
Preview verification passes thirteen previews / nineteen exact original,
production and localhost-served files, MIME checks and unknown-route 404.
The existing large JavaScript bundle warning remains. No additional physical
phone playtest, audio listening or hosted browser QA is claimed.

The source was pushed successfully to the existing Sites source branch and the
validated static build was packaged with the Sites helper. Sites saved version 3.

## Publication receipt

- Site: `appgprj_6aab095b3270819195be324780e2f89e`.
- Saved version: `appgprj_6aab095b3270819195be324780e2f89e~appgver_4665445ecaac8191926f287d5f56c6dd`.
- Deployment: `appgdep_6aac5c5babf48191b69ce997e95f38f6`.
- Terminal status: succeeded, verified by the native Sites status response.
- Production URL: https://chapter-house-jm.mowgliworf.chatgpt.site .
- Success timestamp: `2026-09-17T21:32:29.837386+00:00`.

Phone visitors must sign in with Jobe's owning ChatGPT account. Localhost saves
do not transfer to the hosted origin; phone saves also remain browser-local.
