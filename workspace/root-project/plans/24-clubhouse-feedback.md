# Clubhouse feedback — 2026-09-14

Status: implemented locally; no Firebase or publication.

The user's feedback called for ambient music and UI/pet/jump audio, stable walk-to-idle facing, articulated jumping, a readable wave, an interactive persisted lamp, recovery after canceling a furniture preview, and a trial of three organic round action buttons. Requirements and the pre-code implementation plan are in [application feedback](../application/docs/feedback-01.md); verification is in [the test report](../application/docs/verification.md).

Lamps now toggle outside decorating and store state per owned instance in the existing local profile. The future Firebase member profile must persist this field too. Cancel, commit and store leave decorating active until Done or departure. Saves and Wishbone mechanics are preserved.

Future consideration explicitly requested: a larger space or movement between rooms. Do not build it in this pass; this does not change the fixed full-size room requirement for the first release.

Avatar catalog recommendation: free base colors plus hats, glasses and neck accessories as the first expanded fitting set; shirts and pants later once the shared species rig handles their fit and animation. This is a proposal, not a settled catalog. The existing promise of freely switching species and earning/buying additional cosmetics remains.

Implementation used less expensive agents for bounded audio and action styling, with the primary agent integrating/reviewing code, fixing audio lifecycle races, and owning navigation, animation, save and editor changes. Thirty-five automated checks and a production build passed; browser checks included lamp reload, cancel/select, room/game audio and portrait/landscape control layout. Physical-device and speaker-listening checks remain outstanding.

