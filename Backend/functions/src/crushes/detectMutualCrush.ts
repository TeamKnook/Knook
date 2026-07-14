/**
 * detectMutualCrush
 * Triggered when a crush document is created or reactivated at
 *   users/{uid}/crushes/{phoneHash}
 *
 * If the target user (whose users.phoneHash == the crushed phoneHash) has
 * already crushed the current user back, we create a hidden match document.
 * The match remains on privacy_hold until both users have at least three
 * active crushes, then waits in pending_reveal for the next daily reveal.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { participantActiveCrushCounts } from '../matching/firestorePrivacy';
import {
  isActiveCrushStatus,
  reciprocalMatchStatus,
} from '../matching/privateCircle';

const db = admin.firestore;

async function refreshPrivacyHeldMatches(uid: string): Promise<void> {
  const held = await db().collection('matches')
    .where('participants', 'array-contains', uid)
    .where('status', '==', 'privacy_hold')
    .get();
  if (held.empty) return;

  const now = admin.firestore.Timestamp.now();
  for (const match of held.docs) {
    const participants = match.data().participants;
    if (!Array.isArray(participants) || participants.length !== 2) continue;
    const counts = await participantActiveCrushCounts(participants.map(String), now);
    if (reciprocalMatchStatus(...counts) === 'pending_reveal') {
      await match.ref.update({ status: 'pending_reveal', updatedAt: now });
    }
  }
}

export const detectMutualCrush = functions.firestore
  .document('users/{uid}/crushes/{phoneHash}')
  .onWrite(async (change, context) => {
    const { uid, phoneHash } = context.params as { uid: string; phoneHash: string };
    if (!change.after.exists) return;

    const crush = change.after.data();
    if (!crush || !isActiveCrushStatus(crush.status)) return;

    await refreshPrivacyHeldMatches(uid);
    if (crush.status !== 'pending') return;

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
    const now = admin.firestore.Timestamp.now();
    const activeCounts = await participantActiveCrushCounts(participants, now);
    const status = reciprocalMatchStatus(...activeCounts);

    await db().runTransaction(async (transaction) => {
      const matchSnap = await transaction.get(matchRef);

      const matchData = matchSnap.exists ? matchSnap.data() : null;
      if (!matchSnap.exists || matchData?.status === 'unhooked' || matchData?.status === 'expired') {
        transaction.set(matchRef, {
          matchId,
          userA: participants[0],
          userB: participants[1],
          participants,
          status,
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
          revealedNames: {},
        }, { merge: false });
      }

      transaction.update(change.after.ref, { status: 'matched', matchId, updatedAt: now });
      transaction.update(reverseRef, { status: 'matched', matchId, updatedAt: now });
    });

    // No notification is sent here. Both hidden states remain unreadable to
    // clients until a daily reveal activates the match.
  });
