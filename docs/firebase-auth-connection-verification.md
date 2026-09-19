# Firebase authentication connection verification — 2026-09-19

## Implemented

- Installed the modular Firebase web SDK and initialized the authored client
  against project `chapter-house-jm`.
- Added a typed member-session service with browser-local Firebase session
  persistence, username/password sign-in, sign-out, and generic credential
  errors that do not disclose whether a username exists.
- Added deterministic internal identifier conversion. Players enter only a
  normalized username and password; internal non-deliverable email identifiers
  are never rendered in the player UI.
- Added a responsive account dialog reached by tapping the current name. There
  is no registration, real-email, or player password-reset control.
- Preserved the existing browser-local guest profile through failed sign-in and
  sign-out. Firebase anonymous Auth remains disabled.
- Kept Firestore deny-all. No member profile data, import, social access, admin
  endpoint, hosting change, or site publication is included in this slice.

## Verification

- `npm run typecheck`: pass.
- `npm test`: 112 tests pass, including username normalization, deterministic
  internal conversion, domain rejection, and malformed-name rejection.
- `npm run build`: pass with the pre-existing large-chunk and LiquidFun browser
  externalization warnings; no build failure.
- Desktop in-app browser: local guest label opens the account dialog; fields,
  focus, close control, and copy are visible and usable.
- Live Firebase rejection: a syntactically valid nonexistent username reaches
  Firebase and returns the intended generic retry message without exposing an
  internal identifier or account-existence detail.
- Mobile viewport at 390×844: dialog, fields, error, primary action, and close
  control fit without horizontal clipping. The temporary viewport was reset.
- `npm install` audit reported zero vulnerabilities.

## Remaining before member data is live

The first administrator account, trusted provisioning endpoint, member profile
schema, first-login guest import, Firestore authorization rules, and cross-device
profile repository remain checkpoint-B work. The current UI explicitly states
that online profile syncing is the next step and does not claim the local guest
profile has been uploaded.
