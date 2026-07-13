# Runtime Crash Stabilization Progress

## Stop Point

Resumed on July 1, 2026 after manual testing found Add Crush still glitching/stuck. Fixes were added, and manual simulator verification confirmed Add Crush now opens, renders dummy contacts, adds crushes, and returns to a stable Crushes screen.

## Branch

Current branch:

```bash
fix/runtime-crashes
```

Base branch:

```bash
integration/emergent-base
```

Do not merge into `main`.

## Current Git State

Baseline commits already present:

```text
c6f6527 docs: add product context and stabilization reports
e03282a chore: add curated Emergent baseline
```

Runtime stabilization changes are ready to commit after final validation.

## Files Changed So Far

- `Mobile/app/_layout.tsx`
- `Mobile/app/add-crush.tsx`
- `Mobile/app/(onboarding)/profile.tsx`
- `Mobile/app/(tabs)/chats.tsx`
- `Mobile/app/(tabs)/crushes.tsx`
- `Mobile/package.json`
- `Mobile/src/components/ErrorBoundary.tsx`
- `Mobile/src/services/api.ts`
- `Mobile/src/services/contacts/contactsService.ts`
- `Mobile/src/utils/diagnostics.ts`
- `Mobile/scripts/runtime-stability-tests.js`
- `Docs/RUNTIME_STABILITY_REPORT.md`
- `Scripts/runtime-crash-progress.md`

## Changes Made

- Added dev-only redacted runtime diagnostics.
- Added root React Error Boundary.
- Added global runtime error logging.
- Removed blanket LogBox suppression.
- Added API request/response/failure logging without tokens.
- Hardened Add Crush contact loading.
- Added contact schema sanitizer for malformed/null contact records.
- Added Add Crush entry/exit, list count, selection, and submit failure logs.
- Prevented Add Crush state updates after unmount.
- Cleared Add Crush toast timers on unmount.
- Improved list/scroll flex behavior on Add Crush, Crushes, Chats, and Onboarding Profile.
- Added `yarn test:runtime` for contact sanitizer edge cases.
- Created draft `Docs/RUNTIME_STABILITY_REPORT.md`.
- After manual testing showed Add Crush route refresh/stuck behavior, removed the global runtime error hook because it can chain across reloads, removed the Add Crush per-screen `Stack.Screen` option, made Add Crush's Done action return directly to the Crushes tab, and added US demo contacts for simulator testing.
- Broader app-code audit found unhandled API failure paths in polling hooks and chat/reveal actions. Added contained error state and diagnostics so backend hiccups do not wedge the UI.

## July 1 Validation

Passed after the latest fixes:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
yarn typecheck
yarn lint
yarn test:runtime
npx expo config --type public
```

Passed:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
python3 -m py_compile server.py tests/test_knook_backend.py
```

Passed:

```bash
cd /Users/Amoux/Documents/Knook/Backend/functions
npm run build
```

Backend tests were not rerun on July 1 because `http://127.0.0.1:8000/api/` was not reachable from this session. Restart the preview API before manual testing.

## Validation Already Run

Passed:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
yarn typecheck
yarn lint
yarn test:runtime
npx expo config --type public
```

Passed:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
python3 -m py_compile server.py tests/test_knook_backend.py
TEST_BACKEND_URL=http://127.0.0.1:8000 .venv/bin/python -m pytest -q
```

Backend test result:

```text
15 passed, 1 warning
```

Passed:

```bash
cd /Users/Amoux/Documents/Knook/Backend/functions
npm run build
```

No Emergent hosted preview URL was found in source/config files. Only docs/test-id wording and package registry URLs appeared in broad searches.

## Services

Codex-started preview API was stopped before ending.

MongoDB was running via Homebrew:

```text
mongodb-community started
```

Metro was not left running by Codex. A Codex attempt to start Metro hit a sandbox Watchman/EMFILE limitation.

## Current Tooling Limitation

Starting Metro from Codex hit:

```text
EMFILE: too many open files, watch
```

Watchman from Codex also reported:

```text
fchmod(/Users/Amoux/.local/state/watchman/Amoux-state, 2700): Operation not permitted
```

This appears to be a Codex sandbox/home-folder permission issue. Use the user's normal Terminal for manual testing.

## Resume Commands

Open three normal user Terminal windows.

Terminal 1:

```bash
brew services start mongodb/brew/mongodb-community
mongosh --eval 'db.runCommand({ ping: 1 })'
```

Terminal 2:

```bash
cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

Terminal 3:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
source ~/.zshrc
nvm use
watchman watch-del-all || true
npx expo start --clear
```

Then press:

```text
i
```

## Manual Verification Needed

Use iOS Simulator and verify:

1. Splash loads.
2. Phone screen loads.
3. Demo OTP succeeds with `123456`.
4. Onboarding screens scroll completely.
5. Home screen scrolls where required.
6. Add Crush opens without crashing.
7. Contact list renders.
8. Contact list scrolls.
9. A contact can be tapped.
10. Add Crush completes or returns a clear recoverable error.
11. Back navigation works.
12. Chat list opens.
13. Profile opens and scrolls.
14. No red screen, app termination, frozen UI, or unhandled error occurs.

Use fake data only:

```text
Phone: +12025550100 or another fake number
OTP: 123456
```

## Expected Logs To Watch

Metro should show development diagnostics beginning with:

```text
[knook:runtime]
```

Important events:

- `root-layout-mounted`
- `api-request`
- `api-response`
- `api-failure`
- `add-crush-enter`
- `add-crush-contacts-loaded`
- `add-crush-list-render`
- `add-crush-select`
- `add-crush-submit-failed`
- `add-crush-exit`
- `react-boundary`
- `crushes-refresh-failed`
- `matches-refresh-failed`
- `messages-refresh-failed`
- `chat-send-failed`
- `chat-unhook-failed`
- `reveal-refresh-failed`
- `reveal-submit-failed`

## Remaining Work

1. Run manual simulator verification.
2. If a crash remains, capture Metro log, preview API log, screen, and exact tap.
3. Update `Docs/RUNTIME_STABILITY_REPORT.md` with confirmed manual results.
4. Run validation again.
5. Commit only after manual verification:

```bash
git add Mobile Docs/RUNTIME_STABILITY_REPORT.md Scripts/runtime-crash-progress.md
git commit -m "fix: resolve mobile runtime crashes and scrolling issues"
```

Do not commit `.env`, `.venv`, `node_modules`, `.expo`, caches, databases, or secrets.
