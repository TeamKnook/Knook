# Development Build Migration

Knook is moving from Expo Go to a custom Expo Development Build for local native development.

## Previous Workflow

The app previously ran inside Expo Go:

```bash
cd Mobile
npx expo start --clear
```

That was enough for the temporary preview app, but Expo Go cannot represent the final native runtime once Knook adds native modules and app-specific identifiers.

## New Workflow

Knook now uses a custom development client:

```bash
cd Mobile
source ~/.zshrc
nvm use 20
APP_VARIANT=development npx expo run:ios
APP_VARIANT=development npx expo start --dev-client --clear
```

The installed app should be `Knook Dev`, not Expo Go.

## App Identifiers

Development:

- Display name: `Knook Dev`
- iOS bundle identifier: `com.teamknook.knook.dev`
- Android package: `com.teamknook.knook.dev`
- URL scheme: `knook-dev`

Reserved production values:

- Display name: `Knook`
- iOS bundle identifier: `com.teamknook.knook`
- Android package: `com.teamknook.knook`
- URL scheme: `knook`

Production services and credentials are not connected by this migration.

## Native Project Strategy

See `Docs/NATIVE_PROJECT_STRATEGY.md`.

Knook uses Expo Continuous Native Generation. Generated `Mobile/ios` and `Mobile/android` directories are local build artifacts for now and should not be committed unless native ownership changes.

## Environment Behavior

For local iOS Simulator testing:

```env
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
EXPO_PUBLIC_DEMO_MODE=true
```

Development-only controls require both:

- `APP_VARIANT=development`
- `EXPO_PUBLIC_DEMO_MODE=true`

This gates mock contacts, demo OTP helper text, the manual reveal trigger, and verbose diagnostics.

## When A Native Rebuild Is Required

Rebuild `Knook Dev` after:

- adding, removing, or changing native packages
- changing `app.config.js` native fields such as bundle identifier, scheme, permissions, plugins, icon, or splash
- changing iOS/Android native configuration

JavaScript-only edits usually need only Metro reload.

## Troubleshooting

- If the app opens in Expo Go, restart Metro with `--dev-client`.
- If the app cannot reach the backend, verify `curl http://127.0.0.1:8000/api/`.
- If Metro cannot connect, clear cache with `APP_VARIANT=development npx expo start --dev-client --clear`.
- If native build fails after package changes, regenerate locally with `APP_VARIANT=development npx expo prebuild --clean`.
- If Watchman behaves oddly, run `watchman watch-del-all`.

## Remaining Work

- Add preview and production variants when credentials exist.
- Add native Firebase, Branch.io, notifications, and RevenueCat only in later milestones.
- Compile and verify Android after iOS is stable.

## Verification

Verified on July 6, 2026:

- `Knook Dev` compiled and installed in the iOS Simulator.
- `Knook Dev` opened independently from Expo Go.
- `Knook Dev` was installed on both iPhone 17 Pro and iPhone 17 Pro Max simulators.
- Both simulators connected to one Metro dev-client server.
- Both simulators used the local FastAPI preview API and MongoDB.
- The two-user flow passed in the custom development build: sign-in, private crush, hidden reciprocal match before reveal, demo reveal, anonymous chat, one-sided reveal, mutual reveal, and unhook.
- Sign-out and re-login were verified after the polling/session fix.
