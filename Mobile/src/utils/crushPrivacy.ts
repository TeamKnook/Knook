import type { Crush } from '@/src/models';

export type CrushDisplayState = 'private' | 'expired';

export interface CrushDisplayModel {
  state: CrushDisplayState;
  title: string;
  subtitle: string;
  badge: string;
  isActive: boolean;
}

const PRIVATE_TITLE = 'Added privately';
const PRIVATE_SUBTITLE = "You'll only know if it's mutual during the daily reveal.";

export function getCrushDisplayState(crush: Pick<Crush, 'status'>): CrushDisplayState {
  if (crush.status === 'expired') return 'expired';
  return 'private';
}

export function getCrushDisplayModel(crush: Pick<Crush, 'status'>): CrushDisplayModel {
  const state = getCrushDisplayState(crush);
  if (state === 'expired') {
    return {
      state,
      title: 'Expired',
      subtitle: 'This private crush expired.',
      badge: 'EXPIRED',
      isActive: false,
    };
  }

  return {
    state: 'private',
    title: PRIVATE_TITLE,
    subtitle: PRIVATE_SUBTITLE,
    badge: 'PRIVATE',
    isActive: true,
  };
}
