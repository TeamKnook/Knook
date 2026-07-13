# Setup

This guide covers the local development environment for Knook.

## Required Tools

Install and verify:

- Xcode
- Xcode Command Line Tools
- Node.js and npm
- Homebrew
- Watchman
- Git
- CocoaPods
- Java JDK
- Android Studio or Android command-line tools
- Android SDK
- VS Code

## Recommended macOS Install Commands

After Homebrew permissions are healthy:

```bash
brew install node watchman cocoapods openjdk android-commandlinetools
```

## Verify Tools

```bash
node -v
npm -v
brew --version
watchman --version
git --version
pod --version
xcodebuild -version
java -version
adb version
sdkmanager --version
```

## Android Environment

Recommended shell configuration:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

## Firebase

Install Firebase CLI when backend work begins:

```bash
npm install -g firebase-tools
firebase login
```

Project aliases should be configured before connecting local code to Firebase environments.

For Firebase Phone Auth development, complete the human Console setup in:

- `Docs/Firebase/FIREBASE_CONSOLE_SETUP.md`
- `Docs/Firebase/FIREBASE_ADMIN_LOCAL_SETUP.md`
- `Docs/Firestore/FIRESTORE_CONSOLE_SETUP.md`

Local development files expected after Console setup:

```text
Mobile/firebase/development/GoogleService-Info.plist
Mobile/firebase/development/google-services.json
```

These files are ignored by git. Do not commit service-account credentials.

The temporary preview API can run in either auth mode:

```env
AUTH_MODE=preview
AUTH_MODE=firebase
```

Firebase mode also requires:

```env
FIREBASE_PROJECT_ID=knook-e2c74
GOOGLE_APPLICATION_CREDENTIALS=/Users/Amoux/.config/knook/firebase/knook-development-admin.json
```

Keep the service-account JSON outside the repository.

## Expo Development Build

Knook uses a custom Expo Development Build for local native development.

Build the iOS development app:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
source ~/.zshrc
nvm use 20
APP_VARIANT=development npx expo run:ios
```

For Firebase Phone Auth builds:

```bash
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo prebuild --clean
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo run:ios
APP_VARIANT=development AUTH_PROVIDER=firebase npx expo start --dev-client --clear
```

Firebase Phone Auth was validated locally with the Knook Dev iOS simulator build and Firebase Console fictional numbers:

- Alex: `+12025550100`
- Jordan: `+12025550101`

Start Metro for the development client:

```bash
APP_VARIANT=development npx expo start --dev-client --clear
```

The development app identity is:

- Display name: `Knook Dev`
- iOS bundle identifier: `com.teamknook.knook.dev`
- URL scheme: `knook-dev`

Expo Go can still be useful for quick JavaScript experiments, but it is not the primary Knook runtime.

## Environment Variables

Copy `.env.example` to the app-specific environment file once the mobile app is initialized. Never commit real secrets.

Use `AUTH_PROVIDER=preview` to keep the old preview JWT path. Use `AUTH_PROVIDER=firebase` only after Firebase config files are present and the native app has been rebuilt.

Firestore profile development supports:

```env
FIRESTORE_TARGET=development
FIRESTORE_TARGET=emulator
```

Emulator mode is development-only. See `Docs/Firestore/FIRESTORE_EMULATOR_SETUP.md`.

## VS Code Extensions

Recommended extensions:

- React Native Tools
- ESLint
- Prettier
- GitHub Actions
- GitHub Pull Requests
- Firebase tooling
- TypeScript support
