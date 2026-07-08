export type AuthProviderName = 'firebase' | 'preview';

export interface VerificationSession {
  id: string;
  phoneNumber: string;
  provider: AuthProviderName;
  devCode?: string;
}

export interface AuthenticatedUser {
  uid: string;
  onboardingCompleted: boolean;
}

export type AuthStateListener = (user: AuthenticatedUser | null) => void;
export type Unsubscribe = () => void;

export interface AuthProvider {
  subscribe(listener: AuthStateListener): Unsubscribe;
  sendVerificationCode(phoneNumber: string): Promise<VerificationSession>;
  confirmVerificationCode(
    session: VerificationSession,
    code: string,
  ): Promise<AuthenticatedUser>;
  getAccessToken(forceRefresh?: boolean): Promise<string | null>;
  getCurrentUid(): Promise<string | null>;
  signOut(): Promise<void>;
}
