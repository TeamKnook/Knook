export type CrushStatus = 'pending' | 'matched' | 'unhooked' | 'expired';

export interface Crush {
  uid: string;
  phoneHash: string;
  phoneLast4?: string;
  status: CrushStatus;
  crushedAt: string;
  expiresAt: string;
  renewedAt?: string | null;
  matchId?: string | null;
  createdAt: string;
  updatedAt: string;
}
