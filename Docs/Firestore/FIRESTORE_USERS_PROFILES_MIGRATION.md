# Firestore Users and Profiles Migration

## What Moved

- Firebase-authenticated user profile documents now live in Firestore at `users/{uid}`.
- Firebase Auth UID and verified phone number define account identity.
- Onboarding completion is determined by Firestore profile state.
- Profile setup writes to Firestore only when the user confirms the final profile form.

## What Stayed Temporary

- FastAPI/MongoDB still hold product data.
- Crushes, matches, messages, reveal, and Unhook remain on the preview API.
- A temporary profile sync keeps preview user records compatible with the current demo flow.

## Routing

```text
No Firebase user
→ phone auth

Firebase user exists
→ load users/{uid}

No Firestore profile or onboardingCompleted=false
→ onboarding

Firestore profile onboardingCompleted=true
→ main app
```

## Validation Rules

- first name required
- age must be between 18 and 99
- gender required
- interested-in required
- at least one personality prompt required
- favourite show required
- no partial onboarding profile is written before confirmation

## Development Test Users

Use Firebase Console fictional test numbers:

```text
Alex: +12025550100
Jordan: +12025550101
```

The test code is configured in Firebase Console and must not be hardcoded into production-facing source.

## Native Rebuild

Firestore is a native module. Rebuild Knook Dev after installing it:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo run:ios
```

Then start Metro:

```bash
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo start --dev-client --clear
```

## Remaining Work

- Deploy and test Firestore rules against the development project.
- Validate Android after Android native build setup.
- Remove the preview profile bridge after product data migration.
