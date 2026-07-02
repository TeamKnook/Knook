import type { Crush, Match } from '@/src/models';

export type CrushDisplayState = 'private' | 'matched' | 'unhooked' | 'expired';

export interface CrushDisplayModel {
  state: CrushDisplayState;
  title: string;
  subtitle: string;
  badge: string;
  isMatched: boolean;
}

const PRIVATE_TITLE = 'Added privately';
const PRIVATE_SUBTITLE = "You'll only know if it's mutual during the daily reveal.";

export function activeMatchIds(matches: Pick<Match, 'matchId' | 'status'>[]): Set<string> {
  return new Set(matches.filter((match) => match.status === 'active').map((match) => match.matchId));
}

export function getCrushDisplayState(crush: Pick<Crush, 'status' | 'matchId'>, visibleActiveMatchIds: Set<string>): CrushDisplayState {
  if (crush.status === 'expired') return 'expired';
  if (crush.status === 'unhooked') return 'unhooked';

  if (crush.status === 'matched' && crush.matchId && visibleActiveMatchIds.has(crush.matchId)) {
    return 'matched';
  }

  return 'private';
}

export function getCrushDisplayModel(
  crush: Pick<Crush, 'status' | 'matchId'>,
  visibleActiveMatchIds: Set<string>,
): CrushDisplayModel {
  const state = getCrushDisplayState(crush, visibleActiveMatchIds);

  if (state === 'matched') {
    return {
      state,
      title: 'Matched',
      subtitle: 'Revealed during the daily reveal.',
      badge: 'MATCHED',
      isMatched: true,
    };
  }

  if (state === 'unhooked') {
    return {
      state,
      title: 'Unhooked',
      subtitle: 'This connection has ended.',
      badge: 'UNHOOKED',
      isMatched: false,
    };
  }

  if (state === 'expired') {
    return {
      state,
      title: 'Expired',
      subtitle: 'This private crush expired.',
      badge: 'EXPIRED',
      isMatched: false,
    };
  }

  return {
    state: 'private',
    title: PRIVATE_TITLE,
    subtitle: PRIVATE_SUBTITLE,
    badge: 'PRIVATE',
    isMatched: false,
  };
}
