# Knook

Knook is a contacts-based anonymous dating product. Users secretly add people from their contacts to a crush list; mutual crushes are held until a scheduled reveal moment, and chat stays anonymous until both people choose to reveal.

## Workspace Structure

```text
Knook/
├── Mobile/                # React Native + Expo mobile app
├── Backend/
│   ├── functions/         # Firebase Cloud Functions
│   └── preview-api/       # Temporary FastAPI local preview adapter
├── Docs/                  # Product and engineering documentation
├── Assets/                # Brand and product visual assets
├── Design/                # Design exports and animation assets
├── Research/              # User, market, and technical research
└── Scripts/               # Local runbooks and automation
```

## Current Status

Knook runs locally as the custom native `Knook Dev` iOS development build. The current integration baseline includes the stabilized Emergent-generated MVP, pre-reveal privacy fixes, native development build workflow, edge-case validation, Firebase Phone Auth foundation work, and Firestore-backed user/profile migration work.

## Production Stack Direction

- React Native + TypeScript for the mobile app
- Firebase Authentication for phone auth
- Cloud Firestore for product data
- Firebase Storage for user media
- Firebase Cloud Functions for backend logic
- Firebase Cloud Messaging for notifications
- Branch.io for deep links
- ESLint and Prettier for code quality and formatting

## Temporary Preview Architecture

`Backend/preview-api/` exists only to run and review the Emergent-generated application locally. It is a FastAPI + MongoDB adapter that mirrors the intended Firestore-shaped service calls while the mobile app is still being converted toward the final Firebase implementation.

The final production architecture remains React Native + TypeScript + Firebase Auth + Firestore + Cloud Functions + Firebase Storage + FCM. The preview API and MongoDB must not be treated as production dependencies.

Preview-only protections:

- Fake OTP auth runs only when `DEMO_MODE=true`.
- Preview auth accepts only `DEMO_OTP_CODE`.
- Preview sessions use signed JWTs instead of raw user IDs.
- The local reveal helper requires `DEMO_MODE=true` and authenticated access.

## Firebase Auth Foundation

Knook now supports Firebase Phone Authentication in the custom `Knook Dev` build while product data remains on the temporary FastAPI/MongoDB preview backend.

The mobile app supports explicit auth-provider selection:

```env
AUTH_PROVIDER=firebase
AUTH_PROVIDER=preview
```

The temporary preview API supports matching backend modes:

```env
AUTH_MODE=firebase
AUTH_MODE=preview
```

Firebase mode requires human-supplied Firebase Console configuration files and local Firebase Admin credentials. See:

- [Firebase Auth Current State](Docs/Firebase/FIREBASE_AUTH_CURRENT_STATE.md)
- [Firebase Environments](Docs/Firebase/FIREBASE_ENVIRONMENTS.md)
- [Firebase Console Setup](Docs/Firebase/FIREBASE_CONSOLE_SETUP.md)
- [Firebase Admin Local Setup](Docs/Firebase/FIREBASE_ADMIN_LOCAL_SETUP.md)
- [Firebase Phone Auth Migration](Docs/Firebase/FIREBASE_PHONE_AUTH_MIGRATION.md)
- [Phone Auth Privacy Requirements](Docs/Firebase/PHONE_AUTH_PRIVACY_REQUIREMENTS.md)

The development Firebase project currently validated locally is `knook-e2c74`, with fictional Firebase Console test numbers for Alex and Jordan. Real user SMS, physical-device behavior, and Android Firebase Phone Auth remain separate follow-up validation items.

## Firestore Users and Profiles

User account profile data is migrating to Firestore at `users/{uid}`. Firebase Auth remains the source of truth for the account phone number, and Firestore is the canonical source for onboarding/profile completion.

Product data still remains on the temporary FastAPI/MongoDB preview layer:

- crushes
- matches
- messages
- reveal state
- Unhook state

See:

- [Firestore Current State](Docs/Firestore/FIRESTORE_USERS_PROFILES_CURRENT_STATE.md)
- [Firestore Profile Schema](Docs/Firestore/FIRESTORE_USERS_PROFILE_SCHEMA.md)
- [Firestore Profile Preview Bridge](Docs/Firestore/FIRESTORE_PROFILE_PREVIEW_BRIDGE.md)
- [Firestore Users/Profile Migration](Docs/Firestore/FIRESTORE_USERS_PROFILES_MIGRATION.md)

## Local Setup

See [SETUP.md](SETUP.md) for system-level environment requirements.

Copy example environment files before running locally:

```bash
cp Mobile/.env.example Mobile/.env
cp Backend/preview-api/.env.example Backend/preview-api/.env
```

Replace `JWT_SECRET=replace-with-local-secret` in `Backend/preview-api/.env` with a local-only secret value.

## Common Commands

Install frontend dependencies:

```bash
cd Mobile
yarn install
```

Create the Python virtual environment:

```bash
cd Backend/preview-api
python3 -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start the local preview API:

```bash
cd Backend/preview-api
source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8000
```

Start the Expo app:

```bash
cd Mobile
APP_VARIANT=development yarn start --dev-client
```

Build and install the local iOS development app:

```bash
cd Mobile
source ~/.zshrc
nvm use 20
APP_VARIANT=development npx expo run:ios
```

After adding Firebase native config files or changing Firebase native packages, regenerate the native project locally before rebuilding:

```bash
cd Mobile
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo prebuild --clean
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo run:ios
```

Run backend tests:

```bash
cd Backend/preview-api
source .venv/bin/activate
TEST_BACKEND_URL=http://127.0.0.1:8000 pytest tests
```

Run frontend linting:

```bash
cd Mobile
yarn lint
```

Run frontend type checking:

```bash
cd Mobile
yarn typecheck
```

Run focused profile migration checks:

```bash
cd Mobile
yarn test:profiles
```

Build Firebase Functions:

```bash
cd Backend/functions
npm install
npm run build
```

## Local Native Development

Expo Go is no longer the primary Knook runtime. Use the custom `Knook Dev` development build for local native development.

See:

- [Development Build Migration](Docs/DEVELOPMENT_BUILD_MIGRATION.md)
- [Native Project Strategy](Docs/NATIVE_PROJECT_STRATEGY.md)
- [Two-Device Development Build Workflow](Scripts/two-device-development-build.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit, review, and documentation expectations.
