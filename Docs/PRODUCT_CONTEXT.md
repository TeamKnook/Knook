# Product Context

The normative product source of truth is `Docs/PRODUCT_RULES_V1_1.md`. This file is a shorter orientation and must not override those rules.

## Product

Knook is a contacts-based anonymous dating app for people who already exist in a user's phone contacts.

A user privately adds someone from their contacts as a crush. If the other person independently adds them back, a mutual match is created. Neither user is notified immediately. Matches are revealed only during a daily 6:30 PM IST reveal.

After the match becomes active, users chat anonymously. Either person may choose to reveal their identity. Real identities unlock only when both people choose Reveal. Either person may Unhook at any time. Unhook removes the match and clears the conversation for both users without notifying the other person.

## Core Emotional Flow

1. Secret attraction
2. Waiting
3. Daily reveal
4. Anonymous conversation
5. Voluntary mutual identity reveal
6. Continue or unhook

## Essential Product Rules

- Contacts must never be uploaded in full.
- Raw contact names must remain on-device.
- Phone numbers should be normalized and hashed for matching.
- Mutual matches must remain hidden before 6:30 PM IST.
- A user needs at least three active crushes, and so does the other participant, before a mutual match is reveal-eligible.
- A reciprocal match that does not meet that threshold remains on `privacy_hold` and is re-checked at the next daily reveal.
- A `pending_reveal` match must be indistinguishable from a one-sided crush in all user-facing UI.
- Home must never show match status, matched counts, reciprocal styling, `privacy_hold`, or `pending_reveal`.
- Anonymous chat must never show identifying information before mutual reveal.
- Push notifications must not reveal identity.
- Reveal must remain voluntary.
- Unhook must clear both sides.
- The 48-hour match expiry begins at `revealedAt`, not `matchedAt`.
- The first message disables match expiry.
- Crushes expire after 30 days.
- No monetization feature may block Reveal or Unhook.

## Privacy Position

Knook should feel emotionally risky but technically private. The app may use phone numbers to detect whether two existing contacts have chosen each other, but it should avoid storing unnecessary raw contact data. The safest intended model is:

- request contact permission only when needed
- normalize phone numbers on device
- hash phone numbers before matching
- never upload full address books
- never upload raw contact names
- reveal identities only after both sides explicitly choose Reveal

## Current Migration Caveat

Firebase Auth, private user profiles, and current product-data foundations are present in development. The Blaze-ready branch also contains the V1.1 three-crush `privacy_hold` state machine, pending Functions deployment and two-device verification. `Backend/preview-api` and MongoDB remain temporary compatibility and local-test infrastructure. Production contacts, notifications, the access gate, and deferred monetization require later milestones.
