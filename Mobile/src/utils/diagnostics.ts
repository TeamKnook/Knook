import { appEnvironment } from '@/src/utils/environment';

const PREFIX = '[knook:runtime]';

function isDevRuntime() {
  const isReactNativeDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  return isReactNativeDev && appEnvironment.canUsePreviewTools;
}

function safePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return payload;
  const redactedKeys = new Set(['authorization', 'token', 'password', 'secret', 'jwt']);
  const seen = new WeakSet<object>();
  return JSON.parse(JSON.stringify(payload, (key, value) => {
    if (redactedKeys.has(key.toLowerCase())) return '<redacted>';
    if (value && typeof value === 'object') {
      if (seen.has(value)) return '<circular>';
      seen.add(value);
    }
    return value;
  }));
}

function serializeError(error: Error) {
  const serialized: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  for (const key of Object.getOwnPropertyNames(error)) {
    serialized[key] = (error as unknown as Record<string, unknown>)[key];
  }

  for (const key of Object.keys(error as unknown as Record<string, unknown>)) {
    serialized[key] = (error as unknown as Record<string, unknown>)[key];
  }

  return serialized;
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
      ? serializeError(error)
      : error;
    console.error(PREFIX, event, safePayload({ error: err, payload }));
  },
};
