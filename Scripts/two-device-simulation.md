# Knook Two-Device Local Simulation

This workflow runs two isolated iOS Simulator devices against one local preview API and one Metro server.

## Test Identities

| Alias | Phone | OTP | Name |
| --- | --- | --- | --- |
| USER_A | +12025550100 | 123456 | Alex |
| USER_B | +12025550101 | 123456 | Jordan |

These identities are local preview fixtures only. They must not be hardcoded into production app behavior.

## 1. Reset And Seed Local Data

From the repository root:

```bash
cd /Users/Amoux/Documents/Knook
Backend/preview-api/.venv/bin/python Scripts/two_user_reset_seed.py --reset --seed
```

Dry run:

```bash
Backend/preview-api/.venv/bin/python Scripts/two_user_reset_seed.py --reset --seed --dry-run
```

The script refuses to run unless `Backend/preview-api/.env` has `DEMO_MODE=true`.

## 2. Start Shared Local Services

Terminal 1:

```bash
brew services start mongodb/brew/mongodb-community
mongosh --eval 'db.runCommand({ ping: 1 })'
```

Terminal 2:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/api/
```

Terminal 3:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
nvm use
npx expo start --clear
```

`Mobile/.env` should point to the local backend:

```env
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
EXPO_PUBLIC_DEMO_MODE=true
```

## 3. Select Two iOS Simulator Devices

Run this in your normal Terminal, not from the sandboxed Codex shell if it cannot access CoreSimulator:

```bash
xcrun simctl list devices available | grep -E "iPhone|Booted|Shutdown"
```

Pick two different device UDIDs, for example:

```text
SIM_A=<first iPhone UDID>
SIM_B=<second iPhone UDID>
```

Boot both:

```bash
xcrun simctl boot "$SIM_A" || true
xcrun simctl boot "$SIM_B" || true
open -a Simulator
```

Each simulator device has separate app storage, so USER_A and USER_B sessions remain isolated.

## 4. Open The App On Both Simulators

Once Metro shows the `exp://...:8081` URL, open the same bundle on each simulator:

```bash
xcrun simctl openurl "$SIM_A" exp://127.0.0.1:8081
xcrun simctl openurl "$SIM_B" exp://127.0.0.1:8081
```

If Expo Go is not installed on one simulator, open that simulator, install/open Expo Go through the Expo prompt, then run the `openurl` command again.

Manual fallback:

1. Keep both simulator windows visible.
2. Press `i` in Metro to open the app on one booted simulator.
3. Use the Simulator app's device menu to switch to the second device.
4. Open Expo Go and enter the Metro URL manually if needed.

## 5. Sign In

Simulator A:

```text
phone: +12025550100
otp: 123456
profile name: Alex
```

Simulator B:

```text
phone: +12025550101
otp: 123456
profile name: Jordan
```

## 6. Useful Logs

Preview API logs use these prefixes during the two-user test:

```text
[USER_A]
[USER_B]
[MATCH]
[CHAT]
[REVEAL]
[UNHOOK]
```

The logs intentionally avoid tokens, OTPs, full raw phone numbers, and message bodies.

## 7. Stop Services

Stop Metro and FastAPI with `Ctrl+C` in their terminals.

MongoDB can stay running for development, or stop it with:

```bash
brew services stop mongodb/brew/mongodb-community
```
