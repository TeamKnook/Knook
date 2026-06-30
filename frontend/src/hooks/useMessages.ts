import { useCallback, useEffect, useRef, useState } from 'react';
import { firestoreService } from '@/src/services/firestore/firestoreService';
import type { Match, Message } from '@/src/models';

export function useMessages(matchId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch {
      // match may not be active yet
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

  return { match, messages, loading, send, refresh };
}
