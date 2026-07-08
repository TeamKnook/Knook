# Firebase Console Setup

This setup must be completed by a human in the Firebase Console. Do not invent project IDs, API keys, app IDs, sender IDs, buckets, or service-account credentials in source code.

## 1. Create Development Project

1. Open the Firebase Console.
2. Create a project named something like `knook-development`.
3. Disable or defer Analytics unless the team explicitly wants it for development.
4. Record the Firebase project ID in local setup notes, not in source code unless using an example placeholder.

## 2. Register iOS Development App

1. Add an iOS app.
2. Bundle ID: `com.teamknook.knook.dev`.
3. App nickname: `Knook Dev`.
4. Download `GoogleService-Info.plist`.
5. Place it locally at:

```text
Mobile/firebase/development/GoogleService-Info.plist
```

Do not commit the real file.

## 3. Register Android Development App

1. Add an Android app.
2. Package name: `com.teamknook.knook.dev`.
3. App nickname: `Knook Dev`.
4. Download `google-services.json`.
5. Place it locally at:

```text
Mobile/firebase/development/google-services.json
```

Do not commit the real file.

## 4. Enable Firebase Authentication

1. Open Build > Authentication.
2. Click Get Started if needed.
3. Enable the Phone provider.
4. Configure allowed SMS regions for development.
5. Avoid real SMS sends for routine simulator development.

## 5. Add Fictional Test Numbers

Add Firebase Console fictional phone numbers for simulator testing:

| User | Phone |
| --- | --- |
| Alex | `+15555550100` |
| Jordan | `+15555550101` |

Configure six-digit test codes in the Firebase Console. Do not commit those codes to the repository.

## 6. iOS URL Scheme Requirements

Firebase iOS phone auth may require URL scheme support from the iOS Firebase config. Expo prebuild and the React Native Firebase config plugin should apply the required settings from `GoogleService-Info.plist`.

If native verification later requires APNs:

- Configure APNs auth key or certificates in Firebase Console.
- Test on a real device.
- Document the APNs key owner and rotation process outside the repository.

## 7. Android Fingerprints

When Android development build testing begins:

1. Generate or locate the debug keystore fingerprint.
2. Add SHA-1 and SHA-256 fingerprints to the Android Firebase app.
3. Download an updated `google-services.json`.
4. Rebuild the Android development app.

## Current Blocker Status

Until the Firebase project and local config files are supplied, native Firebase Phone Auth can be scaffolded but a Firebase-backed native build cannot be fully verified.
