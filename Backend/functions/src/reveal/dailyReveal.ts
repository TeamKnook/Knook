/**
 * dailyReveal
 * Scheduled to run every day at 6:30 PM IST.
 * Re-checks Private Circle eligibility for hidden reciprocal matches. Eligible
 * matches become active; ineligible matches remain hidden on privacy_hold.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { participantActiveCrushCounts } from '../matching/firestorePrivacy';
import { revealTransition, type MatchStatus } from '../matching/privateCircle';

const db = admin.firestore;

async function activatePendingMatches(): Promise<number> {
  const pending = await db().collection('matches')
    .where('status', 'in', ['privacy_hold', 'pending_reveal'])
    .get();
  if (pending.empty) return 0;

  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 48 * 60 * 60 * 1000);
  let activatedCount = 0;

  for (const match of pending.docs) {
    const data = match.data();
    const participants = Array.isArray(data.participants) ? data.participants.map(String) : [];
    const counts = await participantActiveCrushCounts(participants, now);
    const nextStatus = revealTransition(data.status as MatchStatus, ...counts);
    const activated = await db().runTransaction(async (transaction) => {
      const current = await transaction.get(match.ref);
      if (!current.exists) return false;

      const currentData = current.data()!;
      if (!['privacy_hold', 'pending_reveal'].includes(String(currentData.status))) {
        return false;
      }

      if (nextStatus === 'active') {
        transaction.update(match.ref, {
          status: 'active',
          revealedAt: currentData.revealedAt ?? now,
          matchExpiresAt: currentData.matchExpiresAt ?? expiresAt,
          updatedAt: now,
        });
        return true;
      }

      transaction.update(match.ref, {
        status: 'privacy_hold',
        revealedAt: null,
        matchExpiresAt: null,
        updatedAt: now,
      });
      return false;
    });
    if (activated) activatedCount += 1;
  }

  return activatedCount;
}

export const dailyReveal = functions
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .pubsub.schedule('30 18 * * *') // 18:30 in the function's TZ — set timeZone below
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    await activatePendingMatches();

    // TODO(notifications): fan out FCM push to each participant of the
    // newly-active matches.
  });

export const handleDevRevealRequest = functions.firestore
  .document('devRevealRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data?.uid) {
      await snap.ref.set({ status: 'failed', error: 'uid required' }, { merge: true });
      return;
    }
    const updated = await activatePendingMatches();
    await snap.ref.set({
      requestId: context.params.requestId,
      status: 'processed',
      updated,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
