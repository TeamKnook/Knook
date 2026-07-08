# Firebase Phone Auth Blocker Log

Date: 2026-07-08
Branch: `feat/firebase-foundation-auth`

## Summary

Knook Dev successfully builds and launches with React Native Firebase installed, but Firebase Phone Authentication is currently blocked at the send-code step.

The visible app error is:

```text
[auth/operation-not-allowed] This operation is not allowed. You must enable this service in the console.
```

This happens before the app reaches the FastAPI preview backend, so the blocker is in Firebase Phone Auth configuration or native Firebase auth setup, not MongoDB or the preview API.

## Confirmed Working

- Knook Dev native iOS development build compiles.
- Knook Dev launches outside Expo Go.
- Firebase native app initializes once.
- The installed app uses Firebase project `knook-e2c74`.
- The installed app uses bundle identifier `com.teamknook.knook.dev`.
- The generated iOS app includes URL schemes:
  - `knook-dev`
  - `com.teamknook.knook.dev`
  - `app-1-725580819857-ios-6c0aa87399b8a2401f3e30`
- Firebase Console project ID matches the app config: `knook-e2c74`.
- Phone provider was enabled in Firebase Authentication.
- Firebase test phone numbers were added:
  - `+15555550100` with test code `123456`
  - `+15555550101` with test code `123456`
- SMS region policy was updated to allow United States for `+1` test numbers.
- Development-only Firebase test verification mode was added in the mobile auth provider.

## Confirmed Not The Cause

- Not the temporary FastAPI preview API.
- Not MongoDB.
- Not Expo Go.
- Not a project ID mismatch between the local plist and Firebase Console.
- Not missing iOS bundle identifier in the local Firebase plist.

## Current Suspects

1. Firebase Console setting propagation delay or stale Phone provider state.
2. Firebase Phone Auth requires an additional Apple-platform configuration step for this project.
3. The local development test-verification setting is not being applied early enough before `signInWithPhoneNumber`.
4. API key or Identity Toolkit restrictions in Google Cloud are blocking Firebase Auth requests.
5. The Firebase test-number path may require using the Auth Emulator for reliable local simulator testing.

## Evidence To Check Next

When resuming, collect:

- Metro log line confirming:

```text
firebase-auth-test-verification-enabled
```

- Full Metro error payload for the failed Firebase send-code request.
- Firebase Console screenshots for:
  - Authentication > Sign-in method > Phone
  - Authentication > Settings > SMS region policy
  - Project settings > General > iOS app config
- Google Cloud API status for Identity Toolkit API on project `knook-e2c74`.

## Recommended Resume Path

1. Reopen `feat/firebase-foundation-auth`.
2. Confirm Phone provider and SMS region policy remain saved.
3. Verify Metro prints `firebase-auth-test-verification-enabled` before sending a code.
4. If the same `operation-not-allowed` error remains, try Firebase Auth Emulator for local development instead of Console test numbers.
5. Only after Firebase Phone Auth returns a valid ID token, continue testing the FastAPI Firebase token bridge.

## Demo Fallback

For the team demo, use the last known-good local demo baseline:

```text
integration/emergent-base at b9d73f7
```

That baseline includes:

- Knook Dev custom iOS development build
- two-simulator local flow
- preview JWT auth
- mock contacts
- hidden pre-reveal mutual matches
- daily reveal trigger
- anonymous chat
- identity reveal
- unhook
- native edge-case fixes

The Firebase Phone Auth work should remain isolated on `feat/firebase-foundation-auth` until this blocker is resolved.
