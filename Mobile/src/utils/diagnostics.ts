import { appEnvironment } from '@/src/utils/environment';

const PREFIX = '[knook:runtime]';

function isDevRuntime() {
  const isReactNativeDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  return isReactNativeDev && appEnvironment.canUsePreviewTools;
}

function safePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return payload;
  const redactedKeys = new Set(['authorization', 'token', 'password', 'secret', 'jwt']);
  return JSON.parse(JSON.stringify(payload, (key, value) => {
    if (redactedKeys.has(key.toLowerCase())) return '<redacted>';
    return value;
  }));
}

export const diagnostics = {
  log(event: string, payload?: unknown) {
    if (!isDevRuntime()) return;
    console.log(PREFIX, event, safePayload(payload));
  },

  warn(event: string, payload?: unknown) {
    if (!isDevRuntime()) return;
    console.warn(PREFIX, event, safePayload(payload));
  },

  error(event: string, error: unknown, payload?: unknown) {
    if (!isDevRuntime()) return;
    const err = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    console.error(PREFIX, event, safePayload({ error: err, payload }));
  },
};
