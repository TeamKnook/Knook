# Crash Report

## Investigation Date

June 30, 2026

## Scope

This report covers the first local simulator stabilization pass after integrating the Emergent-generated app into the Knook workspace. The app currently runs through Expo Go / Metro against the temporary FastAPI preview API and MongoDB.

## Environment

- Branch: `integration/emergent-base`
- Mobile runtime: Expo SDK 54 / React Native 0.81
- Local backend: `Backend/preview-api` on `http://127.0.0.1:8000`
- Temporary database: local MongoDB
- Simulator observed: iPhone 17 Pro, iOS 26.5

## Crash 1: Phone Step Shows `Network request failed`

### Exact Screen

`Mobile/app/(auth)/phone.tsx`

### Exact User Action

1. Launch the app in iOS Simulator.
2. Enter a test phone number on the "What's your number?" screen.
3. Tap "Send code".

### Expected Result

The app should call `POST /api/auth/request-otp`, create a preview verification, and navigate to the OTP screen.

### Actual Result

The phone input displays `Network request failed`.

### Captured Evidence

- Simulator UI showed the error under the phone number field.
- `curl http://127.0.0.1:8000/api/` failed while the backend process was not running.
- When the preview API was started from `Backend/preview-api`, the same endpoint returned `{"service":"knook","status":"ok"}`.
- Recent readable simulator logs did not show a native iOS crash report.
- Mobile `yarn typecheck` and `yarn lint` passed.

### Classification

Missing environment/configuration and API/backend availability issue.

### Root Cause

The mobile app was loaded with a backend URL that was unreachable for the active test mode, or the preview API was not running on port `8000`. This is not a native crash and not a product logic rejection.

For simulator testing, `Mobile/.env` should use:

```env
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

For physical phone testing, it should use the Mac's LAN IP instead.

### Fix Applied

No source-code fix was required. The operational fix is:

1. Start MongoDB.
2. Start `Backend/preview-api`.
3. Use `http://127.0.0.1:8000` for iOS Simulator.
4. Restart Metro after changing `Mobile/.env`.

### Files Changed

None for this crash.

### Validation Performed

- `curl http://127.0.0.1:8000/api/` returned healthy after starting the API.
- Direct endpoint flow passed:
  - `POST /api/auth/request-otp` returned a verification ID and demo code.
  - invalid OTP returned `400`.
  - configured demo OTP returned `200`.
  - `GET /api/users/me` returned the created preview user.
  - `PUT /api/users/me` updated onboarding profile data.
- Backend regression tests passed: `15 passed, 1 warning`.
- Mobile validation passed:
  - `yarn typecheck`
  - `yarn lint`
  - `npx expo config --type public`

## Simulator Tooling Limitation

`xcrun simctl` failed from the Codex sandbox with CoreSimulatorService connection errors and could not write to `CoreSimulator.com.apple.CoreSimulator.simctl.log`. The Simulator UI was usable by the user, but full native log automation from Codex was limited.

## Remaining Unresolved Crashes

No reproducible native iOS crash or React Native JavaScript exception was captured in this pass.

If another crash appears, record:

- screen name
- exact tap/input sequence
- Metro red-screen text
- preview API terminal output
- whether the app fully exits or only shows an inline error
