/**
 * Unhook request processor.
 * Clients create unhookRequests docs; this function performs the destructive
 * match/message/crush updates so clients cannot self-authorize the state move.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore;

async function softDeleteMessages(matchRef: admin.firestore.DocumentReference, now: admin.firestore.FieldValue) {
  const messagesSnap = await matchRef.collection('messages').get();
  for (let i = 0; i < messagesSnap.docs.length; i += 400) {
    const batch = db().batch();
    messagesSnap.docs.slice(i, i + 400).forEach((message) => {
      batch.update(message.ref, { deletedAt: now });
    });
    await batch.commit();
  }
}

async function mirrorCrushes(matchId: string, now: admin.firestore.FieldValue) {
  const crushDocs = await db().collectionGroup('crushes').where('matchId', '==', matchId).get();
  for (let i = 0; i < crushDocs.docs.length; i += 400) {
    const batch = db().batch();
    crushDocs.docs.slice(i, i + 400).forEach((crush) => {
      batch.update(crush.ref, { status: 'unhooked', updatedAt: now });
    });
    await batch.commit();
  }
}

export const handleUnhookRequest = functions.firestore
  .document('unhookRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const { matchId, uid } = snap.data() as { matchId?: string; uid?: string };
    if (!matchId || !uid) {
      await snap.ref.set({ status: 'failed', error: 'matchId and uid required' }, { merge: true });
      return;
    }

    const matchRef = db().doc(`matches/${matchId}`);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      await snap.ref.set({ status: 'failed', error: 'match not found' }, { merge: true });
      return;
    }

    const match = matchSnap.data()!;
    const participants = Array.isArray(match.participants) ? match.participants as string[] : [];
    if (!participants.includes(uid)) {
      await snap.ref.set({ status: 'failed', error: 'not a participant' }, { merge: true });
      return;
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    await matchRef.update({ status: 'unhooked', updatedAt: now });
    await softDeleteMessages(matchRef, now);
    await mirrorCrushes(matchId, now);
    await snap.ref.set({
      status: 'processed',
      requestId: context.params.requestId,
      processedAt: now,
    }, { merge: true });
  });
