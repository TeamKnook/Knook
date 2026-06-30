/**
 * Firestore-shaped service. Backed by the FastAPI adapter in preview.
 *
 * TODO(real-firebase): swap each method for the corresponding Firestore
 * call using @react-native-firebase/firestore. The function signatures
 * are kept identical so the screens never change.
 */
import { api } from '../api';
import type { Crush, Match, Message, User } from '@/src/models';

export const firestoreService = {
  // users
  getMe: () => api.get<User>('/users/me'),
  updateMe: (patch: Partial<User>) => api.put<User>('/users/me', patch),

  // crushes
  addCrush: (phone: string) => api.post<Crush>('/crushes', { phone }),
  listCrushes: () => api.get<Crush[]>('/crushes'),

  // matches
  listMatches: () => api.get<Match[]>('/matches'),
  getMatch: (matchId: string) => api.get<Match>(`/matches/${matchId}`),
  reveal: (matchId: string) => api.post<Match>(`/matches/${matchId}/reveal`),
  unhook: (matchId: string) => api.post<{ ok: boolean }>(`/matches/${matchId}/unhook`),

  // messages
  listMessages: (matchId: string) => api.get<Message[]>(`/matches/${matchId}/messages`),
  sendMessage: (matchId: string, text: string) =>
    api.post<Message>(`/matches/${matchId}/messages`, { text }),

  // dev / demo
  triggerDailyReveal: () => api.post<{ updated: number }>('/dev/trigger-reveal'),
};
