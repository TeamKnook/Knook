# Firebase Phone Auth Resolution Log

Date: 2026-07-08
Branch: `feat/firebase-foundation-auth`

## Summary

Knook Dev now builds, launches, and signs in through Firebase Phone Authentication on two iOS Simulators.

This log records the two blockers found during setup:

1. Firebase rejected the original `+155555501xx` test numbers because of SMS region policy handling.
2. Some simulator installs failed OTP confirmation with a Firebase keychain error until Keychain Sharing was generated into the native app and the app was rebuilt onto fresh simulator state.

Current validated development test numbers:

- Alex: `+12025550100`, Firebase Console test code `123456`
- Jordan: `+12025550101`, Firebase Console test code `123456`

The test code is documented here for local development setup only. It must not be embedded in production-facing application logic.

## Original Send-Code Error

The original visible app error was:

```text
[auth/operation-not-allowed] This operation is not allowed. You must enable this service in the console.
```

This happened before the app reached the FastAPI preview backend, so the initial blocker was in Firebase Phone Auth configuration, not MongoDB or the preview API.

## 2026-07-08 Diagnostic Update

A direct Identity Toolkit REST call using the iOS Firebase API key returned:

```text
OPERATION_NOT_ALLOWED : SMS unable to be sent until this region enabled by the app developer.
```

This proved the Firebase request reaches the correct project, but the SMS region policy rejects the original `+1 555 555 01xx` test-number range before authentication can continue. The development test identities were moved to a clearer US-region fictional range:

- Alex: `+12025550100`
- Jordan: `+12025550101`

The matching Firebase Console test numbers must be updated to these values with test code `123456`.

## Confirmed Working After Fix

- Knook Dev native iOS development build compiles.
- Knook Dev launches outside Expo Go.
- Firebase native app initializes once.
- The installed app uses Firebase project `knook-e2c74`.
- The installed app uses bundle identifier `com.teamknook.knook.dev`.
- The generated iOS app includes URL schemes:
  - `knook-dev`
  - `com.teamknook.knook.dev`
  - `app-1-725580819857-ios-6c0aa87399b8a2401f3e30`
- Firebase Console project ID matches the app config: `knook-e2c74`.
- Phone provider was enabled in Firebase Authentication.
- Firebase test phone numbers were added:
  - `+12025550100` with test code `123456`
  - `+12025550101` with test code `123456`
- SMS region policy was updated to allow United States for `+1` test numbers.
- Development-only Firebase test verification mode was added in the mobile auth provider.
- Firebase Phone Auth send-code succeeds for both development test numbers.
- Firebase OTP confirmation succeeds on two clean simulator installs.
- FastAPI verifies Firebase ID tokens through the Firebase Admin SDK.
- Existing seeded local preview users are resolved by verified Firebase phone-number claim.
- The full two-user flow was manually revalidated on Knook Dev with Firebase Auth:
  - Alex and Jordan sign in independently.
  - Reciprocal crush remains hidden before reveal.
  - Demo reveal activates Mystery Match.
  - Anonymous chat works.
  - One-sided reveal stays private.
  - Mutual reveal unlocks identity.
  - Unhook removes access for both users.

## Confirmed Not The Cause

- Not the temporary FastAPI preview API.
- Not MongoDB.
- Not Expo Go.
- Not a project ID mismatch between the local plist and Firebase Console.
- Not missing iOS bundle identifier in the local Firebase plist.

## Current Open Items

- Physical iPhone testing is not complete. It will require Apple signing, device trust/provisioning, same-network backend access, and likely APNs configuration for production-grade phone verification.
- Android Firebase Phone Auth is not yet validated. Android will need SHA-1/SHA-256 fingerprints in Firebase Console before testing.
- Auth Emulator support remains optional and is not required for the current development test-number path.

## 2026-07-10 Diagnostic Update

The original send-code blocker was resolved for the new Firebase Console test numbers:

- Alex: `+12025550100`
- Jordan: `+12025550101`

Firebase sends/accepts the test-number verification session. During follow-up testing, OTP confirmation failed on some simulator states:

```text
[auth/keychain-error] An error occurred when accessing the keychain.
```

This happens at:

```text
confirmation.confirm(code)
```

in `Mobile/src/services/auth/firebaseAuthProvider.ts`.

### Entitlement Findings And Fix

The generated Expo/iOS configuration now includes Keychain Sharing:

```text
Mobile/ios/KnookDev/KnookDev.entitlements
```

with:

```xml
<key>keychain-access-groups</key>
<array>
  <string>$(AppIdentifierPrefix)com.teamknook.knook.dev</string>
</array>
```

The generated Xcode project points both Debug and Release builds at that file:

```text
CODE_SIGN_ENTITLEMENTS = KnookDev/KnookDev.entitlements;
```

The generated simulator entitlement blob after a successful rebuild included:

```text
application-identifier = J6DG33PYP9.com.teamknook.knook.dev
keychain-access-groups = [J6DG33PYP9.com.teamknook.knook.dev]
```

After the clean rebuild and fresh simulator install, Firebase OTP confirmation succeeded for both Alex and Jordan.

### Local Build Environment Findings

During diagnosis, CocoaPods regenerated successfully, but Xcode/CoreSimulator became unhealthy:

```text
CoreSimulatorService connection became invalid
simdiskimaged crashed or is not responding
Unable to locate device set
```

`xcrun simctl list devices available` fails with CoreSimulator connection errors. `xcodebuild` can list the generated `.xcodeproj`, but fails to use the `.xcworkspace` while CoreSimulator is broken:

```text
xcodebuild: error: '.../KnookDev.xcworkspace' is not a workspace file.
```

That was a local simulator-service issue. Restarting macOS, cleaning DerivedData, rebuilding Knook Dev, and reinstalling onto clean simulator state resolved the local blocker.

## Recommended Resume Path If This Regresses

1. Confirm Firebase Console still has Phone provider enabled.
2. Confirm Firebase Console test numbers remain `+12025550100` and `+12025550101`.
3. Confirm SMS region policy allows United States.
4. Confirm Metro prints `firebase-auth-test-verification-enabled` before sending a code.
5. Confirm `Mobile/app.config.js` still generates `keychain-access-groups`.
6. Rebuild Knook Dev after native auth/config changes.
7. Install onto freshly erased or newly created simulators before retesting keychain failures.
8. Start FastAPI with `AUTH_MODE=firebase`, `FIREBASE_PROJECT_ID=knook-e2c74`, and local `GOOGLE_APPLICATION_CREDENTIALS`.

## Demo Fallback

For the team demo, use the last known-good local demo baseline:

```text
integration/emergent-base at b9d73f7
```

That baseline includes:

- Knook Dev custom iOS development build
- two-simulator local flow
- preview JWT auth
- mock contacts
- hidden pre-reveal mutual matches
- daily reveal trigger
- anonymous chat
- identity reveal
- unhook
- native edge-case fixes

The preview JWT demo baseline remains useful for demos, but Firebase Phone Auth is now validated on `feat/firebase-foundation-auth` for local two-simulator development.
