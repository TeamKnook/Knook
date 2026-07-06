# Android Development Build Readiness

This milestone prioritizes the iOS development build. Android is prepared at the Expo config level but does not block the iOS milestone.

## App Identifiers

Development package:

```text
com.teamknook.knook.dev
```

Reserved production package:

```text
com.teamknook.knook
```

These are controlled by `APP_VARIANT` in `Mobile/app.config.js`.

## Prerequisites

- Android Studio
- Android SDK Platform Tools
- Android SDK command-line tools
- At least one Android Emulator image
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` configured

Recommended shell configuration:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

## Expected Command

From `Mobile/`:

```bash
source ~/.zshrc
nvm use 20
APP_VARIANT=development npx expo run:android
```

Start Metro for the dev client:

```bash
APP_VARIANT=development npx expo start --dev-client --clear
```

## Current Notes

- No Android-specific native code has been authored.
- The temporary preview API should remain reachable from Android Emulator through `http://10.0.2.2:8000` if `127.0.0.1` does not resolve to the host machine.
- Mock contacts are development-gated and remain useful until real contact permissions are tested in a native build.

## Potential Follow-Up Work

- Add Android contact permissions when real contacts are enabled.
- Verify adaptive icon and splash appearance on emulator.
- Confirm Android back navigation on chat/reveal/unhook flows.
- Run the same two-user simulation with Android plus iOS or two Android emulators.
