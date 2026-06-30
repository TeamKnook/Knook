export type RelationshipStatus = 'single' | 'matched' | 'together';

export interface User {
  uid: string;
  phoneHash: string;
  phoneLast4?: string;
  name?: string;
  age?: number;
  gender?: string;
  interestedIn?: string[];
  dateVibe?: string;
  loveLanguage?: string;
  dealBreakers?: string[];
  icebreaker?: string;
  icebreakerAnswer?: string;
  firstDatePrefs?: string[];
  onboardingCompleted: boolean;
  relationshipStatus: RelationshipStatus;
  fcmTokens?: string[];
  appVersion?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
