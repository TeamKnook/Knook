# Firestore Documentation

This document is a planning reference only. It does not create Firebase collections, indexes, or rules.

## Collection: users

### Purpose

Stores public and private user profile data required for account, discovery, and matching flows.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | string | Yes | Matches Firebase Auth UID |
| displayName | string | Yes | User-visible name |
| photoURL | string | No | Profile image URL |
| bio | string | No | Short profile text |
| status | string | Yes | Example: active, paused, deleted |
| createdAt | timestamp | Yes | Server timestamp |
| updatedAt | timestamp | Yes | Server timestamp |

### Relationships

- One `users` document maps to one Firebase Auth user.
- A user can create many `crushes`.
- A user can participate in many `matches` and `messages`.

### Indexes

| Fields | Purpose |
| --- | --- |
| status, updatedAt | Query active users by recent activity |

### Security Considerations

- Users should only edit approved fields on their own profile.
- Private fields should be separated from public discovery fields if needed.
- Deleted or paused users should be excluded from discovery queries.

## Collection: matches

### Purpose

Represents a mutual connection between two users.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | string | Yes | Match document ID |
| userIds | string[] | Yes | Two participant user IDs |
| status | string | Yes | active, archived, blocked |
| createdAt | timestamp | Yes | Server timestamp |
| updatedAt | timestamp | Yes | Server timestamp |
| lastMessageAt | timestamp | No | Used for chat sorting |

### Relationships

- A match references two `users`.
- A match can contain many `messages`.

### Indexes

| Fields | Purpose |
| --- | --- |
| userIds, status, updatedAt | List active matches for a user |
| userIds, lastMessageAt | Sort conversations by recent message |

### Security Considerations

- Only participants should read a match.
- Only trusted backend logic should create a match from mutual interest.
- Blocked or archived states should restrict messaging.

## Collection: crushes

### Purpose

Stores one user's expression of interest in another user.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | string | Yes | Crush document ID |
| fromUserId | string | Yes | User who created the crush |
| toUserId | string | Yes | Target user |
| status | string | Yes | pending, matched, withdrawn |
| createdAt | timestamp | Yes | Server timestamp |
| updatedAt | timestamp | Yes | Server timestamp |

### Relationships

- A crush references two `users`.
- Two reciprocal crushes may create one `match`.

### Indexes

| Fields | Purpose |
| --- | --- |
| fromUserId, toUserId | Prevent duplicate crushes |
| toUserId, status | Detect reciprocal interest |

### Security Considerations

- Users should not read incoming crushes if the product requires secrecy.
- Users should only create or withdraw their own outgoing crushes.
- Match creation should be handled by trusted backend logic.

## Collection: messages

### Purpose

Stores chat messages between matched users.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | string | Yes | Message document ID |
| matchId | string | Yes | Parent match ID |
| senderId | string | Yes | User who sent the message |
| body | string | Yes | Message content |
| type | string | Yes | text, system, media |
| createdAt | timestamp | Yes | Server timestamp |
| readBy | map | No | User ID to timestamp |

### Relationships

- A message belongs to one `match`.
- A message sender must be a match participant.

### Indexes

| Fields | Purpose |
| --- | --- |
| matchId, createdAt | Load messages in chronological order |
| senderId, createdAt | Moderation or account history review |

### Security Considerations

- Only match participants should read messages.
- Users should only create messages as themselves.
- Message body length and type should be validated.
- Consider moderation, reporting, and retention requirements.

## Collection: waitlist

### Purpose

Stores early access or launch waitlist signups.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | string | Yes | Waitlist document ID |
| email | string | Yes | Signup email |
| name | string | No | Optional name |
| source | string | No | Campaign or referral source |
| status | string | Yes | pending, invited, rejected |
| createdAt | timestamp | Yes | Server timestamp |

### Relationships

- A waitlist entry may become a `users` document after invitation and signup.

### Indexes

| Fields | Purpose |
| --- | --- |
| email | Prevent duplicate signups |
| status, createdAt | Process invitations in order |

### Security Considerations

- Public writes should be heavily validated and rate-limited.
- Public reads should not be allowed.
- Email addresses should be treated as private data.

