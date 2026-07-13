# Firebase Auth Current State

This document records the authentication implementation after adding the Firebase Phone Authentication foundation. Product data still lives in the temporary FastAPI/MongoDB preview backend.

## Mobile Flow

1. `Mobile/app/(auth)/phone.tsx`
   - Starts with an empty phone input.
   - Normalizes the typed value with `Mobile/src/utils/normalizePhone.ts`.
   - Calls `authService.requestOtp(phone)`.
   - In Firebase mode, starts Firebase Phone Auth and navigates with a Firebase verification session id.
   - In preview mode, calls the temporary preview OTP endpoint and may include preview-only `devCode`.

2. `Mobile/app/(auth)/otp.tsx`
   - Accepts a six-digit code.
   - Calls `authService.verifyOtp(phone, verificationId, code)`.
   - In Firebase mode, confirms the Firebase verification code and relies on Firebase Auth state.
   - In preview mode, stores the returned preview JWT and uid through `setSession`.
   - Routes completed users to `/(tabs)/crushes`.
   - Routes incomplete users to `/(onboarding)/profile`.
   - Shows the preview `devCode` only when `appEnvironment.canUsePreviewTools` is true.

3. `Mobile/src/services/auth/authService.ts`
   - Selects `FirebaseAuthProvider` or `PreviewAuthProvider` through explicit environment configuration.
   - Registers token and uid resolvers for `Mobile/src/services/api.ts`.
   - Clears the active auth provider session on sign-out.

4. `Mobile/src/services/api.ts`
   - In Firebase mode, asks Firebase Auth for a fresh ID token before API calls.
   - In preview mode, reads the stored preview JWT.
   - Sends `Authorization: Bearer <token>` for authenticated API calls.
   - Handles non-JSON backend error responses without crashing the UI.

5. `Mobile/src/hooks/useAuth.ts`
   - Reads `knook.uid` from AsyncStorage.
   - Calls `firestoreService.getMe()` to load the local preview user.
   - Signs out if the local user lookup fails.

6. `Mobile/app/index.tsx`
   - Reads `knook.uid` from AsyncStorage.
   - Calls `firestoreService.getMe()`.
   - Routes to phone, onboarding, or main tabs.

7. `Mobile/app/(tabs)/profile.tsx`
   - Calls `useAuth().signOut()`.
   - Replaces navigation with the phone screen.

## Backend Flow

1. `Backend/preview-api/server.py`
   - Uses explicit `AUTH_MODE=preview` or `AUTH_MODE=firebase`.

2. In preview mode:
   - `POST /api/auth/request-otp` accepts demo OTP only when `DEMO_MODE=true`.
   - `POST /api/auth/verify-otp` checks the stored preview verification.
   - Existing users are located by `phoneHash`.
   - New users receive a random local `uid`.
   - Session tokens are signed preview JWTs using `JWT_SECRET`.
   - `current_user` decodes the preview JWT and loads `users.uid`.

3. In Firebase mode:
   - Mobile sends a Firebase ID token as `Authorization: Bearer <Firebase ID token>`.
   - FastAPI verifies the token with Firebase Admin SDK.
   - The verified Firebase `uid` and `phone_number` claim are used to resolve a local preview user.
   - Existing users are matched first by `firebase_uid`, then by verified phone hash.
   - New Firebase-authenticated users receive a minimal local preview user record.
   - Old preview JWTs are not accepted in Firebase mode.

4. Preview JWT claims
   - `sub`: local MongoDB user uid.
   - `typ`: `knook-preview-session`.
   - `iat` and `exp`: local preview session timing.

5. Product routes
   - `current_user` is the dependency for users, crushes, matches, messages, reveal, and unhook.
   - Every product route currently assumes a local preview user document.

## Existing-User Detection

- The backend normalizes the phone number.
- The backend hashes it with SHA-256.
- Existing users are found by `phoneHash`.
- Re-login returns the same local uid and existing profile state.

## Sign-Out Behavior

- Mobile clears AsyncStorage keys `knook.token` and `knook.uid`.
- The app navigates to `/(auth)/phone`.
- Polling hooks check for `getUid()` before making authenticated calls, preventing signed-out polling spam.

## Two-Device Fixtures

Development users are seeded by `Scripts/two_user_reset_seed.py`:

- Alex: local uid `demo-user-a`, phone `+12025550100`.
- Jordan: local uid `demo-user-b`, phone `+12025550101`.

The seed script stores phone hashes, not raw phone numbers.

The matching Firebase Console test numbers are:

- Alex: `+12025550100`.
- Jordan: `+12025550101`.

Both use a Firebase Console test code for local development. Do not hardcode that code in production-facing source.

## Files Affected By Firebase Auth

| Area | Files |
| --- | --- |
| Phone UI | `Mobile/app/(auth)/phone.tsx` |
| OTP UI | `Mobile/app/(auth)/otp.tsx` |
| Auth abstraction | `Mobile/src/services/auth/authService.ts` |
| API token injection | `Mobile/src/services/api.ts` |
| Auth state hook | `Mobile/src/hooks/useAuth.ts` |
| Splash routing | `Mobile/app/index.tsx` |
| Sign-out | `Mobile/app/(tabs)/profile.tsx` |
| Environment selection | `Mobile/src/utils/environment.ts`, `Mobile/app.config.js`, `Mobile/.env.example` |
| Firebase bootstrap | `Mobile/src/services/firebase/firebaseApp.ts`, `Mobile/src/services/firebase/firebaseConfig.ts` |
| Backend auth verification | `Backend/preview-api/server.py` |
| Backend dependencies | `Backend/preview-api/requirements.txt`, `Backend/preview-api/.env.example` |
| Tests | `Backend/preview-api/tests/*`, `Mobile/scripts/*` |

## Migration Risk Notes

- Firebase UID must become the authoritative auth identity while product data still uses local preview users.
- The temporary preview backend must map a verified Firebase token to exactly one local preview user.
- Existing preview users must be matched carefully by verified Firebase `phone_number` claim.
- The backend must not accept both preview JWTs and Firebase ID tokens in the same `AUTH_MODE`.
- Local cached uid cannot be treated as proof of authentication after Firebase migration.
- Native Firebase Phone Auth requires the custom Knook Dev build; Expo Go cannot run this path.
- iOS simulator keychain failures should first be debugged through generated entitlements and fresh simulator state before adding more native workarounds.
