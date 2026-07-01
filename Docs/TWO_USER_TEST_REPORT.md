# Two-User Local Test Report

Status: prepared, partially validated by Codex, not yet fully manually executed on two simulators.

Codex could inspect and validate code paths, but could not control two iOS Simulator windows from the sandbox. Manual device execution should follow `Scripts/two-device-simulation.md` and this report should be updated with observed pass/fail results.

## Branches

| Branch | Purpose | Status |
| --- | --- | --- |
| `integration/emergent-base` | Stable curated Emergent integration | Runtime fixes merged locally |
| `fix/runtime-crashes` | Add Crush and scrolling stability fixes | Merged into integration branch |
| `test/two-user-flow` | Two-user simulation tooling and docs | Active branch |

## Capability Audit

| Area | Current preview behavior | Status | Notes |
| --- | --- | --- | --- |
| Authentication session storage | JWT saved in AsyncStorage under app-local keys | Temporary implementation | Production should use Firebase Auth session handling. |
| User creation | Preview API creates users by phone hash after demo OTP | Temporary implementation | Reset/seed tool creates Alex/Jordan locally only. |
| Profile creation | `PUT /api/users/me` stores onboarding/profile fields | Partially implemented | Enough for local flow. |
| Add crush | `POST /api/crushes` hashes target phone and stores pending crush | Partially implemented | Contact source is mocked in Expo Go. |
| Mutual match creation | Reciprocal crush creates `pending_reveal` match | Improved for preview | Match ID is now deterministic from sorted participant UIDs to prevent duplicate local matches. |
| Match visibility | `/api/matches` returns only active matches | Implemented | Pending reveal remains hidden. |
| Development reveal | Authenticated `/api/dev/trigger-reveal` flips pending matches active | Local only | Requires `DEMO_MODE=true` and authenticated session. |
| Chat send/read | Active matches can send/list messages | Implemented for preview | Uses polling rather than realtime listeners. |
| Identity reveal | `revealedBy` and `mutualReveal` update per user | Implemented for preview | Name appears only after mutual reveal. |
| Unhook | Sets match unhooked and soft-deletes messages | Implemented for preview | Other client loses access after polling refresh. |
| Realtime updates | Mobile polls matches/crushes/messages | Temporary implementation | Firebase listeners will replace polling. |

## Main Flow Results

| Step | Simulator A | Simulator B | Backend state | Latency | Status |
| --- | --- | --- | --- | --- | --- |
| USER_A signs in | Pending manual run | N/A | Should create or reuse `demo-user-a` | N/A | Not run |
| USER_B signs in | N/A | Pending manual run | Should create or reuse `demo-user-b` | N/A | Not run |
| USER_A adds USER_B | Pending manual run | N/A | One pending crush for USER_A | N/A | Not run |
| USER_B adds USER_A | N/A | Pending manual run | One deterministic `pending_reveal` match | N/A | Not run |
| Match hidden before reveal | Pending manual run | Pending manual run | `/matches` should be empty | Up to 6s | Not run |
| Development reveal | Pending manual run | Pending manual run | Match becomes `active` | Up to 6s | Not run |
| Anonymous chat | Pending manual run | Pending manual run | Messages inserted under match ID | Up to 3s | Not run |
| USER_A reveal | Pending manual run | Pending manual run | `revealedBy` contains USER_A | Up to 4s | Not run |
| USER_B reveal | Pending manual run | Pending manual run | `mutualReveal=true` | Up to 4s | Not run |
| Unhook | Pending manual run | Pending manual run | Match unhooked, messages inaccessible | Up to 6s | Not run |

## Edge-Case Results

| Edge case | Expected current preview behavior | Status |
| --- | --- | --- |
| Simultaneous reciprocal crushes | At most one deterministic match | Protected in preview API, needs manual/API stress check |
| Development reveal called twice | First call activates pending matches, second updates zero | Not run |
| One user offline during reveal | Offline user sees active match after app returns/polls | Not run |
| One user offline during a message | Offline user receives message after app returns/polls | Not run |
| App restarted during chat | Session should persist from AsyncStorage | Not run |
| Both users reveal nearly together | `mutualReveal=true` after both requests | Not run |
| Unhook while other views chat | Other user should be moved out or see inaccessible chat after polling | Not run |
| Duplicate crush submission | Existing pending/matched crush returned | Covered by code path, not manually run |
| Reopen unhooked match | Should disappear from list; direct chat send fails | Not run |
| Backend unavailable on one device | UI should show recoverable local backend unavailable error | Not run |

## Relevant Logs

Expected preview API log prefixes:

```text
[USER_A]
[USER_B]
[MATCH]
[CHAT]
[REVEAL]
[UNHOOK]
```

Diagnostic logs must not contain bearer tokens, OTP codes, full raw phone numbers, private message bodies, or production secrets.

## Preview Vs Production

Current preview behavior:

- Uses MongoDB and FastAPI only for local review.
- Uses demo OTP and local JWT session tokens.
- Uses polling for updates.
- Uses mocked contacts under Expo Go.

Intended production behavior:

- Firebase Phone Auth replaces preview auth.
- Firestore stores users, crushes, matches, and messages.
- Cloud Functions create mutual matches, run daily reveal, and handle unhook cleanup.
- Firebase realtime listeners replace polling.
- FCM handles safe, non-identifying notifications.
- MongoDB and `Backend/preview-api` are removed.

## Issues Discovered

| Issue | Severity | Recommended fix |
| --- | --- | --- |
| Codex sandbox could not enumerate iOS Simulators because CoreSimulator service access/logging was blocked | Low | Run simulator commands from normal Terminal. |
| Codex sandbox could not connect to local MongoDB, returning `connect EPERM 127.0.0.1:27017` | Low | Run live preview API tests from normal Terminal where local network access is allowed. |
| Expo Go cannot test real contact permission behavior | Medium | Use mocked contacts for preview; test real contacts later in Expo Development Build. |
| Polling creates visible sync delay | Low for preview, medium for production | Replace with Firestore realtime listeners during Firebase migration. |

## Validation Summary

Validated by Codex:

| Check | Result |
| --- | --- |
| Mobile TypeScript check | Passed |
| Mobile ESLint | Passed |
| Expo public config validation | Passed |
| Mobile runtime stability guard | Passed |
| Preview API Python syntax check | Passed |
| Reset/seed tooling tests | Passed |
| Firebase Functions TypeScript build | Passed |

Not completed by Codex because local MongoDB and CoreSimulator access are blocked in the sandbox:

| Check | Result |
| --- | --- |
| Full preview API tests against `http://127.0.0.1:8000` | Blocked in sandbox; run from normal Terminal |
| Two-simulator manual flow | Pending human run |

Run these from a normal Terminal to complete validation:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
npm run typecheck
npm run lint
npx expo config --type public --json

cd /Users/Amoux/Documents/Knook/Backend/preview-api
source .venv/bin/activate
python -m py_compile server.py
TEST_BACKEND_URL=http://127.0.0.1:8000 pytest -q

cd /Users/Amoux/Documents/Knook/Backend/functions
npm run build
```
