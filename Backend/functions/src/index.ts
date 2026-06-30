import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export { detectMutualCrush } from './crushes/detectMutualCrush';
export { dailyReveal } from './reveal/dailyReveal';
export { handleUnhook } from './matches/handleUnhook';
export { sendMatchRevealedNotification } from './notifications/sendNotification';
