# Firebase authentication connection — 2026-09-19

This checkpoint begins application plan phase 3 without publishing the site or
opening member data. It preserves the existing browser-local guest profile and
the current game-package boundaries.

## Requirements

1. Players see only a username and password. They never need or enter an email
   address, and there is no public registration or player password-reset flow.
2. Firebase email/password authentication remains the credential authority.
   The client deterministically converts a restricted, case-insensitive login
   username to an internal non-deliverable address. That address is an
   implementation detail and is never rendered in player UI.
3. Usernames are Jobe-assigned, 3–24 characters, and contain only lowercase
   letters, digits, dots, underscores, or hyphens after normalization. The
   assigned username is also the member's display name.
4. Authentication errors use one generic retry message so the UI does not
   disclose whether a username exists.
5. Browser-local guests remain local and do not use Firebase anonymous Auth.
   Member social access and cloud persistence require a valid Firebase session.
6. This slice adds the typed Firebase client connection and member sign-in and
   sign-out UI. Firestore remains deny-all until profile/import rules and their
   tests land together.
7. Admin account creation must use a trusted Firebase Admin SDK boundary with
   server-checked admin authorization. Admin credentials or service-account
   material must never ship in the browser bundle.

## Implementation boundaries

- Add the official modular Firebase web SDK at the application root.
- Keep project configuration in an authored TypeScript module; Firebase web
  configuration is public routing metadata, not an administrator secret.
- Put username normalization/conversion in a dependency-free module with
  focused tests.
- Put Firebase SDK lifecycle and error translation behind an object-oriented
  session service.
- Add a compact account dialog to the existing shell. Do not modify game
  packages, profile schema, saved guest data, or Firestore access in this slice.

## Acceptance checks

1. Typecheck, complete application tests, and production build pass.
2. Username conversion is deterministic and rejects invalid or misleading
   identifiers before contacting Firebase.
3. The app starts as a local guest, opens a username/password dialog, contains
   no registration/email/reset controls, and retains the guest profile after a
   failed login or sign-out.
4. Firebase initializes against `chapter-house-jm`; Firestore rules remain
   deny-all and no hosting deployment occurs.
