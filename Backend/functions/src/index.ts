import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export { detectMutualCrush } from './crushes/detectMutualCrush';
export { dailyReveal, handleDevRevealRequest } from './reveal/dailyReveal';
export { handleIdentityRevealRequest } from './reveal/handleIdentityReveal';
export { handleUnhook } from './matches/handleUnhook';
export { handleUnhookRequest } from './matches/handleUnhookRequest';
export { handleMessageCreated } from './messages/handleMessageCreated';
export { sendMatchRevealedNotification } from './notifications/sendNotification';
