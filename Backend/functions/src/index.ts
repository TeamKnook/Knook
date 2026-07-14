import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export { detectMutualCrush } from './crushes/detectMutualCrush';
export { handleCrushRequest } from './crushes/handleCrushRequest';
export { dailyReveal, handleDevRevealRequest } from './reveal/dailyReveal';
export { handleIdentityRevealRequest } from './reveal/handleIdentityReveal';
export { handleUnhookRequest } from './matches/handleUnhookRequest';
export { handleMessageCreated } from './messages/handleMessageCreated';
