import { useCallback, useEffect, useState } from 'react';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import type { Match } from '@/src/models';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setMatches(await firestoreService.listMatches());
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

  return { matches, loading, refresh };
}
