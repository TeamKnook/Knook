# Two-Device Knook Dev Simulation

Use this workflow to run the two-user flow in the custom `Knook Dev` iOS development build. Do not use Expo Go for this test.

## Test Users

User A:

```text
Phone: +12025550100
OTP: 123456
Name: Alex
```

User B:

```text
Phone: +12025550101
OTP: 123456
Name: Jordan
```

## 1. Reset The Two Users

```bash
cd /Users/Amoux/Documents/Knook
Backend/preview-api/.venv/bin/python Scripts/two_user_reset_seed.py --reset --seed
```

## 2. Start MongoDB

```bash
brew services start mongodb/brew/mongodb-community
mongosh --eval 'db.runCommand({ ping: 1 })'
```

## 3. Start FastAPI

For the current Firebase Auth foundation branch, run the preview API in Firebase mode:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
AUTH_MODE=firebase \
FIREBASE_PROJECT_ID=knook-e2c74 \
GOOGLE_APPLICATION_CREDENTIALS=/Users/Amoux/.config/knook/firebase/knook-development-admin.json \
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

For the older preview-JWT fallback, use:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
AUTH_MODE=preview \
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/api/
```

## 4. Build And Install Knook Dev On Simulator A

```bash
cd /Users/Amoux/Documents/Knook/Mobile
source ~/.zshrc
nvm use 20
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo run:ios
```

The app installed on the simulator should be named `Knook Dev`.

## 5. Start Metro For The Development Client

```bash
cd /Users/Amoux/Documents/Knook/Mobile
source ~/.zshrc
nvm use 20
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo start --dev-client --clear
```

## 6. Boot Two Simulators

List devices:

```bash
xcrun simctl list devices available | grep -E "iPhone|Booted|Shutdown"
```

Example devices used during earlier testing:

```bash
export SIM_A=217D885E-6AB6-4A81-9E07-7B0287C30A5F
export SIM_B=D2577302-5C56-4604-AB19-639EED8919CE
```

Boot both:

```bash
xcrun simctl boot "$SIM_A" || true
xcrun simctl boot "$SIM_B" || true
open -a Simulator
```

## 7. Install The Same Compiled App On Simulator B

After `expo run:ios` builds Simulator A, find the generated `.app` under Xcode DerivedData or rerun the build targeting the booted second simulator if needed.

Practical manual path:

1. Keep Metro running.
2. In Simulator, switch to Simulator B.
3. Run `APP_VARIANT=development AUTH_PROVIDER=firebase npx expo run:ios` again if the app is not installed on B.
4. Confirm `Knook Dev` appears on both simulator home screens.

If a direct `.app` path is available:

```bash
xcrun simctl install "$SIM_B" /path/to/Knook.app
```

## 8. Launch On Both Devices

```bash
xcrun simctl launch "$SIM_A" com.teamknook.knook.dev
xcrun simctl launch "$SIM_B" com.teamknook.knook.dev
```

Both instances should connect to the shared Metro server and the same FastAPI preview API.

## 9. Manual Flow

Run the two-user test in `Docs/TWO_USER_TEST_PLAN.md`:

1. Alex signs in on Simulator A.
2. Jordan signs in on Simulator B.
3. Alex adds Jordan.
4. Jordan adds Alex.
5. Both Crushes screens remain private before reveal.
6. Chats remain hidden before reveal.
7. Trigger demo reveal.
8. Chat anonymously.
9. Test one-sided reveal.
10. Test mutual reveal.
11. Test unhook.

## 10. Stop Services

Stop Metro and FastAPI with `Ctrl+C`.

MongoDB may remain running, or stop it:

```bash
brew services stop mongodb/brew/mongodb-community
```
