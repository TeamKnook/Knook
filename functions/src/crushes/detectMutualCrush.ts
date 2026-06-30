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

    // Mutual! Create a match in pending_reveal state.
    const matchRef = db().collection('matches').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const participants = [uid, targetUid].sort();

    await matchRef.set({
      matchId: matchRef.id,
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

    // Stamp both crush docs
    const batch = db().batch();
    batch.update(snap.ref, { status: 'matched', matchId: matchRef.id, updatedAt: now });
    batch.update(reverseRef, { status: 'matched', matchId: matchRef.id, updatedAt: now });
    await batch.commit();

    // TODO(notifications): explicitly do NOT push a notification here —
    // matches must remain hidden until the dailyReveal job runs.
  });
