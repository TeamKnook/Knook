import { api, clearSession, getStoredToken, getStoredUid, setSession } from '../api';
import type { AuthenticatedUser, AuthProvider, AuthStateListener, VerificationSession } from './authTypes';

interface RequestOtpResult {
  verificationId: string;
  devCode: string;
}

interface PreviewAuthResult {
  token: string;
  uid: string;
  onboardingCompleted: boolean;
}

export const previewAuthProvider: AuthProvider = {
  subscribe(listener: AuthStateListener) {
    void getStoredUid().then((uid) => {
      listener(uid ? { uid, onboardingCompleted: true } : null);
    });
    return () => {};
  },

  async sendVerificationCode(phoneNumber: string): Promise<VerificationSession> {
    const res = await api.post<RequestOtpResult>('/auth/request-otp', { phone: phoneNumber });
    return {
      id: res.verificationId,
      phoneNumber,
      provider: 'preview',
      devCode: res.devCode,
    };
  },

  async confirmVerificationCode(
    session: VerificationSession,
    code: string,
  ): Promise<AuthenticatedUser> {
    const res = await api.post<PreviewAuthResult>('/auth/verify-otp', {
      phone: session.phoneNumber,
      verificationId: session.id,
      code,
    });
    await setSession(res.token, res.uid);
    return { uid: res.uid, onboardingCompleted: res.onboardingCompleted };
  },

  async getAccessToken(): Promise<string | null> {
    return getStoredToken();
  },

  getCurrentUid: getStoredUid,

  signOut: clearSession,
};
