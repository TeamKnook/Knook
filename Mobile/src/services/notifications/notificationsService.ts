/**
 * Push notifications service.
 *
 * TODO(real-fcm): integrate @react-native-firebase/messaging.
 *   - requestPermission()
 *   - getToken() → POST to /users/me to persist on fcmTokens[]
 *   - onMessage(handler) for foreground
 *   - setBackgroundMessageHandler(handler)
 *
 * For now this stub keeps the API surface stable so call sites don't change.
 */
export const notificationsService = {
  async registerForPush(): Promise<string | null> {
    // TODO(real-fcm)
    return null;
  },
  async unregister(): Promise<void> {
    // TODO(real-fcm)
  },
};
