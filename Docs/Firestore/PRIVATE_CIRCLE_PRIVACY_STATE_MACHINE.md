# Private Circle Privacy State Machine

## Scope

This document defines the trusted Firebase behavior for Knook Product Rules v1.1. It covers the three-active-crush anonymity threshold and the free limit of five active crushes. It does not add Premium, contacts upload, notifications, payments, or public profiles.

## Constants

- Minimum active crushes for reveal eligibility: **3 per participant**
- Free active-crush limit: **5 per user**
- Crush lifetime: **30 days**
- Match reveal time: **6:30 PM Asia/Kolkata**
- Unmessaged active-match expiry: **48 hours from reveal**

`pending`, `matched`, and `unhooked` crush records count as active while their `expiresAt` timestamp is in the future. Unhook does not remove the underlying crush.

## Trusted Add-Crush Path

The mobile app writes a private `crushRequests/{requestId}` document containing the signed-in UID, a SHA-256 phone hash, the last four digits for private support display, and a server timestamp.

`handleCrushRequest` then:

1. verifies the request shape and profile;
2. rejects self-crushes;
3. counts non-expired active crushes;
4. rejects a sixth free active crush;
5. writes or renews `users/{uid}/crushes/{phoneHash}`; and
6. marks the request processed or failed.

Clients cannot write authoritative crush documents. Raw phone numbers and contact names are never written to Firestore by this path.

A server-only `privateCircleMetadata/{uid}` document acts as a transaction contention marker. The active count is still recomputed from crush expiry/status data, while the shared marker prevents simultaneous requests from both passing the free-limit check.

## Match States

| Status | Meaning | Client visibility |
| --- | --- | --- |
| `privacy_hold` | Reciprocal crush exists, but one or both users have fewer than three active crushes | Hidden |
| `pending_reveal` | Both users meet the threshold and the match awaits the next daily reveal | Hidden |
| `active` | Daily reveal activated the match | Participants only |
| `unhooked` | Either participant ended the match | Hidden and inaccessible |
| `expired` | Match ended before conversation | Hidden and inaccessible |

Home must never expose `privacy_hold`, `pending_reveal`, a hidden match count, or which crush reciprocated.

## Transitions

```text
reciprocal crush
  -> privacy_hold       when either active count is below 3
  -> pending_reveal     when both active counts are at least 3

privacy_hold
  -> pending_reveal     when a later active-crush write makes both users ready

privacy_hold or pending_reveal at 6:30 PM
  -> active             when both counts are still at least 3
  -> privacy_hold       otherwise

active
  -> unhooked or expired
```

Once active, a later decrease in crush count does not hide the match again.
Activation is transactional, so overlapping scheduled or development reveal calls cannot replace `revealedAt` or extend `matchExpiresAt`.

## Deployment Boundary

This implementation can be built and tested locally before billing is enabled. Live testing requires deployment of these functions plus Firestore rules:

- `handleCrushRequest`
- `detectMutualCrush`
- `dailyReveal`
- `handleDevRevealRequest`

Deploy only after the development project is upgraded and the rules/functions diff is reviewed.
