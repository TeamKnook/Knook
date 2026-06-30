/**
 * dailyReveal
 * Scheduled to run every day at 6:30 PM IST.
 * Flips matches from 'pending_reveal' to 'active' and stamps revealedAt +
 * matchExpiresAt (revealedAt + 48 hours).
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore;

export const dailyReveal = functions
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .pubsub.schedule('30 18 * * *') // 18:30 in the function's TZ — set timeZone below
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const pending = await db().collection('matches').where('status', '==', 'pending_reveal').get();
    if (pending.empty) return;

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 48 * 60 * 60 * 1000);

    // Batch in chunks of 400 to stay under the 500-write limit
    const docs = pending.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db().batch();
      docs.slice(i, i + 400).forEach((d) => {
        batch.update(d.ref, {
          status: 'active',
          revealedAt: now,
          matchExpiresAt: expiresAt,
          updatedAt: now,
        });
      });
      await batch.commit();
    }

    // TODO(notifications): fan out FCM push to each participant of the
    // newly-active matches.
  });
