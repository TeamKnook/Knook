/**
 * Identity reveal request processor.
 * Clients create revealRequests docs; the function verifies participation
 * and copies reveal-safe names to the match only after both users reveal.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore;

export const handleIdentityRevealRequest = functions.firestore
  .document('revealRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const { matchId, uid } = snap.data() as { matchId?: string; uid?: string };
    if (!matchId || !uid) {
      await snap.ref.set({ status: 'failed', error: 'matchId and uid required' }, { merge: true });
      return;
    }

    const matchRef = db().doc(`matches/${matchId}`);
    await db().runTransaction(async (transaction) => {
      const matchSnap = await transaction.get(matchRef);
      if (!matchSnap.exists) {
        transaction.set(snap.ref, { status: 'failed', error: 'match not found' }, { merge: true });
        return;
      }

      const match = matchSnap.data()!;
      const participants = Array.isArray(match.participants) ? match.participants as string[] : [];
      if (match.status !== 'active' || !participants.includes(uid)) {
        transaction.set(snap.ref, { status: 'failed', error: 'not an active participant' }, { merge: true });
        return;
      }

      const revealedBy = Array.from(new Set([...(match.revealedBy ?? []), uid]));
      const mutualReveal = participants.every((participantUid) => revealedBy.includes(participantUid));
      const update: Record<string, unknown> = {
        revealedBy,
        mutualReveal,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (mutualReveal) {
        const names: Record<string, string> = {};
        for (const participantUid of participants) {
          const userSnap = await transaction.get(db().doc(`users/${participantUid}`));
          const firstName = userSnap.data()?.firstName;
          if (typeof firstName === 'string' && firstName.trim()) {
            names[participantUid] = firstName.trim();
          }
        }
        update.revealedNames = names;
      }

      transaction.update(matchRef, update);
      transaction.set(snap.ref, {
        status: 'processed',
        requestId: context.params.requestId,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  });
