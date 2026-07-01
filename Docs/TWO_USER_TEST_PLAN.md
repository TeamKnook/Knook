# Two-User Local Test Plan

This plan validates the temporary preview app flow with two isolated iOS Simulator sessions. It does not start the Firebase migration.

## Scope

Current preview stack:

- React Native / Expo mobile app
- FastAPI preview API in `Backend/preview-api`
- MongoDB preview database

Intended production stack remains React Native, TypeScript, Expo Development Build, Firebase Auth, Firestore, Cloud Functions, Firebase Storage, FCM, Branch.io, and later RevenueCat.

## Test Users

| Alias | Simulator | Phone | OTP | Name |
| --- | --- | --- | --- | --- |
| USER_A | Simulator A | +15555550100 | 123456 | Alex |
| USER_B | Simulator B | +15555550101 | 123456 | Jordan |

## Preflight

1. Confirm branch is `test/two-user-flow`.
2. Confirm `Backend/preview-api/.env` has `DEMO_MODE=true`.
3. Confirm `Mobile/.env` points to `http://127.0.0.1:8000`.
4. Run the reset/seed tool:

```bash
cd /Users/Amoux/Documents/Knook
Backend/preview-api/.venv/bin/python Scripts/two_user_reset_seed.py --reset --seed
```

5. Start MongoDB, the preview API, Metro, and two iOS Simulator devices using `Scripts/two-device-simulation.md`.
6. Watch Metro logs and FastAPI logs during the test.

## Main Flow

### Authentication

1. USER_A signs in on Simulator A.
2. USER_B signs in on Simulator B.
3. Both complete the minimum profile data.
4. Each simulator keeps its own authenticated session after an app reload.

Expected:

- USER_A and USER_B remain separate users.
- No token, OTP, or full raw phone appears in logs.
- Preview API logs show safe aliases for the two test users.

### Crush And Match

5. USER_A opens Crushes and adds USER_B from the mock contacts list.
6. USER_A should see a pending crush.
7. USER_A should not see a match in Chats.
8. USER_B opens Crushes and adds USER_A by phone/contact where available.
9. Exactly one match is created.
10. The initial match status is `pending_reveal`.
11. Neither user sees the match in Chats before reveal.

Expected:

- Preview API logs show `[MATCH] created pending_reveal match`.
- Duplicate or repeated Add Crush taps return the existing crush instead of creating another match.

### Development Reveal

12. Trigger the demo reveal endpoint from the Chats empty state or authenticated API call.
13. The match changes to `active`.
14. Both users see one anonymous chat.
15. Neither user sees the other's identity.

Expected:

- Preview API logs show `[REVEAL] local development reveal triggered`.
- The route requires authentication and `DEMO_MODE=true`.

### Anonymous Chat

16. USER_A opens the chat and sends a message.
17. USER_B receives it.
18. USER_B replies.
19. USER_A receives it.
20. Record synchronization latency.
21. Verify no identifying information appears in the chat UI before mutual reveal.

Expected:

- Messages can take up to the polling interval to appear.
- Preview API logs show `[CHAT] message sent` with message ID, match ID, and safe alias only.

### Identity Reveal

22. USER_A taps reveal.
23. Mutual reveal remains false.
24. USER_A sees a waiting state.
25. USER_B sees that the other user revealed.
26. USER_B taps reveal.
27. `mutualReveal` becomes true.
28. Both identities unlock.

Expected:

- USER_A sees Jordan after both reveal.
- USER_B sees Alex after both reveal.
- Preview API logs show `[REVEAL] identity reveal updated`.

### Unhook

29. One user unhooks.
30. Both clients exit or lose access to the active conversation.
31. The match becomes unhooked.
32. Messages are deleted or inaccessible.
33. The other user does not receive identifying information about who initiated the unhook.

Expected:

- Preview API logs show `[UNHOOK] match unhooked`.
- Chat disappears from both users after polling refresh.

## Edge Cases

After the main flow passes, test:

1. Reciprocal crushes submitted almost simultaneously.
2. Development reveal called twice.
3. One user offline during reveal.
4. One user offline during a message.
5. One app restarted during chat.
6. Both users reveal at nearly the same time.
7. One user unhooks while the other is viewing the chat.
8. Duplicate crush submission.
9. Attempt to reopen an unhooked match.
10. Backend unavailable on one device.

## Known Preview Limitations

- Mobile updates use polling, not Firebase realtime listeners.
- The preview API is MongoDB-backed only for local review.
- Contact access is mocked for Expo Go; real contacts require Expo Development Build plus `expo-contacts`.
- Development reveal is a local-only route and must not exist in production configuration.
