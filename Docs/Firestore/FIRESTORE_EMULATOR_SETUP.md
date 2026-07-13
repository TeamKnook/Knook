# Firestore Emulator Setup

Firestore emulator support is prepared but not required for the development Firebase project smoke test.

## Config

```text
FIRESTORE_TARGET=development
FIRESTORE_TARGET=emulator
```

Emulator mode is honored only for the development app variant.

## Local Commands

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

Start emulators:

```bash
firebase emulators:start --only auth,firestore
```

Run Knook Dev against the emulator:

```bash
APP_VARIANT=development \
AUTH_PROVIDER=firebase \
FIREBASE_AUTH_TARGET=emulator \
FIRESTORE_TARGET=emulator \
npx expo start --dev-client --clear
```

## iOS Simulator Host

The iOS Simulator can reach the host Mac through `127.0.0.1`, so the app connects to Firestore emulator host `127.0.0.1` on port `8080`.

Preview and production variants must never connect to localhost emulators.
