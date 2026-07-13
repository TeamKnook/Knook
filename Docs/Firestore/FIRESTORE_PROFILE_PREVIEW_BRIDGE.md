# Firestore Profile Preview Bridge

Firestore is now the canonical source for user profile/onboarding data.

The temporary FastAPI/MongoDB preview backend still powers:

- crushes
- matches
- daily reveal
- anonymous chat
- identity reveal
- Unhook

Because the preview backend still needs display names for the local two-user demo, the mobile app performs a temporary minimal sync after Firestore profile completion.

## Sync Direction

```text
Firestore users/{uid}
→ authenticated PUT /api/users/me
→ MongoDB preview user record
```

## Synced Fields

- first name
- age
- gender display value
- interested-in display value
- date vibe
- looking-for/love-language display value
- favourite show as the temporary icebreaker answer
- onboarding completion state

## Safety Requirements

- Firebase ID token is required by the preview API in Firebase mode.
- The client does not send an arbitrary UID.
- FastAPI resolves the user from the verified Firebase UID.
- Firestore remains canonical.

## Removal Condition

Delete this bridge after crushes, matches, messages, reveal, and Unhook migrate to Firebase data stores and Cloud Functions.
