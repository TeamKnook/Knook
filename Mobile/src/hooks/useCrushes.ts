import { useCallback, useEffect, useState } from 'react';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import type { Crush } from '@/src/models';
import { diagnostics } from '@/src/utils/diagnostics';

export function useCrushes() {
  const [crushes, setCrushes] = useState<Crush[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCrushes(await firestoreService.listCrushes());
    } catch (err) {
      diagnostics.error('crushes-refresh-failed', err);
      setError(err instanceof Error ? err.message : 'Could not load crushes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // TODO(real-firebase): replace polling with onSnapshot listener on
    // users/{uid}/crushes for realtime updates.
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  const add = useCallback(
    async (phone: string) => {
      const c = await firestoreService.addCrush(phone);
      await refresh();
      return c;
    },
    [refresh],
  );

  return { crushes, loading, error, refresh, add };
}
