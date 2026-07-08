# Firebase Auth Current State

This document records the current authentication implementation before migrating Knook Dev from preview JWT authentication to Firebase Phone Authentication.

## Current Flow

1. `Mobile/app/(auth)/phone.tsx`
   - Starts with an empty phone input.
   - Normalizes the typed value with `Mobile/src/utils/normalizePhone.ts`.
   - Calls `authService.requestOtp(phone)`.
   - Navigates to `/(auth)/otp` with `phone`, `verificationId`, and preview-only `devCode`.

2. `Mobile/app/(auth)/otp.tsx`
   - Accepts a six-digit code.
   - Calls `authService.verifyOtp(phone, verificationId, code)`.
   - Stores the returned preview JWT and uid through `setSession`.
   - Routes completed users to `/(tabs)/crushes`.
   - Routes incomplete users to `/(onboarding)/profile`.
   - Shows the preview `devCode` only when `appEnvironment.canUsePreviewTools` is true.

3. `Mobile/src/services/auth/authService.ts`
   - Wraps preview API routes:
     - `POST /api/auth/request-otp`
     - `POST /api/auth/verify-otp`
   - Persists `token` and `uid` in AsyncStorage via `Mobile/src/services/api.ts`.
   - Clears session with `clearSession`.

4. `Mobile/src/services/api.ts`
   - Stores preview token at `knook.token`.
   - Stores local uid at `knook.uid`.
   - Sends `Authorization: Bearer <preview JWT>` for all API calls when a token exists.

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

## Current Backend Flow

1. `Backend/preview-api/server.py`
   - `POST /api/auth/request-otp` accepts demo OTP only when `DEMO_MODE=true`.
   - `POST /api/auth/verify-otp` checks the stored preview verification.
   - Existing users are located by `phoneHash`.
   - New users receive a random local `uid`.
   - Session tokens are signed preview JWTs using `JWT_SECRET`.
   - `current_user` decodes the preview JWT and loads `users.uid`.

2. Preview JWT claims
   - `sub`: local MongoDB user uid.
   - `typ`: `knook-preview-session`.
   - `iat` and `exp`: local preview session timing.

3. Product routes
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

- Alex: local uid `demo-user-a`, phone `+15555550100`.
- Jordan: local uid `demo-user-b`, phone `+15555550101`.

The seed script stores phone hashes, not raw phone numbers.

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
