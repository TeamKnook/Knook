# Firestore Users Profile Schema

Canonical collection:

```text
users/{uid}
```

`uid` must equal the Firebase Auth UID. The account phone number must come from the verified Firebase Auth phone claim, not from user-entered onboarding text.

## Document Shape

```ts
type KnookUserProfile = {
  uid: string;
  phoneNumberE164: string;
  phoneLast4: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Timestamp | null;
  firstName: string | null;
  age: number | null;
  gender: "woman" | "man" | "non_binary" | null;
  interestedIn: "men" | "women" | "everyone" | null;
  vibeAnswers: {
    idealFirstDate?: string[];
    biggestDealbreaker?: string[];
    favouriteTVShow?: string[];
    lookingFor?: string[];
    nightOwlOrEarlyBird?: string[];
  };
  favouriteShow: string | null;
  accountStatus: "active" | "deleted";
  accessStatus: "development_allowed" | "waitlist_pending" | "approved";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeenAt: Timestamp | null;
  schemaVersion: number;
};
```

## Privacy Notes

- Profile documents are private to their owner.
- Other users cannot directly read `users/{uid}` documents.
- No photos are stored in this milestone.
- No contacts, raw contact numbers, crushes, matches, or messages are stored in this document.
- Public profile documents are intentionally not created yet.

## Future Notes

Favourite show is stored now because it will later support anonymous character names. Product data migration will need separate collections, rules, and Cloud Function authority.
