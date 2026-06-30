/**
 * detectMutualCrush
 * Triggered when a new crush document is created at
 *   users/{uid}/crushes/{phoneHash}
 *
 * If the target user (whose users.phoneHash == the crushed phoneHash) has
 * already crushed the current user back, we create a match document with
 * status = 'pending_reveal'. Matches are NOT surfaced to users until the
 * dailyReveal job flips them to 'active' at 6:30 PM IST.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore;

export const detectMutualCrush = functions.firestore
  .document('users/{uid}/crushes/{phoneHash}')
  .onCreate(async (snap, context) => {
    const { uid, phoneHash } = context.params as { uid: string; phoneHash: string };

    const meSnap = await db().doc(`users/${uid}`).get();
    const me = meSnap.data();
    if (!me?.phoneHash) return;
    const myPhoneHash: string = me.phoneHash;

    // Find the target user by their phoneHash
    const targets = await db().collection('users').where('phoneHash', '==', phoneHash).limit(1).get();
    if (targets.empty) return;
    const target = targets.docs[0];
    const targetUid = target.id;

    // Check the reverse crush
    const reverseRef = db().doc(`users/${targetUid}/crushes/${myPhoneHash}`);
    const reverseSnap = await reverseRef.get();
    if (!reverseSnap.exists) return;
    const reverse = reverseSnap.data();
    if (!reverse || reverse.status !== 'pending') return;

    const participants = [uid, targetUid].sort();
    const matchId = participants.join('_');
    const matchRef = db().collection('matches').doc(matchId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db().runTransaction(async (transaction) => {
      const matchSnap = await transaction.get(matchRef);

      if (!matchSnap.exists) {
        transaction.create(matchRef, {
          matchId,
          userA: participants[0],
          userB: participants[1],
          participants,
          status: 'pending_reveal',
          matchedAt: now,
          revealedAt: null,
          revealedBy: [],
          mutualReveal: false,
          lastMessageAt: null,
          lastMessagePreview: null,
          matchExpiresAt: null,
          firstMessageSentAt: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      transaction.update(snap.ref, { status: 'matched', matchId, updatedAt: now });
      transaction.update(reverseRef, { status: 'matched', matchId, updatedAt: now });
    });

    // TODO(notifications): explicitly do NOT push a notification here —
    // matches must remain hidden until the dailyReveal job runs.
  });
