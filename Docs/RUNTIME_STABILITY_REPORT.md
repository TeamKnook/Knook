# Runtime Stability Report

## Investigation Date

June 30 - July 1, 2026

## Branch

`fix/runtime-crashes`

## Scope

Focused runtime crash and usability investigation for the current Expo preview app. This pass does not migrate to Firebase, redesign screens, add product features, or replace the temporary preview API.

## Issue 1: Add Crush Can Become Unusable When Contact Data Is Unexpected

### Type

React Native exception risk / navigation failure risk.

### Reproduction Steps

Manual testing reported that tapping Add Crush could crash or make the app unusable. Code inspection found that `Mobile/app/add-crush.tsx` trusted every contact object to contain valid string `id`, `name`, and `phone` fields.

### Log/Error

No native crash log was captured by Codex. The risk path was confirmed in code:

- `c.name.toLowerCase()` would throw if `name` was missing or not a string.
- `c.phone.replace(...)` would throw if `phone` was missing or not a string.
- `keyExtractor={(c) => c.id}` could produce invalid keys if `id` was absent.

### Root Cause

The Add Crush screen assumed perfect contact data. That is tolerable for the fixed mock list but unsafe once the app moves between mock contacts, optional native contacts, permission fallbacks, or malformed preview data.

### Files Changed

- `Mobile/src/services/contacts/contactsService.ts`
- `Mobile/app/add-crush.tsx`
- `Mobile/scripts/runtime-stability-tests.js`
- `Mobile/package.json`

### Fix

- Added `sanitizeContactsForPreview(input)` to validate contact arrays.
- Dropped malformed/null contact entries.
- Generated fallback IDs when missing.
- Defaulted missing names to `Unknown`.
- Preserved only contacts with usable phone numbers.
- Added dev-only contact count/schema logging.
- Added runtime test coverage for null, empty, duplicate, missing-name, and malformed contact records.

### Validation

- `yarn test:runtime` passed.
- `yarn typecheck` passed.
- `yarn lint` passed.

### Remaining Limitations

The app still uses mock contacts for preview. Real contact permissions and native contact loading require a later Expo Development Build pass.

## Issue 2: Add Crush Async State Updates After Navigation

### Type

React Native warning/freezing risk.

### Reproduction Steps

Open Add Crush, trigger contact load or add crush, then quickly leave the screen before the async operation completes.

### Log/Error

No explicit Metro warning was captured, but the previous implementation scheduled `setTimeout(() => setToast(null))` and async state updates without checking whether the screen was still mounted.

### Root Cause

The Add Crush screen could update state after unmount during contact loading, crush submission, or toast timeout cleanup.

### Files Changed

- `Mobile/app/add-crush.tsx`

### Fix

- Added mounted-state guard.
- Cleared toast timer on unmount.
- Avoided `setAdding`, `setContacts`, `setAdded`, and `setToast` after unmount.
- Added dev-only entry/exit, list-render, selection, and submit-failure logging.

### Validation

- `yarn typecheck` passed.
- `yarn lint` passed.

### Remaining Limitations

Needs manual simulator verification by the tester because Codex cannot reliably automate iOS Simulator gestures in this environment.

## Issue 3: Scrolling Can Be Constrained On List Screens

### Type

Broken scrolling/layout.

### Reproduction Steps

Manual testing reported limited or broken scrolling on some screens. Code audit found several `FlatList` and `ScrollView` containers without explicit flex growth in screen layouts with headers, footers, or keyboard avoidance.

### Log/Error

No native log is expected for this class of issue. The layout risk was confirmed by code inspection.

### Root Cause

Some list screens relied on implicit sizing inside a parent `ScreenContainer`. On smaller simulator sizes, content could be constrained by headers, footers, tab bars, or keyboard avoidance.

### Files Changed

- `Mobile/app/add-crush.tsx`
- `Mobile/app/(tabs)/crushes.tsx`
- `Mobile/app/(tabs)/chats.tsx`
- `Mobile/app/(onboarding)/profile.tsx`

### Fix

- Added `style={{ flex: 1 }}` equivalents to list/scroll containers.
- Added `flexGrow: 1` to list content containers.
- Added `keyboardShouldPersistTaps="handled"` where keyboard interactions can block taps.
- Preserved visible content instead of hiding rows.

### Validation

- `yarn typecheck` passed.
- `yarn lint` passed.
- Manual simulator verification still required.

## Issue 4: Runtime Errors Were Hidden From Diagnostics

### Type

Diagnostics gap.

### Reproduction Steps

The root layout previously called `LogBox.ignoreAllLogs(true)`, which suppresses useful development warnings/errors while investigating runtime instability.

### Log/Error

Metro diagnostics were unnecessarily hidden.

### Root Cause

The preview app suppressed all LogBox output.

### Files Changed

- `Mobile/app/_layout.tsx`
- `Mobile/src/components/ErrorBoundary.tsx`
- `Mobile/src/utils/diagnostics.ts`
- `Mobile/src/services/api.ts`

### Fix

- Removed blanket LogBox suppression.
- Added a React Error Boundary around the root navigator.
- Added redacted API request/response/failure logging.
- Kept diagnostics out of normal production-like UI.

### Validation

- `yarn typecheck` passed.
- `yarn lint` passed.

## Issue 5: Codex Metro Start Hit Watchman/EMFILE Limitation

### Type

Tooling limitation, not confirmed app crash.

### Reproduction Steps

Codex attempted:

```bash
npx expo start --clear
```

### Log/Error

```text
EMFILE: too many open files, watch
```

A Watchman reset from Codex also reported:

