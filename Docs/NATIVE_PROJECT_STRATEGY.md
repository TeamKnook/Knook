# Native Project Strategy

Knook uses Expo Continuous Native Generation for the current native development-build milestone.

## Decision

`Mobile/ios` and `Mobile/android` are generated native projects and are not committed at this stage.

## Why

- The current app has no hand-authored native changes.
- Native configuration can be represented through `Mobile/app.config.js`.
- Avoiding committed generated projects keeps the preview branch small while the product is still stabilizing.
- Expo tooling can regenerate native projects for local iOS and Android builds.

## Regeneration

From `Mobile/`:

```bash
APP_VARIANT=development npx expo prebuild --clean
```

For the normal local iOS workflow, `expo run:ios` can generate the native project as needed:

```bash
APP_VARIANT=development npx expo run:ios
```

## Warning

Manual edits inside generated `ios/` or `android/` files may be overwritten by Expo prebuild. Prefer config plugins, `app.config.js`, and package configuration as the source of truth.

## Criteria For Committing Native Projects Later

Commit generated native projects only if:

- Knook needs hand-authored native code that cannot be represented through Expo config or plugins.
- CI requires stable generated native project diffs.
- A native dependency requires manual Xcode or Gradle changes.
- Release engineering decides to own native project files explicitly.
