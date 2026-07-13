import { api } from '../api';
import { authService } from '@/src/services/auth/authService';
import type { Crush, Match, Message, User } from '@/src/models';
import { appEnvironment } from '@/src/utils/environment';
import { firebaseProductDataService } from './firebaseProductDataService';
import { mapProfileToUser, userProfileService } from './userProfileService';

const productDataService = appEnvironment.usesFirebaseProductData
  ? firebaseProductDataService
  : {
      addCrush: (phone: string) => api.post<Crush>('/crushes', { phone }),
      listCrushes: () => api.get<Crush[]>('/crushes'),
      listMatches: () => api.get<Match[]>('/matches'),
      getMatch: (matchId: string) => api.get<Match>(`/matches/${matchId}`),
      reveal: (matchId: string) => api.post<Match>(`/matches/${matchId}/reveal`),
      unhook: (matchId: string) => api.post<{ ok: boolean }>(`/matches/${matchId}/unhook`),
      listMessages: (matchId: string) => api.get<Message[]>(`/matches/${matchId}/messages`),
      sendMessage: (matchId: string, text: string) =>
        api.post<Message>(`/matches/${matchId}/messages`, { text }),
      triggerDailyReveal: () => api.post<{ updated: number }>('/dev/trigger-reveal'),
    };

export const firestoreService = {
  // users
  async getMe() {
    if (!appEnvironment.usesFirebaseAuth) return api.get<User>('/users/me');
    const uid = await authService.getCurrentUid();
    if (!uid) throw new Error('Sign in before loading your profile');
    const profile = await userProfileService.getCurrentUserProfile(uid);
    if (!profile) throw new Error('Profile not found');
    return mapProfileToUser(profile);
  },
  updateMe: (patch: Partial<User>) => api.put<User>('/users/me', patch),

  // crushes
  addCrush: (phone: string) => productDataService.addCrush(phone),
  listCrushes: () => productDataService.listCrushes(),

  // matches
  listMatches: () => productDataService.listMatches(),
  getMatch: (matchId: string) => productDataService.getMatch(matchId),
  reveal: (matchId: string) => productDataService.reveal(matchId),
  unhook: (matchId: string) => productDataService.unhook(matchId),

  // messages
  listMessages: (matchId: string) => productDataService.listMessages(matchId),
  sendMessage: (matchId: string, text: string) => productDataService.sendMessage(matchId, text),

  // dev / demo
  triggerDailyReveal: () => productDataService.triggerDailyReveal(),
};
