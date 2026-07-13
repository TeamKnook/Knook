# Firestore Users and Profiles Current State

## Files Inspected

- `Mobile/app/index.tsx`
- `Mobile/app/(auth)/phone.tsx`
- `Mobile/app/(auth)/otp.tsx`
- `Mobile/app/(onboarding)/profile.tsx`
- `Mobile/app/(tabs)/profile.tsx`
- `Mobile/src/hooks/useAuth.ts`
- `Mobile/src/services/auth/*`
- `Mobile/src/services/api.ts`
- `Mobile/src/services/firestore/firestoreService.ts`
- `Mobile/src/models/User.ts`
- `Backend/preview-api/server.py`

## Before This Migration

Firebase Auth is the account source of truth, but profile/onboarding data was still read from the temporary FastAPI/MongoDB preview user record through `/api/users/me`.

The mobile `firestoreService` name was misleading: it was a Firestore-shaped adapter backed by FastAPI, not the native Firestore SDK. Product data methods for crushes, matches, messages, reveal, and Unhook still use that adapter and remain out of scope for this milestone.

## Mobile Flow

1. Phone screen normalizes an entered phone number.
2. OTP screen confirms Firebase Phone Auth when `AUTH_PROVIDER=firebase`.
3. `authService.verifyOtp` previously fetched `/api/users/me` to determine onboarding status.
4. The splash screen and `useAuth` previously used `/api/users/me` to route to onboarding or main tabs.
5. Profile setup previously wrote profile fields to `/api/users/me`.

## Backend Flow

In `AUTH_MODE=firebase`, FastAPI verifies Firebase ID tokens through Firebase Admin, maps the verified Firebase UID/phone number to a local preview user, and keeps product data in MongoDB.

## Risks Before Migration

- Profile data was not canonical in Firestore.
- A backend outage could block account/profile routing after Firebase Auth succeeded.
- Partial preview backend profile fields were not protected by Firestore rules.
- The temporary preview adapter name made it easy to confuse MongoDB-backed calls with real Firestore calls.

## Temporary Dependencies That Remain

- FastAPI/MongoDB still hold crushes, matches, messages, reveal state, and Unhook state.
- The mobile app still calls preview API routes for product flows.
- A temporary profile sync keeps preview user names available for reveal/chat demos until product data migrates.
