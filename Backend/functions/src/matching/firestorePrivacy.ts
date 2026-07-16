import * as admin from 'firebase-admin';
import {
  countActiveCrushes,
  type CrushEligibilityRecord,
} from './privateCircle';

type Transaction = admin.firestore.Transaction;

function timestampMillis(value: unknown): number | null {
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return null;
}

function eligibilityRecord(data: admin.firestore.DocumentData): CrushEligibilityRecord {
  return {
    status: data.status,
    expiresAtMillis: timestampMillis(data.expiresAt),
  };
}

export async function activeCrushCount(
  uid: string,
  at: admin.firestore.Timestamp,
  transaction?: Transaction,
): Promise<number> {
  const query = admin.firestore().collection(`users/${uid}/crushes`);
  const snapshot = transaction ? await transaction.get(query) : await query.get();
  return countActiveCrushes(
    snapshot.docs.map((document) => eligibilityRecord(document.data())),
    at.toMillis(),
  );
}

export async function participantActiveCrushCounts(
  participants: string[],
  at: admin.firestore.Timestamp,
): Promise<[number, number]> {
  if (participants.length !== 2) return [0, 0];
  return Promise.all([
    activeCrushCount(participants[0], at),
    activeCrushCount(participants[1], at),
  ]);
}
