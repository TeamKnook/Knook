# Firebase Migration Plan

## Goal

Move Knook from the temporary local preview implementation to the intended Firebase production architecture without changing the product contract.

`Backend/preview-api` and MongoDB exist only for local review of the Emergent-generated base. They must be removed after the Firebase path is complete.

## 1. Firebase Project Configuration

- Current temporary implementation: placeholder Firebase config in `Mobile/src/services/firebase/*`; preview API handles data.
- Target Firebase implementation: configure Firebase project, app IDs, Auth, Firestore, Functions, Storage, and FCM credentials for dev/staging/prod.
- Affected files: `Mobile/.env.example`, `Mobile/app.json`, `Mobile/src/services/firebase/firebaseConfig.ts`, Firebase project config files.
- Risks: leaking config or service accounts, wrong environment selection, Expo Go limitations.
- Validation criteria: app can initialize Firebase in an Expo Development Build without falling back to preview mode.
- Rollback strategy: keep preview API path available behind local env while Firebase setup is verified.

## 2. Firebase Phone Auth

- Current temporary implementation: `Backend/preview-api` accepts demo OTP when `DEMO_MODE=true`; Firebase auth scaffolding exists behind `AUTH_PROVIDER=firebase`.
- Target Firebase implementation: React Native Firebase phone auth with real verification flows in Knook Dev.
- Affected files: `Mobile/src/services/auth/*`, `Mobile/app/(auth)/*`, `Mobile/src/services/api.ts`, `Mobile/app.config.js`, Firebase Auth settings.
- Risks: missing native Firebase config files, simulator testing limitations, APNs/reCAPTCHA setup, test phone-number configuration.
- Validation criteria: Firebase test phone numbers can sign in; invalid codes fail; session persists; preview backend verifies Firebase ID tokens in `AUTH_MODE=firebase`.
- Rollback strategy: set `AUTH_PROVIDER=preview` and `AUTH_MODE=preview` while Firebase auth is stabilized.

## 3. Users/Profile Data In Firestore

- Current migration: Firestore `users/{uid}` is becoming canonical for account/profile and onboarding data.
- Temporary compatibility: MongoDB preview users are still minimally synced after profile completion so local product flows keep reveal/chat display names.
- Affected files: `Mobile/src/services/firestore/userProfileService.ts`, `Mobile/src/services/firestore/userProfileTypes.ts`, `Mobile/src/services/firestore/userProfileValidation.ts`, Firestore rules.
- Risks: exposing profile data too broadly, saving partial onboarding early, losing preview compatibility before product data migrates.
- Validation criteria: users can create, read, and update only their own profile; incomplete onboarding routes to onboarding; completed profiles route to main app; preview product flow still works.
- Rollback strategy: keep the preview profile bridge while profile routing is validated.

## 4. Crush Storage And Private Circle Eligibility In Firestore

- Current migration: `PRODUCT_DATA_PROVIDER=firebase` submits `crushRequests`; a trusted function writes `users/{uid}/crushes/{phoneHash}`.
- Temporary compatibility: preview API remains available behind `PRODUCT_DATA_PROVIDER=preview`.
- Affected files: `Mobile/src/services/firestore/firestoreService.ts`, `Mobile/src/services/firestore/firebaseProductDataService.ts`, `Backend/functions/src/crushes/handleCrushRequest.ts`, `Backend/functions/src/crushes/detectMutualCrush.ts`, Firestore rules.
- Risks: storing raw phone numbers, duplicate crushes, client-side limit bypass, exposing held matches.
- Validation criteria: raw phone/name is not stored; duplicate crush add is idempotent; 30-day expiry fields exist; a sixth free active crush is rejected; one or two active crushes cannot reveal a match.
- Rollback strategy: set `PRODUCT_DATA_PROVIDER=preview`.

## 5. Deterministic Mutual Match Creation

- Current migration: Cloud Function creates `matches/{sortedUidA_sortedUidB}` in a transaction from reciprocal pending crushes. It uses `privacy_hold` until both participants have at least three active crushes.
- Affected files: `Backend/functions/src/crushes/detectMutualCrush.ts`, Firestore indexes/rules.
- Risks: duplicate matches during simultaneous reciprocal writes.
- Validation criteria: repeated or simultaneous mutual crush writes create at most one match; duplicate submissions create no duplicates; held and pending matches remain unreadable.
- Rollback strategy: disable function trigger in non-production while preserving crush docs.

## 6. Daily Reveal Cloud Function

