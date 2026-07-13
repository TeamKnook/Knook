import { useCallback, useEffect, useState } from 'react';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import { authService } from '@/src/services/auth/authService';
import type { User } from '@/src/models';

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
      const user = await firestoreService.getMe();
      setState({ loading: false, uid, user });
    } catch {
      await authService.signOut();
      setState({ loading: false, uid: null, user: null });
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = authService.subscribe((user) => {
      if (!user) {
        setState({ loading: false, uid: null, user: null });
        return;
      }
      void refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setState({ loading: false, uid: null, user: null });
  }, []);

  return { ...state, refresh, signOut };
}
