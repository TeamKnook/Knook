# Firebase Admin Local Setup

The FastAPI preview backend temporarily verifies Firebase ID tokens while product data still lives in MongoDB. This bridge is temporary and must be removed after product data migrates to Firebase.

## Credential Method

Use Application Default Credentials or a local service-account file referenced through:

```env
GOOGLE_APPLICATION_CREDENTIALS=/absolute/local/path/to/firebase-admin.json
FIREBASE_PROJECT_ID=knook-e2c74
AUTH_MODE=firebase
```

Never commit the service-account JSON file.

## Local Credential Rules

- Store credentials outside the repository when possible.
- If a local credential file must sit near the project temporarily, ensure it is ignored by git.
- Rotate or revoke credentials immediately if they are exposed.
- Use least-privilege development credentials.
- The current local development credential path used during validation was:

```text
/Users/Amoux/.config/knook/firebase/knook-development-admin.json
```

This path is intentionally outside the repository and must remain untracked.

## Project Validation

The backend should validate that verified tokens belong to the configured `FIREBASE_PROJECT_ID`.

In Firebase mode:

- Accept only Firebase ID tokens.
- Reject old preview JWTs.
- Require a verified Firebase UID.
- Require a phone-number claim for local user mapping.

In preview mode:

- Preserve old preview JWT behavior.
- Reject Firebase tokens unless the mode is explicitly changed.

## Why This Is Temporary

The final production architecture will not use FastAPI to verify Firebase tokens. Cloud Functions and Firestore security rules will use Firebase Auth directly.
