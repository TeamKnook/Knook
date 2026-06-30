# Knook — Product Requirements (MVP)

## Vision
Contacts-based anonymous dating. Users secretly add people from their phone contacts to a Crush list. Mutual crushes are held until **6:30 PM IST**, then revealed all at once. Chat is anonymous until both sides choose to reveal.

## Stack (production target)
- React Native + TypeScript on Expo Dev Build
- Firebase Phone Auth, Cloud Firestore, Storage, FCM
- Firebase Cloud Functions (TypeScript) — `/app/functions/`
- Branch.io deep links
- RevenueCat (post-MVP)

## Preview Adapter
The Emergent preview can't run native Firebase, so this repo ships a thin **FastAPI + MongoDB** adapter under `/app/backend/` that mirrors the Firestore semantics. Every screen calls it through `src/services/firestore/firestoreService.ts`. Swap that single file for the real Firestore SDK when wiring the Dev Build.

## MVP Screens Implemented (12 / 12)
1. Splash (`app/index.tsx`) — boot routing
2. Phone login (`app/(auth)/phone.tsx`)
3. OTP (`app/(auth)/otp.tsx`) — mocked: any 6 digits work, dev code `123456`
4. Profile setup (`app/(onboarding)/profile.tsx`)
5. Crushes home (`app/(tabs)/crushes.tsx`) with countdown to 6:30 PM IST
6. Add Crush (`app/add-crush.tsx`) — 10 mock contacts; search filter fixed
7. Chat list (`app/(tabs)/chats.tsx`)
8. Anonymous chat (`app/chat/[matchId].tsx`)
9. Reveal flow (`app/reveal/[matchId].tsx`)
10. Mutual reveal state — same screen, switches copy + exposes real name
11. Unhook flow — bottom sheet inside chat
12. Profile screen (`app/(tabs)/profile.tsx`)

## Privacy Contracts (enforced in code & tests)
- Raw contacts never leave the device. Numbers are normalized + SHA-256 hashed.
- `GET /api/matches` never returns `pending_reveal` matches.
- Chat header reads "Mystery Match" until `mutualReveal == true`.
- Unhook soft-deletes messages, flips both crush docs, removes the match for both sides.

## Cloud Functions Scaffold (`/app/functions/`)
- `detectMutualCrush` — Firestore `onCreate` users/{uid}/crushes/{phoneHash}
- `dailyReveal` — Pub/Sub scheduled at `30 18 * * *` Asia/Kolkata
- `handleUnhook` — callable
- `sendMatchRevealedNotification` — callable, FCM TODO

## Deferred (TODOs in code)
- Real Firebase Phone Auth (search `TODO(real-firebase)`)
- Real FCM fan-out (`TODO(real-fcm)`, `TODO(notifications)`)
- Real Branch deep links (`TODO(real-branch)`)
- Real device contacts (`TODO(real-device)`)
- Payments / Premium (RevenueCat)
- First Date Packages, Couples Shipping, Origin Story, Restaurant booking, Voice notes, WhatsApp invites, production Branch campaigns

## Tests
- Backend: 15/15 pytest pass at `/app/backend/tests/test_knook_backend.py`
- Frontend: full e2e by testing subagent — phone → OTP → profile → crushes → add crush → dev-trigger reveal → mystery chat → reveal → mutual reveal → unhook
