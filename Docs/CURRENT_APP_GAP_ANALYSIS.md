# Current App Gap Analysis

## Summary

The Emergent-generated app is a useful interactive preview, not the final Knook MVP. It demonstrates the core emotional loop at a high level: phone login, profile setup, adding crushes, waiting for reveal, anonymous chat, identity reveal, and unhook. Most production-critical pieces are still mocked, temporary, or incomplete.

## Feature Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Temporary implementation | Preview API provides demo OTP and local JWT sessions. Production Firebase Phone Auth is not wired. |
| Onboarding | Partially implemented | Profile setup exists and saves basic fields, but validation and final product field design are minimal. |
| Contacts | Mocked | `contactsService` returns fixed mock contacts. Real contact permission and device contact loading are not active. |
| Phone normalization/hash | Partially implemented | Client normalizes phone input and backend hashes phones. Production needs stricter E.164 normalization and client-side contact hashing. |
| Crushes | Temporary implementation | Add/list crushes work through preview API and MongoDB. Raw contact names are not sent, but preview contact rows show mock names locally. |
| Mutual match detection | Partially implemented | Firebase Function uses deterministic match IDs and transaction. Preview API still uses random match IDs. |
| `pending_reveal` state | Partially implemented | Backend supports hidden pending matches. UI shows matched crushes as waiting for reveal. |
| 6:30 PM reveal | Mocked | Preview uses an in-app demo trigger route. Firebase scheduled function exists as planned code but is not deployed. |
| Chat | Temporary implementation | Anonymous chat works through preview API after reveal. Realtime is polling, not Firestore listeners. |
| Reveal flow | Partially implemented | Per-user reveal and mutual reveal states exist. The UI logic needs review for edge cases and clarity. |
| Unhook | Partially implemented | Preview route marks match/crushes and soft-deletes messages. Needs production atomicity and rule coverage. |
| Privacy | Partially implemented | The product intent is documented and preview avoids returning raw phone numbers. Full contacts, notification, Firestore rules, and identity-leak audits remain. |
| Notifications | Missing | FCM service is a stub. No push token registration or privacy-safe notification fanout exists. |
| Database usage | Temporary implementation | MongoDB powers preview only. Production Firestore migration remains. |
| Error handling | Partially implemented | Basic inline errors exist. Some hooks swallow errors, and offline/backend-down states need better user-facing handling. |
| Loading/empty states | Partially implemented | Core screens have simple loading/empty states. Some detail screens can remain on loading if a fetch fails. |
| UI consistency | Partially implemented | Shared components and theme exist. Some copy is stale, including OTP text saying any six digits work. |
| Branch.io | Missing | Service is a placeholder. No native Branch SDK integration yet. |
| RevenueCat | Deferred | Mentioned only as coming soon. No implementation should happen before core MVP. |

## Authentication

The app currently calls `POST /api/auth/request-otp` and `POST /api/auth/verify-otp` through `Mobile/src/services/auth/authService.ts`. This is acceptable for local preview, but production must move to Firebase Phone Auth in an Expo Development Build.

The demo OTP is configured and no longer accepts arbitrary six-digit values, but `Mobile/app/(auth)/otp.tsx` still says "any 6 digits work." That is incorrectly implemented copy, not a runtime blocker.

## Onboarding

`Mobile/app/(onboarding)/profile.tsx` collects name, age, gender, interest, date vibe, love language, and an icebreaker answer. This is partially implemented and adequate for preview.

Gaps:

- age bounds are not validated
- profile edit reuses onboarding without pre-filling current values
- product-approved profile fields are not finalized

## Contacts

`Mobile/src/services/contacts/contactsService.ts` returns fixed mock contacts. The real `expo-contacts` implementation is present as a future helper but is not installed/wired for the current app.

Gaps:

- permission prompt flow
- on-device-only raw names
- normalized and hashed contact matching at production scale
- no upload of full contacts

## Crushes And Mutual Matching

The preview API supports adding crushes and detecting mutual crushes. It keeps raw phone numbers out of returned crush payloads.

Important gap: `Backend/preview-api/server.py` uses `uuid.uuid4()` for preview match IDs. The Firebase function at `Backend/functions/src/crushes/detectMutualCrush.ts` has the correct deterministic sorted participant ID strategy. Production should follow the Firebase version.

## Daily Reveal

The reveal model exists, but the current app exposes `Trigger reveal now (demo)` in the Chats empty state. This is useful locally but must not exist in production builds.

The Firebase scheduled function is present in `Backend/functions/src/reveal/dailyReveal.ts`, using `Asia/Kolkata` and 6:30 PM.

## Chat

Chat is implemented through preview API endpoints and polling hooks. It is not yet realtime Firestore chat.

Gaps:

- Firestore subcollection migration
- participant-only rules
- first-message expiry cancellation needs production enforcement
- message delivery/read state is minimal

## Reveal Flow

The reveal flow stores `revealedBy` and `mutualReveal`. Names are shown only after mutual reveal in the backend serializer.

Gaps:

- UI edge cases need validation with two active users
- reveal action needs production authorization through rules/functions
- push notifications must not leak identity

## Unhook

Unhook exists in preview and in planned Cloud Function code. The behavior matches the product direction at a high level: remove match and clear conversation for both users.

Gaps:

- production cleanup must be carefully validated
- no notification should be sent
- local state should refresh immediately for both users

## Privacy

The current app has the right privacy direction but is not production-audited.

Must verify before production:

- no raw contact names leave device
- no full contact list upload
- no raw phone numbers stored in Firestore
- no identity leak in anonymous chat
- notification payloads contain no identifying data
- Firestore rules prevent cross-user reads

## Recommended Stabilization Before Feature Work

1. Remove or gate demo-only UI controls from production builds.
2. Fix stale OTP copy.
3. Add user-facing backend-offline handling.
4. Add a two-user local test script for mutual crush, reveal, chat, and unhook.
5. Decide final MVP profile fields before expanding onboarding.
