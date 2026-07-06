# Native Edge-Case Test Plan

Branch: `test/native-edge-cases`

Runtime: Knook Dev custom iOS development build, not Expo Go.

Manual scenarios must remain marked `Not run` until confirmed by the human tester on two iOS Simulators.

## Environment

- Simulator A: iPhone 17 Pro, User A Alex, `+15555550100`
- Simulator B: iPhone 17 Pro Max, User B Jordan, `+15555550101`
- Mobile runtime: Knook Dev, bundle `com.teamknook.knook.dev`
- Metro: `APP_VARIANT=development npx expo start --dev-client --clear`
- Preview API: `uvicorn server:app --reload --host 0.0.0.0 --port 8000`
- Database: local MongoDB, database `knook_preview`
- Reset: `Backend/preview-api/.venv/bin/python Scripts/two_user_reset_seed.py --reset --seed`

## Scenario Matrix

| Scenario | Setup | Exact actions | Expected result | Simulator A result | Simulator B result | Backend state | Logs | Pass/fail | Severity | Fix required | Future Firebase implication |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Duplicate crush submission | Reset and sign in both users | User A adds User B repeatedly, taps rapidly, returns and submits again; User B adds User A close after | One visible crush card, one active crush record, one match at most, no duplicate navigation | Not run | Not run | Automated API test covers idempotency | Check `[MATCH]` and `[USER_*]` | Not run | P1 if duplicate match or duplicate visible crush | Add UI submit guard if manual rapid tap duplicates | Firestore function must use deterministic IDs and transaction/create semantics |
| 2. Daily reveal triggered twice | Create reciprocal pending reveal match | Trigger demo reveal twice | First call activates once; second call updates zero; `revealedAt` and expiry stay unchanged | Not run | Not run | Automated API test covers timestamp stability | Check `[REVEAL] updated=1/0` | Not run | P0 if expiry extends or duplicate event occurs | None unless test fails | Scheduled Cloud Function must be idempotent |
| 3. Near-simultaneous identity reveal | Active anonymous match | Both users tap Reveal as close together as practical | Each uid stored once; mutual reveal becomes true; names unlock on both devices | Not run | Not run | Automated API test covers duplicate reveal and mutual state | Check `[REVEAL] mutual=true` | Not run | P1 if one side stuck waiting | None unless manual sync fails | Firestore reveal writes must use array union or transaction |
| 4. Unhook while other user is inside chat | Active chat open on both devices | User A confirms Unhook while User B remains in chat and tries to send | Match unhooks once; A exits; B leaves or loses access without restart; messages inaccessible | Not run | Not run | Automated API test covers stale access rejection | Check `[UNHOOK]` and 410 responses | Not run | P0/P1 if stale chat remains usable | P1 fix added: stale match/message access returns gone and chat redirects | Cloud Function must atomically hide match and block messages |
| 5. Reopen unhooked match | After scenario 4 | Try back navigation, stale match ID, app restart | Access rejected, no messages load, user returns safely to Matches | Not run | Not run | Automated API test covers stale API access | Check 410 and mobile redirect | Not run | P1 if stale identity/messages appear | P1 fix added for backend and chat redirect | Firestore rules must deny reads/writes after unhook |
| 6. App restart during active chat | Active chat states | Restart during anonymous chat, one-sided reveal, mutual reveal | Session restores; match and messages reload; reveal state preserved | Not run | Not run | Not automated | Check Metro and API logs | Not run | P1 if session lost or state corrupt | Document unless core flow breaks | Firebase Auth persistence and listeners must restore state |
| 7. One user offline during a message | Active chat | Close User B app, send from User A, reopen B | No crash, no duplicate message, B receives after polling/reconnect where supported | Not run | Not run | Not automated | Check `[CHAT]` one message ID | Not run | P2 unless send falsely succeeds/fails destructively | Document polling limits | Firestore offline persistence and ordering need explicit rules |
| 8. One user offline during daily reveal | Pending reveal match | Close User B, trigger reveal from A, reopen B | Backend activates once; B sees active match after reconnect; identity remains anonymous | Not run | Not run | Partially covered by reveal idempotency test | Check `[REVEAL]` and match list | Not run | P1 if B misses match permanently | Document polling delay unless permanent | Scheduled reveal must be source of truth |
| 9. Backend unavailable | Signed-in users on key screens | Stop preview API on Home, Add Crush, Chat, Send, Reveal, Unhook | No crash, no false success, clear recoverable error, retry works | Not run | Not run | Not automated | Metro shows local backend unavailable | Not run | P0 if destructive false success; P1 if stuck | Document or fix serious stuck states only | Firebase SDK errors need user-safe handling |

## Automated Coverage Added

- Duplicate crush submission before and after reciprocal match.
- Duplicate daily reveal idempotency and timestamp stability.
- Duplicate identity reveal idempotency and mutual reveal refresh.
- Stale match/message access after Unhook.

## Product Rule Boundaries

Do not implement in this branch:

- Minimum three active crushes.
- Private Circle.
- `privacy_hold`.
- Daily reveal eligibility re-check.
- Waitlist, payments, credits, Premium, Lottie, Branch, FCM, real contacts, voice notes, screenshot protection, or Firebase migration.

Repeat these edge cases after Private Circle and Firebase matching are implemented.
