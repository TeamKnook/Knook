# Knook — MVP

Contacts-based anonymous dating. Users secretly tap people from their phone
contacts; mutual crushes are held until **6:30 PM IST**, then revealed all at
once. Chat is anonymous until both sides choose to reveal.

## Tech Stack

| Layer            | Choice                                       |
|------------------|----------------------------------------------|
| Mobile           | React Native + TypeScript + Expo Dev Build   |
| Auth             | Firebase Phone Authentication                |
| Database         | Cloud Firestore                              |
| Storage          | Firebase Storage                             |
| Push             | Firebase Cloud Messaging                     |
| Backend logic    | Firebase Cloud Functions (TypeScript)        |
| Deep links       | Branch.io (never Firebase Dynamic Links)     |
| Payments (later) | RevenueCat                                   |

> While the preview environment can't run native Firebase, this repo ships
> a thin FastAPI + MongoDB adapter under `/app/backend` that mirrors the
> Firestore semantics. Every screen talks to it via
> `src/services/firestore/firestoreService.ts`. Swap that service for the
> real Firestore SDK once you flip to a Dev Build.

## Local Setup

```bash
# 1. Install JS deps
cd frontend
yarn install

# 2. Set env
cp .env.example .env
# fill in Firebase / Branch keys when you have them

# 3. Run preview (Metro)
yarn start
```

For the Dev Build:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Folder Structure

```
knook/
├── app/                              # expo-router screens
│   ├── _layout.tsx                   # Root navigator
│   ├── index.tsx                     # Splash + boot routing
│   ├── (auth)/                       # AuthNavigator
│   │   ├── phone.tsx
│   │   └── otp.tsx
│   ├── (onboarding)/                 # OnboardingNavigator
│   │   └── profile.tsx
│   ├── (tabs)/                       # MainTabNavigator
│   │   ├── _layout.tsx
│   │   ├── crushes.tsx               # Home / Crushes
│   │   ├── chats.tsx                 # Chat list
│   │   └── profile.tsx               # Profile
│   ├── add-crush.tsx                 # Add Crush modal
│   ├── chat/[matchId].tsx            # Anonymous chat
│   └── reveal/[matchId].tsx          # Reveal identity flow
│
├── src/
│   ├── components/{buttons,cards,inputs,layout}
│   ├── hooks/                        # useAuth, useCrushes, useMatches, useMessages
│   ├── models/                       # User, Crush, Match, Message, Waitlist
│   ├── services/
│   │   ├── firebase/                 # config + bootstrap
│   │   ├── auth/                     # phone OTP
│   │   ├── firestore/                # Firestore-shaped data service
│   │   ├── contacts/                 # expo-contacts wrapper + mock
│   │   ├── notifications/            # FCM stub
│   │   └── branch/                   # Branch deep link stub
│   ├── theme/                        # colors, spacing, typography
│   ├── utils/                        # normalizePhone, sha256, timeUtils
│   └── constants/
│
├── functions/                        # Firebase Cloud Functions (TS)
│   └── src/
│       ├── crushes/detectMutualCrush.ts
│       ├── reveal/dailyReveal.ts
│       ├── matches/handleUnhook.ts
│       ├── notifications/sendNotification.ts
│       └── index.ts
│
└── backend/                          # FastAPI + MongoDB preview adapter
    └── server.py
```

## MVP Features Implemented

1. Splash screen with auth-aware boot routing
2. Phone login (mocked OTP in preview, real Firebase Phone Auth wired)
3. OTP screen
4. Profile setup (name, age, gender, interest, vibe, love language, icebreaker)
5. Crushes home with countdown to next 6:30 PM IST reveal
6. Add Crush screen (mock contacts in preview, real expo-contacts wired)
7. Chats list (only post-reveal matches are visible)
8. Anonymous chat with realtime polling listener
9. Reveal identity flow (per-user, then mutual)
10. Mutual reveal state (real names appear)
11. Unhook flow (soft-deletes messages + flips both crushes)
12. Profile screen with sign-out

## TODOs / Future Features

Search the codebase for `TODO(` to find every deferred hook:

- `TODO(real-firebase)` — swap the firestoreService for the @react-native-firebase SDK
- `TODO(real-fcm)` — actually request token + handlers
- `TODO(real-branch)` — wire react-native-branch
- `TODO(real-device)` — flip Add Crush to load real device contacts
- `TODO(notifications)` — daily-reveal push fan-out
- Payments (RevenueCat), Premium, Credits
- First Date Packages, Couples Shipping, Origin Story, Restaurant booking,
  Voice notes, real WhatsApp invites, production Branch campaign setup

## Core Product Rules (enforced in code)

- **No raw contacts** ever leave the device. The Add Crush flow normalizes
  the picked number and the adapter hashes it (SHA-256) before write.
- **Matches stay hidden** until `status == 'active'`. The `/api/matches`
  list explicitly filters out `pending_reveal`.
- **Anonymous by default.** Chat header reads `Mystery Match` until both
  participants are in `revealedBy[]` and `mutualReveal == true`.
- **Either user can unhook.** Doing so soft-deletes messages, flips the
  match, and mirrors the status onto both crush docs.

## Common Commands

```bash
# Run the app (Metro)
yarn --cwd frontend start

# Backend (preview adapter)
sudo supervisorctl restart backend

# Cloud Functions
cd functions && npm run build && npm run deploy
```

## License

Proprietary — Knook.
