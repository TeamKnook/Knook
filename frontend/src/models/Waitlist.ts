export type WaitlistStatus = 'pending' | 'approved' | 'rejected';
export type WaitlistSource = 'organic' | 'invite_link' | 'paid_skip' | 'couples_shipping';

export interface Waitlist {
  phoneHash: string;
  phoneLast4?: string;
  status: WaitlistStatus;
  source: WaitlistSource;
  invitedByUID?: string;
  branchLinkId?: string;
  paidSkip: boolean;
  submittedAt: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
