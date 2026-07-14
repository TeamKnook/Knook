# Firestore Product Data Migration

## Scope

This milestone moves Knook's active product data from the temporary FastAPI/MongoDB preview path to Firestore and Cloud Functions.

Included:

- Private outgoing crushes
- Mutual match creation
- Daily reveal activation
- Active match lists
- Anonymous chat messages
- Identity reveal state
- Unhook cleanup
- Three-crush Private Circle reveal eligibility
- Free active-crush limit enforcement

Not included:

- Contacts migration
- Notifications
- Waitlist
- Payments
- Branch
- Lottie
- Real production matching eligibility

## Runtime Selection

Mobile now chooses product data with `PRODUCT_DATA_PROVIDER`.

- `PRODUCT_DATA_PROVIDER=firebase` uses Firestore and Cloud Functions request documents.
- `PRODUCT_DATA_PROVIDER=preview` keeps the old FastAPI adapter available as rollback.
- When `AUTH_PROVIDER=firebase`, the default product data provider is `firebase`.

## Firestore Shape

### `crushRequests/{requestId}`

Owner-created and owner-readable request documents. The trusted `handleCrushRequest` function validates the request, enforces the free limit of five active crushes, and writes the authoritative crush document. This prevents clients from bypassing the limit.

### `users/{uid}/crushes/{phoneHash}`

Owner-readable outgoing crushes only.

Fields:

- `uid`
- `phoneHash`
- `phoneLast4`
- `status`
- `crushedAt`
- `expiresAt`
- `renewedAt`
- `matchId`
- `createdAt`
- `updatedAt`

Raw phone numbers are not stored in crush documents.

### `matches/{matchId}`

Created only by Cloud Functions. `matchId` is deterministic from sorted participant UIDs.

Important fields:

- `participants`
- `status`
- `matchedAt`
- `revealedAt`
- `matchExpiresAt`
- `revealedBy`
- `mutualReveal`
- `revealedNames`
- `lastMessageAt`
- `lastMessagePreview`
- `firstMessageSentAt`

Clients may read only active matches where they are participants. `pending_reveal` remains hidden.
`privacy_hold` also remains hidden and indicates that at least one participant has fewer than three active crushes.

### `matches/{matchId}/messages/{messageId}`

Participants may create their own text messages only while the match is active. Message denormalization is handled by Cloud Functions.

## Cloud Functions

- `handleCrushRequest`: owns crush writes and enforces the free five-active-crush limit.
- `detectMutualCrush`: detects reciprocal crushes and creates either `privacy_hold` or `pending_reveal` based on both active-circle counts.
- `dailyReveal`: scheduled at 6:30 PM IST, re-checks both counts, and activates only eligible hidden matches.
- `handleDevRevealRequest`: development-only request processor for manual reveal testing.
- `handleIdentityRevealRequest`: processes reveal requests and copies names only after both participants reveal.
- `handleUnhookRequest`: unhooks the match, soft-deletes messages, and mirrors crush documents.
- `handleMessageCreated`: updates match preview/timestamps after a message is created.

## Privacy Rules

- A pending reveal match must be indistinguishable from a one-sided crush.
- Users cannot read incoming crushes.
- Users cannot read `pending_reveal` matches.
- Users cannot directly mutate matches.
- Users cannot directly write authoritative crush records.
- One or two active crushes can never make a reciprocal match reveal-eligible.
- Users cannot send messages after Unhook.
- Real names are copied to `matches/{matchId}.revealedNames` only after mutual reveal.

## Deployment

Deploy rules, indexes, and functions before manual testing:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,functions --project knook-e2c74
```

Functions deployment may require billing to be enabled for the Firebase project.

## Validation

Manual validation should repeat the two-simulator flow:

1. Alex signs in.
2. Jordan signs in.
3. Each user builds a Private Circle of at least three active crushes.
4. Alex adds Jordan and Jordan adds Alex.
5. Neither sees a match before reveal.
6. Dev reveal activates one active match only when both counts remain at least three.
7. Both can chat anonymously.
8. One-sided reveal keeps identity hidden.
9. Mutual reveal unlocks names.
10. Unhook removes chat access for both users.

## Temporary Components Remaining

- FastAPI preview API remains in the repository for rollback and historical local testing.
- MongoDB reset/seed tooling remains for preview mode only.
- Polling hooks remain; future work should replace them with Firestore realtime listeners.
- Notifications are still stubbed and must not include identity-sensitive content when implemented.
- Cloud Functions require the Firebase development project billing upgrade before live deployment.