- Current migration: scheduled Cloud Function re-checks both participants' active-crush counts at 6:30 PM IST. Only matches where both counts are at least three activate. Development reveal uses the same eligibility path.
- Affected files: `Backend/functions/src/reveal/dailyReveal.ts`, scheduled function config.
- Risks: wrong timezone, revealing early, expiry based on `matchedAt` instead of `revealedAt`, repeated reveal execution extending expiry.
- Validation criteria: ineligible matches remain `privacy_hold`; eligible hidden matches become `active` only at reveal; `matchExpiresAt` equals `revealedAt + 48h`; active matches are never re-hidden by later crush-count changes.
- Rollback strategy: pause scheduled function and set `PRODUCT_DATA_PROVIDER=preview`.

## 7. Realtime Match Listeners

- Current temporary implementation: polling hooks.
- Target Firebase implementation: Firestore `onSnapshot` listeners for matches where `participants` contains current uid.
- Affected files: `Mobile/src/hooks/useMatches.ts`, `Mobile/src/services/firestore/firestoreService.ts`.
- Risks: listener leaks, showing `pending_reveal`, stale states after unhook.
- Validation criteria: active matches appear in real time and pending matches remain hidden.
- Rollback strategy: retain polling fallback behind a local flag during transition.

## 8. Firestore Chat

- Current migration: `matches/{matchId}/messages/{messageId}` stores text messages; Cloud Functions update match previews.
- Affected files: `Mobile/src/hooks/useMessages.ts`, `Mobile/app/chat/[matchId].tsx`, `Mobile/src/services/firestore/firebaseProductDataService.ts`, Firestore rules.
- Risks: unauthorized reads, message writes after unhook, identity leakage.
- Validation criteria: only participants can read/write active chats; first message stamps match preview.
- Rollback strategy: set `PRODUCT_DATA_PROVIDER=preview`.

## 9. Reveal Logic

- Current migration: clients create `revealRequests`; Cloud Functions verify participants and update `revealedBy`.
- Affected files: `Mobile/app/reveal/[matchId].tsx`, `Mobile/src/services/firestore/firebaseProductDataService.ts`, Cloud Functions/rules.
- Risks: client spoofing another participant, exposing names too early, duplicate reveal writes leaving one client stuck.
- Validation criteria: only own reveal state can be changed; repeated reveal taps store each uid once; names appear only after both users reveal; mutual reveal survives refresh/restart.
- Rollback strategy: set `PRODUCT_DATA_PROVIDER=preview`.

## 10. Unhook Cleanup

- Current migration: clients create `unhookRequests`; Cloud Functions mark the match unhooked, soft-delete messages, and mirror crush docs.
- Affected files: `Backend/functions/src/matches/handleUnhookRequest.ts`, `Mobile/app/chat/[matchId].tsx`.
- Risks: partial cleanup, notification leakage, stale chat visible to other participant, direct stale match ID access after Unhook.
- Validation criteria: match disappears for both users; stale match reads and message reads/writes are rejected; messages are inaccessible; no notification is sent.
- Rollback strategy: set `PRODUCT_DATA_PROVIDER=preview`.

## 11. FCM

- Current temporary implementation: notification service is a stub.
- Target Firebase implementation: FCM token registration and privacy-safe push payloads.
- Affected files: `Mobile/src/services/notifications/notificationsService.ts`, users profile tokens, Cloud Functions.
- Risks: identity leakage in push content, stale tokens, permission denial handling.
- Validation criteria: pushes never include names/phone numbers before mutual reveal.
- Rollback strategy: ship without push notifications until privacy copy and payloads are reviewed.

## 12. Firebase Storage

- Current temporary implementation: no production media storage.
- Target Firebase implementation: Storage for approved profile assets or future media.
- Affected files: storage rules, profile/media services.
- Risks: unauthorized media access, metadata leakage.
- Validation criteria: only owners can upload; viewers can access only allowed assets.
- Rollback strategy: keep image/media features disabled.

## 13. Remove Preview API

- Current temporary implementation: mobile service layer points to `EXPO_PUBLIC_BACKEND_URL`.
- Target Firebase implementation: mobile services call Firebase SDKs and callable Functions.
- Affected files: `Backend/preview-api`, `Mobile/src/services/api.ts`, preview env files, docs.
- Risks: accidental production dependency on MongoDB or FastAPI.
- Validation criteria: app works with Firebase services and no mobile code calls preview API.
- Rollback strategy: keep a tagged branch with preview API for historical local review.

## 14. Remove MongoDB

- Current temporary implementation: MongoDB backs `Backend/preview-api`.
- Target Firebase implementation: no MongoDB dependency in app runtime.
- Affected files: setup docs, requirements, local scripts, preview API.
- Risks: stale docs or developer setup still referencing MongoDB as production.
- Validation criteria: production setup and app runtime do not require MongoDB.
- Rollback strategy: keep MongoDB only in archived preview instructions if needed.
