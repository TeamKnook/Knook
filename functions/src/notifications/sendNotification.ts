/**
 * sendMatchRevealedNotification
 * TODO(notifications): full FCM fan-out for matches that transition into
 * 'active' (post-dailyReveal). For now this exposes a callable placeholder.
 */
import * as functions from 'firebase-functions';

export const sendMatchRevealedNotification = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'must be signed in');
  }
  // TODO(notifications): assemble FCM payload, fetch fcmTokens, send
  return { ok: true, queued: 0 };
});
