/**
 * handleUnhook
 * Callable function. Either participant can unhook a match.
 *  - Set match.status = 'unhooked'
 *  - Soft-delete messages
 *  - Mirror to both users' crush docs
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore;

export const handleUnhook = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'must be signed in');
  }
  const uid = context.auth.uid;
  const matchId: string = data?.matchId;
  if (!matchId) {
    throw new functions.https.HttpsError('invalid-argument', 'matchId required');
  }

  const matchRef = db().doc(`matches/${matchId}`);
  const matchSnap = await matchRef.get();
  if (!matchSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'match not found');
  }
  const match = matchSnap.data()!;
  if (!(match.participants || []).includes(uid)) {
    throw new functions.https.HttpsError('permission-denied', 'not a participant');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  await matchRef.update({ status: 'unhooked', updatedAt: now });

  // Soft-delete messages
  const messagesSnap = await matchRef.collection('messages').get();
  for (let i = 0; i < messagesSnap.docs.length; i += 400) {
    const batch = db().batch();
    messagesSnap.docs.slice(i, i + 400).forEach((m) => batch.update(m.ref, { deletedAt: now }));
    await batch.commit();
  }

  // TODO(crush-mirror): find the two crush docs that reference this matchId
  // and flip their status to 'unhooked'. We use a collectionGroup query so
  // we can hit the per-user subcollections.
  const crushDocs = await db().collectionGroup('crushes').where('matchId', '==', matchId).get();
  const batch = db().batch();
  crushDocs.docs.forEach((c) => batch.update(c.ref, { status: 'unhooked', updatedAt: now }));
  await batch.commit();

  return { ok: true };
});
