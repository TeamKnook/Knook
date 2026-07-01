import { useCallback, useEffect, useState } from 'react';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import type { Match } from '@/src/models';
import { diagnostics } from '@/src/utils/diagnostics';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMatches(await firestoreService.listMatches());
    } catch (err) {
      diagnostics.error('matches-refresh-failed', err);
      setError(err instanceof Error ? err.message : 'Could not load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // TODO(real-firebase): swap polling for onSnapshot on matches where
    // participants array-contains current uid.
    const id = setInterval(refresh, 6000);
    return () => clearInterval(id);
  }, [refresh]);

  return { matches, loading, error, refresh };
}
