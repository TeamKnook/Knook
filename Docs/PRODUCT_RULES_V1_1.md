# Knook Product Rules v1.1

Status: Approved product guardrails

This document is the repository source of truth for Knook product behavior. It consolidates the product handoff supplied on 2026-07-13 and the Private Circle minimum-three-active-crushes amendment. When code and this document disagree, treat the disagreement as an implementation gap and resolve it deliberately; do not weaken these rules to match temporary preview behavior.

## 1. Product Truth

Knook is for the crush already in your phone. It is not a swipe app.

Users add people from their real contacts as secret crushes. If both people add each other, a mutual match is created silently. Neither user knows until the 6:30 PM IST reveal. After reveal, they chat anonymously using character names until both choose to reveal.

- No strangers.
- No public profiles.
- No feed.
- No swiping.
- No photos in V1.

## 2. Current Non-Negotiable Rules

1. Phone number is the account identity; one verified phone number equals one account.
2. Firebase Auth is the source of truth for sign-in.
3. Onboarding and profile data is stored privately in Firestore.
4. Crushes are private and all active crush cards look identical.
5. Crush cards and Home never reveal match, reciprocal, held, or pending status.
6. Reciprocal matches are invisible before the daily reveal.
7. Matches appear only after the 6:30 PM IST reveal activates them.
8. Anonymous chat hides all app-provided real identity.
9. One-sided identity reveal exposes nothing to either side.
10. Mutual reveal unlocks first names only.
11. Unhook removes match and message access for both users without identifying the initiator.
12. Stale access after Unhook fails safely.
13. Development controls appear only in development builds.
14. Raw contact lists and raw contact phone numbers are never uploaded or stored.
15. A user cannot directly read another user's private profile, crushes, matches, or messages.

## 3. Private Circle Amendment

### Eligibility

A user must have at least three active crushes in their Private Circle before any mutual match can become reveal-eligible. This prevents a user with one obvious candidate from inferring an anonymous match's identity.

- Minimum active crushes for reveal eligibility: `3`.
- Free active-crush limit: `5`.
- Future Premium active-crush limit: unlimited.
- A user may add fewer than three crushes, but is not reveal-ready.
- Home may show neutral progress toward privacy readiness.
- Home must never say or imply that a hidden match exists.

Approved copy includes:

- `Build your Private Circle`
- `Add at least 3 people so anonymous matches stay private.`
- `Your Private Circle is ready.`

Forbidden copy includes:

- `unlock your match`
- `someone is waiting`
- `add more to reveal`

### Match State Model

```ts
type MatchStatus =
  | "privacy_hold"
  | "pending_reveal"
  | "active"
  | "unhooked"
  | "expired";
```

1. A reciprocal match where either user has fewer than three active crushes is stored as `privacy_hold`.
2. A reciprocal match where both users meet the threshold may become `pending_reveal`.
3. At reveal time, both active-crush counts are checked again.
4. If either user is below the threshold, the match remains or returns to `privacy_hold`.
5. When both users later satisfy the threshold, the match is eligible for the next daily reveal.
6. Once a match is active, later crush-count changes do not hide it again.
7. Privacy eligibility overrides the older rule that every already-created match must reveal.

This state machine requires authoritative Cloud Functions work and is not implemented by documentation-only branches.

## 4. Home and Crush List

Home is the user's Private Circle. It may show active crushes, expired crushes in a separate view, active-crush count, neutral progress toward three-crush privacy readiness, an add-crush action, and the free limit of five.

Home must never show:

- match or reciprocal status
- a hidden-match count
- `privacy_hold` or `pending_reveal`
- Matched or Unhooked tabs
- styling that changes when a person reciprocates
- wording that implies reciprocity

Each active crush card may show only:

- contact first name from the user's local contacts
- added date
- expiry date or days remaining
- optional initials or avatar derived only from local contact data

## 5. Onboarding and Profile

V1 onboarding has three conceptual stages:

1. Basics: first name, age, gender, interested in.
2. Personality: ideal first date, biggest dealbreaker, favourite TV show, what they are looking for, and night owl or early bird.
3. Profile preview: review, edit, then final confirmation.

Rules:

- Do not collect surname, birthday, exact location, or photos in V1.
- Do not save partial onboarding before profile-preview confirmation.
- Store favourite show for future anonymous character assignment.
- Profiles are private to their owner.
- Profile edits affect future matches only.
- Existing character names do not change after a favourite-show edit.

## 6. Matching

A match is created only when A adds B, B adds A, and both crushes are active at the authoritative check.

When reciprocity is detected, no notification, Home change, badge, visible match, or other signal is emitted. Clients do not directly create or activate matches. Matching and activation are trusted-backend responsibilities.

## 7. Daily Reveal

Daily reveal is at 6:30 PM IST.

For each pending match, trusted logic re-checks the three-active-crush threshold for both users. Eligible matches become active, and the 48-hour expiry starts at activation. Ineligible matches remain on privacy hold. A reveal takeover appears only for newly active matches; nothing appears when there are none.

The reveal screen is full-screen, has no bottom navigation, includes `knock knock.`, shows the number of newly active matches, and offers `Start the chat`.

## 8. Anonymous Chat and Expiry

Before mutual identity reveal:

- the header and message notifications use a character name or the safe `Mystery Match` fallback
- no phone number, photo, or real identity is exposed
- an expiry progress bar may show while the 48-hour expiry is active
- a reveal nudge remains available without being aggressive

The 48-hour expiry starts at daily activation. If neither user messages within 48 hours, the match expires silently. The first message permanently disables expiry for that match.

