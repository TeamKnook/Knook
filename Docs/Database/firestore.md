# Firestore Documentation

This document describes the current Firebase data model. Rules and indexes live under `/Users/Amoux/Documents/Knook/firebase`.

## Collection: `users`

### Purpose

Stores private account and profile data for the signed-in user. There are no public profile documents yet.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `uid` | string | Yes | Matches Firebase Auth UID |
| `phoneNumberE164` | string | Yes | Verified Firebase Auth phone number |
| `phoneLast4` | string | Yes | Debug/support display only |
| `phoneHash` | string | Yes | Deterministic hash used for reciprocal crush detection |
| `firstName` | string | No | Visible only to self until mutual reveal copies it to a match |
| `age` | number | No | Profile basics |
| `gender` | string | No | Profile basics |
| `interestedIn` | string | No | Profile basics |
| `vibeAnswers` | map | Yes | Personality/profile answers |
| `favouriteShow` | string | No | Later supports anonymous character-name ideas |
| `onboardingCompleted` | boolean | Yes | Controls routing |
| `accountStatus` | string | Yes | `active` or `deleted` |
| `accessStatus` | string | Yes | Development/waitlist access status |
| `createdAt` | timestamp | Yes | Server timestamp |
| `updatedAt` | timestamp | Yes | Server timestamp |

### Security

- Users can read/write only their own profile.
- Other users cannot read profile documents directly.
- Names are copied into a match only after mutual reveal.

## Subcollection: `users/{uid}/crushes/{phoneHash}`

### Purpose

Stores one user's private outgoing expression of interest.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `uid` | string | Yes | User who created the crush |
| `phoneHash` | string | Yes | Target phone hash and document ID |
| `phoneLast4` | string | Yes | Debug/support display only |
| `status` | string | Yes | `pending`, `matched`, `unhooked`, `expired` |
| `matchId` | string | No | Set by Cloud Functions after reciprocal detection |
| `crushedAt` | timestamp | Yes | Server timestamp |
| `expiresAt` | timestamp | Yes | 30-day expiry marker |
| `renewedAt` | timestamp | No | Set on repeat add |
| `createdAt` | timestamp | Yes | Server timestamp |
| `updatedAt` | timestamp | Yes | Server timestamp |

### Security

- Users can read only their own outgoing crushes.
- Users cannot read incoming crushes.
- Raw phone numbers are not stored in crush documents.
- Match creation is handled by Cloud Functions.
- Clients submit `crushRequests`; they cannot write this subcollection directly.
- The trusted request handler enforces a maximum of five active crushes for free accounts.

## Collection: `matches`

### Purpose

Represents a mutual connection between two users. Created by Cloud Functions only.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `matchId` | string | Yes | Deterministic sorted participant IDs |
| `participants` | string[] | Yes | Two participant user IDs |
| `userA` | string | Yes | Sorted participant A |
| `userB` | string | Yes | Sorted participant B |
| `status` | string | Yes | `privacy_hold`, `pending_reveal`, `active`, `unhooked`, `expired` |
| `matchedAt` | timestamp | Yes | Created when reciprocal crush exists |
| `revealedAt` | timestamp | No | Set when daily reveal activates |
| `matchExpiresAt` | timestamp | No | Reveal expiry |
| `revealedBy` | string[] | Yes | Participants who chose identity reveal |
| `mutualReveal` | boolean | Yes | True only after both reveal |
| `revealedNames` | map | No | Names copied by function after mutual reveal |
| `lastMessageAt` | timestamp | No | Used for chat sorting |
| `lastMessagePreview` | string | No | Generic chat preview |
| `firstMessageSentAt` | timestamp | No | First message marker |
| `createdAt` | timestamp | Yes | Server timestamp |
| `updatedAt` | timestamp | Yes | Server timestamp |

### Security

- Only active-match participants can read a match.
- Privacy-held and pending-reveal matches are hidden from clients.
- Clients cannot directly create or update match documents.
- Unhooked states reject chat/message access.

## Subcollection: `matches/{matchId}/messages/{messageId}`

### Purpose

Stores chat messages under active matches.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `messageId` | string | Yes | Message document ID |
| `matchId` | string | Yes | Parent match ID |
| `senderId` | string | Yes | User who sent the message |
| `type` | string | Yes | Currently `text` |
| `text` | string | Yes | Message body |
| `sentAt` | timestamp | Yes | Server timestamp |
| `readBy` | string[] | Yes | User IDs that have read the message |
| `deletedAt` | timestamp | No | Soft-delete marker after Unhook |

### Security

- Only active-match participants can read non-deleted messages.
- Users can create messages only as themselves.
- Clients cannot edit or delete messages directly.

## Request Collections

Clients create these documents; Cloud Functions perform the privileged work.

| Collection | Purpose |
| --- | --- |
| `crushRequests` | Validate private add-crush requests and enforce active-crush limits |
| `revealRequests` | Add the current user to a match's reveal state |
| `unhookRequests` | Unhook a match and clean up related data |
| `devRevealRequests` | Development-only manual reveal trigger |

## Server-Only Metadata

`privateCircleMetadata/{uid}` is maintained only by Cloud Functions as a transaction contention marker for concurrent add-crush requests. Clients cannot read or write it, and its count is not a user-facing source of truth.

## Temporary Preview Collections

FastAPI/MongoDB remains available only behind `PRODUCT_DATA_PROVIDER=preview` while this migration is validated.
