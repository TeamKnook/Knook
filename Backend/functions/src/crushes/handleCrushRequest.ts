import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  canAddFreeActiveCrush,
  isActiveCrush,
  MAX_FREE_ACTIVE_CRUSHES,
  type CrushEligibilityRecord,
} from '../matching/privateCircle';

const db = admin.firestore;
const CRUSH_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

interface CrushRequest {
  requestId?: string;
  uid?: string;
  phoneHash?: string;
  phoneLast4?: string;
}

function timestampMillis(value: unknown): number | null {
  return value instanceof admin.firestore.Timestamp ? value.toMillis() : null;
}

function activeRecord(data: admin.firestore.DocumentData): CrushEligibilityRecord {
  return {
    status: data.status,
    expiresAtMillis: timestampMillis(data.expiresAt),
  };
}

async function failRequest(
  reference: admin.firestore.DocumentReference,
  requestId: string,
  error: string,
) {
  await reference.set({
    requestId,
    status: 'failed',
    error,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

export const handleCrushRequest = functions.firestore
  .document('crushRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const requestId = context.params.requestId as string;
    const request = snapshot.data() as CrushRequest;
    const { uid, phoneHash, phoneLast4 } = request;

    if (
      request.requestId !== requestId
      || typeof uid !== 'string'
      || typeof phoneHash !== 'string'
      || !/^[a-f0-9]{64}$/.test(phoneHash)
      || typeof phoneLast4 !== 'string'
      || !/^\d{4}$/.test(phoneLast4)
    ) {
      await failRequest(snapshot.ref, requestId, 'invalid crush request');
      return;
    }

    const userRef = db().doc(`users/${uid}`);
    const crushRef = userRef.collection('crushes').doc(phoneHash);
    const metadataRef = db().doc(`privateCircleMetadata/${uid}`);

    try {
      await db().runTransaction(async (transaction) => {
        const now = admin.firestore.Timestamp.now();
        const userSnapshot = await transaction.get(userRef);
        const existingCrush = await transaction.get(crushRef);
        await transaction.get(metadataRef);
        const allCrushes = await transaction.get(userRef.collection('crushes'));

        if (!userSnapshot.exists || userSnapshot.data()?.phoneHash === phoneHash) {
          throw new Error(userSnapshot.exists ? 'You cannot crush on yourself' : 'profile not found');
        }

        const existingData = existingCrush.exists ? existingCrush.data()! : null;
        const existingIsActive = existingData
          ? isActiveCrush(activeRecord(existingData), now.toMillis())
          : false;
        if (
          existingData
          && existingIsActive
          && ['pending', 'matched'].includes(String(existingData.status))
        ) {
          transaction.set(metadataRef, {
            uid,
            activeCountSnapshot: allCrushes.docs.filter((document) => (
              isActiveCrush(activeRecord(document.data()), now.toMillis())
            )).length,
            updatedAt: now,
          });
          transaction.set(snapshot.ref, {
            requestId,
            status: 'processed',
            crushPath: crushRef.path,
            processedAt: now,
          }, { merge: true });
          return;
        }

        const activeCount = allCrushes.docs.filter((document) => {
          if (document.id === phoneHash) return false;
          return isActiveCrush(activeRecord(document.data()), now.toMillis());
        }).length;

        if (!canAddFreeActiveCrush(activeCount, existingIsActive)) {
          throw new Error(`Your Private Circle can hold up to ${MAX_FREE_ACTIVE_CRUSHES} active crushes`);
        }

        transaction.set(crushRef, {
          uid,
          phoneHash,
          phoneLast4,
          status: 'pending',
          crushedAt: existingData?.crushedAt ?? now,
          expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + CRUSH_LIFETIME_MS),
          renewedAt: existingData ? now : null,
          matchId: null,
          createdAt: existingData?.createdAt ?? now,
          updatedAt: now,
        }, { merge: true });
        // This server-only document provides one transaction contention point
        // so simultaneous requests cannot both pass the five-crush check.
        transaction.set(metadataRef, {
          uid,
          activeCountSnapshot: activeCount + 1,
          updatedAt: now,
        });
        transaction.set(snapshot.ref, {
          requestId,
          status: 'processed',
          crushPath: crushRef.path,
          processedAt: now,
        }, { merge: true });
      });
    } catch (error) {
      await failRequest(
        snapshot.ref,
        requestId,
        error instanceof Error ? error.message : 'Could not add crush',
      );
    }
  });
