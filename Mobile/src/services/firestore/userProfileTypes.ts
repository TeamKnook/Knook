import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export const USER_PROFILE_SCHEMA_VERSION = 1;

export type ProfileGender = 'woman' | 'man' | 'non_binary';
export type ProfileInterestedIn = 'men' | 'women' | 'everyone';
export type AccountStatus = 'active' | 'deleted';
export type AccessStatus = 'development_allowed' | 'waitlist_pending' | 'approved';

export type ProfileTimestamp = FirebaseFirestoreTypes.Timestamp | Date | null;

export interface VibeAnswers {
  idealFirstDate?: string[];
  biggestDealbreaker?: string[];
  favouriteTVShow?: string[];
  lookingFor?: string[];
  nightOwlOrEarlyBird?: string[];
}

export interface KnookUserProfile {
  uid: string;
  phoneNumberE164: string;
  phoneLast4: string;
  phoneHash: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: ProfileTimestamp;
  firstName: string | null;
  age: number | null;
  gender: ProfileGender | null;
  interestedIn: ProfileInterestedIn | null;
  vibeAnswers: VibeAnswers;
  favouriteShow: string | null;
  accountStatus: AccountStatus;
  accessStatus: AccessStatus;
  createdAt: ProfileTimestamp;
  updatedAt: ProfileTimestamp;
  lastSeenAt: ProfileTimestamp;
  schemaVersion: number;
}

export interface CompleteOnboardingInput {
  firstName: string;
  age: string | number;
  gender: string | null;
  interestedIn: string | null;
  idealFirstDate?: string | null;
  loveLanguage?: string | null;
  favouriteShow?: string | null;
}

export interface ProfileValidationResult {
  ok: boolean;
  error?: string;
}
