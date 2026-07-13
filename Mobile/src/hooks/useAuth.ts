import { useCallback, useEffect, useState } from 'react';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import { authService } from '@/src/services/auth/authService';
import { appEnvironment } from '@/src/utils/environment';
import type { User } from '@/src/models';
import { mapProfileToUser, userProfileService } from '@/src/services/firestore/userProfileService';

export interface AuthState {
  loading: boolean;
  uid: string | null;
  user: User | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ loading: true, uid: null, user: null });

  const refresh = useCallback(async () => {
    const uid = await authService.getCurrentUid();
    if (!uid) {
      setState({ loading: false, uid: null, user: null });
      return;
    }
    try {
      if (appEnvironment.usesFirebaseAuth) {
        const profile = await userProfileService.getCurrentUserProfile(uid);
        setState({ loading: false, uid, user: profile ? mapProfileToUser(profile) : null });
        return;
      }
      const user = await firestoreService.getMe();
      setState({ loading: false, uid, user });
    } catch {
      await authService.signOut();
      setState({ loading: false, uid: null, user: null });
    }
  }, []);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;
    void refresh();
    const unsubscribe = authService.subscribe((user) => {
      profileUnsubscribe?.();
      profileUnsubscribe = undefined;
      if (!user) {
        setState({ loading: false, uid: null, user: null });
        return;
      }
      if (!appEnvironment.usesFirebaseAuth) {
        void refresh();
        return;
      }
      const uid = user.uid;
      profileUnsubscribe = userProfileService.subscribeToCurrentUserProfile(uid, (profile) => {
        setState({ loading: false, uid, user: profile ? mapProfileToUser(profile) : null });
      });
    });
    return () => {
      profileUnsubscribe?.();
      unsubscribe();
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setState({ loading: false, uid: null, user: null });
  }, []);

  return { ...state, refresh, signOut };
}
