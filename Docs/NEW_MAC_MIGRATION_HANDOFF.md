# Knook New Mac Migration Handoff

Last reviewed: 2026-07-20

This document is the durable handoff for moving Knook development to another Mac. GitHub contains the source code and documentation. Secrets, Firebase application files, Apple signing state, simulator data, generated native projects, and Codex task history are intentionally not stored in Git.

## 1. Repository and branch map

Repository:

```text
https://github.com/TeamKnook/Knook.git
```

Important branches:

| Branch | Purpose |
| --- | --- |
| `demo/firestore-profiles-illustrations` | Stable team-demo baseline. Firebase Phone Auth and Firestore profiles are active; crushes, matches, chat, reveal, and Unhook use the temporary FastAPI/MongoDB bridge. Includes the current illustration and onboarding work. |
| `test/firebase-blaze-product-data` | Blaze-ready validation branch. Contains the Firestore product-data migration, Firebase Functions validation, and Private Circle privacy work. Use this after the Firebase project is upgraded and Functions can be deployed. |
| `feat/firestore-product-data` | Product-data migration implementation before the final Blaze validation work. |
| `feat/firestore-users-profiles` | Firebase Auth plus Firestore users/profiles milestone. |
| `integration/emergent-base` | Integration history. Do not treat `main` as the active development baseline unless the team explicitly changes the branch policy. |

The demo branch is the safest branch for a presentation before Blaze deployment. The full Firebase product flow requires authoritative Cloud Functions for crush matching, reveal, and destructive match actions.

## 2. Current application identity

```text
Display name: Knook Dev
iOS bundle identifier: com.teamknook.knook.dev
Android application ID: com.teamknook.knook.dev
URL scheme: knook-dev
Firebase development project: knook-e2c74
```

Current mobile foundation:

```text
Expo SDK: 54
React Native: 0.81.5
Node.js: 20
React Native Firebase: 25.1.0
```

Knook Dev is a custom native Expo Development Build. Expo Go is not part of the supported workflow.

## 3. Files that must not go through GitHub

The following files are ignored intentionally and must never be committed:

```text
Mobile/.env
Mobile/firebase/development/GoogleService-Info.plist
Mobile/firebase/development/google-services.json
any Firebase Admin service-account JSON
any .p12, .mobileprovision, private key, or signing credential
Mobile/ios/
Mobile/android/
node_modules/
.venv/
DerivedData and simulator data
```

Restore the two Firebase client files on the new Mac at the exact paths above. They identify the development Firebase apps and are not Firebase Admin credentials.

For the temporary FastAPI bridge, prefer generating a new Firebase Admin service-account key on the new Mac, storing it outside the repository, and revoking the old key after the new environment works. The previous local convention was:

```text
~/.config/knook/firebase/knook-development-admin.json
```

Never send an Admin key through GitHub, ordinary chat, email, or a shared drive without appropriate encryption and access controls.

## 4. New Mac prerequisites

Install and configure:

1. Xcode and the iOS simulator runtime actually needed for development.
2. Xcode Command Line Tools.
3. Homebrew.
4. NVM and Node.js 20.
5. Yarn 1.22.x through the package manager declared in `Mobile/package.json`.
6. Python 3.12.
7. MongoDB Community for the demo branch.
8. CocoaPods, if it is not already available through the Expo/Xcode toolchain.
9. Firebase CLI for rules, emulator, and Functions work.

Avoid installing unused watchOS, tvOS, visionOS, or duplicate simulator runtimes. Xcode runtimes, DerivedData, and native dependency builds were the main sources of disk pressure on the previous Mac.

## 5. Clone and restore configuration

```bash
git clone https://github.com/TeamKnook/Knook.git
cd Knook
git fetch --all --prune
git switch demo/firestore-profiles-illustrations
```

Copy `Mobile/.env.example` to `Mobile/.env` and fill in the development Firebase client values. For iOS simulators, the preview API can normally use:

```text
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

For a physical iPhone, replace `127.0.0.1` with the new Mac's current LAN IP and keep the phone and Mac on the same network. Do not reuse the old Mac's LAN IP.

Restore:

```text
Mobile/firebase/development/GoogleService-Info.plist
Mobile/firebase/development/google-services.json
```

Then install dependencies:

```bash
cd Mobile
source ~/.zshrc
nvm use 20
yarn install

cd ../Backend/preview-api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd ../functions
npm install
```

## 6. Apple and Firebase access

In Xcode:

1. Sign in with the intended Apple ID.
2. Open the generated `Mobile/ios/KnookDev.xcworkspace`, not the `.xcodeproj`.
3. Select the `KnookDev` target.
4. Under Signing & Capabilities, select the correct Team and keep automatic signing enabled.
5. Confirm Keychain Sharing is present for `com.teamknook.knook.dev`.
6. Enable Developer Mode on each physical iPhone used for development.

Sign in to the Firebase CLI account that has access to `knook-e2c74`:

```bash
firebase login
firebase use knook-e2c74
```

The development Firebase Console should retain the fictional phone numbers used for testing. Do not put their verification codes into production-facing source code.

## 7. Generate and build Knook Dev

Generated native folders are deliberately untracked. Recreate them from Expo configuration after the Firebase client files are restored:

```bash
cd Mobile
source ~/.zshrc
nvm use 20

