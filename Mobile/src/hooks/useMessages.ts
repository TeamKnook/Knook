import { useCallback, useEffect, useRef, useState } from 'react';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import type { Match, Message } from '@/src/models';
import { diagnostics } from '@/src/utils/diagnostics';

export function useMessages(matchId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!matchId) return;
    try {
      const [m, msgs] = await Promise.all([
        firestoreService.getMatch(matchId),
        firestoreService.listMessages(matchId),
      ]);
      if (!mounted.current) return;
      setMatch(m);
      setMessages(msgs);
      setError(null);
    } catch (err) {
      diagnostics.error('messages-refresh-failed', err, { matchId });
      // match may not be active yet
      if (mounted.current) setError(err instanceof Error ? err.message : 'Could not load chat');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    // TODO(real-firebase): swap for onSnapshot on the messages subcollection.
    const id = setInterval(refresh, 3000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  const send = useCallback(
    async (text: string) => {
      if (!matchId) return;
      await firestoreService.sendMessage(matchId, text);
      await refresh();
    },
    [matchId, refresh],
  );

  return { match, messages, loading, error, send, refresh };
}
