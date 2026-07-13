/**
 * Message denormalization.
 * Clients may create their own messages under an active match; this function
 * updates the match preview/timestamps with server authority.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore;

export const handleMessageCreated = functions.firestore
  .document('matches/{matchId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const matchRef = db().doc(`matches/${context.params.matchId}`);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) return;
    const match = matchSnap.data()!;
    if (match.status !== 'active') return;

    const now = admin.firestore.FieldValue.serverTimestamp();
    await matchRef.set({
      lastMessageAt: message.sentAt ?? now,
      lastMessagePreview: typeof message.text === 'string' ? message.text.slice(0, 80) : null,
      firstMessageSentAt: match.firstMessageSentAt ?? message.sentAt ?? now,
      updatedAt: now,
    }, { merge: true });
  });
