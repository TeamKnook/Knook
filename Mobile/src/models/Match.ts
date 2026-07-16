export type MatchStatus = 'privacy_hold' | 'pending_reveal' | 'active' | 'unhooked' | 'expired';

export interface Match {
  matchId: string;
  userA: string;
  userB: string;
  participants: string[];
  status: MatchStatus;
  matchedAt: string;
  revealedAt?: string | null;
  revealedBy: string[];
  mutualReveal: boolean;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  matchExpiresAt?: string | null;
  firstMessageSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // hydrated client-side
  otherUid?: string;
  otherName?: string | null;
  otherPhoneLast4?: string | null;
  iRevealed?: boolean;
}