```text
fchmod(/Users/Amoux/.local/state/watchman/Amoux-state, 2700): Operation not permitted
```

### Root Cause

Codex could not write Watchman state under the user's home directory from the sandbox. The user's normal Terminal previously showed Watchman working, so manual Metro startup should be performed from the user's shell.

### Files Changed

None.

### Fix

No project fix applied. Use the normal user Terminal for Metro:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
source ~/.zshrc
nvm use
watchman watch-del-all || true
npx expo start --clear
```

### Validation

Not validated by Codex due sandbox limitation.

## Issue 6: Add Crush Route Refresh/Stuck Behavior

### Type

Navigation failure / UI freeze.

### Reproduction Steps

1. Launch the app.
2. Reach the Crushes home screen.
3. Tap Add Crush.

### Log/Error

Manual testing reported that Add Crush glitched, appeared to refresh the tab, disabled interactions, and prevented back navigation.

### Root Cause

Code audit found two likely contributors:

- A global `ErrorUtils` runtime hook installed from the root layout could chain onto itself across reloads and Fast Refresh, which can amplify runtime errors into repeated refresh-like behavior.
- Add Crush relied on stack back state and declared per-screen stack presentation from inside the screen. That was unnecessary for the current root stack and made recovery weaker if the route opened in an unexpected state.

The preview app already uses dummy contacts, so missing native contact permission was not the primary cause.

### Files Changed

- `Mobile/app/_layout.tsx`
- `Mobile/app/add-crush.tsx`
- `Mobile/src/services/contacts/contactsService.ts`
- `Mobile/scripts/runtime-stability-tests.js`

### Fix

- Removed global `ErrorUtils` hook.
- Kept the safer React Error Boundary and explicit screen/API diagnostics.
- Removed Add Crush's per-screen `Stack.Screen` option.
- Changed Add Crush Done action to `router.replace('/(tabs)/crushes')` so it always recovers to a known-good route.
- Added US-format dummy contacts to improve simulator testing with fake local numbers.

### Validation

- `yarn typecheck` passed.
- `yarn lint` passed.
- `yarn test:runtime` passed.
- Manual simulator verification passed on July 1, 2026:
  - Add Crush opens without route refresh/glitch behavior.
  - Dummy contact list renders.
  - Adding demo contacts returns to the Crushes list as pending crushes.
  - Back/tab navigation remains usable.

## Issue 7: API Failures Could Leave Screens In Unhandled States

### Type

Backend connectivity error / UI freeze risk.

### Reproduction Steps

1. Navigate to Crushes, Chats, Chat, or Reveal while the preview API is unavailable or returns an error.
2. Wait for polling or tap an action such as Trigger Reveal, Send, Unhook, or Reveal.

### Log/Error

Several hooks and button handlers awaited API calls without local `catch` handling. In development, these can surface as unhandled promise rejections, noisy refresh behavior, or stuck loading/action states.

### Root Cause

The preview app was optimistic about backend availability. Polling hooks used `try/finally` but no `catch`, and some screen actions used `try/finally` without handling the thrown error.

### Files Changed

- `Mobile/src/hooks/useCrushes.ts`
- `Mobile/src/hooks/useMatches.ts`
- `Mobile/src/hooks/useMessages.ts`
- `Mobile/app/(tabs)/crushes.tsx`
- `Mobile/app/(tabs)/chats.tsx`
- `Mobile/app/chat/[matchId].tsx`
- `Mobile/app/reveal/[matchId].tsx`

### Fix

- Added contained error state to polling hooks.
- Added diagnostic logging for refresh failures.
- Added local error handling for chat send, unhook, dev reveal, and reveal submit.
- Added small inline recoverable error text where a screen otherwise had no way to indicate failure.

### Validation

- `yarn typecheck` passed.
- `yarn lint` passed.
- Manual simulator verification still required.

## Automated Validation

Passed:

- `cd Mobile && yarn typecheck`
- `cd Mobile && yarn lint`
- `cd Mobile && yarn test:runtime`
- `cd Mobile && npx expo config --type public`
- `cd Backend/preview-api && python3 -m py_compile server.py tests/test_knook_backend.py`
- `cd Backend/preview-api && TEST_BACKEND_URL=http://127.0.0.1:8000 .venv/bin/python -m pytest -q`
- `cd Backend/functions && npm run build`

Backend tests passed: `15 passed, 1 warning`.

July 1 note: backend tests were not rerun from Codex after the final Add Crush patch because `127.0.0.1:8000` was not reachable from this sandbox session, but the mobile app was manually verified against the user's running local services.

## Manual Verification Checklist

The human tester ran the app in iOS Simulator and verified the critical Add Crush path after the July 1 patch:

- Crushes home loads.
- Add Crush opens without crashing or repeatedly remounting.
- Preview contacts render.
- Demo contacts can be added.
- Crushes list updates with pending crushes.
- Tabs remain responsive.

The remaining broader checklist should be repeated before release-level acceptance:

1. Splash loads.
2. Phone screen loads.
3. Demo OTP succeeds with `123456`.
4. Onboarding screens scroll completely.
5. Home screen scrolls where required.
6. Add Crush opens without crashing.
7. Contact list renders.
8. Contact list scrolls.
9. A contact can be tapped.
10. Submit/Add Crush completes or returns a clear recoverable error.
11. Back navigation works.
12. Chat list opens.
13. Profile opens and scrolls.
14. No red screen, app termination, frozen UI, or unhandled error occurs.

## Remaining Limitations

- Codex did not manually validate simulator gestures.
- Real contact permission flow is still deferred.
- No confirmed native iOS crash was captured in this pass.
- The preview app still depends on the temporary FastAPI/MongoDB backend.
