# Firebase Phone Auth Migration

This milestone moves account authentication from preview JWTs to Firebase Phone Authentication while keeping product data on the temporary FastAPI/MongoDB preview backend.

## Scope

In scope:

- React Native Firebase app/auth native packages.
- Expo config plugins for Firebase native config.
- Central auth provider abstraction.
- Firebase Phone Auth in Knook Dev.
- FastAPI Firebase ID token verification bridge.
- Existing local preview product flow preserved.

Out of scope:

- Firestore product-data migration.
- Cloud Functions migration.
- FCM.
- Branch.
- RevenueCat.
- Real contacts migration.
- Private Circle or three-crush rule.

## Auth Provider Modes

```env
AUTH_PROVIDER=firebase
AUTH_PROVIDER=preview
```

- `firebase`: mobile signs in through Firebase Phone Auth and sends Firebase ID tokens to the preview API.
- `preview`: mobile uses the old demo OTP + preview JWT flow.

The app must not silently accept both flows at the same time.

## Backend Auth Modes

```env
AUTH_MODE=firebase
AUTH_MODE=preview
```

- `firebase`: FastAPI verifies Firebase ID tokens and maps them to local preview users.
- `preview`: FastAPI verifies preview JWTs.

The modes must match during local testing.

## Local User Mapping

When a Firebase token is verified:

1. Read `uid` from the verified token.
2. Read the verified `phone_number` claim.
3. Normalize and hash the phone number.
4. Look for an existing user by `firebase_uid`.
5. If missing, look for an existing user by `phoneHash`.
6. Attach `firebase_uid` to the existing user when a phone-hash match exists.
7. If no user exists, create a minimal local preview user.

This preserves Alex and Jordan's seeded profiles when their Firebase test numbers match the existing phone hashes.

## Native Build Requirement

React Native Firebase cannot run inside Expo Go. After installing native Firebase packages or changing config plugins, rebuild Knook Dev:

```bash
cd Mobile
APP_VARIANT=development npx expo prebuild --clean
APP_VARIANT=development npx expo run:ios
APP_VARIANT=development npx expo start --dev-client --clear
```

## Reversibility

To temporarily return to the preview JWT path:

```env
AUTH_PROVIDER=preview
AUTH_MODE=preview
```

This fallback exists only until Firebase Auth is stable.

## Current Implementation Status

Implemented in source:

- React Native Firebase `app` and `auth` dependencies are installed.
- `Mobile/app.config.js` includes Firebase native plugins when `AUTH_PROVIDER=firebase`.
- `Mobile/src/services/auth/*` contains `FirebaseAuthProvider` and `PreviewAuthProvider`.
- `Mobile/src/services/api.ts` obtains bearer tokens from the selected auth provider.
- `Backend/preview-api/server.py` supports `AUTH_MODE=firebase` and maps verified Firebase users to local preview users.
- Unit tests cover local Firebase user mapping and auth-mode separation.

Blocked until human setup:

- Firebase development project creation.
- `Mobile/firebase/development/GoogleService-Info.plist`.
- `Mobile/firebase/development/google-services.json`.
- Firebase test phone numbers and Console-configured test codes.
- Local Firebase Admin credentials for FastAPI token verification.
- Native rebuild and simulator sign-in.

Required local dependency install after pulling this branch:

```bash
cd Backend/preview-api
source .venv/bin/activate
pip install -r requirements.txt
```
