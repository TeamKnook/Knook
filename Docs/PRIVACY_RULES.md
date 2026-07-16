# Privacy Rules

These rules summarize `Docs/PRODUCT_RULES_V1_1.md`, which is authoritative when wording differs.

## Private Circle Eligibility

- Both users need at least three active crushes before a reciprocal match can become reveal-eligible.
- A reciprocal match below that threshold is `privacy_hold`, not user-visible.
- Eligibility is checked again at the 6:30 PM IST reveal.
- Home may show neutral progress toward three crushes but must not imply a held match exists.
- The full `privacy_hold` transition requires authoritative Cloud Functions work; client-only checks are insufficient.

Knook's product promise depends on hiding reciprocity, identity, and unhook intent until the exact moment the user has consented to reveal or the daily reveal has activated a match.

## Hidden Mutual State

- The backend may detect a mutual crush before reveal.
- The backend may create a match with `status = pending_reveal`.
- A `pending_reveal` match must be indistinguishable from a one-sided crush in all user-facing UI.
- Firestore rules must prevent clients from reading `pending_reveal` match documents directly.
- Users must never be able to read incoming crush documents.
- Do not show matched badges, matched counts, success styling, match IDs, chat entry points, or reciprocity copy before reveal.
- Home never shows matched badges, matched counts, or reciprocal styling, including after a match becomes active.
- Neutral pre-reveal copy should use language such as `Added privately` and `You'll only know if it's mutual during the daily reveal.`

## Pre-Reveal UI Restrictions

Before a match is `active`, the UI must not expose:

- `Matched`
- `Mutual`
- `They crushed you back`
- `Waiting for them to crush back`
- any visual badge or counter that changes only because reciprocity was detected
- any navigation route that includes a hidden `matchId`

The user should not be able to infer whether the other person has added them.

## Anonymous Chat Identity

- Chat is available only after the daily reveal activates a match.
- Chat headers must show anonymous labels until both users choose Reveal.
- Real names unlock only after mutual reveal.
- The app cannot control names typed by users inside message bodies, but app-provided headers, badges, labels, and notifications must stay non-identifying.

## Notification Privacy

- Push notifications must not include names, phone numbers, contact names, or message previews that reveal identity before mutual reveal.
- Match notifications should use generic language such as `You have a new mystery match`.
- Reveal notifications should not identify who revealed until mutual reveal is complete.

## Unhook Privacy

- Either person may Unhook from an active chat. Pre-reveal Unhook is not exposed in V1.
- Unhook removes the match and clears or hides the conversation for both users.
- The other user must not be told who initiated the Unhook.
- Unhook notifications, if any, must be generic and non-identifying.
- The Home crush card does not change because of Unhook; removing a crush is a separate future decision.
