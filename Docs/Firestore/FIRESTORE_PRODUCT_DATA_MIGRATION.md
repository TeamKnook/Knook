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

### `matches/{matchId}/messages/{messageId}`

Participants may create their own text messages only while the match is active. Message denormalization is handled by Cloud Functions.

## Cloud Functions

- `detectMutualCrush`: watches outgoing crush writes, detects reciprocal pending crushes, and creates a hidden `pending_reveal` match.
- `dailyReveal`: scheduled at 6:30 PM IST and activates pending matches.
- `handleDevRevealRequest`: development-only request processor for manual reveal testing.
- `handleIdentityRevealRequest`: processes reveal requests and copies names only after both participants reveal.
- `handleUnhookRequest`: unhooks the match, soft-deletes messages, and mirrors crush documents.
- `handleMessageCreated`: updates match preview/timestamps after a message is created.

## Privacy Rules

- A pending reveal match must be indistinguishable from a one-sided crush.
- Users cannot read incoming crushes.
- Users cannot read `pending_reveal` matches.
- Users cannot directly mutate matches.
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
3. Alex adds Jordan.
4. Jordan adds Alex.
5. Neither sees a match before reveal.
6. Dev reveal activates one active match.
7. Both can chat anonymously.
8. One-sided reveal keeps identity hidden.
9. Mutual reveal unlocks names.
10. Unhook removes chat access for both users.

## Temporary Components Remaining

- FastAPI preview API remains in the repository for rollback and historical local testing.
- MongoDB reset/seed tooling remains for preview mode only.
- Polling hooks remain; future work should replace them with Firestore realtime listeners.
- Notifications are still stubbed and must not include identity-sensitive content when implemented.
