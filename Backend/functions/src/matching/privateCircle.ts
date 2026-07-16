export const MIN_ACTIVE_CRUSHES = 3;
export const MAX_FREE_ACTIVE_CRUSHES = 5;

export type MatchStatus =
  | 'privacy_hold'
  | 'pending_reveal'
  | 'active'
  | 'unhooked'
  | 'expired';

export type ActiveCrushStatus = 'pending' | 'matched' | 'unhooked';

export interface CrushEligibilityRecord {
  status?: unknown;
  expiresAtMillis?: number | null;
}

const ACTIVE_CRUSH_STATUSES = new Set<ActiveCrushStatus>([
  'pending',
  'matched',
  'unhooked',
]);

export function isActiveCrushStatus(status: unknown): status is ActiveCrushStatus {
  return typeof status === 'string' && ACTIVE_CRUSH_STATUSES.has(status as ActiveCrushStatus);
}

export function isActiveCrush(record: CrushEligibilityRecord, nowMillis: number): boolean {
  return isActiveCrushStatus(record.status)
    && typeof record.expiresAtMillis === 'number'
    && record.expiresAtMillis > nowMillis;
}

export function countActiveCrushes(records: CrushEligibilityRecord[], nowMillis: number): number {
  return records.filter((record) => isActiveCrush(record, nowMillis)).length;
}

export function isPrivacyReady(activeCrushCount: number): boolean {
  return activeCrushCount >= MIN_ACTIVE_CRUSHES;
}

export function canAddFreeActiveCrush(
  otherActiveCrushCount: number,
  targetCrushIsAlreadyActive: boolean,
): boolean {
  return targetCrushIsAlreadyActive || otherActiveCrushCount < MAX_FREE_ACTIVE_CRUSHES;
}

export function reciprocalMatchStatus(
  firstUserActiveCrushes: number,
  secondUserActiveCrushes: number,
): Extract<MatchStatus, 'privacy_hold' | 'pending_reveal'> {
  return isPrivacyReady(firstUserActiveCrushes) && isPrivacyReady(secondUserActiveCrushes)
    ? 'pending_reveal'
    : 'privacy_hold';
}

export function revealTransition(
  currentStatus: MatchStatus,
  firstUserActiveCrushes: number,
  secondUserActiveCrushes: number,
): MatchStatus {
  if (currentStatus === 'active' || currentStatus === 'unhooked' || currentStatus === 'expired') {
    return currentStatus;
  }

  return isPrivacyReady(firstUserActiveCrushes) && isPrivacyReady(secondUserActiveCrushes)
    ? 'active'
    : 'privacy_hold';
}