## 9. Identity Reveal

1. Neither revealed: anonymous chat continues.
2. I revealed: I see that I went first; they do not receive my identity.
3. They revealed: I see `they showed their hand. your move.` and may reveal or stay anonymous.
4. Both revealed: both first names unlock, the anonymous name is replaced, and chat continues.

Reveal is voluntary, one-way, permanent, and always accessible. Mutual reveal shares first name only: never surname, phone number, or photo. For V1, another user's one-sided reveal surfaces in chat, not through push notification.

## 10. Character Names

- Each anonymous match uses fixed character names assigned at match creation.
- Names come from each user's favourite TV show when possible, with safe classic fallbacks.
- A sees B's assigned name; B sees A's assigned name. A user never sees their own assigned name.
- Names disappear after mutual reveal and are not retained in user-facing history after Unhook or expiry.
- Until the character library is ready, use `Mystery Match`.

## 11. Unhook

Unhook is the only V1 exit from an active match. It is available inside chat and uses quiet, non-destructive styling.

Confirmation copy:

- `unhook from [character name]?`
- `they'll never know you were here. no trace, no notification, nothing.`
- Secondary action: `actually, never mind`

On confirmation, the chat disappears for both users, messages and any voice notes become inaccessible, no notification or history identifies the action, stale access fails safely, and the Home crush card does not change. The crush remains active unless it expires separately.

Pre-reveal Unhook is not exposed in V1. Removing a crush before reveal is a separate future product decision.

## 12. Contact Privacy

1. Contact access occurs only when the user opens the picker.
2. Contact processing occurs on device.
3. The full contact list and raw numbers are never uploaded or stored.
4. A selected number is normalized locally and production matching stores only a one-way hash.
5. Local contact names are used only for that user's display.
6. Human-readable crush lists must not be available to the Knook team.
7. Mock contacts exist only in development builds.

## 13. Waitlist

Waitlist is deferred until after core Firebase product data. Planned paths are organic queue, invite-link access, and an optional future pay-to-skip path. Everyone in the organic queue is eventually approved. Invite links may bypass the queue without revealing the inviter. Do not implement real payment yet.

## 14. Notifications

Notifications are deferred. Planned V1 behavior includes only a 6:30 PM match notification, character-name message notifications before reveal, first-name notifications after mutual reveal, one crush nudge per 24 hours, day-27 expiry warning, and waitlist approval. Never notify when reciprocity is first detected, and do not push one-sided reveal events.

## 15. Packages, Credits, Premium, and Payments

Monetization is deferred. A V1 Packages screen may show coming-soon items only. Do not implement purchases, credits, subscriptions, bookings, pay-to-skip, voice notes, or disappearing messages without a dedicated milestone.

## 16. Screenshot Protection

Screenshot protection is a future native feasibility investigation. Do not claim it is production-ready before real-device validation. If feasible, protection is local and never notifies the other user.

## 17. Ship a Friend

This feature is deferred. A future user may select up to two friends, confirm consent, generate links, and manually share them. Knook does not send messages automatically or force a match. Do not promise sender anonymity outside Knook; manual sharing can reveal the sender in the chosen messaging app.

## 18. Account Rules

- Sign-out ends only the session; account data remains.
- Account deletion is irreversible and must remove profile, crushes, matches, messages, and applicable invite/waitlist records.
- Active matches end silently and other users receive no explanation.
- Phone-number changes are unsupported in V1; a new number creates a new account.
- Account deletion must exist before public launch.

## 19. Current Milestone Boundary

Current guardrail work may include product-rule documentation, static illustration extraction, current Firebase configuration, and UI protections that prevent privacy violations.

It must not silently expand into waitlist, payments, notifications, voice notes, real contacts, Branch links, RevenueCat, screenshot protection, or the three-crush backend state machine. Each requires an explicit milestone.

## 20. Illustration System

The approved V1 direction uses the wordmark as the illustration. `kn` and the final `k` remain stable while the two `oo` letters transform. Use deep purple, warm yellow, black/white, and off-white with generous whitespace. Do not add mascot heads or detached cartoon faces.

Static source assets live in `Mobile/assets/illustrations/static/`. Runtime motion may be added state by state without changing the approved geometry or privacy boundaries.

## 21. Recommended Implementation Order

1. Finish and validate Firestore users/profiles.
2. Define Firestore schemas and rules for crushes, matches, and messages.
3. Implement Private Circle and Firebase crushes.
4. Implement authoritative matching and the 6:30 PM reveal.
5. Implement Firestore chat, reveal, and Unhook.
6. Add real contacts and hashing.
7. Add waitlist and invite gate.
8. Add notifications.
9. Complete illustration motion integration.
10. Add TestFlight/preview builds.
11. Add deferred monetization only in a later milestone.

## 22. Non-Negotiable Tests

Every branch touching matching or Home must verify:

1. One active crush cannot reveal a match.
2. Two active crushes cannot reveal a match.
3. Three active crushes on both sides can make a match reveal-eligible.
4. Home never shows which crush reciprocated.
5. Held and pending matches never appear before reveal.
6. Daily reveal re-checks three-crush eligibility.
7. Duplicate crush submission creates no duplicate match.
8. Duplicate reveal is idempotent.
9. One-sided reveal exposes no identity.
10. Mutual reveal unlocks first names only.
11. Unhook removes access for both users.
12. Stale chat access after Unhook is rejected.
13. Restart preserves auth and profile state.
14. Signed-out clients do not poll private endpoints.
15. Development controls do not appear outside development builds.
