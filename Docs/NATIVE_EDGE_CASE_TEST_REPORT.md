# Native Edge-Case Test Report

Status: in progress on `test/native-edge-cases`.

This report distinguishes:

- Verified behavior: covered by automated checks or direct command output.
- Human-confirmed behavior: manually confirmed on two iOS Simulators.
- Codex-inspected behavior: source-code behavior inspected without simulator control.
- Not tested: still awaiting manual confirmation.

## Environment Used

| Area | Value |
| --- | --- |
| Mobile runtime | Knook Dev custom iOS development build |
| Expo Go | Not used |
| Branch base | `integration/emergent-base` after native-development merge `4726849` |
| Edge branch | `test/native-edge-cases` |
| Preview API | FastAPI local preview API |
| Database | Local MongoDB preview database |
| Test users | Alex `+12025550100`, Jordan `+12025550101` |
| Update model | Polling in preview app; Firestore listeners deferred |

## Firebase Auth Retest

After the Firebase foundation work, the same Knook Dev two-simulator flow was manually revalidated in Firebase auth mode.

| Check | Human-confirmed result | Notes |
| --- | --- | --- |
| Alex Firebase Phone Auth sign-in | Passed | `+12025550100` signed in with Firebase Console test verification. |
| Jordan Firebase Phone Auth sign-in | Passed | `+12025550101` signed in independently on a second simulator. |
| Backend Firebase token bridge | Passed | FastAPI accepted Firebase ID tokens and resolved local preview users. |
| Pre-reveal privacy | Passed | Reciprocal crush remained private before reveal. |
| Daily reveal | Passed | Demo reveal activated Mystery Match. |
| Anonymous chat | Passed | Messages synced between both users without exposing names. |
| Identity reveal | Passed | One-sided reveal stayed hidden; mutual reveal unlocked names. |
| Unhook | Passed | Both clients lost access to the active conversation. |

The Firebase run used the temporary FastAPI/MongoDB preview backend only as a product-data bridge. Product data has not moved to Firestore yet.

## Automated Results

| Check | Result | Notes |
| --- | --- | --- |
| Duplicate crush idempotency | Added, live run blocked in Codex sandbox | `test_native_edge_cases.py` covers the API path; run from normal Terminal against local API. |
| Duplicate reveal idempotency | Added, live run blocked in Codex sandbox | Test checks `revealedAt` and expiry stability. |
| Identity reveal idempotency | Added, live run blocked in Codex sandbox | Test checks repeated reveal and mutual reveal refresh. |
| Authorization after Unhook | Added, live run blocked in Codex sandbox | Test checks stale match/message access returns gone. |
| Python syntax | Passed | `server.py` and `test_native_edge_cases.py` compile. |
| Reset/seed tooling tests | Passed | `3 passed`. |
| Mobile typecheck | Passed | `npm run typecheck`. |
| Mobile ESLint | Passed | `npm run lint`. |
| Mobile privacy guard | Passed | `npm run test:privacy`. |
| Mobile runtime guard | Passed | `npm run test:runtime`. |
| Development config validation | Passed | Resolved `Knook Dev`, `com.teamknook.knook.dev`, `knook-dev`. |
| Firebase Functions build | Passed | `npm run build`. |

## Manual Results

| Scenario | Human-confirmed result | Severity | Notes |
| --- | --- | --- | --- |
| Duplicate crush submission | Passed for core behavior | P2 follow-up | Re-adding an existing contact did not create duplicate crushes or cards; contact still appears selectable in Add Crush, which is a UX cleanup item. |
| Daily reveal triggered twice | Not specifically tested twice | TBD | Basic reveal flow was human-confirmed; explicit double-trigger still needs API/manual confirmation. |
| Near-simultaneous identity reveal | Not tested | TBD | Requires both simulators. |
| Anonymous chat | Passed | None | Both users could exchange messages after reveal, and names remained hidden until mutual reveal. |
| Identity reveal | Passed for normal sequence | None | One-sided reveal and mutual reveal behaved correctly in manual testing. |
| Unhook while other user is inside chat | Passed for visible app behavior | None | Unhook removed the conversation for both users; stale API access is also covered by the new automated test. |
| Reopen an unhooked match | Not tested after P1 fix | TBD | Try back navigation and app restart. |
| App restart during chat/reveal | Not tested | TBD | Requires manual simulator restart. |
| One user offline during message | Not tested | TBD | Expected polling limitation. |
| One user offline during reveal | Not tested | TBD | Expected to recover on reconnect. |
| Backend unavailable | Passed with preview limitation | P2 | App became unusable while FastAPI was stopped, then recovered after the API restarted. No permanent corruption reported. |

## P0 Findings

No P0 findings confirmed yet.

## P1 Findings

| Finding | Evidence | Fix |
| --- | --- | --- |
| Stale direct access after Unhook could still fetch an unhooked match document | Codex-inspected: `GET /matches/{matchId}` previously allowed `status=unhooked`, while messages were blocked. This could leave stale navigation behavior ambiguous. | Preview API now returns `410 match no longer available` for unhooked match, message list, and message send. Chat screen redirects to Matches when that error appears. |

## P2 Findings

| Finding | Evidence | Handling |
| --- | --- | --- |
| Polling delay remains visible for cross-device updates | Existing hooks poll every few seconds. | Documented as preview limitation; Firebase realtime listeners should replace it. |
| Offline behavior is limited by preview API and polling | No offline queue is implemented in preview app. | Document rather than deeply fix unless destructive false success appears. |
| Already-added contacts remain selectable in Add Crush | Human tester confirmed duplicate submission is safe but the contact still appears in the picker. | Treat as P2 UX cleanup; core idempotency is intact. |
| Preview API outage blocks the app | Human tester stopped FastAPI and the simulator flow stopped working until the API restarted. | Accept for temporary preview; production Firebase must provide clearer retry/offline states where supported. |

## Fixes Applied

- `Backend/preview-api/server.py`: stale unhooked match access now returns `410 match no longer available`.
- `Mobile/app/chat/[matchId].tsx`: chat redirects safely when stale access returns `match no longer available`.
- `Backend/preview-api/tests/test_native_edge_cases.py`: added focused API coverage for duplicate crushes, duplicate reveal, identity reveal, and Unhook stale access.

## Firebase Requirements Discovered

- Match documents must deny reads and writes after Unhook, including stale direct navigation paths.
- Message reads/writes must be allowed only while `status == active`.
- Daily reveal must update only `pending_reveal` matches and must not change `revealedAt` or expiry on repeated execution.
- Identity reveal must use an idempotent participant-only update, such as array union plus server-side mutual reveal calculation.
- Duplicate reciprocal crushes must create at most one deterministic match.
- Realtime listeners must remove unhooked matches quickly enough that the other user is not left inside a stale chat.
- Firebase client error handling should distinguish recoverable network/backend failures from successful destructive actions.
- Firebase Auth migration must preserve the same local preview user mapping for Alex and Jordan by verified phone-number claim before product data moves to Firestore.

## Remaining Temporary Limitations

- Preview app uses polling instead of Firestore realtime listeners.
- Preview API does not implement production-grade offline queueing.
- Preview API/MongoDB remain local-only and must not become production dependencies.
- Additional manual edge testing should be repeated after Firestore listeners replace polling.
- Codex sandbox cannot call `127.0.0.1:8000`; live edge tests must run from normal Terminal.

## Commands For Live Edge Validation

Run from normal Terminal with MongoDB and the preview API running:

```bash
cd /Users/Amoux/Documents/Knook
Backend/preview-api/.venv/bin/python -m pytest -q Backend/preview-api/tests/test_native_edge_cases.py
```
