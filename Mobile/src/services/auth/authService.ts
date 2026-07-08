import { api, setAccessTokenResolver, setUidResolver } from '../api';
import { appEnvironment } from '@/src/utils/environment';
import type { User } from '@/src/models';
import { firebaseAuthProvider } from './firebaseAuthProvider';
import { previewAuthProvider } from './previewAuthProvider';
import type { AuthProvider } from './authTypes';

export interface RequestOtpResult {
  verificationId: string;
  devCode?: string;
}

export interface AuthResult {
  token: string;
  uid: string;
  onboardingCompleted: boolean;
}

const provider: AuthProvider = appEnvironment.usesFirebaseAuth
  ? firebaseAuthProvider
  : previewAuthProvider;

setAccessTokenResolver((forceRefresh?: boolean) => provider.getAccessToken(forceRefresh));
setUidResolver(() => provider.getCurrentUid());

export const authService = {
  async requestOtp(phone: string): Promise<RequestOtpResult> {
    const session = await provider.sendVerificationCode(phone);
    return { verificationId: session.id, devCode: session.devCode };
  },

  async verifyOtp(phone: string, verificationId: string, code: string): Promise<AuthResult> {
    const user = await provider.confirmVerificationCode(
      { id: verificationId, phoneNumber: phone, provider: appEnvironment.authProvider },
      code,
    );
    const me = await api.get<User>('/users/me');
    return {
      token: '',
      uid: user.uid,
      onboardingCompleted: Boolean(me.onboardingCompleted),
    };
  },

  signOut: () => provider.signOut(),

  async getCurrentUid() {
    return provider.getCurrentUid();
  },

  subscribe: provider.subscribe,
};
