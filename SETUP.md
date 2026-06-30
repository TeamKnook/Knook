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

## Environment Variables

Copy `.env.example` to the app-specific environment file once the mobile app is initialized. Never commit real secrets.

## VS Code Extensions

Recommended extensions:

- React Native Tools
- ESLint
- Prettier
- GitHub Actions
- GitHub Pull Requests
- Firebase tooling
- TypeScript support