APP_VARIANT=development \
AUTH_PROVIDER=firebase \
npx expo prebuild --clean

APP_VARIANT=development \
AUTH_PROVIDER=firebase \
npx expo run:ios
```

Start Metro separately when required:

```bash
APP_VARIANT=development \
AUTH_PROVIDER=firebase \
npx expo start --dev-client --clear --lan
```

The previous Mac successfully built and ran the native app on two simulators. Physical-iPhone installation was started but the last Xcode attempt failed because the old Mac ran out of disk space while writing DerivedData, not because of a confirmed application or signing defect. Repeat the physical-device build on the new Mac.

## 8. Demo branch startup

Start MongoDB and seed the two-user demo:

```bash
cd /path/to/Knook
brew services start mongodb/brew/mongodb-community
mongosh --eval 'db.runCommand({ ping: 1 })'
Backend/preview-api/.venv/bin/python Scripts/two_user_reset_seed.py --reset --seed
```

Start the temporary preview API:

```bash
cd Backend/preview-api
source .venv/bin/activate

AUTH_MODE=firebase \
FIREBASE_PROJECT_ID=knook-e2c74 \
GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/knook/firebase/knook-development-admin.json" \
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Start Metro from a separate terminal using the command in section 7.

Development identities:

```text
Alex   +12025550100
Jordan +12025550101
```

The verification codes are managed as fictional Firebase test numbers in Firebase Console. Confirm the current test configuration there rather than relying on this document as a credential store.

## 9. First verification on the new Mac

Before retiring the old Mac, verify all of the following on the new one:

1. Repository clone contains every expected remote branch.
2. `git status` is clean before local configuration is restored.
3. Firebase development config resolves to `knook-e2c74`.
4. Knook Dev builds, installs, and launches without Expo Go.
5. Alex and Jordan can sign in independently on two simulators.
6. Firestore profiles load after restart and sign-out/re-login.
7. On the demo branch: crush, reveal, anonymous chat, identity reveal, Unhook, and stale-access rejection work through FastAPI/MongoDB.
8. Illustrations and the three-step onboarding flow render correctly.
9. A physical iPhone build installs and connects to Metro over the LAN.
10. The Firebase Admin key on the new Mac can authenticate the temporary backend.

The repository's self-contained backend auth/tooling tests can run without starting the API:

```bash
cd Backend/preview-api
.venv/bin/python -m pytest -q \
  tests/test_firebase_auth_bridge_unit.py \
  tests/test_two_user_tooling.py
```

The remaining backend tests are live integration tests. Start MongoDB and the preview API first, or they will correctly report that the local backend is unavailable.

## 10. Blaze-ready continuation

After the Firebase project is upgraded to Blaze:

1. Switch to `test/firebase-blaze-product-data`.
2. Review that branch's Firestore rules, indexes, and Functions configuration.
3. Build and test Functions locally.
4. Deploy Functions and Firestore configuration to `knook-e2c74`.
5. Run the two-user product-data validation, including the minimum-three-active-crush Private Circle rules.
6. Do not merge into `main` until the team has reviewed the integration PR and manual results.

Spark-plan Firestore can store data, but the migrated product flow intentionally does not let clients authoritatively create matches or activate reveals. Trusted Cloud Functions are required to preserve privacy, authorization, idempotency, and the 6:30 PM reveal rules.

## 11. Codex continuity

The Git repository contains the implementation and durable documentation, but it does not contain Codex task history. On the new Mac:

1. Sign in to the same Codex account if task history should remain available.
2. Open the newly cloned Knook repository as the workspace.
3. Start a new task by referencing this handoff and the active branch.
4. Treat Git commits, branch history, and the documents under `Docs/` as the source of truth if old task history is unavailable.

## 12. Retire the old Mac only after verification

Do not delete the repository or macOS user before section 9 passes on the new Mac.

Once it passes:

1. Verify the latest commit hashes on GitHub from the new Mac.
2. Generate a replacement Admin key and revoke/delete the old key.
3. Sign out of Firebase CLI, GitHub, Xcode, and Codex on the old Mac.
4. Remove the local Knook repository and development caches only after confirming no unpushed work remains.
5. Remove the dedicated macOS user last.

Deleting the macOS user may remove Keychain items, Apple signing material, Codex local state, Firebase CLI sessions, ignored configuration, and any forgotten untracked files. It is intentionally the final operation, not part of the Git handoff.
