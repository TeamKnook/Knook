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

Implemented and validated in local development:

- React Native Firebase `app` and `auth` dependencies are installed.
- `Mobile/app.config.js` includes Firebase native plugins when `AUTH_PROVIDER=firebase`.
- `Mobile/app.config.js` generates iOS Keychain Sharing for `com.teamknook.knook.dev`.
- `Mobile/src/services/auth/*` contains `FirebaseAuthProvider` and `PreviewAuthProvider`.
- `Mobile/src/services/api.ts` obtains bearer tokens from the selected auth provider.
- `Backend/preview-api/server.py` supports `AUTH_MODE=firebase` and maps verified Firebase users to local preview users.
- Unit tests cover local Firebase user mapping and auth-mode separation.
- Knook Dev was rebuilt as a native iOS development build with Firebase config.
- Firebase Phone Auth sign-in was manually verified on two iOS Simulators.
- FastAPI verified Firebase ID tokens through Firebase Admin credentials.
- The existing two-user product flow was manually revalidated after Firebase sign-in.

Current development Firebase project:

- Project ID: `knook-e2c74`
- iOS bundle identifier: `com.teamknook.knook.dev`
- Android package: `com.teamknook.knook.dev`
- Test numbers:
  - Alex: `+12025550100`
  - Jordan: `+12025550101`

Still required before broader rollout:

- Physical iPhone verification with Apple signing/provisioning and APNs considerations.
- Android Firebase Phone Auth validation with SHA-1/SHA-256 fingerprints.
- Auth Emulator decision, if the team wants fully local auth without relying on Firebase Console test numbers.
- Firestore product-data migration in a later milestone.
- Removal of the temporary FastAPI/MongoDB bridge after product data moves to Firebase.

Required local dependency install after pulling this branch:

```bash
cd Backend/preview-api
source .venv/bin/activate
pip install -r requirements.txt
```

## Local Firebase Auth Run Command

Start the temporary preview API in Firebase mode:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
AUTH_MODE=firebase \
FIREBASE_PROJECT_ID=knook-e2c74 \
GOOGLE_APPLICATION_CREDENTIALS=/Users/Amoux/.config/knook/firebase/knook-development-admin.json \
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Start Metro for the Firebase native app:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
source ~/.zshrc
nvm use 20
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo start --dev-client --clear
```
